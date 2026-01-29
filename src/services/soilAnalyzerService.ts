import { API_BASE_URL } from '../config/api';
import { getApiHeaders } from './api';

export interface SoilAnalysisResult {
  confidence: string;
  parsedData: {
    location: {
      state: string;
      district: string;
      village: string;
    };
    soilProperties: {
      type: string;
      pH: number;
      ec: number;
    };
    nutrients: {
      nitrogen?: { value: string; unit: string; status: string };
      phosphorus?: { value: string; unit: string; status: string };
      potassium?: { value: string; unit: string; status: string };
      zinc?: { value: string; unit: string; status: string };
      iron?: { value: string; unit: string; status: string };
      boron?: { value: string; unit: string; status: string };
    };
    healthStatus: string;
    recommendations: string[];
  };
  validityInfo: {
    message: string;
    recommendedRetestDate: string;
  };
}

export interface ConfirmResponse {
  success: boolean;
  message: string;
  land: {
    landId: string;
    name: string;
    soilType: string;
    soilHealth: string;
    lastUpdated: string;
  };
}

export const soilAnalyzerService = {
  /**
   * Upload and analyze soil report
   * Returns parsed data for review (does not save)
   */
  async analyzeSoilReport(file: File): Promise<SoilAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/soil-analyzer/analyze`, {
      method: 'POST',
      headers: getApiHeaders(true), // Skip Content-Type for FormData
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to analyze soil report');
    }

    return response.json();
  },

  /**
   * Confirm and save soil data to land
   * Call after user reviews and selects land
   */
  async confirmSoilData(landId: string, userId: string): Promise<ConfirmResponse> {
    const response = await fetch(`${API_BASE_URL}/soil-analyzer/confirm`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ landId, userId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save soil data');
    }

    return response.json();
  },

  /**
   * Get current analysis session
   * Retrieve parsed data if analysis was interrupted
   */
  async getSession(): Promise<SoilAnalysisResult | null> {
    const response = await fetch(`${API_BASE_URL}/soil-analyzer/session`, {
      method: 'GET',
      headers: getApiHeaders()
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to retrieve session');
    }

    const data = await response.json();
    return data.parsedData || null;
  },

  /**
   * Cancel current analysis session
   * Clear session data if user wants to start over
   */
  async cancelAnalysis(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/soil-analyzer/cancel`, {
      method: 'POST',
      headers: getApiHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel analysis');
    }
  },

  /**
   * Check if analyzer service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/soil-analyzer/health`, {
        method: 'GET',
        headers: getApiHeaders()
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};
