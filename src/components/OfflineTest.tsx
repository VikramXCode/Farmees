import React, { useState } from 'react';
import { useConnectivity } from '../contexts/ConnectivityContext';
import { offlineAIService } from '../services/offlineAIService';
import { cropRecommendationService } from '../services/cropRecommendationService';

// Test component to verify offline functionality
export default function OfflineTest() {
  const { online, toggle, isAutoDetected, enableAutoDetect } = useConnectivity();
  const [testQuery, setTestQuery] = useState('Tell me about fertilizer for rice cultivation');
  const [testResponse, setTestResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testOfflineAI = async () => {
    setIsLoading(true);
    try {
      const response = await offlineAIService.generateResponse(testQuery);
      setTestResponse(response.response);
    } catch (error) {
      setTestResponse('Error: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const testCropService = async () => {
    setIsLoading(true);
    try {
      const response = await cropRecommendationService.generateAIRecommendation(undefined, testQuery);
      setTestResponse(response.recommendation);
    } catch (error) {
      setTestResponse('Error: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Offline AI Test</h2>
      
      {/* Connectivity Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Connectivity Status</h3>
        <div className="space-y-2">
          <p>Status: <span className={online ? 'text-green-600' : 'text-red-600'}>{online ? 'Online' : 'Offline'}</span></p>
          <p>Auto-detect: <span className={isAutoDetected ? 'text-blue-600' : 'text-orange-600'}>{isAutoDetected ? 'Enabled' : 'Disabled'}</span></p>
          <div className="flex space-x-2">
            <button
              onClick={toggle}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Toggle Mode
            </button>
            {!isAutoDetected && (
              <button
                onClick={enableAutoDetect}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Enable Auto-detect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Test Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Test Query:</label>
        <input
          type="text"
          value={testQuery}
          onChange={(e) => setTestQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Ask about farming..."
        />
      </div>

      {/* Test Buttons */}
      <div className="mb-4 space-x-2">
        <button
          onClick={testOfflineAI}
          disabled={isLoading}
          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
        >
          Test Offline AI Direct
        </button>
        <button
          onClick={testCropService}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
        >
          Test Crop Service
        </button>
      </div>

      {/* Response */}
      {testResponse && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Response:</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{testResponse}</p>
        </div>
      )}

      {isLoading && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <p className="mt-2 text-sm text-gray-600">Testing...</p>
        </div>
      )}
    </div>
  );
}
