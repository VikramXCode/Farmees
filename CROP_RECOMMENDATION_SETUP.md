# 🤖 Crop Recommendation System with AI Chatbot - Setup Guide

## 🎉 Implementation Complete!

Your comprehensive crop recommendation system with AI chatbot has been successfully implemented! Here's what has been added:

### ✅ What's Been Implemented

1. **🔑 API Key Rotation System**
   - Enhanced existing `apiKeys.js` utility to support Groq API keys
   - Automatic rotation when API limits are reached
   - Support for multiple key formats (CSV, indexed, single)

2. **🤖 Groq AI Service**
   - Backend service (`backend/services/groqService.js`) with Mixtral-8x7b model
   - Comprehensive crop recommendations based on land and soil data
   - Interactive chat capabilities with farming context
   - Automatic API key rotation on errors

3. **🛠️ Enhanced Backend Routes**
   - `/api/crop-recommendations/ai-generate` - Generate AI recommendations
   - `/api/crop-recommendations/chat` - Chat with AI assistant
   - Integration with existing land and soil data

4. **🎨 Redesigned Frontend Component**
   - Tabbed interface with 3 sections:
     - **AI Assistant**: Groq-powered recommendations
     - **Analysis**: Traditional rule-based recommendations
     - **Chat**: Interactive AI farming assistant
   - Real-time chat interface with typing indicators
   - Structured response parsing and formatting

5. **📦 Dependencies Installed**
   - Frontend: `@langchain/groq`, `langchain`
   - Backend: `groq-sdk`

## 🚀 Getting Started

### Step 1: Get Groq API Keys

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up for a free account
3. Generate 2-3 API keys for rotation
4. Each key provides generous free tier limits

### Step 2: Configure Environment

1. Navigate to `backend/.env.example`
2. Copy it to `backend/.env`
3. Add your Groq API keys in any of these formats:

```bash
# Option 1: Comma-separated (Recommended)
GROQ_API_KEYS=gsk_your_key_1,gsk_your_key_2,gsk_your_key_3

# Option 2: Indexed
GROQ_API_KEY_1=gsk_your_key_1
GROQ_API_KEY_2=gsk_your_key_2
GROQ_API_KEY_3=gsk_your_key_3

# Option 3: Single key (fallback)
GROQ_API_KEY=gsk_your_single_key
```

### Step 3: Start the Application

1. **Backend** (from `backend/` directory):
   ```bash
   npm run dev
   # or
   node server.js
   ```

2. **Frontend** (from root directory):
   ```bash
   npm run dev
   ```

3. Visit `http://localhost:5174` (or shown port)

## 🎯 How to Use

### 1. **AI Assistant Tab**
- Select a land from "My Lands"
- Click "Generate AI Plan" for comprehensive recommendations
- Get detailed advice considering:
  - Soil type and pH levels
  - Nutrient analysis (N-P-K)
  - Current crop rotation
  - Local climate (Kerala conditions)
  - Market considerations

### 2. **Analysis Tab**
- View traditional rule-based recommendations
- See soil health indicators
- Suitability scores for different crops
- Detailed requirements for each recommendation

### 3. **Chat Tab**
- Ask specific questions about farming
- Get real-time advice from AI assistant
- Context-aware responses based on selected land
- Topics include:
  - Crop selection and timing
  - Soil preparation techniques
  - Pest and disease management
  - Market strategies
  - Weather considerations

## 🔧 Key Features

### **Intelligent Context Awareness**
- AI considers your specific land characteristics
- Soil analysis data integration
- Location-based recommendations (Kerala focus)
- Historical crop performance analysis

### **Advanced API Management**
- Automatic key rotation on quota exhaustion
- Error handling and fallback mechanisms
- Rate limiting protection
- Detailed logging for debugging

### **User-Friendly Interface**
- Clean tabbed design
- Real-time chat with typing indicators
- Structured response formatting
- Mobile-responsive layout

### **Comprehensive Recommendations**
The AI provides structured advice covering:
1. **Recommended Crops** (3-5 suggestions with reasons)
2. **Soil Preparation** (specific steps)
3. **Timing & Season** (best planting times)
4. **Expected Yield** (realistic estimates)
5. **Market Considerations** (profitability insights)
6. **Risk Factors** (potential challenges)

## 💡 Sample Questions for Chat

Try asking the AI assistant:

- "What crops should I plant for the upcoming monsoon season?"
- "How can I improve my soil pH naturally?"
- "What's the best irrigation schedule for rice in Kerala?"
- "How do I prepare my land after harvesting coconut?"
- "What are the signs of nutrient deficiency in vegetables?"
- "When is the best time to plant pepper in my region?"

## 🔍 Troubleshooting

### Common Issues:

1. **"0 Groq API keys loaded"**
   - Check your `.env` file in the backend directory
   - Ensure API keys are properly formatted
   - Restart the backend server after adding keys

2. **"Failed to generate AI recommendation"**
   - Verify internet connection
   - Check if Groq API keys are valid
   - Look at backend console for detailed error messages

3. **Chat not responding**
   - Ensure you're authenticated (logged in)
   - Check backend server is running
   - Verify API key quota hasn't been exceeded

## 🎯 Next Steps

Your crop recommendation system is now ready for production use! The AI will provide increasingly better recommendations as you:

1. Upload more soil reports
2. Add detailed land information
3. Record crop history and yields
4. Use the chat feature for specific guidance

## 🤖 Technical Details

- **AI Model**: Mixtral-8x7b-32768 (via Groq)
- **Context Window**: 32,768 tokens
- **Response Limit**: 2,048 tokens for recommendations, 1,024 for chat
- **Temperature**: 0.3 for recommendations (consistent), 0.4 for chat (slightly creative)
- **API Key Rotation**: Automatic on 429, quota, or auth errors

Enjoy your new AI-powered farming assistant! 🌱🚀