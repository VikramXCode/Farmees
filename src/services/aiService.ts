// AI Service: integrates with Ollama when enabled, otherwise falls back to mock

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
    const viteEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  this.useOllama = String(viteEnv.VITE_USE_OLLAMA || '').toLowerCase() === 'true';
  this.useGroq = String(viteEnv.VITE_USE_GROQ || '').toLowerCase() === 'true';
  this.apiBase = viteEnv.VITE_API_URL || 'http://localhost:3001/api';
    this.ollamaUrl = viteEnv.VITE_OLLAMA_URL || 'http://localhost:11434';
    this.ollamaModel = viteEnv.VITE_OLLAMA_MODEL || 'llama2:latest';
  }

  async generate(input: string, options: AIOptions = {}): Promise<string> {
    // Offline mode gate via localStorage flag set by ConnectivityContext
    try {
      const onlineFlag = localStorage.getItem('farmease_online');
      if (onlineFlag === 'false') {
        const offline = this.offlineGenerate(input, options.context);
        return offline || this.mockGenerate(input);
      }
    } catch {}
    if (this.useGroq) {
      try {
          const res = await fetch(`${this.apiBase}/ai/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input, systemPrompt: options.systemPrompt, model: options.model, context: options.context })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data.text) return data.text;
        }
      } catch (_) {}
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
      const t = (en: string, ml: string) => (language === 'malayalam' ? ml : en);

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
      if (text.includes('fertilizer') || text.includes('fertilize') || text.includes('വളം')) {
        if (soil) {
          return t(
            `For ${data.name} (${data.currentCrop}), soil pH ${soil.pH}. N:${soil.nitrogen} ppm, P:${soil.phosphorus} ppm, K:${soil.potassium} ppm. Recommendation: Apply 120kg/ha of NPK 20:10:10 in the morning; adjust based on rainfall and growth stage.`,
            `${data.name} ൽ ${data.currentCrop} കൃഷിക്ക്, മണ്ണിന്റെ pH ${soil.pH}. N:${soil.nitrogen} ppm, P:${soil.phosphorus} ppm, K:${soil.potassium} ppm. ശുപാർശ: ഹെക്ടറിന് 120kg NPK 20:10:10 രാവിലെ പ്രയോഗിക്കുക; മഴ/വളർച്ചാ ഘട്ടം പരിഗണിക്കുക.`
          );
        }
        return t(
          `Use a balanced NPK for ${data.currentCrop}; apply in cool hours and water adequately.`,
          `${data.currentCrop} കൃഷിക്ക് സുസ്ഥിര NPK ഉപയോഗിക്കുക; காலை/വൈകുന്നേരം പ്രയോഗിച്ച് മതിയായ ജലം നൽകുക.`
        );
      }

      // Weather
      if (text.includes('weather') || text.includes('കാലാവസ്ഥ')) {
        if (recentWeather) {
          return t(
            `Current weather near ${data.name}: ${recentWeather.temperature}°C, humidity ${recentWeather.humidity}%, rain ${recentWeather.rainfall}mm, wind ${recentWeather.windSpeed}km/h. Plan field work during dry, calm periods.`,
            `${data.name} അടുത്തിലെ കാലാവസ്ഥ: ${recentWeather.temperature}°C, ഈർപ്പം ${recentWeather.humidity}%, മഴ ${recentWeather.rainfall}mm, കാറ്റ് ${recentWeather.windSpeed}km/h. വരണ്ട/ശാന്ത സമയത്ത് ഫീൽഡ് പ്രവർത്തനം.`
          );
        }
        return t('No recent weather on device. Use general caution for field work.', 'സമീപകാല കാലാവസ്ഥ ഇല്ല. പൊതുവായ ജാഗ്രത പാലിക്കുക.');
      }

      // Irrigation / water
      if (text.includes('irrigation') || text.includes('water') || text.includes('ജലം') || text.includes('നന')) {
        const base = t(
          `Water availability is ${data.waterAvailability}. Maintain soil moisture ~80% field capacity; irrigate every 2-3 days in warm/dry conditions.`,
          `ജല ലഭ്യത ${data.waterAvailability}. മണ്ണിലെ ഈർപ്പ് ഏകദേശം 80% നിലനിർത്തുക; ചൂട്/വരണ്ട കാലാവസ്ഥയിൽ 2-3 ദിവസത്തിലൊരിക്കൽ നനയ്ക്കുക.`
        );
        if (recentWeather && recentWeather.rainfall > 5) {
          return base + ' ' + t('Skip irrigation after rain; check drainage.', 'മഴയ്ക്ക് ശേഷമുള്ള നനയ്ക്കൽ ഒഴിവാക്കുക; ഡ്രെയിനേജ് പരിശോധിക്കുക.');
        }
        return base;
      }

      // Pest / disease
      if (text.includes('pest') || text.includes('disease') || text.includes('കീട') || text.includes('രോഗ')) {
        if (activePests.length > 0) {
          const names = activePests.map((p: any) => p.name).join(', ');
          const treats = activePests.map((p: any) => p.treatment).join('; ');
          return t(
            `Active issues: ${names}. Recommended: ${treats}. Inspect every 3-4 days; use preventive measures like neem oil.`,
            `സജീവ പ്രശ്നങ്ങൾ: ${names}. ശുപാർശ: ${treats}. 3-4 ദിവസത്തിലൊരിക്കൽ പരിശോധന; നീം ഓയിൽ പോലെ പ്രതിരോധ നടപടികൾ.`
          );
        }
        return t('No active pest records. Monitor foliage and traps weekly.', 'സജീവ കീട രേഖകൾ ഇല്ല. ഇല/ഫ്ലൈറ്റ് ട്രാപുകൾ ആഴ്ചതോറും പരിശോധിക്കുക.');
      }

      // Market / price
      if (text.includes('market') || text.includes('price') || text.includes('വില') || text.includes('മാർക്കറ്റ്')) {
        if (market) {
          return t(
            `Market for ${market.cropName}: ₹${market.currentPrice}/quintal; demand ${market.demand}. Next month forecast: ₹${market.forecast?.nextMonth}.`,
            `${market.cropName} വിപണി: ₹${market.currentPrice}/quintal; ആവശ്യം ${market.demand}. അടുത്ത മാസം പ്രവചനം: ₹${market.forecast?.nextMonth}.`
          );
        }
        return t('No market data cached. Check local APMC when online.', 'വിപണി ഡേറ്റ ഇല്ല. ഓൺലൈൻ ആയാൽ APMC പരിശോധിക്കുക.');
      }

      // Harvest
      if (text.includes('harvest') || text.includes('വിളവെടുപ്പ്') || text.includes('വിളവെടുക്ക')) {
        return t(
          `Harvest timing depends on variety; for many crops, look for maturity signs (e.g., grain color, moisture). Avoid harvesting during rain.`,
          `വിളവെടുപ്പ് സമയം ഇനത്തെ ആശ്രയിച്ചിരിക്കുന്നു; ധാരാളം വിളയിൽ പക്വത സൂചനകൾ നോക്കുക (ഉദാ: ധാന്യ നിറം, ഈർപ്പ്). മഴക്കാലത്ത് വിളവെടുപ്പ് ഒഴിവാക്കുക.`
        );
      }

      // General
      return t(
        `Your land ${data.name} with ${data.soilType} soil and ${data.waterAvailability} water availability is growing ${data.currentCrop}. Ask about fertilizer, irrigation, pests, or market for tailored advice.`,
        `നിങ്ങളുടെ ${data.name} ഭൂമിയിൽ ${data.soilType} മണ്ണും ${data.waterAvailability} ജല ലഭ്യതയും; നിലവിലെ വിള ${data.currentCrop}. വളം, നനയ്ക്കൽ, കീടങ്ങൾ, വിപണി എന്നീ കാര്യങ്ങളിൽ ചോദിക്കൂ.`
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
