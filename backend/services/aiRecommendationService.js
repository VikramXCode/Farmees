import groqService from './groqService.js';
import FarmingPlan from '../models/FarmingPlan.js';
import WeatherSnapshot from '../models/WeatherSnapshot.js';

/**
 * AI Recommendation Service
 * Generates intelligent activity suggestions using AI
 * Provides context-aware farming advice
 */
class AIRecommendationService {
  
  /**
   * Generate pre-activity AI suggestions
   * @param {String} planId - Farming plan ID
   * @param {String} activityType - Type of upcoming activity
   * @returns {Array} - AI suggestions with reasoning
   */
  async generateActivitySuggestions(planId, activityType) {
    try {
      const plan = await FarmingPlan.findById(planId)
        .populate('userId')
        .populate('landId');
      
      if (!plan) throw new Error('Plan not found');
      
      // Get latest weather data
      const weatherSnapshot = await WeatherSnapshot.findOne({ planId })
        .sort({ snapshotDate: -1 });
      
      // Build context for AI
      const context = this.buildActivityContext(plan, activityType, weatherSnapshot);
      
      // Generate suggestions using Groq AI
      const suggestions = await this.generateAISuggestions(context);
      
      return suggestions;
      
    } catch (error) {
      console.error('Error generating activity suggestions:', error);
      // Return fallback suggestions if AI fails
      return this.getFallbackSuggestions(activityType);
    }
  }
  
  /**
   * Build context for AI prompt
   */
  buildActivityContext(plan, activityType, weatherSnapshot) {
    const context = {
      cropName: plan.cropName,
      activityType: activityType,
      landSize: plan.landId ? plan.landId.landSize : 'Unknown',
      soilType: plan.landId ? plan.landId.soilType : 'Unknown',
      region: plan.landId ? `${plan.landId.district}, ${plan.landId.state}` : 'Unknown',
      currentStage: plan.currentStage,
      completedActivities: plan.activities
        .filter(a => a.status === 'completed')
        .map(a => a.activityType),
      weather: null
    };
    
    if (weatherSnapshot && weatherSnapshot.forecast.length > 0) {
      const todayWeather = weatherSnapshot.forecast[0];
      context.weather = {
        temp: todayWeather.temp.avg,
        humidity: todayWeather.humidity,
        rainfall: todayWeather.rainfallAmount,
        irrigationNeeded: todayWeather.irrigationNeeded,
        pestRisk: todayWeather.pestRisk,
        diseaseRisk: todayWeather.diseaseRisk
      };
    }
    
    return context;
  }
  
  /**
   * Generate AI suggestions using Groq
   */
  async generateAISuggestions(context) {
    try {
      const prompt = this.buildPrompt(context);
      
      // Call Groq AI service
      const aiResponse = await groqService.generateResponse(prompt, {
        temperature: 0.7,
        maxTokens: 500
      });
      
      // Parse AI response into structured suggestions
      const suggestions = this.parseAIResponse(aiResponse, context.activityType);
      
      return suggestions;
      
    } catch (error) {
      console.error('Error calling Groq AI:', error);
      throw error;
    }
  }
  
  /**
   * Build prompt for AI
   */
  buildPrompt(context) {
    let prompt = `You are an expert agricultural advisor helping a farmer in ${context.region}.

Farmer Details:
- Crop: ${context.cropName}
- Land Size: ${context.landSize} acres
- Soil Type: ${context.soilType}
- Current Stage: ${context.currentStage}
- Completed Activities: ${context.completedActivities.join(', ') || 'None'}

Upcoming Activity: ${this.formatActivityType(context.activityType)}
`;

    if (context.weather) {
      prompt += `
Current Weather:
- Temperature: ${Math.round(context.weather.temp)}°C
- Humidity: ${Math.round(context.weather.humidity)}%
- Rainfall Expected: ${Math.round(context.weather.rainfall)}mm
- Irrigation Needed: ${context.weather.irrigationNeeded ? 'Yes' : 'No'}
- Pest Risk: ${context.weather.pestRisk}
- Disease Risk: ${context.weather.diseaseRisk}
`;
    }

    prompt += `
Provide 3-4 specific, actionable suggestions for ${this.formatActivityType(context.activityType)}:
1. What materials/tools are needed (be specific with quantities)
2. Best time of day to do this activity
3. Key things to watch out for
4. Cost-saving tips

Keep suggestions simple, practical, and suitable for small farmers. Each suggestion should be 1-2 sentences.

Format your response as:
SUGGESTION 1: [text]
SUGGESTION 2: [text]
SUGGESTION 3: [text]
SUGGESTION 4: [text]
`;

    return prompt;
  }
  
