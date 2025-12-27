import api from './api';

const API_BASE_URL = ''; // Empty because api instance already has baseURL: '/api'

// Mock data for demo mode
const DEMO_RECOMMENDATION_RESPONSE = {
  success: true,
  recommendation: `Based on your soil analysis and current market conditions in Pollachi, here are my recommendations:

**Recommended Crops:**

1. **Rice (Paddy)** - HIGHLY SUITABLE
   - Your clay loam soil with pH 6.8 is ideal
   - High water availability matches crop needs
   - Current market price: ₹2,850/quintal (trending up)
   - Expected yield: 25-30 quintals per acre
   - Growing season: 120-130 days
   - Investment: ₹20,000-25,000 per acre

2. **Turmeric** - EXCELLENT CHOICE
   - High organic matter (3.2%) perfect for turmeric
   - Strong market demand in Pollachi APMC
   - Current price: ₹12,800/quintal
   - Expected yield: 30-40 quintals per acre
   - Growing season: 7-9 months
   - Investment: ₹40,000-50,000 per acre

3. **Coconut** - LONG-TERM INVESTMENT
   - Excellent rainfall and soil conditions
   - Stable market at ₹18,500/quintal
   - Starts yielding in 4-5 years
   - 80-100 nuts per tree annually after maturity

**Soil Management:**
- Your nitrogen levels (55 ppm) are adequate
- Reduce urea application by 20%
- Continue composting practices
- pH is optimal - no amendments needed

**Market Insights:**
- Rice prices trending upward (+1.8%)
- High demand for organic turmeric
- Pollachi market has strong buyer network

**Weather Considerations:**
- Current conditions: 28°C, 75% humidity - ideal for rice
- 5-day forecast shows partly cloudy with light rain expected
- Good for transplanting rice seedlings

Would you like specific guidance on any of these crops?`,
  metadata: {
    keyUsed: 'demo',
    timestamp: new Date().toISOString()
  }
};

const DEMO_CHAT_RESPONSES: Record<string, string> = {
  'irrigation': `For your rice field with high water availability, here's my irrigation advice:

**Current Stage Irrigation:**
- Rice needs standing water of 5-7 cm during vegetative stage
- Maintain consistent water level during flowering
- Drain 10 days before harvest

**Water Management:**
- Your clay loam soil retains water well
- Check water level daily in morning
- Ensure proper field bunding to prevent leakage

**Best Practices:**
- Use alternate wetting and drying (AWD) to save 25% water
- Monitor for pests in standing water
- Maintain drainage channels around field`,
  
  'pest': `Common rice pests in Pollachi region and management:

**Stem Borer (Major threat):**
- Symptoms: Dead heart, white ear head
- Control: Pheromone traps, Chlorpyriphos 20% EC
- Apply at tillering stage

**Brown Plant Hopper:**
- Symptoms: Yellowing, hopperburn
- Control: Imidacloprid 17.8% SL @ 0.3 ml/liter
- Monitor regularly during vegetative stage

**Leaf Folder:**
- Symptoms: Folded leaves, white streaks
- Control: Cartap hydrochloride 50% SP
- Spray at early infestation

**Prevention:**
- Use pheromone traps (install 20/acre)
- Avoid excess nitrogen fertilizer
- Maintain proper spacing for air circulation`,
  
  'fertilizer': `Fertilizer recommendations for your rice field:

**Basal Application (At planting):**
- Urea: 40 kg/acre
- DAP: 50 kg/acre
- Potash: 25 kg/acre

**Top Dressing:**
- 1st dose: 25 days after planting - 40 kg Urea/acre
- 2nd dose: 45 days after planting - 40 kg Urea/acre

**Micronutrients:**
- Zinc sulfate: 10 kg/acre (one time)
- Iron: Foliar spray if deficiency appears

**Organic Options:**
- Farmyard manure: 5 tons/acre before planting
- Green manure: Dhaincha or Sunhemp
- Azolla: Incorporate 1 ton/acre`,
  
  'default': `I can help you with:
- Crop recommendations based on your soil and weather
- Irrigation scheduling and water management
- Pest and disease control strategies
- Fertilizer application timing and dosage
- Market price trends and selling strategies
- Organic farming practices

What would you like to know more about?`
};

