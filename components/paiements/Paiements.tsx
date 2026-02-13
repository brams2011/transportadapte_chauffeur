'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard, Receipt, Link2, Plus, ExternalLink, Copy, CheckCircle,
  Loader2, X, Send, DollarSign, Clock, AlertCircle, RefreshCw
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────
interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  sourceType: string;
  cardBrand: string | null;
  cardLast4: string | null;
  receiptUrl: string | null;
  createdAt: string;
  note: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  title: string | null;
  description: string | null;
  amount: number;
  currency: string;
  dueDate: string | null;
  publicUrl: string | null;
  createdAt: string;
  recipientName: string;
}

interface PaymentLink {
  id: string;
  url: string;
  description: string | null;
  amount: number | null;
  createdAt: string;
}

interface PaiementsProps {
  userId: string;
}

// ─── Composant Principal ─────────────────────────────────────────
export default function Paiements({ userId }: PaiementsProps) {
  const [activeSection, setActiveSection] = useState<'transactions' | 'factures' | 'liens'>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showNewLink, setShowNewLink] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Formulaire facture
  const [invoiceForm, setInvoiceForm] = useState({
    customerName: '', customerEmail: '', amount: '', description: '', dueDate: ''
  });

  // Formulaire lien de paiement
  const [linkForm, setLinkForm] = useState({
    amount: '', description: '', customerName: ''
  });

  // ─── Fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [txRes, invRes, linkRes] = await Promise.all([
        fetch('/api/square/transactions').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/square/invoices').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/square/payment-links').then(r => r.json()).catch(() => ({ success: false })),
      ]);

      if (txRes.success) setTransactions(txRes.transactions);
      if (invRes.success) setInvoices(invRes.invoices);
      if (linkRes.success) setPaymentLinks(linkRes.links);

      if (!txRes.success && !invRes.success && !linkRes.success) {
        setError('Impossible de se connecter à Square. Vérifiez vos clés API.');
      }
    } catch {
      setError('Erreur de connexion à Square');
    } finally {
      setLoading(false);
    }
  };

  // ─── Actions ───────────────────────────────────────────────────
  const handleCreateInvoice = async () => {
    if (!invoiceForm.amount || !invoiceForm.customerEmail) return;
    setSaving(true);
    try {
      const res = await fetch('/api/square/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewInvoice(false);
        setInvoiceForm({ customerName: '', customerEmail: '', amount: '', description: '', dueDate: '' });
        fetchAll();
      } else {
        alert(data.error || 'Erreur lors de la création');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLink = async () => {
    if (!linkForm.amount) return;
    setSaving(true);
    try {
      const res = await fetch('/api/square/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewLink(false);
        setLinkForm({ amount: '', description: '', customerName: '' });
        // Copier automatiquement le lien
        if (data.link?.url) {
          navigator.clipboard.writeText(data.link.url);
          setCopied('new');
          setTimeout(() => setCopied(null), 3000);
        }
        fetchAll();
      } else {
        alert(data.error || 'Erreur lors de la création');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // ─── Helpers ───────────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      COMPLETED: { color: 'bg-green-100 text-green-700', label: 'Complété' },
      APPROVED: { color: 'bg-green-100 text-green-700', label: 'Approuvé' },
      PENDING: { color: 'bg-yellow-100 text-yellow-700', label: 'En attente' },
      FAILED: { color: 'bg-red-100 text-red-700', label: 'Échoué' },
      CANCELED: { color: 'bg-gray-100 text-gray-600', label: 'Annulé' },
      DRAFT: { color: 'bg-gray-100 text-gray-600', label: 'Brouillon' },
      UNPAID: { color: 'bg-orange-100 text-orange-700', label: 'Impayée' },
      SENT: { color: 'bg-blue-100 text-blue-700', label: 'Envoyée' },
      PAID: { color: 'bg-green-100 text-green-700', label: 'Payée' },
      PARTIALLY_PAID: { color: 'bg-yellow-100 text-yellow-700', label: 'Partiel' },
      OVERDUE: { color: 'bg-red-100 text-red-700', label: 'En retard' },
      SCHEDULED: { color: 'bg-blue-100 text-blue-700', label: 'Planifiée' },
    };
    const badge = map[status] || { color: 'bg-gray-100 text-gray-600', label: status };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge.color}`}>{badge.label}</span>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-CA', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatMoney = (amount: number) => amount.toFixed(2) + ' $';

  const sections = [
    { id: 'transactions' as const, label: 'Transactions', icon: CreditCard, count: transactions.length },
    { id: 'factures' as const, label: 'Factures', icon: Receipt, count: invoices.length },
    { id: 'liens' as const, label: 'Liens de paiement', icon: Link2, count: paymentLinks.length },
  ];

  // ─── Rendu ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-green-600" />
            Paiements Square
          </h2>
          <p className="text-sm text-gray-500 mt-1">Gérez vos transactions, factures et liens de paiement</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Erreur Square */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900">{error}</p>
            <p className="text-sm text-red-700 mt-1">
              Ajoutez vos clés Square dans le fichier .env.local :
              SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_ENVIRONMENT
            </p>
          </div>
        </div>
      )}

      {/* Sous-navigation */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
              activeSection === s.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <s.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{s.label}</span>
            <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{s.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <>
          {/* ═══ TRANSACTIONS ═══ */}
          {activeSection === 'transactions' && (
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune transaction trouvée</p>
                </div>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-50 p-2.5 rounded-xl">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{formatMoney(tx.amount)}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDate(tx.createdAt)}
                            {tx.cardBrand && <span>• {tx.cardBrand} ****{tx.cardLast4}</span>}
                          </div>
                          {tx.note && <p className="text-xs text-gray-400 mt-0.5">{tx.note}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(tx.status)}
                        {tx.receiptUrl && (
                          <a href={tx.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 p-1">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══ FACTURES ═══ */}
          {activeSection === 'factures' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowNewInvoice(true)}
                  className="bg-green-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle facture
                </button>
              </div>

              {invoices.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune facture</p>
                </div>
              ) : (
                invoices.map(inv => (
                  <div key={inv.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2.5 rounded-xl">
                          <Receipt className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            #{inv.invoiceNumber} — {formatMoney(inv.amount)}
                          </p>
                          <p className="text-sm text-gray-600">{inv.recipientName}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            {inv.dueDate && <span>Échéance: {inv.dueDate}</span>}
                            {inv.title && <span>• {inv.title}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(inv.status)}
                        {inv.publicUrl && (
                          <a href={inv.publicUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 p-1">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══ LIENS DE PAIEMENT ═══ */}
          {activeSection === 'liens' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowNewLink(true)}
                  className="bg-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-md text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau lien
                </button>
              </div>

              {paymentLinks.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun lien de paiement</p>
                </div>
              ) : (
                paymentLinks.map(link => (
                  <div key={link.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-50 p-2.5 rounded-xl">
                          <Link2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          {link.amount && <p className="font-bold text-gray-900">{formatMoney(link.amount)}</p>}
                          {link.description && <p className="text-sm text-gray-600">{link.description}</p>}
                          <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] md:max-w-[400px] truncate">{link.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyToClipboard(link.url, link.id)}
                          className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Copier le lien"
                        >
                          {copied === link.id ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 p-2">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* ═══ MODAL NOUVELLE FACTURE ═══ */}
      {showNewInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Nouvelle facture</h3>
              <button onClick={() => setShowNewInvoice(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du client</label>
                <input
                  type="text"
                  value={invoiceForm.customerName}
                  onChange={e => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
                  placeholder="Jean Tremblay"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email du client *</label>
                <input
                  type="email"
                  value={invoiceForm.customerEmail}
                  onChange={e => setInvoiceForm({ ...invoiceForm, customerEmail: e.target.value })}
                  placeholder="jean@email.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoiceForm.amount}
                    onChange={e => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    placeholder="150.00"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Échéance</label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={invoiceForm.description}
                  onChange={e => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                  placeholder="Service de transport adapté"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button
                onClick={handleCreateInvoice}
                disabled={saving || !invoiceForm.amount || !invoiceForm.customerEmail}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Créer et envoyer
              </button>
              <button onClick={() => setShowNewInvoice(false)} className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL NOUVEAU LIEN ═══ */}
      {showNewLink && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Nouveau lien de paiement</h3>
              <button onClick={() => setShowNewLink(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={linkForm.amount}
                  onChange={e => setLinkForm({ ...linkForm, amount: e.target.value })}
                  placeholder="75.00"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du client</label>
                <input
                  type="text"
                  value={linkForm.customerName}
                  onChange={e => setLinkForm({ ...linkForm, customerName: e.target.value })}
                  placeholder="Jean Tremblay"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={linkForm.description}
                  onChange={e => setLinkForm({ ...linkForm, description: e.target.value })}
                  placeholder="Transport adapté - Course du 10 février"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs text-purple-700">Le lien sera automatiquement copié dans votre presse-papiers après la création.</p>
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button
                onClick={handleCreateLink}
                disabled={saving || !linkForm.amount}
                className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                Créer le lien
              </button>
              <button onClick={() => setShowNewLink(false)} className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copié notification */}
      {copied === 'new' && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-slide-in-left z-50">
          <CheckCircle className="w-5 h-5" />
          Lien copié dans le presse-papiers!
        </div>
      )}
    </div>
  );
}
