# Soil Report OCR Testing Guide

## Setup Requirements

### 1. Install Python Dependencies
```bash
cd services
pip install pytesseract pillow pdf2image
```

### 2. Install Tesseract OCR

**macOS:**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
```

**Windows:**
Download from: https://github.com/UB-Mannheim/tesseract/wiki

### 3. Install Poppler (for PDF support)

**macOS:**
```bash
brew install poppler
```

**Ubuntu/Debian:**
```bash
sudo apt-get install poppler-utils
```

## Testing OCR Directly

### Test with Sample Text File
Create a test image with soil report data:

```bash
# Create a simple text file
cat > test_soil_report.txt << 'EOF'
SOIL ANALYSIS REPORT
Farm: Test Farm
Date: 2026-01-29

pH Level: 6.8
Nitrogen (N): 280 kg/ha
Phosphorus (P): 45 mg/kg
Potassium (K): 195 mg/kg
Organic Carbon: 1.2%
Sulfur (S): 18 mg/kg
Zinc (Zn): 1.5 mg/kg
Iron (Fe): 10.2 mg/kg
Manganese (Mn): 4.1 mg/kg
Copper (Cu): 1.1 mg/kg
EOF
```

### Convert to Image (for testing)
```bash
# On macOS/Linux with ImageMagick
convert -size 800x600 -pointsize 16 -font Courier \
  -gravity center label:@test_soil_report.txt \
  test_soil_report.png
```

### Test OCR Script Directly
```bash
cd services
python ocr_soil.py test_soil_report.png tesseract en
```

Expected output (JSON format):
```json
{
  "pH": "6.8",
  "N": "280",
  "P": "45",
  "K": "195",
  "OC": "1.2",
  "S": "18",
  "Zn": "1.5",
  "Fe": "10.2",
  "Mn": "4.1",
  "Cu": "1.1",
  "_raw_text": "SOIL ANALYSIS REPORT\nFarm: Test Farm..."
}
```

## Testing via Web UI

1. **Start Backend Server:**
```bash
cd backend
npm start
```

2. **Start Frontend:**
```bash
npm run dev
```

3. **Test Upload:**
   - Navigate to Add Land page
   - Fill in required fields (Name, PIN Code)
   - Upload a soil report image (JPG/PNG) or PDF
   - Click "Add Land"
   - Watch for:
     - Loading spinner during OCR processing
     - Extracted text displayed below upload button

## Expected Behavior

### Success Case:
1. File upload shows filename
2. On submit, loading spinner appears: "Extracting soil data from report..."
3. Green box appears with "Extracted Soil Data:"
4. Shows RAW EXTRACTED TEXT (first 500 chars)
5. Shows PARSED VALUES (pH, N, P, K, etc.)

### Failure Case:
1. Alert shows: "Land created but soil report upload failed"
2. Check browser console for errors
3. Check backend logs for OCR errors

## Troubleshooting

### OCR Returns Empty Result
- Verify Tesseract is installed: `tesseract --version`
- Check image quality (clear text, good contrast)
- Try with higher resolution image

### Python Script Not Found
- Check path in `backend/routes/soil.js`:
  - `services/ocr_soil.py` (preferred)
  - `backend/scripts/ocr_soil.py` (fallback)

### Dependencies Not Installed
```bash
# Check if libraries are available
python -c "import pytesseract; print('pytesseract: OK')"
python -c "from PIL import Image; print('PIL: OK')"
python -c "from pdf2image import convert_from_path; print('pdf2image: OK')"
```

## Sample Soil Report Values

For testing, use these realistic ranges:
- **pH**: 5.5-8.5 (6.5-7.5 ideal)
- **Nitrogen (N)**: 200-400 kg/ha
- **Phosphorus (P)**: 20-50 mg/kg
- **Potassium (K)**: 150-300 mg/kg
- **Organic Carbon**: 0.5-2.0%
- **Zinc (Zn)**: 0.5-2.0 mg/kg
- **Iron (Fe)**: 5-15 mg/kg
- **Copper (Cu)**: 0.5-2.0 mg/kg
- **Manganese (Mn)**: 2-10 mg/kg
- **Sulfur (S)**: 10-25 mg/kg

## Next Steps After Testing

Once OCR extraction is working correctly:
1. Verify parsed values are accurate
2. Test with real soil report PDFs/images
3. Implement validation for extracted values
4. Add manual correction UI if values are incorrect
5. Store extracted data in database
6. Use data for crop recommendations
