const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// ============================================
// CONFIGURATION
// ============================================

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.use(cors({
  origin: '*', // Permettre tous les domaines pour l'embed
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// MIDDLEWARE D'AUTHENTIFICATION
// ============================================

const authenticateClient = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'Clé API requise' });
  }
  
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single();
  
  if (error || !client) {
    return res.status(401).json({ error: 'Clé API invalide' });
  }
  
  req.client = client;
  next();
};

// ============================================
// ROUTES PUBLIQUES - POUR LES VISITEURS
// ============================================

// Servir le script d'embed personnalisé
app.get('/embed/:embedId.js', async (req, res) => {
  try {
    const embedId = req.params.embedId;
    
    // Récupérer la configuration de l'embed
    const { data: embed, error } = await supabase
      .from('embeds')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('embed_id', embedId)
      .eq('is_active', true)
      .single();
    
    if (error || !embed) {
      return res.status(404).send('// Embed non trouvé ou inactif');
    }
    
    // Incrémenter le compteur de vues
    await supabase
      .from('embeds')
      .update({ total_loads: (embed.total_loads || 0) + 1 })
      .eq('embed_id', embedId);
    
    // Logger l'utilisation
    await supabase
      .from('embed_analytics')
      .insert([{
        embed_id: embedId,
        client_id: embed.client_id,
        event_type: 'load',
        referrer: req.headers.referer || null,
        user_agent: req.headers['user-agent'],
        ip_address: req.ip
      }]);
    
    // Générer le script personnalisé
    const script = generateEmbedScript(embed);
    
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1h
    res.send(script);
    
  } catch (error) {
    console.error('Erreur embed:', error);
    res.status(500).send('// Erreur serveur');
  }
});

// Endpoint pour tracker les événements (ouverture, fermeture, etc.)
app.post('/track/:embedId', async (req, res) => {
  try {
    const { embedId } = req.params;
    const { event_type, metadata } = req.body;
    
    await supabase
      .from('embed_analytics')
      .insert([{
        embed_id: embedId,
        event_type,
        metadata,
        referrer: req.headers.referer,
        user_agent: req.headers['user-agent'],
        ip_address: req.ip
      }]);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Erreur tracking:', error);
    res.status(500).json({ error: 'Erreur tracking' });
  }
});

// ============================================
// ROUTES API - POUR LES CLIENTS
// ============================================

