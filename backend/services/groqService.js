const { getEnvKeys, shouldRotate } = require('../utils/apiKeys');
const { Groq } = require('groq-sdk');

class GroqService {
  constructor() {
    this.currentKeyIndex = 0;
    this.availableKeys = [];
    this.loadKeys();
  }

  loadKeys() {
    this.availableKeys = getEnvKeys('GROQ');
    console.log(`Loaded ${this.availableKeys.length} Groq API keys`);
  }

  getCurrentKey() {
    if (this.availableKeys.length === 0) {
      throw new Error('No Groq API keys available');
    }
    return this.availableKeys[this.currentKeyIndex];
  }

  rotateKey() {
    if (this.availableKeys.length <= 1) {
      console.warn('Cannot rotate: Only one or no Groq API keys available');
      return false;
    }
    
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.availableKeys.length;
    console.log(`Rotated to Groq API key index: ${this.currentKeyIndex + 1}/${this.availableKeys.length}`);
    return true;
  }

  async generateCropRecommendation(landData, soilData, userQuery = '') {
    let attempts = 0;
    const maxAttempts = this.availableKeys.length;

    while (attempts < maxAttempts) {
      try {
        const apiKey = this.getCurrentKey();
        
        const groq = new Groq({ apiKey });

        // Build comprehensive prompt with land and soil data
        const systemPrompt = `You are an expert agricultural advisor specializing in crop recommendations for Indian farming conditions. 
        Provide detailed, practical advice based on soil analysis, land characteristics, and local conditions.
        
        Always structure your response in the following format:
        1. **Recommended Crops** (3-5 suggestions with reasons)
        2. **Soil Preparation** (specific steps)
        3. **Timing & Season** (best planting times)
        4. **Expected Yield** (realistic estimates)
        5. **Market Considerations** (profitability insights)
        6. **Risk Factors** (potential challenges)
        
        Keep responses practical, actionable, and suitable for farmers in Kerala, India.`;

        const userPrompt = this.buildUserPrompt(landData, soilData, userQuery);

        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          model: "llama-3.1-8b-instant", // Using Mixtral for better agricultural knowledge
          temperature: 0.3, // Lower temperature for more consistent advice
          max_tokens: 2048,
        });

        return {
          success: true,
          recommendation: completion.choices[0]?.message?.content || 'No recommendation generated',
          keyUsed: `Key ${this.currentKeyIndex + 1}`,
          model: "llama-3.1-8b-instant"
        };

      } catch (error) {
        console.error(`Groq API error with key ${this.currentKeyIndex + 1}:`, error.message);
        
        // Check if we should rotate the key
        if (shouldRotate(error)) {
          if (this.rotateKey()) {
            attempts++;
            continue;
          } else {
            break; // No more keys to try
          }
        } else {
          // Non-rotatable error, return immediately
          throw error;
        }
      }
    }

    throw new Error(`All Groq API keys exhausted after ${attempts} attempts`);
  }

  buildUserPrompt(landData, soilData, userQuery) {
    let prompt = `Please provide crop recommendations based on the following information:\n\n`;
    
    // Land Information
    if (landData) {
      prompt += `**Land Details:**\n`;
      prompt += `- Location: ${landData.location || 'Not specified'}\n`;
      prompt += `- Size: ${landData.size || 'Not specified'} acres\n`;
      prompt += `- Current Crop: ${landData.currentCrop || 'None'}\n`;
      prompt += `- Soil Type: ${landData.soilType || 'Not specified'}\n`;
      prompt += `- Water Source: ${landData.waterSource || 'Not specified'}\n`;
      prompt += `- Last Crop Season: ${landData.lastCropSeason || 'Not specified'}\n\n`;
    }

    // Soil Analysis
    if (soilData) {
      prompt += `**Soil Analysis:**\n`;
      prompt += `- pH Level: ${soilData.ph || 'Not tested'}\n`;
      prompt += `- Nitrogen (N): ${soilData.nitrogen || 'Not tested'}\n`;
      prompt += `- Phosphorus (P): ${soilData.phosphorus || 'Not tested'}\n`;
      prompt += `- Potassium (K): ${soilData.potassium || 'Not tested'}\n`;
      prompt += `- Organic Matter: ${soilData.organicMatter || 'Not tested'}\n`;
      prompt += `- Moisture Content: ${soilData.moisture || 'Not tested'}\n\n`;
    }

    // User Query
    if (userQuery && userQuery.trim()) {
      prompt += `**Specific Question:**\n${userQuery}\n\n`;
    }

    prompt += `Please provide comprehensive recommendations considering Kerala's climate, monsoon patterns, and local market conditions.`;

    return prompt;
  }

  async chatWithBot(messages, landData = null, soilData = null) {
    let attempts = 0;
    const maxAttempts = this.availableKeys.length;

    while (attempts < maxAttempts) {
      try {
        const apiKey = this.getCurrentKey();
        
        const groq = new Groq({ apiKey });

        // Clean messages: remove timestamp and other unsupported properties
        const cleanMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // Add context to the first user message if land/soil data is available
        const contextualMessages = [...cleanMessages];
        if (contextualMessages.length > 0 && (landData || soilData)) {
          const lastMessage = contextualMessages[contextualMessages.length - 1];
          if (lastMessage.role === 'user') {
            lastMessage.content = this.addContextToMessage(lastMessage.content, landData, soilData);
          }
        }

        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `You are a friendly and professional agricultural assistant for Indian farmers, specifically in Kerala region.

IMPORTANT RESPONSE GUIDELINES:
- For greetings (hi, hello etc.): Give a brief, warm welcome and ask what they need help with. Do NOT provide detailed farming advice unless specifically asked.
- For specific questions: Provide focused, practical answers about crops, soil, pests, weather, or farming techniques.
- Keep responses conversational and helpful, not overwhelming.
- Use simple language that farmers can easily understand.
- If you have land/soil context, mention it briefly but don't repeat all details unless relevant.
- Always be encouraging and supportive in your tone.
- Don't use namaste while greeting.

Your role: Help farmers with practical farming advice, crop recommendations, pest management, soil health, and agricultural best practices.`
            },
            ...contextualMessages
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.4,
          max_tokens: 1024,
        });

        return {
          success: true,
          response: completion.choices[0]?.message?.content || 'No response generated',
          keyUsed: `Key ${this.currentKeyIndex + 1}`
        };

      } catch (error) {
        console.error(`Groq chat error with key ${this.currentKeyIndex + 1}:`, error.message);
        
        if (shouldRotate(error)) {
          if (this.rotateKey()) {
            attempts++;
            continue;
          } else {
            break;
          }
        } else {
          throw error;
        }
      }
    }

    throw new Error(`All Groq API keys exhausted after ${attempts} attempts`);
  }

  addContextToMessage(message, landData, soilData) {
    // Only add context if the message is asking for specific farming advice
    const farmingKeywords = ['crop', 'fertilizer', 'soil', 'pest', 'disease', 'water', 'irrigation', 'harvest', 'plant', 'grow', 'farming', 'agriculture'];
    const isFarmingQuestion = farmingKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    if (!isFarmingQuestion) {
      return message; // Don't add context for greetings or non-farming questions
    }
    
    let context = '';
    
    if (landData) {
      context += `[Context: ${landData.location}, ${landData.soilType} soil, Current crop: ${landData.currentCrop || 'None'}] `;
    }
    
    if (soilData) {
      context += `[Soil pH: ${soilData.ph}] `;
    }
    
    return context + message;
  }

  async transcribeAudio(audioFile, language = "en") {
    let attempts = 0;
    const maxAttempts = this.availableKeys.length;

    while (attempts < maxAttempts) {
      try {
        const apiKey = this.getCurrentKey();
        
        const groq = new Groq({ apiKey });

        // Create transcription using Groq's Whisper API
        const transcription = await groq.audio.transcriptions.create({
          file: audioFile, // File object or Buffer
          model: "whisper-large-v3-turbo", // Using the faster turbo model
          language: language, // Dynamic language setting (en, ml, etc.)
          response_format: "json",
          temperature: 0.2 // Lower temperature for more accurate transcription
        });

        return {
          success: true,
          text: transcription.text,
          keyUsed: `Key ${this.currentKeyIndex + 1}`,
          model: "whisper-large-v3-turbo",
          language: language
        };

      } catch (error) {
        console.error(`Groq transcription error with key ${this.currentKeyIndex + 1}:`, error.message);
        
        if (shouldRotate(error)) {
          if (this.rotateKey()) {
            attempts++;
            continue;
          } else {
            break;
          }
        } else {
          throw error;
        }
      }
    }

    throw new Error(`All Groq API keys exhausted for transcription after ${attempts} attempts`);
  }
}

module.exports = new GroqService();