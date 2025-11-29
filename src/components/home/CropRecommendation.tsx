import { useEffect, useState, useRef } from 'react';
import { Lightbulb, MessageCircle, Send, Bot, User, Sparkles, RefreshCw, AlertCircle, Mic, MicOff, Square, Wifi, WifiOff } from 'lucide-react';
import { useFarm } from '../../contexts/FarmContext';
import { useAuth } from '../../contexts/AuthContext';
import { useConnectivity } from '../../contexts/ConnectivityContext';
import cropRecommendationService, { ChatMessage, AIRecommendationResponse } from '../../services/cropRecommendationService';
import { AudioRecorder, AudioRecorderState } from '../../utils/audioRecorder';

export default function CropRecommendation() {
  const { lands, selectedLandId } = useFarm();
  const { user } = useAuth();
  const { online } = useConnectivity();
  const [activeTab, setActiveTab] = useState<'ai' | 'chat'>('ai');
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendationResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ml'>('en');
  const [audioRecorder] = useState(() => new AudioRecorder(
    (state: AudioRecorderState) => {
      setIsRecording(state.isRecording);
      setRecordingDuration(state.duration);
    },
    (error: string) => {
      console.error('Recording error:', error);
      setIsRecording(false);
    }
  ));
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const selectedLand = lands.find(land => land.id === selectedLandId);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Generate AI recommendation
  const generateAIRecommendation = async (userQuery?: string) => {
    if (!selectedLandId && !userQuery) return;

    // Check if user is authenticated
    if (!user) {
      console.log('Please log in to use AI recommendations');
      return;
    }

    setAiLoading(true);
    try {
      console.log('Generating AI recommendation for user:', user.id, 'land:', selectedLandId);
      const result = await cropRecommendationService.generateAIRecommendation(selectedLandId || undefined, userQuery);
      setAiRecommendation(result);
    } catch (err) {
      console.error('Error generating AI recommendation:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Send chat message
  const sendChatMessage = async () => {
    if (!newMessage.trim() || chatLoading) return;

    // Check if user is authenticated
    if (!user) {
      console.log('Please log in to use the chat feature');
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setChatLoading(true);

    try {
      const result = await cropRecommendationService.chatWithBot([...chatMessages, userMessage], selectedLandId || undefined);
      
      const botMessage: ChatMessage = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString()
      };

      setChatMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    if (!audioRecorder.isSupported) {
      alert('Audio recording is not supported in this browser');
      return;
    }

    try {
      await audioRecorder.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please check your microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      setIsTranscribing(true);
      const audioBlob = await audioRecorder.stopRecording();
      
      if (audioBlob) {
        // Transcribe the audio with selected language
        const filename = `voice_message${audioRecorder.getFileExtension()}`;
        const result = await cropRecommendationService.transcribeAudio(audioBlob, filename, selectedLanguage);
        
        if (result.success && result.transcription.trim()) {
          // Set the transcribed text as the new message
          setNewMessage(result.transcription.trim());
        } else {
          console.error('No transcription received');
        }
      }
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const cancelRecording = () => {
    audioRecorder.cancelRecording();
  };

  const formatAIContent = (content: string) => {
    const parsed = cropRecommendationService.parseStructuredRecommendation(content);
    
    if (parsed.sections.length > 0) {
      return (
        <div className="space-y-4">
          {parsed.introduction && (
            <p className="text-gray-700 mb-4">{parsed.introduction}</p>
          )}
          {parsed.sections.map((section, index) => (
            <div key={index} className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-green-800 mb-2">{section.title}</h4>
              <div className="text-gray-700 whitespace-pre-line">{section.content}</div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div 
        className="text-gray-700 whitespace-pre-line"
        dangerouslySetInnerHTML={{ 
          __html: cropRecommendationService.formatRecommendationText(content) 
        }}
      />
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Lightbulb className="w-6 h-6 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-green-800">Crop Recommendations</h3>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'ai' 
                ? 'bg-white text-green-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-1" />
            AI Assistant
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'chat' 
                ? 'bg-white text-green-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-1" />
            Chat
          </button>
        </div>
      </div>

      {!selectedLand ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <Lightbulb className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-gray-600">Select a land from "My Lands" to get personalized recommendations</p>
        </div>
      ) : !user ? (
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">
            <AlertCircle className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-red-600 mb-2">Authentication Required</p>
          <p className="text-gray-500">Please log in to access AI crop recommendations</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* AI Assistant Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-800 flex items-center">
                    <Bot className="w-5 h-5 text-green-600 mr-2" />
                    AI-Powered Recommendations for {selectedLand.location}
                  </h4>
                  <button
                    onClick={() => generateAIRecommendation()}
                    disabled={aiLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {aiLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {aiLoading ? 'Generating...' : 'Generate AI Plan'}
                  </button>
                </div>

                {aiLoading && (
                  <div className="text-center py-8">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
                    </div>
                    <p className="text-gray-600 mt-4">AI is analyzing your land and generating personalized recommendations...</p>
                  </div>
                )}

                {aiRecommendation && (
                  <div className="bg-white rounded-lg p-6 border">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-semibold text-gray-800">AI Recommendation</h5>
                    </div>
                    
                    {/* Land & Soil Context */}
                    {(aiRecommendation.landData || aiRecommendation.soilData) && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h6 className="font-medium text-gray-700 mb-3">Analysis Context</h6>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {aiRecommendation.landData && (
                            <div>
                              <p className="text-gray-600">📍 {aiRecommendation.landData.location}</p>
                              <p className="text-gray-600">🌱 {aiRecommendation.landData.soilType}</p>
                              <p className="text-gray-600">📏 {aiRecommendation.landData.size} acres</p>
                            </div>
                          )}
                          {aiRecommendation.soilData && (
                            <div>
                              <p className="text-gray-600">pH: {aiRecommendation.soilData.ph}</p>
                              <p className="text-gray-600">N-P-K: {aiRecommendation.soilData.nitrogen}-{aiRecommendation.soilData.phosphorus}-{aiRecommendation.soilData.potassium}</p>
                              <p className="text-gray-600">Organic Matter: {aiRecommendation.soilData.organicMatter}%</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="prose max-w-none">
                      {formatAIContent(aiRecommendation.recommendation)}
                    </div>
                    
                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700">
                        💡 <strong>Tip:</strong> Use the Chat tab below to ask specific questions about this recommendation or get more detailed guidance!
                      </p>
                    </div>
                  </div>
                )}

                {!aiRecommendation && !aiLoading && (
                  <div className="text-center py-6 text-gray-500">
                    <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Click "Generate AI Plan" to get comprehensive, AI-powered crop recommendations based on your land data.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 flex items-center mb-2">
                      <MessageCircle className="w-5 h-5 text-blue-600 mr-2" />
                      AI Farming Assistant
                    </h4>
                    <p className="text-sm text-gray-600">
                      Ask questions about your land, crop recommendations, farming techniques, or any agricultural advice.
                    </p>
                  </div>
                  {/* Language Selection */}
                  <div className="ml-4">
                    <label htmlFor="language-select" className="block text-xs font-medium text-gray-700 mb-1">
                      Voice Language
                    </label>
                    <select
                      id="language-select"
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value as 'en' | 'ml')}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      disabled={isRecording || isTranscribing}
                    >
                      <option value="en">English</option>
                      <option value="ml">മലയാളം</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="bg-white border rounded-lg h-96 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="mb-2">👋 Hello! I'm your AI farming assistant.</p>
                      <p className="text-sm">Ask me anything about crop recommendations, soil management, pest control, or farming techniques!</p>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((message, index) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-green-600 text-white ml-auto' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            <div className="flex items-start space-x-2">
                              {message.role === 'assistant' && (
                                <Bot className="w-4 h-4 mt-1 text-blue-600 flex-shrink-0" />
                              )}
                              {message.role === 'user' && (
                                <User className="w-4 h-4 mt-1 text-white flex-shrink-0" />
                              )}
                              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
                            <div className="flex items-center space-x-2">
                              <Bot className="w-4 h-4 text-blue-600" />
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                        placeholder="Ask about crops, farming techniques, or any agricultural question..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        disabled={chatLoading || isTranscribing}
                      />
                      {/* Voice Input Button */}
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        {!isRecording ? (
                          <button
                            onClick={startRecording}
                            disabled={chatLoading || isTranscribing || !audioRecorder.isSupported}
                            className="p-1 text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={audioRecorder.isSupported ? `Click to record voice message in ${selectedLanguage === 'en' ? 'English' : 'Malayalam'}` : "Voice recording not supported"}
                          >
                            {isTranscribing ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mic className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-red-600 font-medium">
                              {AudioRecorder.formatDuration(recordingDuration)}
                            </span>
                            <button
                              onClick={stopRecording}
                              className="p-1 text-red-600 hover:text-red-700 transition-colors"
                              title="Stop recording and transcribe"
                            >
                              <Square className="w-4 h-4 fill-current" />
                            </button>
                            <button
                              onClick={cancelRecording}
                              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                              title="Cancel recording"
                            >
                              <MicOff className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={sendChatMessage}
                      disabled={!newMessage.trim() || chatLoading || isRecording}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}