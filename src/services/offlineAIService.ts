// Offline AI Service - Wrapper around Lightweight Ollama Service
// Provides a consistent interface for offline AI functionality

import { lightweightOllamaService } from './lightweightOllamaService';

export interface OfflineAIResponse {
  success: boolean;
  response: string;
  isOffline: true;
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

class OfflineAIService {
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await lightweightOllamaService.initialize();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Offline AI service initialization failed:', error);
      // Service will still work with fallback responses
    }
  }

  async generateResponse(
    userQuery: string,
    landContext?: LandContext
  ): Promise<OfflineAIResponse> {
    try {
      // Ensure service is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Use the lightweight Ollama service
      const ollamaResponse = await lightweightOllamaService.generateResponse(
        userQuery,
        landContext
      );

      // Convert OllamaResponse to OfflineAIResponse format
      return {
        success: ollamaResponse.success,
        response: ollamaResponse.response,
        isOffline: true,
        model: ollamaResponse.model,
        performance: ollamaResponse.performance
      };

    } catch (error) {
      console.error('Offline AI service error:', error);
      
      // Return a fallback response
      return {
        success: true,
        response: this.generateFallbackResponse(userQuery, landContext),
        isOffline: true,
        model: 'fallback',
        performance: {
          responseTime: 0,
          memoryUsage: 0
        }
      };
    }
  }

  private generateFallbackResponse(userQuery: string, landContext?: LandContext): string {
    const lowerQuery = userQuery.toLowerCase();
    
    // Simple keyword-based responses
    if (lowerQuery.includes('hi') || lowerQuery.includes('hello') || lowerQuery.includes('namaste')) {
      return landContext 
        ? `Hello! I can help with ${landContext.currentCrop} cultivation on ${landContext.name}. What do you need?`
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

  // Health check method
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; message: string }> {
    try {
      const ollamaHealth = await lightweightOllamaService.healthCheck();
      return ollamaHealth;
    } catch (error) {
      return { status: 'unhealthy', message: 'Offline AI service unavailable' };
    }
  }

  // Get service statistics
  getStats() {
    return lightweightOllamaService.getStats();
  }

  // Clear cache
  clearCache(): void {
    lightweightOllamaService.clearCache();
  }

  // Set custom Ollama URL (for mobile)
  setOllamaUrl(url: string): void {
    lightweightOllamaService.setOllamaUrl(url);
  }
}

export const offlineAIService = new OfflineAIService();