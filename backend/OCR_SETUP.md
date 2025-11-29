# OCR Setup Instructions for Windows

The soil report upload feature uses OCR (Optical Character Recognition) to extract text from PDF and image files. For full functionality, you need to install system dependencies.

## Current Status
✅ **Working**: The OCR script now has fallback functionality and won't crash
✅ **Demo Data**: Returns sample soil data when dependencies aren't available
⚠️ **Missing**: Full OCR capabilities need system installations

## Required System Dependencies

### 1. Tesseract OCR
- **Download**: https://github.com/UB-Mannheim/tesseract/wiki
- **Windows Installer**: Download the latest .exe installer
- **Installation**: Install to default location (usually `C:\Program Files\Tesseract-OCR`)
- **PATH**: Add `C:\Program Files\Tesseract-OCR` to your system PATH

### 2. Poppler (for PDF processing)
- **Download**: https://blog.alivate.com.au/poppler-windows/
- **Extract**: Unzip to a folder like `C:\poppler`
- **PATH**: Add `C:\poppler\bin` to your system PATH

### 3. Python Packages (Already Installed)
```bash
pip install pytesseract pillow pdf2image easyocr
```

## Verification
After installing dependencies, test with:
```bash
cd backend
python scripts/ocr_soil.py "path/to/test/file.pdf" "tesseract"
```

## Fallback Mode
If dependencies aren't installed, the script will:
- Print a warning message
- Return sample soil data structure
- Allow the application to continue working
- Prevent crashes and "Failed to parse OCR result" errors

## Production Deployment
For production servers, ensure all dependencies are installed for full OCR functionality.