import api from './api';

const API_BASE_URL = ''; // Empty because api instance already has baseURL: '/api'

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