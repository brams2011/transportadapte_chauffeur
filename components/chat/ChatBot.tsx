'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import TypingIndicator from '@/components/ui/TypingIndicator';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatBotProps {
  userId: string;
  userContext: {
    current_month_revenue: number;
    current_month_expenses: number;
    current_profit: number;
    top_expense_categories: string[];
  };
}

export default function ChatBot({ userId, userContext }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Bonjour! Je suis votre assistant financier IA. Posez-moi des questions sur vos finances, vos dépenses, ou demandez des conseils!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          question: input,
          context: userContext,
          history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '❌ Désolé, une erreur est survenue. Veuillez réessayer.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Questions suggérées
  const suggestedQuestions = [
    "Combien j'ai gagné ce mois-ci?",
    "Quelles sont mes plus grosses dépenses?",
    "Comment réduire mes coûts d'essence?",
    "Suis-je rentable ce mois?",
    "Conseils pour optimiser mes impôts"
  ];

  const handleSuggestionClick = (question: string) => {
    setInput(question);
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl h-[500px] md:h-[600px] flex flex-col border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-3 md:p-4 rounded-t-xl shadow-lg">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-white/20 backdrop-blur-sm p-2 md:p-2.5 rounded-xl shadow-inner">
            <Bot className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
              🤖 Assistant Financier IA
            </h3>
            <p className="text-xs md:text-sm text-blue-100 font-medium">Propulsé par Claude AI</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              message.role === 'user' ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'
            }`}
          >
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'
            }`}>
              {message.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* Message bubble */}
            <div className={`flex-1 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}>
              <div className={`inline-block max-w-[90%] md:max-w-[80%] rounded-2xl p-2.5 md:p-3 shadow-md ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 border border-gray-200'
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1.5 px-1 font-medium">
                {message.timestamp.toLocaleTimeString('fr-CA', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-slide-in-left">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 flex items-center justify-center shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl px-4 py-3 shadow-md">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions (only show if no messages yet) */}
      {messages.length === 1 && (
        <div className="px-3 md:px-4 pb-2 border-t pt-3">
          <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <span>💡</span> Questions suggérées
          </p>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(question)}
                className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-3 py-2 rounded-full hover:from-blue-100 hover:to-indigo-100 transition-all btn-press border border-blue-200 font-medium shadow-sm hover:shadow-md"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 md:p-4 border-t bg-gray-50/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="💬 Posez votre question..."
            disabled={loading}
            className="flex-1 px-3 md:px-4 py-2.5 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all btn-press shadow-md hover:shadow-lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
