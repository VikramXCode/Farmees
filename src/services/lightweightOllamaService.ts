// Lightweight Ollama Service for Laptop and Mobile
// Uses the smallest possible models for optimal performance

export interface OllamaResponse {
  success: boolean;
  response: string;
  isOffline: boolean;
  model: string;
  performance: {
    responseTime: number;
    memoryUsage: number;
  };
}

interface LandContext {
  id: string;
  name: string;
  location: string;
  currentCrop: string;
  soilType: string;
  waterAvailability: 'high' | 'medium' | 'low';
  soilReport?: {
    pH: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
}

class LightweightOllamaService {
  private baseUrl: string = 'http://localhost:11434';
  private currentModel: string = 'phi3:mini'; // Prefer more capable tiny model by default
  private isInitialized: boolean = false;
  private responseCache: Map<string, string> = new Map();
  private maxCacheSize: number = 100;
  private language: string = 'english';
  private backendTimeoutMs: number = 8000;

  // Recommended models in order of preference (smallest to largest)
  private recommendedModels = [
    'phi3:mini',          // 3.8B parameters - Microsoft's tiny model
    'llama3.2:1b',        // 1B parameters - Meta's tiny model
    'gemma2:2b',          // 2B parameters - Google's tiny model
    'qwen2:1.5b',         // 1.5B parameters - Alibaba's tiny model
    'tinyllama:1.1b',     // 1.1B parameters - Ultra lightweight (last resort)
  ];

  constructor() {
    this.detectOllamaUrl();
    this.loadLanguage();
  }

  private detectOllamaUrl(): void {
    // Try to detect Ollama URL based on environment
    // Check if we're in a mobile environment
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // For mobile, try to detect the computer's IP
      this.baseUrl = 'http://192.168.1.100:11434'; // Default mobile hotspot IP
    } else {
      this.baseUrl = 'http://localhost:11434'; // Default for laptop
    }
  }