function isDemoMode(): boolean {
  try {
    const user = localStorage.getItem('farmease_user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.isDemo === true;
    }
  } catch {}
  return false;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface LandData {
  id: string;
  name: string;
  location: string;
  size: number;
  soilType: string;
  currentCrop: string;
  waterAvailability: string;
  soilReport?: {
    pH: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    organicMatter: number;
    moisture: number;
  };
  weatherHistory?: Array<{
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
    date: string;
  }>;
  marketData?: Array<{
    cropName: string;
    currentPrice: number;
    demand: string;
    forecast?: {
      nextMonth: number;
    };
  }>;
  pestDiseaseHistory?: Array<{
    name: string;
    status: string;
    treatment: string;
    date: string;
  }>;
}

export interface SoilData {
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicMatter: number;
  moisture: number;
}

export interface AIRecommendationResponse {
  success: boolean;
  recommendation: string;
  landData: LandData | null;
  soilData: SoilData | null;
  metadata: {
    keyUsed: string;
    model: string;
    timestamp: string;
  };
}

export interface ChatResponse {
  success: boolean;
  response: string;
  metadata: {
    keyUsed: string;
    contextUsed: {
      land: boolean;
      soil: boolean;
    };
    timestamp: string;
  };
}

export interface RecommendationSection {
  title: string;
  content: string;
}

export interface ParsedRecommendation {
  introduction: string;
  sections: RecommendationSection[];
}

export interface SpeechToTextResponse {
  success: boolean;
  transcription: string;
  metadata: {
    keyUsed: string;
    model: string;
    originalFilename: string;
    fileSize: number;
    timestamp: string;
  };
}

class CropRecommendationService {
  private getUserId(): string | null {
    const user = localStorage.getItem('farmease_user');
    if (!user) return null;
    try {
      const userData = JSON.parse(user);
      return userData.id || null;
    } catch {
      return null;
    }
  }

  private async getLandDataWithContext(landId?: string): Promise<LandData | null> {
    if (!landId) return null;
    
    try {
      const response = await this.getLandDetails(landId);
      return response.land;
    } catch (error) {
      console.warn('Could not fetch land data for offline context:', error);
      return null;
    }
  }

  async generateAIRecommendation(landId?: string, userQuery?: string): Promise<AIRecommendationResponse> {
    try {
      const userId = this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Try to use Groq API
      const response = await api.post(`${API_BASE_URL}/crop-recommendations/ai-generate`, {
        landId,
        userQuery,
        userId
      });
      
      return response;
    } catch (error: any) {
      console.error('AI recommendation generation error:', error);
      
      // Fallback to mock data if network/API error (internet issue)
      const isNetworkError = !error.response || error.message.includes('Network') || error.message.includes('network');
      if (isNetworkError) {
        console.warn('Network error detected, using offline mock data');
        return DEMO_RECOMMENDATION_RESPONSE as AIRecommendationResponse;
      }
      
      throw error;
    }
  }

  async chatWithBot(messages: ChatMessage[], landId?: string): Promise<ChatResponse> {
    try {
      const userId = this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Try to use Groq API
      const response = await api.post(`${API_BASE_URL}/crop-recommendations/chat`, {
        messages,
        landId,
        userId
      });
      
      return response;
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Fallback to mock data if network/API error (internet issue)
      const isNetworkError = !error.response || error.message.includes('Network') || error.message.includes('network');
      if (isNetworkError) {
        console.warn('Network error detected, using offline mock responses');
        const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
        let responseText = DEMO_CHAT_RESPONSES['default'];
        
        // Match keywords in user message
        if (lastMessage.includes('irrigation') || lastMessage.includes('water')) {
          responseText = DEMO_CHAT_RESPONSES['irrigation'];
        } else if (lastMessage.includes('pest') || lastMessage.includes('disease') || lastMessage.includes('insect')) {
          responseText = DEMO_CHAT_RESPONSES['pest'];
        } else if (lastMessage.includes('fertilizer') || lastMessage.includes('nutrient') || lastMessage.includes('manure')) {
          responseText = DEMO_CHAT_RESPONSES['fertilizer'];
        }
        
        return {
          success: true,
          response: responseText,
          metadata: {
            keyUsed: 'offline',
            contextUsed: { land: !!landId, soil: true },
            timestamp: new Date().toISOString()
          }
        } as ChatResponse;
      }
      
      throw error;
    }
  }

  async getAvailableLands(): Promise<LandData[]> {
    try {
      const userId = this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await api.get(`${API_BASE_URL}/lands/user/${userId}`);
      
      return response || [];
    } catch (error: any) {
      console.error('Lands fetch error:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to fetch lands'
      );
    }
  }

  async transcribeAudio(audioBlob: Blob, filename: string = 'recording.wav', language: string = 'en'): Promise<SpeechToTextResponse> {
    try {
      const userId = this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const formData = new FormData();
      formData.append('audio', audioBlob, filename);
      formData.append('userId', userId);
      formData.append('language', language);

      const response = await api.post(`${API_BASE_URL}/crop-recommendations/speech-to-text`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Speech-to-text error:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to transcribe audio'
      );
    }
  }

  async getLandDetails(landId: string): Promise<{ land: LandData; soilReport: SoilData | null }> {
    try {
      const response = await api.get(`${API_BASE_URL}/lands/${landId}`);
      
      return response.data;
    } catch (error: any) {
      console.error('Land details fetch error:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to fetch land details'
      );
    }
  }

  // Legacy support for existing recommendation system
  async getTraditionalRecommendations(landId: string) {
    try {
      const response = await api.get(`${API_BASE_URL}/crop-recommendations/crops/${landId}`);
      
      return response;
    } catch (error: any) {
      console.error('Traditional recommendations error:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to get traditional recommendations'
      );
    }
  }

  formatRecommendationText(text: string): string {
    // Add basic formatting to the AI response
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
      .replace(/\n\n/g, '</p><p>') // Paragraphs
      .replace(/\n/g, '<br>') // Line breaks
      .replace(/^/, '<p>') // Start paragraph
      .replace(/$/, '</p>'); // End paragraph
  }

  parseStructuredRecommendation(text: string): ParsedRecommendation {
    const sections = text.split(/\d+\.\s\*\*(.*?)\*\*/);
    const parsed: ParsedRecommendation = {
      introduction: '',
      sections: []
    };

    if (sections.length > 1) {
      parsed.introduction = sections[0].trim();
      
      for (let i = 1; i < sections.length; i += 2) {
        if (i + 1 < sections.length) {
          parsed.sections.push({
            title: sections[i],
            content: sections[i + 1].trim()
          });
        }
      }
    } else {
      parsed.introduction = text;
    }

    return parsed;
  }
}

export default new CropRecommendationService();