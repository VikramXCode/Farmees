// Mobile-Optimized Ollama Service
// Uses the smallest possible models for mobile and low-end devices

export interface MobileOllamaResponse {
  success: boolean;
  response: string;
  isOffline: true;
  model: string;
  performance: {
    responseTime: number;
    memoryUsage: number;
    tokensUsed: number;
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

class MobileOllamaService {
  private baseUrl: string;
  private currentModel: string = 'tinyllama:1.1b'; // Ultra-lightweight model
  private fallbackModel: string = 'phi3:mini'; // Microsoft's tiny model
  private isInitialized: boolean = false;
  private responseCache: Map<string, string> = new Map();
  private maxCacheSize: number = 50;

  constructor() {
    // Try to detect Ollama URL
    this.baseUrl = this.detectOllamaUrl();
  }

  private detectOllamaUrl(): string {
    // Check for common Ollama URLs
    const possibleUrls = [
      'http://localhost:11434',
      'http://127.0.0.1:11434',
      'http://192.168.1.100:11434', // Common mobile hotspot IP
      'http://10.0.0.1:11434' // Another common mobile IP
    ];

    // For now, use localhost - in production, this would be configurable
    return 'http://localhost:11434';
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Check if Ollama is available
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        timeout: 5000 // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        const models = data.models || [];
        
        // Find the smallest available model
        const availableModels = models.map((m: any) => m.name);
        
        if (availableModels.includes('tinyllama:1.1b')) {
          this.currentModel = 'tinyllama:1.1b';
        } else if (availableModels.includes('phi3:mini')) {
          this.currentModel = 'phi3:mini';
        } else if (availableModels.includes('gemma2:2b')) {
          this.currentModel = 'gemma2:2b';
        } else if (availableModels.length > 0) {
          this.currentModel = availableModels[0]; // Use first available
        } else {
          throw new Error('No suitable models found');
        }

        this.isInitialized = true;
        console.log(`Mobile Ollama initialized with model: ${this.currentModel}`);
        return true;
      }
    } catch (error) {
      console.warn('Ollama not available, using fallback:', error);
    }

    return false;
  }

  async generateResponse(
    userQuery: string,
    landContext?: LandContext
  ): Promise<MobileOllamaResponse> {
    const startTime = performance.now();

    try {
      // Check cache first
      const cacheKey = `${userQuery}-${landContext?.id || 'no-land'}`;
      if (this.responseCache.has(cacheKey)) {
        const endTime = performance.now();
        return {
          success: true,
          response: this.responseCache.get(cacheKey)!,
          isOffline: true,
          model: this.currentModel,
          performance: {
            responseTime: Math.round(endTime - startTime),
            memoryUsage: this.estimateMemoryUsage(),
            tokensUsed: 0
          }
        };
      }

      // Try to use Ollama if available
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
            memoryUsage: this.estimateMemoryUsage(),
            tokensUsed: this.estimateTokens(response)
          }
        };
      }

      // Fallback to ultra-lightweight rule-based system
      throw new Error('Ollama not available');

    } catch (error) {
      console.error('Mobile Ollama error:', error);
      
      // Fallback to rule-based system
      const fallbackResponse = this.generateFallbackResponse(userQuery, landContext);
      
      const endTime = performance.now();
      return {
        success: true,
        response: fallbackResponse,
        isOffline: true,
        model: 'rule-based-fallback',
        performance: {
          responseTime: Math.round(endTime - startTime),
          memoryUsage: this.estimateMemoryUsage(),
          tokensUsed: 0
        }
      };
    }
  }

  private async generateWithOllama(userQuery: string, landContext?: LandContext): Promise<string> {
    // Create a very lightweight prompt
    const systemPrompt = this.createLightweightPrompt(landContext);
    const fullPrompt = `${systemPrompt}\n\nUser: ${userQuery}\nAssistant:`;

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.currentModel,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.3, // Low temperature for consistency
          top_p: 0.9,
          max_tokens: 150, // Very short responses for speed
          stop: ['User:', 'Human:', 'Assistant:']
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response?.trim() || 'Sorry, I could not generate a response.';
  }

  private createLightweightPrompt(landContext?: LandContext): string {
    let prompt = 'You are a farming assistant. Give short, practical advice.';
    
    if (landContext) {
      prompt += `\nContext: ${landContext.currentCrop} on ${landContext.name} land.`;
      if (landContext.soilReport) {
        prompt += ` Soil pH: ${landContext.soilReport.pH}.`;
      }
    }
    
    prompt += '\nKeep responses under 100 words.';
    return prompt;
  }

  private generateFallbackResponse(userQuery: string, landContext?: LandContext): string {
    const lowerQuery = userQuery.toLowerCase();
    
    // Ultra-simple keyword matching
    if (lowerQuery.includes('hi') || lowerQuery.includes('hello')) {
      return landContext 
        ? `Hello! I can help with ${landContext.currentCrop} cultivation. What do you need?`
        : 'Hello! I can help with farming advice. What do you need?';
    }
    
    if (lowerQuery.includes('fertilizer') || lowerQuery.includes('fertilize')) {
      return landContext?.soilReport
        ? `For ${landContext.currentCrop}: Soil pH ${landContext.soilReport.pH}. Apply balanced NPK fertilizer.`
        : 'Use balanced NPK fertilizer. Apply 100-150kg per hectare.';
    }
    
    if (lowerQuery.includes('water') || lowerQuery.includes('irrigation')) {
      return landContext?.waterAvailability === 'low'
        ? 'Water is low. Use drip irrigation. Water every 3-4 days in small amounts.'
        : 'Maintain 70-80% soil moisture. Water every 2-3 days in dry periods.';
    }
    
    if (lowerQuery.includes('pest') || lowerQuery.includes('disease')) {
      return 'Check crops weekly for pests. Use neem oil spray every 15 days. Remove affected plants.';
    }
    
    if (lowerQuery.includes('weather')) {
      return 'Check weather forecast. Avoid field work in extreme weather. Plan irrigation based on rain.';
    }
    
    if (lowerQuery.includes('harvest')) {
      const crop = landContext?.currentCrop || 'your crop';
      return `Harvest ${crop} when fully mature. Look for color change and firmness. Harvest in morning.`;
    }
    
    if (lowerQuery.includes('soil')) {
      return landContext?.soilReport
        ? `Soil pH: ${landContext.soilReport.pH}. Add compost regularly. Maintain pH 6.0-7.5.`
        : 'Test soil regularly. Add compost. Maintain pH 6.0-7.5. Ensure good drainage.';
    }
    
    if (lowerQuery.includes('market') || lowerQuery.includes('price')) {
      return 'Check local APMC for prices. Prices higher during festivals, lower during peak harvest.';
    }
    
    return landContext
      ? `I can help with ${landContext.currentCrop} cultivation on ${landContext.name}. Ask about fertilizer, water, pests, weather, or harvest.`
      : 'I can help with farming advice. Ask about fertilizer, water, pests, weather, or harvest.';
  }

  private cacheResponse(key: string, response: string): void {
    if (this.responseCache.size >= this.maxCacheSize) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
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

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  // Model management
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
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
      isInitialized: this.isInitialized
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
}

export const mobileOllamaService = new MobileOllamaService();