// Créer un nouvel embed
app.post('/api/embeds', authenticateClient, async (req, res) => {
  try {
    const {
      name,
      jotform_agent_id,
      configuration = {}
    } = req.body;
    
    if (!name || !jotform_agent_id) {
      return res.status(400).json({
        error: 'name et jotform_agent_id requis'
      });
    }
    
    // Générer un ID unique pour l'embed
    const embedId = `emb_${crypto.randomBytes(16).toString('hex')}`;
    
    const { data: embed, error } = await supabase
      .from('embeds')
      .insert([{
        embed_id: embedId,
        client_id: req.client.id,
        name,
        jotform_agent_id,
        configuration: {
          // Configuration par défaut
          position: 'bottom-right',
          theme: {
            primaryColor: '#667eea',
            buttonText: '💬 Besoin d\'aide ?',
            welcomeMessage: 'Bonjour ! Comment puis-je vous aider ?'
          },
          behavior: {
            autoOpen: false,
            autoOpenDelay: 5000,
            showOnPages: '*'
          },
          // Fusionner avec la config personnalisée
          ...configuration
        },
        is_active: true,
        total_loads: 0,
        total_conversations: 0
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Erreur création embed:', error);
      return res.status(500).json({ error: 'Erreur création' });
    }
    
    res.json({
      success: true,
      embed,
      script_url: `${process.env.API_URL}/embed/${embedId}.js`,
      integration_code: `<script src="${process.env.API_URL}/embed/${embedId}.js"></script>`
    });
    
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

// Lister tous les embeds du client
app.get('/api/embeds', authenticateClient, async (req, res) => {
  try {
    const { data: embeds, error } = await supabase
      .from('embeds')
      .select('*')
      .eq('client_id', req.client.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ error: 'Erreur récupération' });
    }
    
    res.json({
      total: embeds.length,
      embeds: embeds.map(e => ({
        ...e,
        script_url: `${process.env.API_URL}/embed/${e.embed_id}.js`,
        integration_code: `<script src="${process.env.API_URL}/embed/${e.embed_id}.js"></script>`
      }))
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir un embed spécifique
app.get('/api/embeds/:embedId', authenticateClient, async (req, res) => {
  try {
    const { data: embed, error } = await supabase
      .from('embeds')
      .select('*')
      .eq('embed_id', req.params.embedId)
      .eq('client_id', req.client.id)
      .single();
    
    if (error || !embed) {
      return res.status(404).json({ error: 'Embed non trouvé' });
    }
    
    res.json({
      ...embed,
      script_url: `${process.env.API_URL}/embed/${embed.embed_id}.js`,
      integration_code: `<script src="${process.env.API_URL}/embed/${embed.embed_id}.js"></script>`
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour un embed
app.put('/api/embeds/:embedId', authenticateClient, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.embed_id; // Ne pas permettre de changer l'ID
    delete updates.client_id; // Ne pas permettre de changer le client
    
    const { data: embed, error } = await supabase
      .from('embeds')
      .update(updates)
      .eq('embed_id', req.params.embedId)
      .eq('client_id', req.client.id)
      .select()
      .single();
    
    if (error || !embed) {
      return res.status(404).json({ error: 'Embed non trouvé' });
    }
    
    res.json({
      success: true,
      embed
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer (désactiver) un embed
app.delete('/api/embeds/:embedId', authenticateClient, async (req, res) => {
  try {
    const { data: embed, error } = await supabase
      .from('embeds')
      .update({ is_active: false })
      .eq('embed_id', req.params.embedId)
      .eq('client_id', req.client.id)
      .select()
      .single();
    
    if (error || !embed) {
      return res.status(404).json({ error: 'Embed non trouvé' });
    }
    
    res.json({
      success: true,
      message: 'Embed désactivé'
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les analytics d'un embed
app.get('/api/embeds/:embedId/analytics', authenticateClient, async (req, res) => {
  try {
    const { embedId } = req.params;
    const { from, to } = req.query;
    
    // Vérifier que l'embed appartient au client
    const { data: embed } = await supabase
      .from('embeds')
      .select('id')
      .eq('embed_id', embedId)
      .eq('client_id', req.client.id)
      .single();
    
    if (!embed) {
      return res.status(404).json({ error: 'Embed non trouvé' });
    }
    
    // Récupérer les analytics
    let query = supabase
      .from('embed_analytics')
      .select('*')
      .eq('embed_id', embedId);
    
    if (from) {
      query = query.gte('created_at', from);
    }
    if (to) {
      query = query.lte('created_at', to);
    }
    
    const { data: analytics, error } = await query
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (error) {
      return res.status(500).json({ error: 'Erreur analytics' });
    }
    
    // Calculer des statistiques
    const stats = {
      total_loads: analytics.filter(a => a.event_type === 'load').length,
      total_opens: analytics.filter(a => a.event_type === 'open').length,
      total_conversations: analytics.filter(a => a.event_type === 'conversation_start').length,
      by_event_type: {},
      by_date: {}
    };
    
    analytics.forEach(a => {
      // Par type d'événement
      stats.by_event_type[a.event_type] = (stats.by_event_type[a.event_type] || 0) + 1;
      
      // Par date
      const date = a.created_at.split('T')[0];
      if (!stats.by_date[date]) {
        stats.by_date[date] = { loads: 0, opens: 0, conversations: 0 };
      }
      if (a.event_type === 'load') stats.by_date[date].loads++;
      if (a.event_type === 'open') stats.by_date[date].opens++;
      if (a.event_type === 'conversation_start') stats.by_date[date].conversations++;
    });
    
    res.json({
      stats,
      recent_events: analytics.slice(0, 100)
    });
    
  } catch (error) {
    console.error('Erreur analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// FONCTION DE GÉNÉRATION DU SCRIPT
// ============================================

function generateEmbedScript(embed) {
  const config = embed.configuration || {};
  
  return `
(function() {
  'use strict';
  
  // Configuration
  const CONFIG = ${JSON.stringify(config, null, 2)};
  const JOTFORM_AGENT_ID = '${embed.jotform_agent_id}';
  const EMBED_ID = '${embed.embed_id}';
  const API_URL = '${process.env.API_URL}';
  
  // État
  let isLoaded = false;
  let isOpen = false;
  
  // Fonction de tracking
  function track(eventType, metadata = {}) {
    fetch(API_URL + '/track/' + EMBED_ID, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        metadata
      })
    }).catch(err => console.error('Tracking error:', err));
  }
  
  // Créer le bouton flottant
  function createButton() {
    const button = document.createElement('button');
    button.id = 'ino-chatbot-button';
    button.innerHTML = CONFIG.theme?.buttonText || '💬 Besoin d\\'aide ?';
    button.style.cssText = \`
      position: fixed;
      \${CONFIG.position?.includes('right') ? 'right: 20px' : 'left: 20px'};
      \${CONFIG.position?.includes('bottom') ? 'bottom: 20px' : 'top: 20px'};
      background: \${CONFIG.theme?.primaryColor || '#667eea'};
      color: white;
      border: none;
      border-radius: 50px;
      padding: 15px 25px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 999998;
      transition: all 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    \`;
    
    button.onmouseover = () => {
      button.style.transform = 'scale(1.05)';
      button.style.boxShadow = '0 6px 25px rgba(0,0,0,0.3)';
    };
    
    button.onmouseout = () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
    };
    
    button.onclick = toggleChatbot;
    
    document.body.appendChild(button);
    return button;
  }
  
  // Créer le conteneur du chatbot
  function createChatbotContainer() {
    const container = document.createElement('div');
    container.id = 'ino-chatbot-container';
    container.style.cssText = \`
      position: fixed;
      \${CONFIG.position?.includes('right') ? 'right: 20px' : 'left: 20px'};
      \${CONFIG.position?.includes('bottom') ? 'bottom: 90px' : 'top: 90px'};
      width: 400px;
      height: 600px;
      max-width: calc(100vw - 40px);
      max-height: calc(100vh - 120px);
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      z-index: 999999;
      display: none;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.3s ease;
    \`;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = \`
      background: \${CONFIG.theme?.primaryColor || '#667eea'};
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    \`;
    
    const title = document.createElement('h3');
    title.textContent = CONFIG.theme?.welcomeMessage || 'Assistant virtuel';
    title.style.cssText = 'margin: 0; font-size: 18px;';
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = \`
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    \`;
    closeBtn.onclick = toggleChatbot;
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // iFrame JotForm
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width: 100%; height: 100%; border: none; flex: 1;';
    iframe.src = 'https://agent.jotform.com/' + JOTFORM_AGENT_ID;
    
    container.appendChild(header);
    container.appendChild(iframe);
    document.body.appendChild(container);
    
    return container;
  }
  
  // Toggle chatbot
  function toggleChatbot() {
    const container = document.getElementById('ino-chatbot-container');
    const button = document.getElementById('ino-chatbot-button');
    
    if (isOpen) {
      container.style.display = 'none';
      button.style.display = 'block';
      isOpen = false;
      track('close');
    } else {
      container.style.display = 'flex';
      button.style.display = 'none';
      isOpen = true;
      track('open');
      
      if (!isLoaded) {
        track('conversation_start');
        isLoaded = true;
      }
    }
  }
  
  // Auto-open si configuré
  function autoOpenIfNeeded() {
    if (CONFIG.behavior?.autoOpen) {
      const delay = CONFIG.behavior?.autoOpenDelay || 5000;
      setTimeout(() => {
        if (!isOpen) {
          toggleChatbot();
        }
      }, delay);
    }
  }
  
  // Initialisation
  function init() {
    // Vérifier si on doit afficher sur cette page
    const showOnPages = CONFIG.behavior?.showOnPages;
    if (showOnPages && showOnPages !== '*') {
      const currentPath = window.location.pathname;
      const patterns = Array.isArray(showOnPages) ? showOnPages : [showOnPages];
      const shouldShow = patterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\\*/g, '.*'));
        return regex.test(currentPath);
      });
      if (!shouldShow) return;
    }
    
    // Créer les éléments
    createButton();
    createChatbotContainer();
    
    // Auto-open si nécessaire
    autoOpenIfNeeded();
    
    console.log('[Ino Chatbot] Initialized with embed ID:', EMBED_ID);
  }
  
  // Démarrer quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
  `.trim();
}

// ============================================
// ROUTES D'ADMINISTRATION
// ============================================

// Créer un nouveau client
app.post('/api/admin/clients', async (req, res) => {
  try {
    const { name, email, company } = req.body;
    
    const apiKey = 'ino_client_' + crypto.randomBytes(24).toString('hex');
    
    const { data: client, error } = await supabase
      .from('clients')
      .insert([{
        name,
        email,
        company,
        api_key: apiKey,
        is_active: true
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Erreur création client', details: error.message });
    }
    
    res.json({
      success: true,
      client,
      api_key: apiKey
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lister tous les clients
app.get('/api/admin/clients', async (req, res) => {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ error: 'Erreur récupération' });
    }
    
    res.json({ total: clients.length, clients });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROUTES UTILITAIRES
// ============================================

app.get('/', (req, res) => {
  res.json({
    name: 'Ino Embed API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: 'GET /health',
      embed_script: 'GET /embed/:embedId.js',
      track_event: 'POST /track/:embedId',
      api_embeds: 'GET/POST /api/embeds',
      api_embed: 'GET/PUT/DELETE /api/embeds/:embedId',
      api_analytics: 'GET /api/embeds/:embedId/analytics',
      admin_clients: 'GET/POST /api/admin/clients'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// DÉMARRAGE
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Embed Ino Service démarrée sur le port ${PORT}`);
  console.log(`📍 URL: ${process.env.API_URL || 'http://localhost:' + PORT}`);
});

module.exports = app;
