# Python Service Development Guide

## Overview
This microservice handles crop recommendations using historical yield data, soil analysis, and budget constraints.

## Architecture
- **Framework**: FastAPI
- **Dependencies**: pandas, pydantic, uvicorn
- **Port**: 8000
- **Integration**: Express proxy at `/api/crop-recommendation`

## Setup

### Local Development

1. **Navigate to python-service directory**
   ```bash
   cd python-service
   ```

2. **Create virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the service**
   ```bash
   python app.py
   # OR
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Test the service**
   ```bash
   curl http://localhost:8000/
   ```

### Docker Deployment

```bash
# Build image
docker build -t farmees-crop-service .

# Run container
docker run -p 8000:8000 farmees-crop-service
```

## API Usage

### Endpoint: POST /crop-recommendation

**Request:**
```json
{
  "state": "Tamil Nadu",
  "district": "Coimbatore",
  "land_area_hectare": 5.0,
  "budget_inr": 200000,
  "planning_months": 6,
  "date": "2024-06-15",
  "soil_type": "Loamy",
  "ph": 6.5,
  "temperature": 28.0,
  "soil_report_uploaded": true
}
```

**Response:**
```json
{
  "recommended_crop": "Rice",
  "planned_area_hectare": 5.0,
  "expected_yield_ton_per_hectare": 3.5,
  "total_production_tons": 17.5,
  "budget_summary": {
    "status": "fits",
    "planned_area_hectare": 5.0,
    "cost_per_hectare": 40000,
    "estimated_cost": 200000,
    "budget_remaining": 0
  },
  "confidence": "High",
  "explanation": "Rice is recommended based on 8 years of data...",
  "season": "Kharif",
  "alternative_crops": ["Maize", "Cotton"],
  "disclaimer": "Results depend on weather conditions..."
}
```

## Integration with Express Backend

The Express backend proxies requests to this Python service:

```javascript
// In your frontend
const response = await fetch('/api/crop-recommendation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});
```

## Environment Variables

### Development
- No environment variables needed for local development

### Production
Set in your deployment platform:
- `PYTHON_SERVICE_URL` - URL of the Python service (set in Express backend)

Example for Vercel/Railway/Render:
```
PYTHON_SERVICE_URL=https://your-python-service.railway.app
```

## Data Files (TODO)

The current implementation uses **dummy data**. Replace these functions with real database queries:

1. `load_soil_crop_data()` - Load soil-crop compatibility matrix
2. `load_crop_history_data()` - Load historical yield data
3. `load_cost_data()` - Load cultivation cost data

Recommended approaches:
- Use MongoDB with pymongo
- Load CSV files from data directory
- Use external API for real-time data

## Core Logic Modules

All business logic is in `/recommender/`:

- `season.py` - Determines Kharif/Rabi/Zaid season
- `soil_filter.py` - Filters crops by soil conditions
- `ranking.py` - Ranks crops by historical performance
- `yield_estimation.py` - Estimates expected yield
- `budget.py` - Plans area based on budget constraints

**⚠️ DO NOT MODIFY these modules** - They contain exact formulas provided by the user.

## Testing

```bash
# Install test dependencies
pip install pytest httpx

# Run tests
pytest tests/
```

## Deployment Options

### Option 1: Railway (Recommended)
1. Create new project on Railway
2. Connect GitHub repository
3. Set root directory to `python-service`
4. Railway auto-detects Dockerfile
5. Copy deployment URL
6. Set `PYTHON_SERVICE_URL` in Vercel backend environment variables

### Option 2: Render
1. Create new Web Service
2. Connect repository
3. Set root directory: `python-service`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`

### Option 3: Google Cloud Run
```bash
gcloud run deploy crop-service \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Health Check

```bash
curl http://localhost:8000/
# Returns: {"service": "Crop Recommendation Microservice", "status": "active"}
```

## Common Issues

### Import Errors
- Ensure you're in the virtual environment: `source venv/bin/activate`
- Reinstall dependencies: `pip install -r requirements.txt`

### Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### CORS Errors
- FastAPI CORS is configured to allow all origins
- Check if Python service is running: `curl http://localhost:8000/`

## Next Steps

1. Replace dummy data with real database queries
2. Add authentication/API keys if needed
3. Implement soil report OCR (if not already done)
4. Add logging and monitoring
5. Write unit tests for recommender modules