  /**
   * Parse AI response into structured format
   */
  parseAIResponse(aiResponse, activityType) {
    try {
      const suggestions = [];
      const lines = aiResponse.split('\n').filter(line => line.trim());
      
      let currentSuggestion = null;
      for (const line of lines) {
        const match = line.match(/SUGGESTION (\d+):\s*(.+)/);
        if (match) {
          if (currentSuggestion) {
            suggestions.push(currentSuggestion);
          }
          currentSuggestion = {
            title: this.generateSuggestionTitle(match[2], activityType),
            descriptionEnglish: match[2].trim(),
            descriptionTamil: '', // Would translate in production
            type: this.categorizeSuggestion(match[2]),
            priority: suggestions.length === 0 ? 'high' : 'medium'
          };
        } else if (currentSuggestion && line.trim()) {
          // Multi-line suggestion
          currentSuggestion.descriptionEnglish += ' ' + line.trim();
        }
      }
      
      if (currentSuggestion) {
        suggestions.push(currentSuggestion);
      }
      
      return suggestions.length > 0 ? suggestions : this.getFallbackSuggestions(activityType);
      
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.getFallbackSuggestions(activityType);
    }
  }
  
  /**
   * Generate suggestion title from content
   */
  generateSuggestionTitle(content, activityType) {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('material') || lowerContent.includes('tool')) {
      return 'Materials & Tools';
    }
    if (lowerContent.includes('time') || lowerContent.includes('morning') || lowerContent.includes('evening')) {
      return 'Best Timing';
    }
    if (lowerContent.includes('watch') || lowerContent.includes('avoid') || lowerContent.includes('careful')) {
      return 'Important Tips';
    }
    if (lowerContent.includes('cost') || lowerContent.includes('save') || lowerContent.includes('budget')) {
      return 'Cost Savings';
    }
    
