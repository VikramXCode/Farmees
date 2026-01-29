import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  BarChart3,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Loader2,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { PageContainer } from '../components/layout/AppShell';
import Button from '../components/common/Button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  riskIfIgnored: string;
}

type AITab = 'chat' | 'dashboard';

export default function AIPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { selectedLand } = useFarm();

  const [activeTab, setActiveTab] = useState<AITab>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: language === 'english'
        ? `Hello ${user?.name?.split(' ')[0]}! 🌾 I'm your AI farming assistant. I can help you with crop recommendations, disease diagnosis, weather insights, and more. What would you like to know?`
        : `வணக்கம் ${user?.name?.split(' ')[0]}! 🌾 நான் உங்கள் AI விவசாய உதவியாளர். பயிர் பரிந்துரைகள், நோய் கண்டறிதல், வானிலை நுண்ணறிவு மற்றும் பலவற்றில் நான் உங்களுக்கு உதவ முடியும். நீங்கள் என்ன அறிய விரும்புகிறீர்கள்?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = {
    chat: language === 'english' ? 'Chat' : 'அரட்டை',
    dashboard: language === 'english' ? 'Dashboard' : 'டாஷ்போர்டு',
    typeMessage: language === 'english' ? 'Ask me anything...' : 'என்னிடம் எதையும் கேளுங்கள்...',
    recommendations: language === 'english' ? 'AI Recommendations' : 'AI பரிந்துரைகள்',
    confidence: language === 'english' ? 'Confidence' : 'நம்பிக்கை',
    riskComparison: language === 'english' ? 'Risk Comparison' : 'ஆபத்து ஒப்பீடு',
    ifFollowed: language === 'english' ? 'If followed' : 'பின்பற்றினால்',
    ifIgnored: language === 'english' ? 'If ignored' : 'புறக்கணித்தால்',
    pastAdvice: language === 'english' ? 'Past Advice' : 'கடந்த ஆலோசனை',
    viewAll: language === 'english' ? 'View All' : 'அனைத்தையும் காண்க',
  };

  // Recommendations will be loaded from backend in future
  const recommendations: Recommendation[] = [];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: language === 'english'
          ? "Based on your current crop (Rice) and soil conditions, I recommend maintaining consistent water levels of 2-3 inches during the tillering stage. The weather forecast shows light rain tomorrow, so you might reduce irrigation today. Would you like more specific advice?"
          : "உங்கள் தற்போதைய பயிர் (நெல்) மற்றும் மண் நிலைமைகளின் அடிப்படையில், பயிர் தளிர்க்கும் நிலையில் 2-3 அங்குல நிலையான நீர் மட்டத்தை பராமரிக்க பரிந்துரைக்கிறேன். வானிலை முன்னறிவிப்பு நாளை லேசான மழையைக் காட்டுகிறது, எனவே இன்று நீர்ப்பாசனத்தைக் குறைக்கலாம். மேலும் குறிப்பிட்ட ஆலோசனை வேண்டுமா?",
        timestamp: new Date(),
        confidence: 89,
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-danger-600 bg-danger-50';
      case 'medium':
        return 'text-warning-600 bg-warning-50';
      default:
        return 'text-success-600 bg-success-50';
    }
  };

  return (
    <PageContainer className="!p-0">
      {/* Tab Switcher */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'chat'
                ? 'bg-white text-farm-primary-600 shadow-sm'
                : 'text-text-muted'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {t.chat}
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-white text-farm-primary-600 shadow-sm'
                : 'text-text-muted'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {t.dashboard}
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <div className="flex flex-col h-[calc(100vh-200px)]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Context Card */}
            {selectedLand && (
              <div className="bg-farm-primary-50 border border-farm-primary-200 rounded-xl p-3 text-sm">
                <div className="flex items-center gap-2 text-farm-primary-700">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium">
                    {language === 'english' ? 'Context:' : 'சூழல்:'}
                  </span>
                  <span>{selectedLand.name} • {selectedLand.currentCrop}</span>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-farm-primary-600 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-text-primary rounded-bl-md shadow-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  
                  {/* Confidence Score for AI messages */}
                  {message.role === 'assistant' && message.confidence && (
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-text-muted">
                        {t.confidence}: {message.confidence}%
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(message.id, message.content)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-4 h-4 text-success-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-text-muted" />
                          )}
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <ThumbsUp className="w-4 h-4 text-text-muted" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <ThumbsDown className="w-4 h-4 text-text-muted" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-farm-primary-600" />
                    <span className="text-sm text-text-muted">
                      {language === 'english' ? 'Thinking...' : 'சிந்திக்கிறேன்...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleRecording}
                className={`p-3 rounded-xl transition-colors ${
                  isRecording
                    ? 'bg-danger-100 text-danger-600'
                    : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t.typeMessage}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-primary-500 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-farm-primary-600 text-white rounded-xl hover:bg-farm-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Dashboard Tab */
        <div className="px-4 py-4 space-y-6">
          {/* Recommendations */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-text-primary">{t.recommendations}</h2>
              <button className="text-sm text-farm-primary-600 font-medium flex items-center gap-1">
                {t.viewAll}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.id} className="card-farm">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-text-primary flex-1">{rec.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getImpactColor(rec.impact)}`}>
                      {rec.impact.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-3">{rec.description}</p>
                  
                  {/* Confidence Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-muted">{t.confidence}</span>
                      <span className="font-semibold text-farm-primary-600">{rec.confidence}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-farm-primary-500 rounded-full"
                        style={{ width: `${rec.confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Risk Comparison */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-text-muted">{t.riskComparison}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-success-500" />
                        <div>
                          <p className="text-xs text-text-muted">{t.ifFollowed}</p>
                          <p className="text-sm font-medium text-success-600">
                            {language === 'english' ? '+25% yield' : '+25% மகசூல்'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-danger-500" />
                        <div>
                          <p className="text-xs text-text-muted">{t.ifIgnored}</p>
                          <p className="text-sm font-medium text-danger-600">{rec.riskIfIgnored}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Past Advice History */}
          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">{t.pastAdvice}</h2>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-farm-primary-300 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-farm-primary-100 text-farm-primary-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm truncate">
                      {language === 'english' ? 'Irrigation advice for paddy' : 'நெல்லுக்கான நீர்ப்பாசன ஆலோசனை'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {i} {language === 'english' ? 'days ago' : 'நாட்களுக்கு முன்'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </PageContainer>
  );
}
