# Soil Report Flow Implementation

## Overview
Complete implementation of the soil report → land → crop recommendation flow with **simulated OCR** for demo purposes. The architecture is production-ready and future-proof for real OCR integration.

## Architecture

### Core Concept
1. **OCR Text** - Only for display/debugging at `/api/soil/dummy`
2. **Structured Data** - Stored in Land model, used for crop recommendations
3. **Separation** - OCR output never used for recommendations

### Files Created/Modified

#### New Files
1. `/backend/services/soilDataService.js` (240 lines)
   - Simulates OCR parsing based on filename
   - 3 hardcoded soil profiles (Tamil Nadu, Karnataka, Maharashtra)
   - In-memory session management
   - Conversion utilities for Land schema

2. `/backend/routes/soilNew.js` (414 lines)
   - 5 API endpoints for complete soil flow
   - Multer file upload handling (10MB, JPEG/PNG/PDF)
   - Comprehensive error handling and validation

#### Modified Files
1. `/backend/models/Land.js`
   - Added `soilData` field (structured soil information)
   - Added `lastSoilUpdate` timestamp
   - Compatible with convertToLandSoilData output

2. `/backend/server.js`
   - Imported soilNew routes
   - Mounted at `/api/soil` (replaces old soil router)

## API Endpoints

### 1. Upload Soil Report
```bash
POST /api/soil/upload
Content-Type: multipart/form-data

# Upload file with specific filename to trigger soil profile:
# - soil_report1.* → Tamil Nadu (pH 6.8, Loamy, Good health)
# - soil_report2.* → Karnataka (pH 5.4, Red Soil, Medium health, deficiencies)
# - soil_report3.* → Maharashtra (pH 8.3, Black Cotton Soil, Salinity affected)

Response:
{
  "parsed": true,
  "message": "Soil report parsed successfully",
  "filename": "soil_report1.png",
  "uploadDate": "2026-01-29T13:35:36.812Z",
  "preview": {
    "soilType": "Loamy",
    "pH": 6.8,
    "soilHealth": "Good",
    "state": "Tamil Nadu",
    "district": "Coimbatore",
    "village": "Perur"
  }
}
```

### 2. View OCR Text (Debug Only)
```bash
GET /api/soil/dummy

Response:
{
  "hasData": true,
  "filename": "soil_report1.png",
  "uploadDate": "2026-01-29T13:35:36.801Z",
  "ocrText": "═══════════════════════════\n SOIL ANALYSIS REPORT\n..."
}
```

### 3. Attach Soil Data to Land
```bash
POST /api/soil/land/attach-soil
Content-Type: application/json

{
  "land_id": "test_land_001"
}

Response:
{
  "success": true,
  "message": "Soil data attached to land successfully",
  "landId": "697b62dcbc9e390a72a3d60d",
  "landName": "Test Farm",
  "soilData": {
    "soilType": "Loamy",
    "pH": 6.8,
    "soilHealth": "Good",
    "analysisDate": "2026-01-29T13:40:03.600Z"
  }
}
```

### 4. Get Soil Data from Land
```bash
GET /api/land/:landId/soil

Response:
{
  "landId": "test_land_001",
  "landName": "Test Farm",
  "soilData": {
    "state": "Tamil Nadu",
    "district": "Coimbatore",
    "village": "Perur",
    "soilType": "Loamy",
    "pH": 6.8,
    "ec": 1.2,
    "nutrients": {
      "nitrogen": 310,
      "phosphorus": 24,
      "potassium": 290,
      "zinc": 0.9,
      "iron": 4.8,
      "boron": 0.55
    },
    "recommendations": [
      "Maintain current NPK balance",
      "Continue organic matter application",
      "Monitor zinc levels during monsoon"
    ]
  }
}
```

### 5. Clear Session
```bash
POST /api/soil/clear

Response:
{
  "success": true,
  "message": "Soil session cleared"
}
```

### 6. Health Check
```bash
GET /api/soil/health

Response:
{
  "status": "ok",
  "service": "soil-data-service",
  "sessionActive": true,
  "timestamp": "2026-01-29T13:45:00.000Z"
}
```

## Soil Profiles

### Profile 1: Tamil Nadu (Healthy)
- **Trigger**: filename contains "soil_report1"
- **Location**: Tamil Nadu, Coimbatore, Perur
- **Soil Type**: Loamy
- **pH**: 6.8 (Neutral)
- **EC**: 1.2 dS/m (Normal)
- **NPK**: Medium-High (310-24-290 kg/ha)
- **Micronutrients**: All sufficient (Zn, Fe, B)
- **Health**: Good
- **Recommendations**: Maintain balance, continue organic matter

### Profile 2: Karnataka (Deficiencies)
- **Trigger**: filename contains "soil_report2"
- **Location**: Karnataka, Chikkamagaluru, Aldur
- **Soil Type**: Red Soil
- **pH**: 5.4 (Acidic)
- **EC**: 0.8 dS/m (Low)
- **NPK**: Low-Medium (190-11-180 kg/ha)
- **Micronutrients**: Zn and B deficient
- **Health**: Medium
- **Recommendations**: Apply lime, increase N, apply ZnSO4 and Borax