  private loadLanguage(): void {
    try {
      this.language = localStorage.getItem('farmease_language') || 'english';
    } catch {
      this.language = 'english';
    }
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Check if Ollama is available
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        timeout: 30000 // 30 second timeout for mobile
      });

      if (response.ok) {
        const data = await response.json();
        const availableModels = (data.models || []).map((m: any) => m.name);
        
        // Find the smallest available model
        for (const model of this.recommendedModels) {
          if (availableModels.includes(model)) {
            this.currentModel = model;
            break;
          }
        }

        this.isInitialized = true;
        console.log(`Ollama initialized with model: ${this.currentModel}`);
        return true;
      }
    } catch (error) {
      console.warn('Ollama not available:', error);
    }

    return false;
  }

  async generateResponse(
    userQuery: string,
    landContext?: LandContext
  ): Promise<OllamaResponse> {
    const startTime = performance.now();

    try {
      // Check cache first
      const cacheKey = `${userQuery}-${landContext?.id || 'no-land'}`;
      if (this.responseCache.has(cacheKey)) {
        const endTime = performance.now();
        return {
          success: true,
          response: this.responseCache.get(cacheKey)!,
          isOffline: false,
          model: 'cache',
          performance: {
            responseTime: Math.round(endTime - startTime),
            memoryUsage: this.estimateMemoryUsage()
          }
        };
      }

      // Try higher-quality backend LLM first (Groq via backend). Falls back if unavailable.
      try {
        const backendText = await this.generateWithBackendLLM(userQuery, landContext);
        // Cache the response
        this.cacheResponse(cacheKey, backendText);
        const endTime = performance.now();
        return {
          success: true,
          response: backendText,
          isOffline: false,
          model: 'backend-llm',
          performance: {
            responseTime: Math.round(endTime - startTime),
            memoryUsage: this.estimateMemoryUsage()
          }
        };
      } catch (_e) {
        // ignore and try local Ollama next
      }

      // Try to use Ollama
      if (await this.initialize()) {
        const response = await this.generateWithOllama(userQuery, landContext);
        
        // Cache the response
        this.cacheResponse(cacheKey, response);
        
        const endTime = performance.now();
        return {
          success: true,
          response,
          isOffline: true,
          model: this.currentModel,
          performance: {
            responseTime: Math.round(endTime - startTime),
            memoryUsage: this.estimateMemoryUsage()
          }
        };
      }

      // Fallback to simple rule-based system
      throw new Error('Ollama not available');

    } catch (error) {
      console.error('Ollama service error:', error);
      
      // Fallback to simple rule-based system
      const fallbackResponse = this.generateFallbackResponse(userQuery, landContext);
      
      const endTime = performance.now();
      return {
        success: true,
        response: fallbackResponse,
        isOffline: true,
        model: 'rule-based-fallback',
        performance: {
          responseTime: Math.round(endTime - startTime),
          memoryUsage: this.estimateMemoryUsage()
        }
      };
    }
  }

  private async generateWithOllama(userQuery: string, landContext?: LandContext): Promise<string> {
    // Create a very lightweight prompt
    const systemPrompt = this.createLightweightPrompt(landContext);
    const fullPrompt = `${systemPrompt}\n\nUser: ${userQuery}\nAssistant:`;

    const response = await this.fetchWithTimeout(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.currentModel,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.4, // a touch higher for better fluency
          top_p: 0.9,
          num_predict: 160, // slightly longer for better quality
          stop: ['User:', 'Human:', 'Assistant:', '\n\n']
        }
      }),
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response?.trim() || 'Sorry, I could not generate a response.';
  }

  private async generateWithBackendLLM(userQuery: string, landContext?: LandContext): Promise<string> {
    const sys = this.createLightweightPrompt(landContext);
    const resp = await this.fetchWithTimeout('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: userQuery, systemPrompt: sys, context: landContext }),
      timeout: this.backendTimeoutMs
    });
    if (!resp.ok) {
      throw new Error(`Backend LLM error: ${resp.status}`);
    }
    const data = await resp.json();
    if (data && data.success && data.text) {
      return String(data.text).trim();
    }
    throw new Error('Backend LLM returned no text');
  }

  private createLightweightPrompt(landContext?: LandContext): string {
    let prompt = this.language === 'malayalam' 
      ? 'നിങ്ങൾ ഒരു കൃഷി സഹായി ആണ്. ലളിതവും പ്രായോഗികവുമായ Malayāḷam ഉപദേശം നൽകുക. ചെറിയ ഉത്തരങ്ങൾ മാത്രം.'
      : 'You are a farming assistant. Give short, practical advice. Keep responses under 50 words.';
    
    if (landContext) {
      if (this.language === 'malayalam') {
        prompt += `\nContext: ${landContext.currentCrop} on ${landContext.name} land.`;
        if (landContext.soilReport) {
          prompt += ` Soil pH: ${landContext.soilReport.pH}.`;
        }
      } else {
        prompt += `\nContext: ${landContext.currentCrop} on ${landContext.name} land.`;
        if (landContext.soilReport) {
          prompt += ` Soil pH: ${landContext.soilReport.pH}.`;
        }
      }
    }
    
    return prompt;
  }

  private generateFallbackResponse(userQuery: string, landContext?: LandContext): string {
    const lowerQuery = userQuery.toLowerCase();
    
    // Ultra-simple keyword matching
    if (lowerQuery.includes('hi') || lowerQuery.includes('hello') || lowerQuery.includes('namaste')) {
      if (this.language === 'malayalam') {
        return landContext 
          ? `ഹലോ! നിങ്ങളുടെ ${landContext.name} ഭൂമിയിൽ ${landContext.currentCrop} കൃഷിയിൽ സഹായിക്കാം. എന്താണ് വേണ്ടത്?`
          : 'ഹലോ! കൃഷി ഉപദേശത്തിൽ സഹായിക്കാം. എന്താണ് വേണ്ടത്?';
      }
      return landContext 
        ? `Hello! I can help with ${landContext.currentCrop} cultivation. What do you need?`
        : 'Hello! I can help with farming advice. What do you need?';
    }
    
    if (lowerQuery.includes('fertilizer') || lowerQuery.includes('fertilize') || lowerQuery.includes('വളം')) {
      if (this.language === 'malayalam') {
        return landContext?.soilReport
          ? `${landContext.currentCrop} കൃഷിക്ക്: മണ്ണിന്റെ pH ${landContext.soilReport.pH}. സുസ്ഥിര NPK വളം പ്രയോഗിക്കുക.`
          : 'സുസ്ഥിര NPK വളം ഉപയോഗിക്കുക. ഹെക്ടറിന് 100-150kg പ്രയോഗിക്കുക.';
      }
      return landContext?.soilReport
        ? `For ${landContext.currentCrop}: Soil pH ${landContext.soilReport.pH}. Apply balanced NPK fertilizer.`
        : 'Use balanced NPK fertilizer. Apply 100-150kg per hectare.';
    }
    
    if (lowerQuery.includes('water') || lowerQuery.includes('irrigation') || lowerQuery.includes('ജലം')) {
      if (this.language === 'malayalam') {
        return landContext?.waterAvailability === 'low'
          ? 'ജലം കുറവാണ്. ഡ്രിപ്പ് ജലസേചനം ഉപയോഗിക്കുക. 3-4 ദിവസത്തിലൊരിക്കൽ കുറഞ്ഞ അളവിൽ നനയ്ക്കുക.'
          : 'മണ്ണിലെ ഈർപ്പം 70-80% നിലനിർത്തുക. വരണ്ട കാലയളവിൽ 2-3 ദിവസത്തിലൊരിക്കൽ നനയ്ക്കുക.';
      }
      return landContext?.waterAvailability === 'low'
        ? 'Water is low. Use drip irrigation. Water every 3-4 days in small amounts.'
        : 'Maintain 70-80% soil moisture. Water every 2-3 days in dry periods.';
    }
    
    if (lowerQuery.includes('pest') || lowerQuery.includes('disease') || lowerQuery.includes('കീടം')) {
      if (this.language === 'malayalam') {
        return 'കീടങ്ങൾക്കായി ആഴ്ചതോറും വിളകൾ പരിശോധിക്കുക. 15 ദിവസത്തിലൊരിക്കൽ നീം ഓയിൽ സ്പ്രേ ഉപയോഗിക്കുക.';
      }
      return 'Check crops weekly for pests. Use neem oil spray every 15 days. Remove affected plants.';
    }
    
    if (lowerQuery.includes('weather') || lowerQuery.includes('കാലാവസ്ഥ')) {
      if (this.language === 'malayalam') {
        return 'കാലാവസ്ഥാ പ്രവചനം പരിശോധിക്കുക. കടുത്ത കാലാവസ്ഥയിൽ ഫീൽഡ് പ്രവർത്തനം ഒഴിവാക്കുക.';
      }
      return 'Check weather forecast. Avoid field work in extreme weather. Plan irrigation based on rain.';
    }
    
    if (lowerQuery.includes('harvest') || lowerQuery.includes('വിളവെടുപ്പ്')) {
      const crop = landContext?.currentCrop || 'your crop';
      if (this.language === 'malayalam') {
        return `${crop} പൂർണ്ണമായി പക്വമാകുമ്പോൾ വിളവെടുക്കുക. നിറം മാറ്റവും കടുപ്പവും നോക്കുക. രാവിലെ വിളവെടുക്കുക.`;
      }
      return `Harvest ${crop} when fully mature. Look for color change and firmness. Harvest in morning.`;
    }
    
    if (lowerQuery.includes('soil') || lowerQuery.includes('മണ്ണ്')) {
      if (this.language === 'malayalam') {
        return landContext?.soilReport
          ? `മണ്ണിന്റെ pH: ${landContext.soilReport.pH}. പതിവായി കമ്പോസ്റ്റ് ചേർക്കുക. pH 6.0-7.5 നിലനിർത്തുക.`
          : 'പതിവായി മണ്ണ് പരിശോധിക്കുക. കമ്പോസ്റ്റ് ചേർക്കുക. pH 6.0-7.5 നിലനിർത്തുക.';
      }
      return landContext?.soilReport
        ? `Soil pH: ${landContext.soilReport.pH}. Add compost regularly. Maintain pH 6.0-7.5.`
        : 'Test soil regularly. Add compost. Maintain pH 6.0-7.5. Ensure good drainage.';
    }
    
    if (lowerQuery.includes('market') || lowerQuery.includes('price') || lowerQuery.includes('വിപണി')) {
      if (this.language === 'malayalam') {
        return 'വിലകൾക്ക് പ്രാദേശിക APMC പരിശോധിക്കുക. ഉത്സവങ്ങളിൽ വില ഉയരും, പീക്ക് വിളവെടുപ്പിൽ കുറയും.';
      }
      return 'Check local APMC for prices. Prices higher during festivals, lower during peak harvest.';
    }
    
    if (this.language === 'malayalam') {
      return landContext
        ? `${landContext.name} ൽ ${landContext.currentCrop} കൃഷിയിൽ സഹായിക്കാം. വളം, ജലം, കീടങ്ങൾ, കാലാവസ്ഥ, വിളവെടുപ്പ് എന്നിവയെക്കുറിച്ച് ചോദിക്കാം.`
        : 'കൃഷി ഉപദേശത്തിൽ സഹായിക്കാം. വളം, ജലം, കീടങ്ങൾ, കാലാവസ്ഥ, വിളവെടുപ്പ് എന്നിവയെക്കുറിച്ച് ചോദിക്കാം.';
    }
    
    return landContext
      ? `I can help with ${landContext.currentCrop} cultivation on ${landContext.name}. Ask about fertilizer, water, pests, weather, or harvest.`
      : 'I can help with farming advice. Ask about fertilizer, water, pests, weather, or harvest.';
  }

  private async fetchWithTimeout(url: string, options: RequestInit & { timeout?: number }): Promise<Response> {
    const { timeout = 5000, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private cacheResponse(key: string, response: string): void {
    if (this.responseCache.size >= this.maxCacheSize) {
      const iter = this.responseCache.keys().next();
      if (!iter.done && iter.value) {
        this.responseCache.delete(iter.value as string);
      }
    }
    this.responseCache.set(key, response);
  }

  private estimateMemoryUsage(): number {
    let totalSize = 0;
    for (const [key, value] of this.responseCache) {
      totalSize += key.length + value.length;
    }
    return totalSize;
  }

  // Model management
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/tags`, { timeout: 3000 });
      if (response.ok) {
        const data = await response.json();
        return (data.models || []).map((m: any) => m.name);
      }
    } catch (error) {
      console.error('Failed to get models:', error);
    }
    return [];
  }

  async switchModel(modelName: string): Promise<boolean> {
    try {
      const models = await this.getAvailableModels();
      if (models.includes(modelName)) {
        this.currentModel = modelName;
        return true;
      }
    } catch (error) {
      console.error('Failed to switch model:', error);
    }
    return false;
  }

  // Performance monitoring
  getStats() {
    return {
      model: this.currentModel,
      cacheSize: this.responseCache.size,
      maxCacheSize: this.maxCacheSize,
      memoryUsage: this.estimateMemoryUsage(),
      isInitialized: this.isInitialized,
      baseUrl: this.baseUrl
    };
  }

  clearCache(): void {
    this.responseCache.clear();
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; message: string }> {
    try {
      if (await this.initialize()) {
        return { status: 'healthy', message: `Ollama running with ${this.currentModel}` };
      } else {
        return { status: 'degraded', message: 'Using fallback rule-based system' };
      }
    } catch (error) {
      return { status: 'unhealthy', message: 'Service unavailable' };
    }
  }

  // Set custom Ollama URL (for mobile)
  setOllamaUrl(url: string): void {
    this.baseUrl = url;
    this.isInitialized = false; // Reset initialization
  }
}

export const lightweightOllamaService = new LightweightOllamaService();
