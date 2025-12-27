import { useState, useEffect } from 'react';
import { MessageCircle, Mic, Send, Bot, BarChart3, MessageSquare } from 'lucide-react';
import { useFarm } from '../../contexts/FarmContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { landService } from '../../services/landService';
import { LandData } from '../../types/land';
import { aiService } from '../../services/aiService';
import EscalateButton from './EscalateButton';
import FarmAnalyticsDashboard from './FarmAnalyticsDashboard';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AIAssistant() {
  const { selectedLandId, lands, addReminder } = useFarm();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard');
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [landData, setLandData] = useState<LandData | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: t('hello_assistant'),
      timestamp: new Date().toISOString()
    }
  ]);

  const selectedLand = lands.find(land => land.id === selectedLandId);

  // Load land-specific data when land is selected
  useEffect(() => {
    let cancelled = false;
    const loadLandData = async () => {
      if (selectedLandId) {
        try {
          const data = await landService.getLandData(selectedLandId) ||
            await landService.getMockLandData(selectedLandId);
          if (!cancelled) setLandData(data);
        } catch (error) {
          console.error('Error loading land data:', error);
          if (!cancelled) {
            const mockData = await landService.getMockLandData(selectedLandId);
            setLandData(mockData);
          }
        }
      } else {
        setLandData(null);
      }
    };

    loadLandData();
    return () => { cancelled = true; };
  }, [selectedLandId]);

  const handleRecommendationRequest = (query: string) => {
    setActiveTab('chat');
    setInputValue(query);
    // Auto-send the query
    setTimeout(() => {
      if (query.trim()) {
        const userMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: query,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        // Generate AI response
        generateResponseWithLandData(query).then(response => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: response,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, assistantMessage]);
        });
      }
    }, 100);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = inputValue;
    setInputValue('');

    // Generate AI response with land-specific data
    const response = await generateResponseWithLandData(userInput);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, assistantMessage]);

    // Save interaction to database
    try {
      await landService.saveAIInteraction({
        landId: selectedLandId || 'default',
        userId: user?.id || 'guest',
        timestamp: new Date().toISOString(),
        userMessage: userInput,
        aiResponse: response,
        context: {
          selectedLand: selectedLand?.name,
          weatherData: landData?.weatherHistory.slice(-1)[0],
          marketData: landData?.marketData[0],
          recentActivities: landData?.treatmentHistory.slice(-3).map(t => t.type)
        }
      });
    } catch (error) {
      console.error('Error saving AI interaction:', error);
    }

    // Check if the response suggests an action to be added to reminders
    if (response.includes('fertilize') || response.includes('spray') || response.includes('irrigation') ||
      response.includes('ഓർമ്മപ്പെടുത്തലുകളിൽ ചേർക്കുന്നു')) {
      addReminder({
        title: 'AI Recommendation',
        description: response,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        landId: selectedLandId || '1',
        completed: false,
        priority: 'medium'
      });
    }
  };

  const generateResponseWithLandData = async (input: string): Promise<string> => {
    const systemPrompt = language === 'tamil'
      ? 'நீங்கள் ஒரு விவசாய உதவியாளர். எளிய மற்றும் நடைமுறை தமிழ் ஆலோசனைகளை வழங்கவும்.'
      : 'You are a farming assistant. Provide concise, practical guidance.';

    try {
      const aiText = await aiService.generate(input, { systemPrompt, context: { language, landData } });
      if (aiText && aiText.trim().length > 0) {
        return aiText.trim();
      }
    } catch (e) {
      // Fallback handled below
    }

    // Use land-specific rules if AI not available
    if (landData) {
      return generateLandSpecificResponse(input, landData);
    }

    // Final basic fallback
    return generateResponse(input);
  };

  const generateLandSpecificResponse = (input: string, data: LandData): string => {
    const lowerInput = input.toLowerCase();

    // Fertilizer recommendations based on soil data
    if (lowerInput.includes('fertilizer') || lowerInput.includes('fertilize') || lowerInput.includes('ചെമ്പ്') || lowerInput.includes('உரம்')) {
      const soil = data.soilReport;
      if (soil) {
        if (language === 'tamil') {
          return `${data.name} இல் ${data.currentCrop} பயிரிட, மண் pH ${soil.pH} ஆக உள்ளது. நைட்ரஜன் ${soil.nitrogen} ppm, பாஸ்பரஸ் ${soil.phosphorus} ppm, பொட்டாசியம் ${soil.potassium} ppm உள்ளது. பரிந்துரை: NPK 20:10:10 ஹெக்டேருக்கு 120 கிலோ இடவும். நீர் இருப்பு ${data.waterAvailability} ஆக இருப்பதால், காலையில் இடவும்.`;
        }
        return `For your ${data.name} with ${data.currentCrop}, soil pH is ${soil.pH}. Nitrogen: ${soil.nitrogen} ppm, Phosphorus: ${soil.phosphorus} ppm, Potassium: ${soil.potassium} ppm. Recommendation: Apply 120kg/hectare of NPK 20:10:10. With ${data.waterAvailability} water availability, apply in the morning.`;
      }
    }

    // Weather-based advice
    if (lowerInput.includes('weather') || lowerInput.includes('வானிலை')) {
      const recentWeather = data.weatherHistory[data.weatherHistory.length - 1];
      if (recentWeather) {
        if (language === 'tamil') {
          return `${data.name} இல் தற்போதைய வானிலை: வெப்பநிலை ${recentWeather.temperature}°C, ஈரப்பதம் ${recentWeather.humidity}%, மழை ${recentWeather.rainfall}mm. ${recentWeather.conditions} நிலையில், ${data.currentCrop} பயிரிட உகந்தது.`;
        }
        return `Current weather in ${data.name}: Temperature ${recentWeather.temperature}°C, Humidity ${recentWeather.humidity}%, Rainfall ${recentWeather.rainfall}mm. With ${recentWeather.conditions} conditions, it's suitable for growing ${data.currentCrop}.`;
      }
    }

    // Market price information
    if (lowerInput.includes('market') || lowerInput.includes('price') || lowerInput.includes('சந்தை') || lowerInput.includes('விலை')) {
      const market = data.marketData[0];
      if (market) {
        if (language === 'tamil') {
          return `${data.name} இல் ${market.cropName} இன் தற்போதைய விலை ₹${market.currentPrice}/குவின்டால். தேவை ${market.demand}. அடுத்த மாத முன்னறிவிப்பு ₹${market.forecast.nextMonth}/குவின்டால்.`;
        }
        return `Current price for ${market.cropName} in ${data.name}: ₹${market.currentPrice}/quintal. Demand is ${market.demand}. Next month forecast: ₹${market.forecast.nextMonth}/quintal.`;
      }
    }

    // Pest and disease management based on history
    if (lowerInput.includes('pest') || lowerInput.includes('disease') || lowerInput.includes('பூச்சி') || lowerInput.includes('நோய்')) {
      const recentPests = data.pestDiseaseHistory.filter(p => p.status === 'active');
      if (recentPests.length > 0) {
        if (language === 'tamil') {
          return `${data.name} இல் உள்ள பூச்சிகள்: ${recentPests.map(p => p.name).join(', ')}. பரிந்துரை: ${recentPests.map(p => p.treatment).join(', ')}. உங்கள் ${data.currentCrop} பயிரைப் பாதுகாக்கவும்.`;
        }
        return `Active pests in ${data.name}: ${recentPests.map(p => p.name).join(', ')}. Recommendations: ${recentPests.map(p => p.treatment).join(', ')}. Protect your ${data.currentCrop} crop.`;
      }
    }

    // Treatment history
    if (lowerInput.includes('treatment') || lowerInput.includes('spray') || lowerInput.includes('சிகிச்சை') || lowerInput.includes('தெளிப்பு')) {
      const recentTreatments = data.treatmentHistory.slice(-3);
      if (recentTreatments.length > 0) {
        if (language === 'tamil') {
          return `${data.name} இல் சமீபத்திய சிகிச்சைகள்: ${recentTreatments.map(t => `${t.product} (${t.quantity}${t.unit})`).join(', ')}. அடுத்த சிகிச்சையைத் திட்டமிடுங்கள்.`;
        }
        return `Recent treatments in ${data.name}: ${recentTreatments.map(t => `${t.product} (${t.quantity}${t.unit})`).join(', ')}. Plan your next treatment accordingly.`;
      }
    }

    // General land-specific advice
    if (language === 'tamil') {
      return `${data.name} இல் ${data.currentCrop} பயிரிட, ${data.soilType} மண் மற்றும் ${data.waterAvailability} நீர் வசதி உள்ளது. மேலும் விவரங்களுக்கு என்னைக் கேட்கவும்.`;
    }
    return `For your ${data.name} with ${data.currentCrop}, you have ${data.soilType} soil and ${data.waterAvailability} water availability. Ask me for more specific details.`;
  };

  const generateResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();

    if (selectedLand) {
      if (lowerInput.includes('fertilizer') || lowerInput.includes('fertilize') || lowerInput.includes('ചെമ്പ്') || lowerInput.includes('உரம்')) {
        if (language === 'tamil') {
          return `${selectedLand.name} இல் ${selectedLand.currentCrop} பயிரிட, ${selectedLand.soilType} மண்ணிற்கு ஏற்ற நைட்ரஜன் உரம் பரிந்துரைக்கிறேன். ${selectedLand.waterAvailability} நீர் வசதி இருப்பதால், ஹெக்டேருக்கு 120 கிலோ NPK 20:10:10 இடவும். அதிகாலை சிறந்தது. இதை உங்கள் நினைவூட்டல்களில் சேர்க்கிறேன்.`;
        }
        return `For your ${selectedLand.name} with ${selectedLand.currentCrop}, I recommend applying nitrogen fertilizer based on the ${selectedLand.soilType} soil type. With ${selectedLand.waterAvailability} water availability, apply 120kg/hectare of NPK 20:10:10. Best time is early morning. I'll add this to your reminders.`;
      }

      if (lowerInput.includes('pest') || lowerInput.includes('disease') || lowerInput.includes('பூச்சி') || lowerInput.includes('நோய்')) {
        if (language === 'tamil') {
          return `${selectedLand.name} இல் ${selectedLand.currentCrop} பயிரிட, தண்டு துளைப்பான் மற்றும் அசுவினி போன்ற பொதுவான பூச்சிகள் குறித்து கவனமாக இருங்கள். 3-4 நாட்களுக்கு ஒருமுறை ஆய்வு செய்ய பரிந்துரைக்கப்படுகிறது. வேப்ப எண்ணெய் தெளிப்பை தடுப்பு நடவடிக்கையாகப் பயன்படுத்தவும். ${selectedLand.soilType} மண் பொதுவாக பூச்சி எதிர்ப்பைக் கொண்டுள்ளது.`;
        }
        return `For ${selectedLand.currentCrop} in your ${selectedLand.name}, watch out for common pests like stem borers and aphids. Regular inspection every 3-4 days is recommended. Use neem oil spray as a preventive measure. The ${selectedLand.soilType} soil generally has good pest resistance.`;
      }

      if (lowerInput.includes('water') || lowerInput.includes('irrigation') || lowerInput.includes('நீர்') || lowerInput.includes('நீர்ப்பாசனம்')) {
        if (language === 'tamil') {
          return `${selectedLand.name} இல் ${selectedLand.waterAvailability} நீர் வசதி உள்ளது. ${selectedLand.currentCrop} பயிரிட, மண் ஈரப்பதத்தை 80% பராமரிக்கவும். தற்போதைய வானிலையில், 2-3 நாட்களுக்கு ஒருமுறை நீர் பாய்ச்சவும். அடுத்த நீர்ப்பாசன சுழற்சிக்கு நினைவூட்டலை அமைக்கிறேன்.`;
        }
        return `Your ${selectedLand.name} has ${selectedLand.waterAvailability} water availability. For ${selectedLand.currentCrop}, maintain soil moisture at 80% field capacity. With the current weather, irrigate every 2-3 days. I'll set up a reminder for your next irrigation cycle.`;
      }

      if (lowerInput.includes('harvest') || lowerInput.includes('when to harvest') || lowerInput.includes('அறுவடை') || lowerInput.includes('எப்போது அறுவடை')) {
        if (language === 'tamil') {
          return `${selectedLand.name} இல் ${selectedLand.currentCrop} பயிரிட, அறுவடை நேரம் ரகத்தைப் பொறுத்தது. பொதுவாக, நடவு செய்த 110-120 நாட்களுக்குப் பிறகு நெல் தயாராகும். தங்க மஞ்சள் நிறத் தானியங்களைப் பார்த்து, ஈரப்பதத்தைச் சரிபார்க்கவும். தற்போதைய சந்தை விலை ₹2,850/குவின்டால்.`;
        }
        return `For ${selectedLand.currentCrop} in ${selectedLand.name}, harvest timing depends on the variety. Generally, rice is ready in 110-120 days after transplanting. Look for golden yellow grains and check moisture content. Current market prices are favorable at ₹2,850/quintal.`;
      }
    }

    // General responses
    if (lowerInput.includes('weather') || lowerInput.includes('வானிலை')) {
      if (language === 'tamil') {
        return 'தற்போதைய வானிலை முன்னறிவிப்பின்படி, 28°C வெப்பநிலையுடன் ஓரளவு மேகமூட்டமாக இருக்கும் என்று எதிர்பார்க்கப்படுகிறது. புதன் மற்றும் வியாழன் அன்று கனமழை பெய்யக்கூடும், எனவே அதற்கேற்ப திட்டமிடுங்கள். மழையின் போது மருந்து தெளிப்பதைத் தவிர்க்கவும் மற்றும் வடிகால் வசதியை உறுதி செய்யவும்.';
      }
      return 'Based on the current weather forecast, we expect partly cloudy conditions with 28°C temperature. Heavy rain is predicted for Wednesday-Thursday, so plan accordingly. Avoid spraying during rain and ensure proper drainage.';
    }

    if (lowerInput.includes('market') || lowerInput.includes('price') || lowerInput.includes('சந்தை') || lowerInput.includes('விலை')) {
      if (language === 'tamil') {
        return 'தற்போதைய சந்தை விலைகள்: நெல் ₹2,850/குவின்டால் (1.8% உயர்வு), தேங்காய் ₹18,500/குவின்டால் (3.6% குறைவு). ஏற்றுமதி வாய்ப்புகளால் நெல்லுக்கு அதிக தேவை உள்ளது. உங்கள் பயிர்களுக்கான விலை எச்சரிக்கைகளை அமைக்க விரும்புகிறீர்களா?';
      }
      return 'Current market prices show rice at ₹2,850/quintal (up 1.8%), coconut at ₹18,500/quintal (down 3.6%). Demand is high for rice due to export opportunities. Would you like me to set up price alerts for your crops?';
    }

    if (language === 'tamil') {
      return 'விவசாயத்தில் உதவி தேவை என்பதைப் புரிந்துகொள்கிறேன். நீங்கள் என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள் என்பதை இன்னும் விரிவாகக் கூற முடியுமா? பயிர் பாதுகாப்பு, பூச்சி கட்டுப்பாடு, வானிலை திட்டமிடல், சந்தை விலைகள் போன்றவற்றில் நான் உதவ முடியும். மேலும் குறிப்பிட்ட ஆலோசனைக்கு "என் நிலங்கள்" என்பதிலிருந்து ஒரு குறிப்பிட்ட நிலத்தைத் தேர்ந்தெடுக்கலாம்.';
    }
    return 'I understand you need help with farming. Could you please be more specific about what you\'d like to know? I can assist with crop care, pest management, weather planning, market prices, and more. You can also select a specific land from "My Lands" for more targeted advice.';
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Voice input functionality would be implemented here
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-96 h-[32rem] flex flex-col">
          {/* Header */}
          <div className="bg-green-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center">
              <Bot className="w-5 h-5 mr-2" />
              <div>
                <h4 className="font-medium">{t('farm_assistant')}</h4>
                {selectedLand && (
                  <p className="text-xs text-green-100">
                    {t('context')}: {selectedLand.name}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-green-100 hover:text-white"
            >
              ×
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center ${activeTab === 'dashboard'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center ${activeTab === 'chat'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'dashboard' ? (
              <div className="h-full overflow-y-auto">
                <FarmAnalyticsDashboard onRecommendationRequest={handleRecommendationRequest} />
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100% - 80px)' }}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-lg text-sm ${message.type === 'user'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        <div className="flex items-start">
                          {message.type === 'assistant' && (
                            <Bot className="w-4 h-4 mr-2 mt-0.5 text-green-600" />
                          )}
                          <p>{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={t('ask_about_farming')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                    />
                    <button
                      onClick={handleVoiceInput}
                      className={`p-2 rounded-lg transition-colors ${isListening
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSend}
                      className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <EscalateButton
                    userId={user?.id || 'guest'}
                    landId={selectedLandId || undefined}
                    getQueryContext={() => ({
                      query: messages.filter(m => m.type === 'user').slice(-1)[0]?.content || inputValue || 'Assistance needed for farming issue',
                      context: {
                        land: selectedLand || null,
                        language,
                        lastAssistantMessage: messages.filter(m => m.type === 'assistant').slice(-1)[0]?.content,
                      },
                      suggestions: []
                    })}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}