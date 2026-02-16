'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  FileText,
  Brain,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  Shield,
  Zap,
  Phone,
  Mail,
  MapPin,
  Loader2,
} from 'lucide-react';

interface LandingPageProps {
  onGoToLogin: () => void;
  onGoToSignup: () => void;
}

export default function LandingPage({ onGoToLogin, onGoToSignup }: LandingPageProps) {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planName: string, amount: number) => {
    setLoadingPlan(planName);
    try {
      const res = await fetch('/api/square/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description: `Ino-Service - Forfait ${planName}`,
          customerName: 'Chauffeur',
        }),
      });
      const data = await res.json();
      if (data.success && data.link?.url) {
        window.location.href = data.link.url;
      } else {
        alert(data.error || 'Erreur lors de la création du paiement');
      }
    } catch {
      alert('Erreur de connexion. Réessayez.');
    } finally {
      setLoadingPlan(null);
    }
  };

  // JotForm Agent chatbot
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jotfor.ms/agent/embedjs/019c316345c37c149f3229f6a6ed7674fcaa/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      try { document.body.removeChild(script); } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-white">
      {/* Navigation unique */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-amber-100">
        <div className="container mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-400 p-2 rounded-xl shadow-md">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11c-.66 0-1.21.42-1.42 1.01L3 11v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 15c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5S7.33 15 6.5 15zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z" />
                </svg>
              </div>
              <span className="text-lg md:text-xl font-bold text-gray-800">Ino-Service</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#fonctionnalites" className="text-gray-600 hover:text-amber-600 transition-colors font-medium">Fonctionnalites</a>
              <a href="#avantages" className="text-gray-600 hover:text-amber-600 transition-colors font-medium">Avantages</a>
              <a href="#tarifs" className="text-gray-600 hover:text-amber-600 transition-colors font-medium">Tarifs</a>
              <a href="#temoignages" className="text-gray-600 hover:text-amber-600 transition-colors font-medium">Temoignages</a>
              <button
                onClick={onGoToLogin}
                className="bg-amber-500 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-amber-600 transition-all shadow-md hover:shadow-lg"
              >
                Connexion
              </button>
            </div>
            <button
              onClick={onGoToLogin}
              className="md:hidden bg-amber-500 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-md"
            >
              Connexion
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - style chaud centre */}
      <section className="relative overflow-hidden">
        {/* Background degrade chaud */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-50 z-0"></div>
        {/* Decorations */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-amber-200/40 rounded-full blur-3xl z-0"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl z-0"></div>

        <div className="relative z-10 container mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm text-amber-700 px-4 py-2 rounded-full mb-8 shadow-sm border border-amber-200">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-semibold">Assistant IA Personnel Inclus</span>
            </div>

            {/* Titre centre */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Chauffeur, ta gestion<br />
              <span className="text-amber-500">devient simple</span> avec l&apos;IA
            </h1>

            {/* Sous-titre centre */}
            <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              Scanne tes factures, suis tes tournees, gere ton vehicule. Tout en un seul endroit.
              Fait sur mesure pour les chauffeurs de <span className="font-bold text-gray-800">transport adapte au Quebec</span>.
            </p>

            {/* Stats cards avec icones */}
            <div className="grid grid-cols-3 gap-3 md:gap-5 mb-10 max-w-lg mx-auto">
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl p-4 md:p-5 text-center shadow-md border border-amber-200/50">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-2xl md:text-3xl font-bold text-amber-700">5h</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-xs md:text-sm text-amber-600 font-medium">economisees/semaine</div>
              </div>
              <div className="bg-gradient-to-br from-amber-200 to-orange-200 rounded-2xl p-4 md:p-5 text-center shadow-md border border-amber-200/50">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-2xl md:text-3xl font-bold text-amber-800">500$</span>
                  <DollarSign className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xs md:text-sm text-amber-700 font-medium">economises/mois</div>
              </div>
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl p-4 md:p-5 text-center shadow-md border border-orange-200/50">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-2xl md:text-3xl font-bold text-orange-700">100+</span>
                  <Users className="w-4 h-4 text-orange-500" />
                </div>
                <div className="text-xs md:text-sm text-orange-600 font-medium">chauffeurs actifs</div>
              </div>
            </div>

            {/* CTA centres */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={onGoToSignup}
                className="bg-amber-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                Essai Gratuit 15 Jours
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onGoToLogin}
                className="bg-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                J&apos;ai deja un compte
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-gray-500 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Sans carte de credit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Annule quand tu veux</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span>100% securise</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 120" className="w-full h-auto">
            <path fill="#ffffff" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* Comment ca marche */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple comme 1-2-3!
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Inscris-toi et commence a gerer ta business en minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Cree ton compte</h3>
                <p className="text-gray-600">
                  Inscription en 30 secondes. Ajoute ton vehicule et c&apos;est parti!
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Scanne tes factures</h3>
                <p className="text-gray-600">
                  L&apos;IA lit, classe et enregistre tout automatiquement. Zero Excel!
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Suis tes finances</h3>
                <p className="text-gray-600">
                  Dashboard en temps reel, rapports PDF, conseils IA personnalises.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalites */}
      <section id="fonctionnalites" className="py-16 md:py-20 bg-amber-50/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tout ce dont t&apos;as besoin dans une seule app
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Concu specialement pour les chauffeurs de transport adapte
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Sparkles, color: 'amber',
                title: 'Scan Factures IA',
                desc: 'Prends une photo, l\'IA extrait TOUT: montant, date, vendeur, categorie.',
                items: ['10 secondes par facture', 'Tous formats acceptes'],
              },
              {
                icon: TrendingUp, color: 'green',
                title: 'Dashboard Temps Reel',
                desc: 'Vois ton profit, revenus et depenses en direct. Fini les surprises!',
                items: ['Graphiques interactifs', 'Compare avec mois dernier'],
              },
              {
                icon: Brain, color: 'purple',
                title: 'Assistant IA Personnel',
                desc: 'Pose n\'importe quelle question: "Combien j\'ai fait cette semaine?"',
                items: ['Reponses instantanees', 'Connait toutes tes donnees'],
              },
              {
                icon: DollarSign, color: 'orange',
                title: 'Suivi Tournees',
                desc: 'Enregistre tes courses, adapte ou regulier, et suis tes revenus quotidiens.',
                items: ['Transport adapte & regulier', 'Revenus en temps reel'],
              },
              {
                icon: FileText, color: 'red',
                title: 'Rapports Automatiques',
                desc: 'Rapports mensuels generes automatiquement. CSV + PDF prets a envoyer!',
                items: ['Export CSV/PDF', 'Ventilation par type'],
              },
              {
                icon: Clock, color: 'blue',
                title: 'Gestion Vehicule',
                desc: 'Suis le kilometrage, les entretiens et les couts de ton vehicule.',
                items: ['Alertes entretien', 'Historique complet'],
              },
            ].map((feat) => {
              const bgMap: Record<string, string> = {
                amber: 'bg-amber-100', green: 'bg-green-100', purple: 'bg-purple-100',
                orange: 'bg-orange-100', red: 'bg-red-100', blue: 'bg-blue-100',
              };
              const textMap: Record<string, string> = {
                amber: 'text-amber-600', green: 'text-green-600', purple: 'text-purple-600',
                orange: 'text-orange-600', red: 'text-red-600', blue: 'text-blue-600',
              };
              return (
                <div key={feat.title} className="bg-white p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                  <div className={`w-14 h-14 ${bgMap[feat.color]} rounded-xl flex items-center justify-center mb-4`}>
                    <feat.icon className={`w-8 h-8 ${textMap[feat.color]}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feat.title}</h3>
                  <p className="text-gray-600 mb-4">{feat.desc}</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {feat.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section id="avantages" className="py-16 md:py-20 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pourquoi les chauffeurs nous adorent
            </h2>
            <p className="text-lg md:text-xl text-amber-100">
              Des resultats concrets, pas des promesses
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: '5h', label: 'par semaine', sub: 'economisees sur la paperasse' },
              { value: '500$', label: 'par mois', sub: 'economises en moyenne' },
              { value: '10s', label: 'par facture', sub: 'vs 5 min avec Excel' },
              { value: '24/7', label: 'disponible', sub: 'assistant IA toujours la' },
            ].map((stat) => (
              <div key={stat.value} className="text-center">
                <div className="text-4xl md:text-6xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-lg md:text-xl font-semibold mb-2 text-amber-100">{stat.label}</div>
                <div className="text-amber-200 text-sm md:text-base">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Temoignages */}
      <section id="temoignages" className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ce que disent nos chauffeurs
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Plus de 100 chauffeurs nous font confiance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {[
              {
                quote: "J'economise 600$/mois juste avec les deductions que je ratais avant! L'IA est incroyable.",
                name: 'Jean Tremblay', role: 'Chauffeur STM, Montreal', initials: 'JT', color: 'bg-amber-500',
              },
              {
                quote: "Avant je passais mes soirees sur Excel. Maintenant je scanne mes factures en 2 minutes et c'est fini!",
                name: 'Marie Gagnon', role: 'Chauffeure RTL, Longueuil', initials: 'MG', color: 'bg-orange-500',
              },
              {
                quote: "L'assistant IA repond a toutes mes questions. 'Combien j'ai fait cette semaine?' Reponse en 2 secondes!",
                name: 'Pierre Dubois', role: 'Chauffeur STL, Laval', initials: 'PD', color: 'bg-amber-600',
              },
            ].map((t) => (
              <div key={t.name} className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 md:p-8 rounded-2xl shadow-lg border border-amber-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${t.color} rounded-full flex items-center justify-center text-white font-bold`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{t.name}</div>
                    <div className="text-sm text-gray-600">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="py-16 md:py-20 bg-amber-50/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Un prix qui fait du sens
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Tous les plans incluent 15 jours d&apos;essai gratuit
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto items-start">
            {/* Pro */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 md:p-8 rounded-2xl shadow-2xl border-4 border-yellow-300 relative md:scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-300 text-amber-900 px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                POPULAIRE
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 text-center">Pro</h3>
              <div className="text-center mb-1">
                <span className="text-lg text-amber-200 line-through">30$/mois</span>
              </div>
              <div className="text-4xl font-bold text-white mb-2 text-center">
                20$<span className="text-lg font-normal text-amber-100">/mois</span>
              </div>
              <div className="text-center mb-6">
                <span className="bg-yellow-300 text-amber-900 px-3 py-1 rounded-full text-xs font-bold">PROMO -33%</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Scan factures illimite',
                  'Dashboard temps reel',
                  'Suivi tournees',
                  'Rapports mensuels',
                  'Assistant IA personnel',
                  'Alertes intelligentes',
                  'Gestion vehicule avancee',
                  'Support prioritaire',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-yellow-200 mt-0.5 flex-shrink-0" />
                    <span className="text-white">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe('Pro', 20)}
                disabled={loadingPlan === 'Pro'}
                className="w-full bg-white text-amber-700 py-3 rounded-full font-bold hover:bg-amber-50 transition-colors shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loadingPlan === 'Pro' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Redirection...
                  </>
                ) : (
                  'S\'abonner - 20$/mois'
                )}
              </button>
            </div>

            {/* Premium */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border-2 border-gray-200 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                COMPLET
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Premium</h3>
              <div className="text-center mb-1">
                <span className="text-lg text-gray-400 line-through">45$/mois</span>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2 text-center">
                30$<span className="text-lg font-normal text-gray-600">/mois</span>
              </div>
              <div className="text-center mb-6">
                <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-bold">PROMO -33%</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Tout dans Pro +',
                  'Acces comptable direct',
                  'Rapports personnalises',
                  'Support dedie 24/7',
                  'Multi-vehicules',
                  'Analyses financieres avancees',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe('Premium', 30)}
                disabled={loadingPlan === 'Premium'}
                className="w-full bg-gray-800 text-white py-3 rounded-full font-semibold hover:bg-gray-900 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loadingPlan === 'Premium' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Redirection...
                  </>
                ) : (
                  'S\'abonner - 30$/mois'
                )}
              </button>
            </div>
          </div>

          {/* ROI */}
          <div className="mt-12 md:mt-16 max-w-2xl mx-auto bg-gradient-to-r from-amber-50 to-orange-50 p-6 md:p-8 rounded-2xl border-2 border-amber-200">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 text-center">
              Ton Retour sur Investissement
            </h3>
            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-amber-600 mb-2">700$</div>
                <div className="text-sm text-gray-600">economises/mois en moyenne</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-600 mb-2">20$</div>
                <div className="text-sm text-gray-600">cout du plan Pro</div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t-2 border-amber-200 text-center">
              <div className="text-3xl md:text-4xl font-bold text-amber-600 mb-2">= 680$/mois</div>
              <div className="text-lg text-gray-700 font-semibold">de profit supplementaire!</div>
              <div className="text-sm text-gray-600 mt-2">Soit 8,160$/an dans tes poches</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Pret a simplifier ta vie?
          </h2>
          <p className="text-lg md:text-2xl text-amber-100 mb-10 max-w-3xl mx-auto">
            Rejoins plus de 100 chauffeurs qui economisent du temps et de l&apos;argent chaque mois.
            Essaie gratuitement pendant 15 jours, aucune carte de credit requise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGoToSignup}
              className="bg-white text-amber-700 px-10 py-5 rounded-full font-bold text-xl hover:bg-amber-50 transition-all shadow-lg hover:shadow-2xl inline-flex items-center justify-center gap-3 group"
            >
              Commence Ton Essai Gratuit
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onGoToLogin}
              className="bg-white/20 backdrop-blur-sm border-2 border-white text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-white/30 transition-all inline-flex items-center justify-center gap-3"
            >
              Se connecter
            </button>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-6 md:gap-8 text-amber-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>100+ chauffeurs actifs</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
              <span>Note 4.9/5</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Donnees 100% securisees</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-amber-500 p-1.5 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11c-.66 0-1.21.42-1.42 1.01L3 11v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 15c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5S7.33 15 6.5 15zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z" />
                  </svg>
                </div>
                <span className="font-bold text-lg">Ino-Service</span>
              </div>
              <p className="text-gray-400 text-sm">
                La solution de gestion financiere pour les chauffeurs de transport adapte au Quebec.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalites</a></li>
                <li><a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="#temoignages" className="hover:text-white transition-colors">Temoignages</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Ressources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Guide demarrage</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> support@transportadapte.ca</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +1 514-XXX-XXXX</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Montreal, QC</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              Developpe avec soin par <span className="font-semibold text-amber-400">Brams AI Agency</span>
            </p>
            <p className="text-gray-500 text-xs mt-2">&copy; 2025-2026 Ino-Service. Tous droits reserves.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
