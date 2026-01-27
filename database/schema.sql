-- ============================================
-- SCHÉMA SUPABASE - API EMBED INO SERVICE
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: clients
-- ============================================

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Informations client
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    company VARCHAR(255),
    
    -- Authentification
    api_key VARCHAR(255) UNIQUE NOT NULL,
    
    -- État
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_api_key ON clients(api_key);
CREATE INDEX idx_clients_email ON clients(email);

-- ============================================
-- TABLE: embeds
-- ============================================

CREATE TABLE IF NOT EXISTS embeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    embed_id VARCHAR(255) UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Configuration
    name VARCHAR(255) NOT NULL,
    jotform_agent_id VARCHAR(255) NOT NULL,
    
    -- Configuration personnalisée (JSONB)
    configuration JSONB DEFAULT '{
        "position": "bottom-right",
        "theme": {
            "primaryColor": "#667eea",
            "buttonText": "💬 Besoin d\\'aide ?",
            "welcomeMessage": "Bonjour ! Comment puis-je vous aider ?"
        },
        "behavior": {
            "autoOpen": false,
            "autoOpenDelay": 5000,
            "showOnPages": "*"
        }
    }'::jsonb,
    
    -- Statistiques
    total_loads INTEGER DEFAULT 0,
    total_conversations INTEGER DEFAULT 0,
    
    -- État
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_embeds_embed_id ON embeds(embed_id);
CREATE INDEX idx_embeds_client_id ON embeds(client_id);
CREATE INDEX idx_embeds_is_active ON embeds(is_active);

-- ============================================
-- TABLE: embed_analytics
-- ============================================

CREATE TABLE IF NOT EXISTS embed_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    embed_id VARCHAR(255) NOT NULL,
    client_id UUID,
    
    -- Type d'événement
    event_type VARCHAR(50) NOT NULL, -- load, open, close, conversation_start, message_sent
    
    -- Métadonnées de l'événement
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Informations de tracking
    referrer TEXT,
    user_agent TEXT,
    ip_address VARCHAR(45),
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_embed_analytics_embed_id ON embed_analytics(embed_id);
CREATE INDEX idx_embed_analytics_event_type ON embed_analytics(event_type);
CREATE INDEX idx_embed_analytics_created_at ON embed_analytics(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_embeds_updated_at
    BEFORE UPDATE ON embeds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FONCTIONS UTILES
-- ============================================

-- Obtenir les statistiques d'un embed
CREATE OR REPLACE FUNCTION get_embed_stats(p_embed_id VARCHAR, p_days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    result JSON;
    start_date TIMESTAMPTZ;
BEGIN
    start_date := NOW() - (p_days || ' days')::INTERVAL;
    
    SELECT json_build_object(
        'embed_id', p_embed_id,
        'period_days', p_days,
        'total_loads', (
            SELECT COUNT(*)
            FROM embed_analytics
            WHERE embed_id = p_embed_id
            AND event_type = 'load'
            AND created_at >= start_date
        ),
        'total_opens', (
            SELECT COUNT(*)
            FROM embed_analytics
            WHERE embed_id = p_embed_id
            AND event_type = 'open'
            AND created_at >= start_date
        ),
        'total_conversations', (
            SELECT COUNT(*)
            FROM embed_analytics
            WHERE embed_id = p_embed_id
            AND event_type = 'conversation_start'
            AND created_at >= start_date
        ),
        'unique_ips', (
            SELECT COUNT(DISTINCT ip_address)
            FROM embed_analytics
            WHERE embed_id = p_embed_id
            AND created_at >= start_date
        ),
        'conversion_rate', (
            SELECT CASE 
                WHEN COUNT(*) FILTER (WHERE event_type = 'load') > 0 
                THEN ROUND(
                    (COUNT(*) FILTER (WHERE event_type = 'conversation_start')::numeric / 
                     COUNT(*) FILTER (WHERE event_type = 'load')::numeric) * 100, 
                    2
                )
                ELSE 0
            END
            FROM embed_analytics
            WHERE embed_id = p_embed_id
            AND created_at >= start_date
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Obtenir les événements par jour
CREATE OR REPLACE FUNCTION get_events_by_day(p_embed_id VARCHAR, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    loads BIGINT,
    opens BIGINT,
    conversations BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(created_at) as date,
        COUNT(*) FILTER (WHERE event_type = 'load') as loads,
        COUNT(*) FILTER (WHERE event_type = 'open') as opens,
        COUNT(*) FILTER (WHERE event_type = 'conversation_start') as conversations
    FROM embed_analytics
    WHERE embed_id = p_embed_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(created_at)
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VUES
-- ============================================

-- Vue pour les embeds avec info client
CREATE OR REPLACE VIEW embeds_with_client AS
SELECT 
    e.*,
    c.name as client_name,
    c.email as client_email,
    c.company as client_company
FROM embeds e
JOIN clients c ON e.client_id = c.id
WHERE e.is_active = TRUE;

-- Vue pour les statistiques par client
CREATE OR REPLACE VIEW client_stats AS
SELECT 
    c.id,
    c.name,
    c.email,
    c.company,
    COUNT(DISTINCT e.id) as total_embeds,
    SUM(e.total_loads) as total_loads,
    SUM(e.total_conversations) as total_conversations,
    c.created_at
FROM clients c
LEFT JOIN embeds e ON e.client_id = c.id AND e.is_active = TRUE
GROUP BY c.id, c.name, c.email, c.company, c.created_at;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE embed_analytics ENABLE ROW LEVEL SECURITY;

-- Policies pour clients
CREATE POLICY "Clients can view own data"
    ON clients FOR SELECT
    USING (auth.uid()::text = id::text);

CREATE POLICY "Clients can update own data"
    ON clients FOR UPDATE
    USING (auth.uid()::text = id::text);

-- Policies pour embeds
CREATE POLICY "Clients can view own embeds"
    ON embeds FOR SELECT
    USING (auth.uid()::text = client_id::text);

CREATE POLICY "Clients can insert own embeds"
    ON embeds FOR INSERT
    WITH CHECK (auth.uid()::text = client_id::text);

CREATE POLICY "Clients can update own embeds"
    ON embeds FOR UPDATE
    USING (auth.uid()::text = client_id::text);

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE clients IS 'Clients utilisant l''API Embed';
COMMENT ON TABLE embeds IS 'Instances d''embed chatbot JotForm';
COMMENT ON TABLE embed_analytics IS 'Analytics et événements des embeds';

COMMENT ON COLUMN embeds.jotform_agent_id IS 'ID de l''agent JotForm (ex: 019af1747f74749fae12e693ee2cfd4bf1be)';
COMMENT ON COLUMN embeds.configuration IS 'Configuration JSONB personnalisable (position, thème, comportement)';

-- ============================================
-- DONNÉES DE TEST
-- ============================================

-- Insérer un client de test
INSERT INTO clients (name, email, company, api_key)
VALUES (
    'Brams - Ino Service',
    'brams@ino-service.ai',
    'Ino Service',
    'ino_client_' || encode(gen_random_bytes(24), 'hex')
)
ON CONFLICT (email) DO NOTHING
RETURNING *;

-- ============================================
-- VÉRIFICATION
-- ============================================

SELECT 'Schéma API Embed créé avec succès! ✅' as status;
