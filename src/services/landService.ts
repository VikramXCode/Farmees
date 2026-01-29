// MongoDB service for land-specific data management

import { LandData, AIInteraction, LandRecommendation } from '../types/land';
import { getApiHeaders } from './api';
import { API_BASE_URL } from '../config/api';

class LandService {
  private baseUrl = API_BASE_URL;

  // Land Data Management
  async createLandData(landData: Omit<LandData, '_id' | 'createdAt' | 'updatedAt'>): Promise<LandData> {
    const response = await fetch(`${this.baseUrl}/lands`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({
        ...landData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create land data');
    }

    return response.json();
  }

  async getLandData(landId: string): Promise<LandData | null> {
    const response = await fetch(`${this.baseUrl}/lands/${landId}`, {
      headers: getApiHeaders()
    });
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch land data');
    }

    return response.json();
  }

  async updateLandData(landId: string, updates: Partial<LandData>): Promise<LandData> {
    const response = await fetch(`${this.baseUrl}/lands/${landId}`, {
      method: 'PUT',
      headers: getApiHeaders(),
      body: JSON.stringify({
        ...updates,
        updatedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update land data');
    }

    return response.json();
  }

  async getAllUserLands(userId: string): Promise<LandData[]> {
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        console.log(`[LandService] Fetching lands for user ${userId} (attempt ${attempt + 1}/${maxRetries + 1})`);
        const response = await fetch(`${this.baseUrl}/lands/user/${userId}`, {
          headers: getApiHeaders(),
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user lands: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`[LandService] Successfully fetched ${data.length} lands`);
        return data;
      } catch (error: any) {
        clearTimeout(timeout);
        lastError = error;
        
        if (error.name === 'AbortError') {
          console.error(`[LandService] Request timeout on attempt ${attempt + 1}`);
          if (attempt < maxRetries) {
            console.log(`[LandService] Retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
            continue;
          }
          throw new Error('Request timeout - slow connection detected. Please try again later.');
        }
        
        // For other errors, don't retry
        throw error;
      }
    }
    
    throw lastError || new Error('Failed to fetch user lands');
  }

  async deleteLandData(landId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/lands/${landId}`, {
      method: 'DELETE',
      headers: getApiHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete land data');
    }
  }

  // Weather Data Management
  async updateWeatherData(landId: string, weatherData: any): Promise<void> {
    await this.updateLandData(landId, {
      weatherHistory: weatherData,
    });
  }

  // Crop Management
  async addCropRecord(landId: string, cropRecord: any): Promise<void> {
    const landData = await this.getLandData(landId);
    if (!landData) return;

    const updatedCropHistory = [...(landData.cropHistory || []), cropRecord];
    await this.updateLandData(landId, {
      cropHistory: updatedCropHistory,
    });
  }

  // Pest & Disease Management
  async addPestDiseaseRecord(landId: string, record: any): Promise<void> {
    const landData = await this.getLandData(landId);
    if (!landData) return;

    const updatedHistory = [...(landData.pestDiseaseHistory || []), record];
    await this.updateLandData(landId, {
      pestDiseaseHistory: updatedHistory,
    });
  }

  // Treatment Records
  async addTreatmentRecord(landId: string, treatment: any): Promise<void> {
    const landData = await this.getLandData(landId);
    if (!landData) return;

    const updatedTreatments = [...(landData.treatmentHistory || []), treatment];
    await this.updateLandData(landId, {
      treatmentHistory: updatedTreatments,
    });
  }

  // Market Data
  async updateMarketData(landId: string, marketData: any): Promise<void> {
    await this.updateLandData(landId, {
      marketData: marketData,
    });
  }

  // AI Context Management
  async updateAIContext(landId: string, context: any): Promise<void> {
    const landData = await this.getLandData(landId);
    if (!landData) return;

    await this.updateLandData(landId, {
      aiContext: {
        ...landData.aiContext,
        ...context,
        lastInteraction: new Date().toISOString(),
      },
    });
  }

  // AI Interactions
  async saveAIInteraction(interaction: Omit<AIInteraction, '_id'>): Promise<AIInteraction> {
    const response = await fetch(`${this.baseUrl}/ai-interactions`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(interaction),
    });

    if (!response.ok) {
      throw new Error('Failed to save AI interaction');
    }

    return response.json();
  }

  async getAIInteractions(landId: string, limit: number = 10): Promise<AIInteraction[]> {
    const response = await fetch(`${this.baseUrl}/ai-interactions/land/${landId}?limit=${limit}`, {
      headers: getApiHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch AI interactions');
    }

    return response.json();
  }

  // Recommendations
  async createRecommendation(recommendation: Omit<LandRecommendation, '_id' | 'createdAt' | 'updatedAt'>): Promise<LandRecommendation> {
    const response = await fetch(`${this.baseUrl}/recommendations`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({
        ...recommendation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create recommendation');
    }

    return response.json();
  }

  async getRecommendations(landId: string): Promise<LandRecommendation[]> {
    const response = await fetch(`${this.baseUrl}/recommendations/land/${landId}`, {
      headers: getApiHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch recommendations');
    }

    return response.json();
  }

  // Analytics and Insights
  async getLandAnalytics(landId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/lands/${landId}/analytics`, {
      headers: getApiHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch land analytics');
    }

    return response.json();
  }

  // Mock data for development (when API is not available)
  async getMockLandData(landId: string): Promise<LandData> {
    return {
      _id: landId,
      landId: landId,
      userId: 'mock-user',
      name: 'North Field',
      location: 'Kochi, Kerala',
      soilType: 'Clay Loam',
      currentCrop: 'Rice',
      waterAvailability: 'high',
      soilReport: {
        pH: 6.5,
        nitrogen: 45,
        phosphorus: 25,
        potassium: 180,
        organicMatter: 2.8,
        moisture: 65,
        texture: 'Clay Loam',
        analysisDate: new Date().toISOString(),
      },
      weatherHistory: [
        {
          date: new Date().toISOString(),
          temperature: 28,
          humidity: 75,
          rainfall: 2,
          windSpeed: 8,
          conditions: 'partly_cloudy',
        },
      ],
      cropHistory: [
        {
          cropName: 'Rice',
          plantingDate: '2024-01-15',
          harvestDate: '2024-04-15',
          yield: 4500,
          notes: 'Good harvest season',
        },
      ],
      pestDiseaseHistory: [
        {
          date: new Date().toISOString(),
          type: 'pest',
          name: 'Stem Borer',
          severity: 'low',
          treatment: 'Neem oil spray',
          status: 'resolved',
        },
      ],
      treatmentHistory: [
        {
          date: new Date().toISOString(),
          type: 'fertilizer',
          product: 'NPK 20:10:10',
          quantity: 50,
          unit: 'kg',
          notes: 'Applied during flowering stage',
        },
      ],
      marketData: [
        {
          cropName: 'Rice',
          currentPrice: 2850,
          priceHistory: [
            {
              date: new Date().toISOString(),
              price: 2850,
              market: 'Kochi APMC',
            },
          ],
          demand: 'high',
          forecast: {
            nextMonth: 2900,
            nextQuarter: 3000,
          },
        },
      ],
      aiContext: {
        lastInteraction: new Date().toISOString(),
        commonQuestions: [
          'When should I fertilize?',
          'What pests should I watch for?',
          'How is the weather affecting my crop?',
        ],
        recommendedActions: [
          {
            action: 'Apply nitrogen fertilizer',
            priority: 'high',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
          },
        ],
        preferences: {
          communicationStyle: 'simple',
          focusAreas: ['pest_management', 'fertilization'],
          alertLevel: 'medium',
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };
  }
}

export const landService = new LandService();
