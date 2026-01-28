// AI Service: integrates with Ollama when enabled, otherwise falls back to mock

import { getApiHeaders } from './api';

export interface AIOptions {
  model?: string;
  systemPrompt?: string;
  context?: any;
}

class AIService {
  private useOllama: boolean;
  private useGroq: boolean;
  private apiBase: string;
  private ollamaUrl: string;
  private ollamaModel: string;

  constructor() {
    this.useOllama = String(import.meta.env.VITE_USE_OLLAMA || '').toLowerCase() === 'true';
    this.useGroq = String(import.meta.env.VITE_USE_GROQ || '').toLowerCase() === 'true';
    // Import dynamically to avoid circular dependency
    this.apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://farmees-backend.vercel.app/api' : '/api');
    this.ollamaUrl = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';
    this.ollamaModel = import.meta.env.VITE_OLLAMA_MODEL || 'llama2:latest';
  }

  async generate(input: string, options: AIOptions = {}): Promise<string> {
    if (this.useGroq) {
      try {
        const res = await fetch(`${this.apiBase}/ai/generate`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({ input, systemPrompt: options.systemPrompt, model: options.model, context: options.context })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data.text) return data.text;
        }
      } catch (_) { }
    }

    if (!this.useOllama) {
      return this.mockGenerate(input);
    }

    const model = options.model || this.ollamaModel;
    const system = options.systemPrompt || 'You are a helpful farming assistant. Keep answers concise and practical.';
    const contextBlock = options.context ? `\n\nContext: ${typeof options.context === 'string' ? options.context : JSON.stringify(options.context)}` : '';