    return `${this.formatActivityType(activityType)} Tip`;
  }
  
  /**
   * Categorize suggestion type
   */
  categorizeSuggestion(content) {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('material') || lowerContent.includes('tool')) return 'materials';
    if (lowerContent.includes('time') || lowerContent.includes('timing')) return 'timing';
    if (lowerContent.includes('cost') || lowerContent.includes('save')) return 'cost';
    if (lowerContent.includes('weather') || lowerContent.includes('rain')) return 'weather';
    
    return 'general';
  }
  
  /**
   * Fallback suggestions when AI fails
   */
  getFallbackSuggestions(activityType) {
    const fallbackMap = {
      land_preparation: [
        {
          title: 'Clear the Field',
          descriptionEnglish: 'Remove all weeds, stones, and crop residue from previous harvest. This prevents pest buildup.',
          descriptionTamil: 'அனைத்து களைகள், கற்கள் மற்றும் பயிர் எச்சங்களை அகற்றவும்.',
          type: 'preparation',
          priority: 'high'
        },
        {
          title: 'Check Soil Moisture',
          descriptionEnglish: 'Soil should have moderate moisture for easy ploughing. Too wet or too dry makes work harder.',
          descriptionTamil: 'எளிதாக உழுவதற்கு மண் ஈரப்பதம் சரியாக இருக்க வேண்டும்.',
          type: 'timing',
          priority: 'medium'
        }
      ],
      ploughing: [
        {
          title: 'Plough to Right Depth',
          descriptionEnglish: 'Plough 15-20 cm deep for most crops. Too shallow roots struggle, too deep wastes fuel.',
          descriptionTamil: 'பெரும்பாலான பயிர்களுக்கு 15-20 செமீ ஆழத்தில் உழவு செய்யவும்.',
          type: 'technique',
          priority: 'high'
        },
        {
          title: 'Early Morning is Best',
          descriptionEnglish: 'Plough early morning when soil is cool. Reduces equipment wear and saves fuel.',
          descriptionTamil: 'காலை நேரத்தில் உழுவது சிறந்தது. எரிபொருள் சேமிப்பு.',
          type: 'timing',
          priority: 'medium'
        }
      ],
      seed_sowing: [
        {
          title: 'Use Quality Seeds',
          descriptionEnglish: 'Buy certified seeds from authorized dealers. Check germination rate (should be >80%).',
          descriptionTamil: 'அங்கீகரிக்கப்பட்ட விதைகளை வாங்கவும். முளைப்பு விகிதம் 80% க்கு மேல் இருக்க வேண்டும்.',
          type: 'materials',
          priority: 'high'
        },
        {
          title: 'Sow at Right Spacing',
          descriptionEnglish: 'Follow recommended seed spacing for your crop. Too close creates competition, too far wastes land.',
          descriptionTamil: 'பரிந்துரைக்கப்பட்ட இடைவெளியில் விதைக்கவும்.',
          type: 'technique',
          priority: 'medium'
        }
      ],
      fertilizer_application: [
        {
          title: 'Soil Test First',
          descriptionEnglish: 'Do soil test to know exact fertilizer needs. Avoid over-application which wastes money and harms soil.',
          descriptionTamil: 'மண் பரிசோதனை செய்து தேவையான உரத்தை அறியவும்.',
          type: 'preparation',
          priority: 'high'
        },
        {
          title: 'Apply with Moisture',
          descriptionEnglish: 'Apply fertilizer when soil has moisture. Water lightly after application for better absorption.',
          descriptionTamil: 'மண்ணில் ஈரப்பதம் இருக்கும்போது உரமிடவும்.',
          type: 'timing',
          priority: 'medium'
        }
      ],
      irrigation: [
        {
          title: 'Check Soil Before Watering',
          descriptionEnglish: 'Feel soil 2-3 inches deep. If moist, skip irrigation. Over-watering causes root rot.',
          descriptionTamil: '2-3 அங்குல ஆழத்தில் மண்ணை சரிபார்க்கவும். ஈரமாக இருந்தால் நீர்ப்பாசனம் தேவையில்லை.',
          type: 'technique',
          priority: 'high'
        },
        {
          title: 'Irrigate Morning or Evening',
          descriptionEnglish: 'Water early morning or evening. Midday watering loses 30-40% to evaporation.',
          descriptionTamil: 'காலை அல்லது மாலை நீர்ப்பாசனம் சிறந்தது. ஆவியாதல் குறைவு.',
          type: 'timing',
          priority: 'medium'
        }
      ],
      weeding: [
        {
          title: 'Weed When Small',
          descriptionEnglish: 'Remove weeds when young (2-3 weeks). Mature weeds compete more and spread seeds.',
          descriptionTamil: 'சிறிய களைகளை நீக்குவது எளிது. 2-3 வாரத்தில் அகற்றவும்.',
          type: 'timing',
          priority: 'high'
        },
        {
          title: 'Use Mulch',
          descriptionEnglish: 'Spread crop residue or dry grass as mulch. Reduces weed growth by 60-70% and saves labor.',
          descriptionTamil: 'வைக்கோல் மூடி பயன்படுத்தவும். களை வளர்ச்சியைக் குறைக்கும்.',
          type: 'cost',
          priority: 'medium'
        }
      ],
      pest_control: [
        {
          title: 'Identify Pest First',
          descriptionEnglish: 'Correctly identify pest before spraying. Wrong pesticide wastes money and harms beneficial insects.',
          descriptionTamil: 'பூச்சியை சரியாக அடையாளம் காணவும். தவறான பூச்சிக்கொல்லி பணத்தை வீணாக்கும்.',
          type: 'preparation',
          priority: 'high'
        },
        {
          title: 'Use Neem First',
          descriptionEnglish: 'Try neem oil or neem cake before chemical pesticides. Cheaper and safer for environment.',
          descriptionTamil: 'வேப்ப எண்ணெய் முதலில் முயற்சிக்கவும். பாதுகாப்பானது.',
          type: 'cost',
          priority: 'medium'
        }
      ],
      harvesting: [
        {
          title: 'Harvest at Right Maturity',
          descriptionEnglish: 'Check crop maturity indicators. Early harvest reduces yield, late harvest reduces quality.',
          descriptionTamil: 'சரியான முதிர்ச்சியில் அறுவடை செய்யவும். விளைச்சல் அதிகமாக இருக்கும்.',
          type: 'timing',
          priority: 'high'
        },
        {
          title: 'Clean Equipment',
          descriptionEnglish: 'Clean harvesting tools before use. Dirty equipment spreads disease to stored produce.',
          descriptionTamil: 'அறுவடை கருவிகளை சுத்தமாக வைத்திருக்கவும்.',
          type: 'preparation',
          priority: 'medium'
        }
      ]
    };
    
    return fallbackMap[activityType] || [
      {
        title: 'Plan Ahead',
        descriptionEnglish: 'Check weather forecast and prepare materials needed for this activity.',
        descriptionTamil: 'வானிலை முன்னறிவிப்பை சரிபார்க்கவும்.',
        type: 'general',
        priority: 'medium'
      }
    ];
  }
  
  /**
   * Format activity type
   */
  formatActivityType(activityType) {
    const map = {
      land_preparation: 'Land Preparation',
      ploughing: 'Ploughing',
      seed_sowing: 'Seed Sowing',
      fertilizer_application: 'Fertilizer Application',
      irrigation: 'Irrigation',
      weeding: 'Weeding',
      pest_control: 'Pest Control',
      harvesting: 'Harvesting',
      sale: 'Crop Sale',
      other: 'Other Activity'
    };
    return map[activityType] || activityType;
  }
}

export default new AIRecommendationService();