### Profile 3: Maharashtra (Salinity)
- **Trigger**: filename contains "soil_report3"
- **Location**: Maharashtra, Solapur, Barshi
- **Soil Type**: Black Cotton Soil
- **pH**: 8.3 (Alkaline)
- **EC**: 4.6 dS/m (High salinity)
- **NPK**: Medium-Low-High (260-14-410 kg/ha)
- **Micronutrients**: Fe deficient, S deficient
- **Health**: Salinity Affected
- **Recommendations**: Apply gypsum, improve drainage, add P and Fe

## Testing

### Complete Flow Test
```bash
# 1. Upload soil report
curl -X POST http://localhost:3001/api/soil/upload \
  -F "file=@soil_report1.png"

# 2. View OCR text (optional debug)
curl -X GET http://localhost:3001/api/soil/dummy

# 3. Create a land (if needed)
curl -X POST http://localhost:3001/api/lands \
  -H "Content-Type: application/json" \
  -d '{
    "landId": "test_land_001",
    "userId": "demo_farmer",
    "name": "Test Farm",
    "location": "Coimbatore, Tamil Nadu",
    "waterAvailability": "high",
    "landSize": {"value": 5, "unit": "acres"}
  }'

# 4. Attach soil data to land
curl -X POST http://localhost:3001/api/soil/land/attach-soil \
  -H "Content-Type: application/json" \
  -d '{"land_id": "test_land_001"}'

# 5. Verify land has soil data
curl -X GET http://localhost:3001/api/lands/test_land_001
```

### Testing All Profiles
```bash
# Tamil Nadu (Good)
curl -X POST http://localhost:3001/api/soil/upload -F "file=@soil_report1.png"

# Karnataka (Deficiencies)
curl -X POST http://localhost:3001/api/soil/upload -F "file=@soil_report2.jpg"

# Maharashtra (Salinity)
curl -X POST http://localhost:3001/api/soil/upload -F "file=@soil_report3.pdf"
```

## Land Model Schema

```javascript
soilData: {
  state: String,
  district: String,
  village: String,
  soilType: String,
  pH: Number,
  ec: Number,              // Electrical Conductivity
  nutrients: {
    nitrogen: Number,       // kg/ha
    phosphorus: Number,     // kg/ha
    potassium: Number,      // kg/ha
    zinc: Number,          // ppm
    iron: Number,          // ppm
    boron: Number          // ppm (optional)
  },
  healthStatus: String,
  recommendations: [String]
}
lastSoilUpdate: Date
```

## Future OCR Integration

To replace simulated OCR with real OCR:

1. **Update `soilDataService.js`**:
   ```javascript
   // Replace this function:
   parsesoilReport(filename) {
     // Currently: return hardcoded profile based on filename
     // Future: Call actual OCR service/Python script
     const ocrText = await callOCRService(filePath);
     const structuredData = parseOCRText(ocrText);
     return { ocrText, structuredData };
   }
   ```

2. **Keep the rest unchanged**:
   - Session management
   - Land attachment logic
   - API routes
   - Land model structure

3. **OCR Options**:
   - **Tesseract.js**: In-process OCR (Node.js)
   - **Python script**: Call existing `ocr_soil.py`
   - **Google Vision API**: Cloud-based OCR
   - **Azure Form Recognizer**: Structured document parsing

## Demo Safety

✅ **Judge-safe features**:
- Works without external dependencies (no API keys needed)
- Consistent, reproducible results
- No rate limits or failures
- Fast response times
- Professional error handling

✅ **Production-ready architecture**:
- Clean separation of concerns
- Comprehensive error handling
- File cleanup on errors
- Database persistence (optional)
- Extensible design

## Next Steps

1. **Frontend Integration**:
   - Create soil upload UI component
   - Display OCR text for verification
   - Show soil data in land details
   - Add soil health indicators

2. **Crop Recommendation Integration**:
   - Update recommendation logic to read `land.soilData`
   - Use pH, soilType, nutrients for crop matching
   - Display soil-specific recommendations

3. **Enhanced Features**:
   - Soil data history (track changes over time)
   - Comparison tool (compare multiple reports)
   - Soil health score visualization
   - Export soil data as PDF report

## Status

✅ Backend implementation complete
✅ All 3 soil profiles tested
✅ End-to-end flow verified
⚠️ Frontend UI pending
⚠️ Crop recommendation integration pending

## Testing Log

```
✅ Upload soil_report1.png → Tamil Nadu profile
✅ View OCR text at /api/soil/dummy
✅ Create land test_land_001
✅ Attach soil data to land
✅ Verify land.soilData contains structured data
✅ Upload soil_report2.png → Karnataka profile
✅ Upload soil_report3.pdf → Maharashtra profile
```

All tests passed successfully! 🎉