    // For Ollama /api/generate (single-turn)
    try {
      const res = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          prompt: `${system}${contextBlock}\n\nUser: ${input}\nAssistant:`,
          stream: false
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ollama error: ${res.status} ${text}`);
      }

      const data = await res.json();
      // Ollama returns { response: string, ... }
      return data.response?.trim() || '';
    } catch (err: any) {
      console.error('AIService.generate error', err);
      return this.mockGenerate(input);
    }
  }

  private offlineGenerate(input: string, ctx: any): string | null {
    try {
      const text = (input || '').toLowerCase();
      const language = ctx?.language || 'english';
      const data = ctx?.landData;
      const t = (en: string, ta: string) => (language === 'tamil' ? ta : en);

      if (!data) return null;

      const soil = data.soilReport;
      const recentWeather = Array.isArray(data.weatherHistory) && data.weatherHistory.length > 0
        ? data.weatherHistory[data.weatherHistory.length - 1]
        : null;
      const market = Array.isArray(data.marketData) && data.marketData.length > 0 ? data.marketData[0] : null;
      const activePests = Array.isArray(data.pestDiseaseHistory)
        ? data.pestDiseaseHistory.filter((p: any) => p.status === 'active')
        : [];

      // Fertilizer
      if (text.includes('fertilizer') || text.includes('fertilize') || text.includes('உரம்')) {
        if (soil) {
          return t(
            `For ${data.name} (${data.currentCrop}), soil pH ${soil.pH}. N:${soil.nitrogen} ppm, P:${soil.phosphorus} ppm, K:${soil.potassium} ppm. Recommendation: Apply 120kg/ha of NPK 20:10:10 in the morning; adjust based on rainfall and growth stage.`,
            `${data.name} இல் ${data.currentCrop} பயிருக்கு, மண் pH ${soil.pH}. N:${soil.nitrogen} ppm, P:${soil.phosphorus} ppm, K:${soil.potassium} ppm. பரிந்துரை: ஹெக்டேருக்கு 120kg NPK 20:10:10 காலையில் இடவும்; மழை மற்றும் வளர்ச்சி நிலையை சரிபார்க்கவும்.`
          );
        }
        return t(
          `Use a balanced NPK for ${data.currentCrop}; apply in cool hours and water adequately.`,
          `${data.currentCrop} பயிருக்கு சமச்சீர் NPK பயன்படுத்தவும்; குளிர்ந்த நேரங்களில் இடவும் மற்றும் போதுமான நீர் பாய்ச்சவும்.`
        );
      }

      // Weather
      if (text.includes('weather') || text.includes('வானிலை')) {
        if (recentWeather) {
          return t(
            `Current weather near ${data.name}: ${recentWeather.temperature}°C, humidity ${recentWeather.humidity}%, rain ${recentWeather.rainfall}mm, wind ${recentWeather.windSpeed}km/h. Plan field work during dry, calm periods.`,
            `${data.name} அருகில் வானிலை: ${recentWeather.temperature}°C, ஈரப்பதம் ${recentWeather.humidity}%, மழை ${recentWeather.rainfall}mm, காற்று ${recentWeather.windSpeed}km/h. உலர்ந்த காலநிலையில் களப் பணிகளை மேற்கொள்ளவும்.`
          );
        }
        return t('No recent weather on device. Use general caution for field work.', 'சாதனத்தில் சமீபத்திய வானிலை இல்லை. களப் பணிகளில் பொதுவான எச்சரிக்கையைப் பயன்படுத்தவும்.');
      }

      // Irrigation / water
      if (text.includes('irrigation') || text.includes('water') || text.includes('நீர்') || text.includes('பாசனம்')) {
        const base = t(
          `Water availability is ${data.waterAvailability}. Maintain soil moisture ~80% field capacity; irrigate every 2-3 days in warm/dry conditions.`,
          `நீர் இருப்பு ${data.waterAvailability}. மண் ஈரப்பதத்தை 80% பராமரிக்கவும்; வெப்பமான/உலர்ந்த நிலையில் 2-3 நாட்களுக்கு ஒருமுறை நீர் பாய்ச்சவும்.`
        );
        if (recentWeather && recentWeather.rainfall > 5) {
          return base + ' ' + t('Skip irrigation after rain; check drainage.', 'மழைக்குப் பிறகு நீர்ப்பாசனத்தைத் தவிர்க்கவும்; வடிகால் வசதியைச் சரிபார்க்கவும்.');
        }
        return base;
      }

      // Pest / disease
      if (text.includes('pest') || text.includes('disease') || text.includes('பூச்சி') || text.includes('நோய்')) {
        if (activePests.length > 0) {
          const names = activePests.map((p: any) => p.name).join(', ');
          const treats = activePests.map((p: any) => p.treatment).join('; ');
          return t(
            `Active issues: ${names}. Recommended: ${treats}. Inspect every 3-4 days; use preventive measures like neem oil.`,
            `செயலில் உள்ள பிரச்சனைகள்: ${names}. பரிந்துரை: ${treats}. 3-4 நாட்களுக்கு ஒருமுறை ஆய்வு செய்யவும்; வேப்ப எண்ணெய் போன்ற தடுப்பு நடவடிக்கைகளைப் பயன்படுத்தவும்.`
          );
        }
        return t('No active pest records. Monitor foliage and traps weekly.', 'செயலில் உள்ள பூச்சி பதிவுகள் இல்லை. வாரந்தோறும் இலைகள் மற்றும் பொறிகளைக் கண்காணிக்கவும்.');
      }

      // Market / price
      if (text.includes('market') || text.includes('price') || text.includes('விலை') || text.includes('சந்தை')) {
        if (market) {
          return t(
            `Market for ${market.cropName}: ₹${market.currentPrice}/quintal; demand ${market.demand}. Next month forecast: ₹${market.forecast?.nextMonth}.`,
            `${market.cropName} சந்தை: ₹${market.currentPrice}/குவின்டால்; தேவை ${market.demand}. அடுத்த மாத கணிப்பு: ₹${market.forecast?.nextMonth}.`
          );
        }
        return t('No market data cached. Check local APMC when online.', 'சந்தை தரவு சேமிக்கப்படவில்லை. ஆன்லைனில் இருக்கும்போது உள்ளூர் APMC ஐச் சரிபார்க்கவும்.');
      }

      // Harvest
      if (text.includes('harvest') || text.includes('அறுவடை')) {
        return t(
          `Harvest timing depends on variety; for many crops, look for maturity signs (e.g., grain color, moisture). Avoid harvesting during rain.`,
          `அறுவடை நேரம் பயிர் வகையைப் பொறுத்தது; பல பயிர்களுக்கு, முதிர்ச்சி அறிகுறிகளைப் பார்க்கவும் (எ.கா., தானிய நிறம், ஈரப்பதம்). மழையின் போது அறுவடை செய்வதைத் தவிர்க்கவும்.`
        );
      }

      // General
      return t(
        `Your land ${data.name} with ${data.soilType} soil and ${data.waterAvailability} water availability is growing ${data.currentCrop}. Ask about fertilizer, irrigation, pests, or market for tailored advice.`,
        `உங்கள் ${data.name} நிலத்தில் ${data.soilType} மண் மற்றும் ${data.waterAvailability} நீர் இருப்பு உள்ளது; தற்போதைய பயிர் ${data.currentCrop}. உரம், நீர்ப்பாசனம், பூச்சிகள் அல்லது சந்தை பற்றி கேளுங்கள்.`
      );
    } catch {
      return null;
    }
  }

  // Optional: vision support via embeddings or image pathways can go here later
  async analyzeText(input: string): Promise<string> {
    return this.generate(input);
  }

  private mockGenerate(input: string): string {
    const lower = input.toLowerCase();
    if (lower.includes('fertilizer')) return 'Recommendation: Apply NPK 20:10:10 in the morning when soil is moist.';
    if (lower.includes('weather')) return 'Today is partly cloudy with light winds. Good time for field inspection.';
    if (lower.includes('pest')) return 'Watch for stem borers and aphids; consider neem oil spray as preventive.';
    return 'I can help with crop care, pest management, weather planning, and market info.';
  }
}

export const aiService = new AIService();
