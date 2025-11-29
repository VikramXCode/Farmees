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
    const loadLandData = async () => {
      if (selectedLandId) {
        try {
          const data = await landService.getLandData(selectedLandId) || 
                      await landService.getMockLandData(selectedLandId);
          setLandData(data);
        } catch (error) {
          console.error('Error loading land data:', error);
          const mockData = await landService.getMockLandData(selectedLandId);
          setLandData(mockData);
        }
      } else {
        setLandData(null);
      }
    };

    loadLandData();
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
    const systemPrompt = language === 'malayalam'
      ? 'നിങ്ങൾ ഒരു കാർഷിക സഹായി ആണ്. ലളിതവും പ്രായോഗികവുമായ Malayāḷam ഉപദേശം നൽകുക.'
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
    if (lowerInput.includes('fertilizer') || lowerInput.includes('fertilize') || lowerInput.includes('ചെമ്പ്') || lowerInput.includes('വളം')) {
      const soil = data.soilReport;
      if (soil) {
        if (language === 'malayalam') {
          return `${data.name} ൽ ${data.currentCrop} വളർത്തുന്നതിന്, മണ്ണിന്റെ pH ${soil.pH} ആണ്. നൈട്രജൻ ${soil.nitrogen} ppm, ഫോസ്ഫറസ് ${soil.phosphorus} ppm, പൊട്ടാസ്യം ${soil.potassium} ppm ഉണ്ട്. ശുപാർശ: NPK 20:10:10 ഹെക്ടറിന് 120 കിലോ പ്രയോഗിക്കുക. ജല ലഭ്യത ${data.waterAvailability} ആയതിനാൽ, രാവിലെ പ്രയോഗിക്കുക.`;
        }
        return `For your ${data.name} with ${data.currentCrop}, soil pH is ${soil.pH}. Nitrogen: ${soil.nitrogen} ppm, Phosphorus: ${soil.phosphorus} ppm, Potassium: ${soil.potassium} ppm. Recommendation: Apply 120kg/hectare of NPK 20:10:10. With ${data.waterAvailability} water availability, apply in the morning.`;
      }
    }
    
    // Weather-based advice
    if (lowerInput.includes('weather') || lowerInput.includes('കാലാവസ്ഥ')) {
      const recentWeather = data.weatherHistory[data.weatherHistory.length - 1];
      if (recentWeather) {
        if (language === 'malayalam') {
          return `${data.name} ൽ നിലവിലെ കാലാവസ്ഥ: താപനില ${recentWeather.temperature}°C, ഈർപ്പം ${recentWeather.humidity}%, മഴ ${recentWeather.rainfall}mm. ${recentWeather.conditions} അവസ്ഥയിൽ, ${data.currentCrop} വളർത്തുന്നതിന് അനുയോജ്യമാണ്.`;
        }
        return `Current weather in ${data.name}: Temperature ${recentWeather.temperature}°C, Humidity ${recentWeather.humidity}%, Rainfall ${recentWeather.rainfall}mm. With ${recentWeather.conditions} conditions, it's suitable for growing ${data.currentCrop}.`;
      }
    }
    
    // Market price information
    if (lowerInput.includes('market') || lowerInput.includes('price') || lowerInput.includes('മാർക്കറ്റ്') || lowerInput.includes('വില')) {
      const market = data.marketData[0];
      if (market) {
        if (language === 'malayalam') {
          return `${data.name} ൽ ${market.cropName} ന്റെ നിലവിലെ വില ₹${market.currentPrice}/quintal. ആവശ്യം ${market.demand} ആണ്. അടുത്ത മാസത്തെ പ്രവചനം ₹${market.forecast.nextMonth}/quintal.`;
        }
        return `Current price for ${market.cropName} in ${data.name}: ₹${market.currentPrice}/quintal. Demand is ${market.demand}. Next month forecast: ₹${market.forecast.nextMonth}/quintal.`;
      }
    }
    
    // Pest and disease management based on history
    if (lowerInput.includes('pest') || lowerInput.includes('disease') || lowerInput.includes('കീടം') || lowerInput.includes('രോഗം')) {
      const recentPests = data.pestDiseaseHistory.filter(p => p.status === 'active');
      if (recentPests.length > 0) {
        if (language === 'malayalam') {
          return `${data.name} ൽ സജീവ കീടങ്ങൾ: ${recentPests.map(p => p.name).join(', ')}. ശുപാർശ: ${recentPests.map(p => p.treatment).join(', ')}. നിങ്ങളുടെ ${data.currentCrop} വിളയെ സൂക്ഷിക്കുക.`;
        }
        return `Active pests in ${data.name}: ${recentPests.map(p => p.name).join(', ')}. Recommendations: ${recentPests.map(p => p.treatment).join(', ')}. Protect your ${data.currentCrop} crop.`;
      }
    }
    
    // Treatment history
    if (lowerInput.includes('treatment') || lowerInput.includes('spray') || lowerInput.includes('ചികിത്സ') || lowerInput.includes('സ്പ്രേ')) {
      const recentTreatments = data.treatmentHistory.slice(-3);
      if (recentTreatments.length > 0) {
        if (language === 'malayalam') {
          return `${data.name} ൽ സമീപകാല ചികിത്സകൾ: ${recentTreatments.map(t => `${t.product} (${t.quantity}${t.unit})`).join(', ')}. അടുത്ത ചികിത്സ ആസൂത്രണം ചെയ്യുക.`;
        }
        return `Recent treatments in ${data.name}: ${recentTreatments.map(t => `${t.product} (${t.quantity}${t.unit})`).join(', ')}. Plan your next treatment accordingly.`;
      }
    }
    
    // General land-specific advice
    if (language === 'malayalam') {
      return `${data.name} ൽ ${data.currentCrop} വളർത്തുന്നതിന്, ${data.soilType} മണ്ണും ${data.waterAvailability} ജല ലഭ്യതയും ഉണ്ട്. കൂടുതൽ വിശദാംശങ്ങൾക്ക് എന്നെ ചോദിക്കുക.`;
    }
    return `For your ${data.name} with ${data.currentCrop}, you have ${data.soilType} soil and ${data.waterAvailability} water availability. Ask me for more specific details.`;
  };

  const generateResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (selectedLand) {
      if (lowerInput.includes('fertilizer') || lowerInput.includes('fertilize') || lowerInput.includes('ചെമ്പ്') || lowerInput.includes('വളം')) {
        if (language === 'malayalam') {
          return `${selectedLand.name} ൽ ${selectedLand.currentCrop} വളർത്തുന്നതിന്, ${selectedLand.soilType} മണ്ണിന് അനുയോജ്യമായ നൈട്രജൻ വളം ശുപാർശ ചെയ്യുന്നു. ${selectedLand.waterAvailability} ജല ലഭ്യതയുള്ളതിനാൽ, ഹെക്ടറിന് 120 കിലോ NPK 20:10:10 പ്രയോഗിക്കുക. രാവിലെ പ്രയോഗിക്കുന്നതാണ് ഏറ്റവും നല്ലത്. ഇത് നിങ്ങളുടെ ഓർമ്മപ്പെടുത്തലുകളിൽ ചേർക്കുന്നു.`;
        }
        return `For your ${selectedLand.name} with ${selectedLand.currentCrop}, I recommend applying nitrogen fertilizer based on the ${selectedLand.soilType} soil type. With ${selectedLand.waterAvailability} water availability, apply 120kg/hectare of NPK 20:10:10. Best time is early morning. I'll add this to your reminders.`;
      }
      
      if (lowerInput.includes('pest') || lowerInput.includes('disease') || lowerInput.includes('കീടം') || lowerInput.includes('രോഗം')) {
        if (language === 'malayalam') {
          return `${selectedLand.name} ൽ ${selectedLand.currentCrop} വളർത്തുന്നതിന്, സ്റ്റെം ബോറർ, ആഫിഡ് തുടങ്ങിയ സാധാരണ കീടങ്ങളിൽ നിന്ന് സൂക്ഷിക്കുക. 3-4 ദിവസത്തിലൊരിക്കൽ പരിശോധന നടത്തുക. നീം ഓയിൽ സ്പ്രേ പ്രതിരോധ നടപടിയായി ഉപയോഗിക്കുക. ${selectedLand.soilType} മണ്ണിന് സാധാരണയായി നല്ല കീട പ്രതിരോധശേഷി ഉണ്ട്.`;
        }
        return `For ${selectedLand.currentCrop} in your ${selectedLand.name}, watch out for common pests like stem borers and aphids. Regular inspection every 3-4 days is recommended. Use neem oil spray as a preventive measure. The ${selectedLand.soilType} soil generally has good pest resistance.`;
      }
      
      if (lowerInput.includes('water') || lowerInput.includes('irrigation') || lowerInput.includes('ജലം') || lowerInput.includes('നനയ്ക്കൽ')) {
        if (language === 'malayalam') {
          return `${selectedLand.name} ൽ ${selectedLand.waterAvailability} ജല ലഭ്യതയുണ്ട്. ${selectedLand.currentCrop} വളർത്തുന്നതിന്, മണ്ണിന്റെ ഈർപ്പം 80% ഫീൽഡ് കപ്പാസിറ്റിയിൽ നിലനിർത്തുക. നിലവിലെ കാലാവസ്ഥയിൽ, 2-3 ദിവസത്തിലൊരിക്കൽ നനയ്ക്കുക. അടുത്ത നനയ്ക്കൽ സൈക്കിളിനായി ഒരു ഓർമ്മപ്പെടുത്തൽ സജ്ജമാക്കുന്നു.`;
        }
        return `Your ${selectedLand.name} has ${selectedLand.waterAvailability} water availability. For ${selectedLand.currentCrop}, maintain soil moisture at 80% field capacity. With the current weather, irrigate every 2-3 days. I'll set up a reminder for your next irrigation cycle.`;
      }
      
      if (lowerInput.includes('harvest') || lowerInput.includes('when to harvest') || lowerInput.includes('വിളവെടുക്കൽ') || lowerInput.includes('എപ്പോൾ വിളവെടുക്കണം')) {
        if (language === 'malayalam') {
          return `${selectedLand.name} ൽ ${selectedLand.currentCrop} വളർത്തുന്നതിന്, വിളവെടുക്കൽ സമയം വിത്തിന്റെ തരത്തെ ആശ്രയിച്ചിരിക്കുന്നു. സാധാരണയായി, അരി 110-120 ദിവസത്തിന് ശേഷം വിളവെടുക്കാൻ തയ്യാറാകും. സ്വർണ്ണ മഞ്ഞ ധാന്യങ്ങൾ നോക്കുക, ഈർപ്പ അളവ് പരിശോധിക്കുക. നിലവിലെ മാർക്കറ്റ് വില ₹2,850/quintal ആണ്.`;
        }
        return `For ${selectedLand.currentCrop} in ${selectedLand.name}, harvest timing depends on the variety. Generally, rice is ready in 110-120 days after transplanting. Look for golden yellow grains and check moisture content. Current market prices are favorable at ₹2,850/quintal.`;
      }
    }
    
    // General responses
    if (lowerInput.includes('weather') || lowerInput.includes('കാലാവസ്ഥ')) {
      if (language === 'malayalam') {
        return 'നിലവിലെ കാലാവസ്ഥാ പ്രവചനത്തെ അടിസ്ഥാനമാക്കി, 28°C താപനിലയിൽ ഭാഗികമായി മേഘാവൃതമായ അവസ്ഥ പ്രതീക്ഷിക്കുന്നു. ബുധനും വ്യാഴവും കനത്ത മഴ പ്രതീക്ഷിക്കുന്നു, അതിനാൽ അതനുസരിച്ച് ആസൂത്രണം ചെയ്യുക. മഴയിൽ സ്പ്രേ ഒഴിവാക്കുക, ശരിയായ ഡ്രെയിനേജ് ഉറപ്പാക്കുക.';
      }
      return 'Based on the current weather forecast, we expect partly cloudy conditions with 28°C temperature. Heavy rain is predicted for Wednesday-Thursday, so plan accordingly. Avoid spraying during rain and ensure proper drainage.';
    }
    
    if (lowerInput.includes('market') || lowerInput.includes('price') || lowerInput.includes('മാർക്കറ്റ്') || lowerInput.includes('വില')) {
      if (language === 'malayalam') {
        return 'നിലവിലെ മാർക്കറ്റ് വിലകൾ അരി ₹2,850/quintal (1.8% വർദ്ധനവ്), തെങ്ങ് ₹18,500/quintal (3.6% കുറവ്) കാണിക്കുന്നു. എക്സ്പോർട്ട് അവസരങ്ങൾ കാരണം അരിക്ക് ഉയർന്ന ആവശ്യമുണ്ട്. നിങ്ങളുടെ വിളകൾക്ക് വില അലേർട്ടുകൾ സജ്ജമാക്കാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?';
      }
      return 'Current market prices show rice at ₹2,850/quintal (up 1.8%), coconut at ₹18,500/quintal (down 3.6%). Demand is high for rice due to export opportunities. Would you like me to set up price alerts for your crops?';
    }
    
    if (language === 'malayalam') {
      return 'കാർഷികത്തിൽ സഹായം ആവശ്യമാണെന്ന് മനസ്സിലാക്കുന്നു. നിങ്ങൾ അറിയാൻ ആഗ്രഹിക്കുന്നതിനെക്കുറിച്ച് കൂടുതൽ വിശദമായി പറയാമോ? വിള പരിപാലനം, കീട നിയന്ത്രണം, കാലാവസ്ഥാ ആസൂത്രണം, മാർക്കറ്റ് വിലകൾ എന്നിവയിൽ സഹായിക്കാനാകും. കൂടുതൽ ലക്ഷ്യാനുസൃത ഉപദേശത്തിന് "എന്റെ ഭൂമികൾ" ൽ നിന്ന് ഒരു പ്രത്യേക ഭൂമി തിരഞ്ഞെടുക്കാം.';
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
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center ${
                activeTab === 'dashboard'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center ${
                activeTab === 'chat'
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
                        className={`max-w-xs p-3 rounded-lg text-sm ${
                          message.type === 'user'
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
                      className={`p-2 rounded-lg transition-colors ${
                        isListening
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