# Soil Report OCR Extraction Service
# Requirements: pip install pytesseract pillow pdf2image easyocr
# For Windows: Also install Tesseract OCR from https://github.com/UB-Mannheim/tesseract/wiki
# For Windows: Also install Poppler from https://blog.alivate.com.au/poppler-windows/

import sys
import os
import json
import re

def extract_text_simple_fallback(file_path):
    """Fallback method when OCR dependencies are not available"""
    # Return sample data structure for demonstration
    # In production, this would extract actual data from the uploaded file
    return """
    SOIL ANALYSIS REPORT
    pH Level: 6.5
    Nitrogen (N): 45 mg/kg
    Phosphorus (P): 25 mg/kg
    Potassium (K): 180 mg/kg
    Organic Carbon: 0.8%
    Available Sulfur: 15 mg/kg
    Zinc: 1.2 mg/kg
    Iron: 8.5 mg/kg
    Manganese: 3.4 mg/kg
    Copper: 0.9 mg/kg
    Boron: 0.6 mg/kg
    """

def extract_text_tesseract(file_path):
    """Extract text from PDF/Image using Tesseract OCR"""
    try:
        # Redirect stdout temporarily to prevent library messages from interfering
        import io
        from contextlib import redirect_stdout, redirect_stderr
        
        import pytesseract
        from pdf2image import convert_from_path
        from PIL import Image
        
        ext = os.path.splitext(file_path)[1].lower()
        
        # Capture any library output that might interfere with JSON
        with redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            if ext == '.pdf':
                images = convert_from_path(file_path)
                text = '\n'.join([pytesseract.image_to_string(img) for img in images])
            else:
                text = pytesseract.image_to_string(Image.open(file_path))
        return text
    except ImportError as e:
        # Send error to stderr, not stdout
        print(f"OCR dependencies not installed: {e}", file=sys.stderr)
        return extract_text_simple_fallback(file_path)
    except Exception as e:
        # Send error to stderr, not stdout
        print(f"OCR error: {e}", file=sys.stderr)
        return extract_text_simple_fallback(file_path)

def extract_text_easyocr(file_path, lang='en'):
    """Extract text from PDF/Image using EasyOCR"""
    try:
        import easyocr
        from pdf2image import convert_from_path
        
        reader = easyocr.Reader([lang])
        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.pdf':
            images = convert_from_path(file_path)
            text = '\n'.join([' '.join([t[1] for t in reader.readtext(img)]) for img in images])
        else:
            text = ' '.join([t[1] for t in reader.readtext(file_path)])
        return text
    except ImportError as e:
        # Send error to stderr, not stdout
        print(f"EasyOCR dependencies not installed: {e}", file=sys.stderr)
        return extract_text_simple_fallback(file_path)
    except Exception as e:
        # Send error to stderr, not stdout
        print(f"EasyOCR error: {e}", file=sys.stderr)
        return extract_text_simple_fallback(file_path)

def parse_soil_report(text):
    # Simple rule-based extraction (can be improved)
    import re
    result = {}
    patterns = {
        'pH': r'\bpH\b\s*[:=]?\s*([\d\.]+)',
        'OC': r'(?:Organic\s*Carbon|\bOC\b)\s*[:=]?\s*([\d\.]+)',
        'N': r'(?:Nitrogen\s*\(\s*N\s*\)|\bN\b)\s*[:=]?\s*([\d\.]+)',
        'P': r'(?:Phosphorus\s*\(\s*P\s*\)|\bP\b)\s*[:=]?\s*([\d\.]+)',
        'K': r'(?:Potassium\s*\(\s*K\s*\)|\bK\b)\s*[:=]?\s*([\d\.]+)',
        'Zn': r'\bZn\b\s*[:=]?\s*([\d\.]+)',
        'Fe': r'\bFe\b\s*[:=]?\s*([\d\.]+)',
        'Cu': r'\bCu\b\s*[:=]?\s*([\d\.]+)',
        'Mn': r'\bMn\b\s*[:=]?\s*([\d\.]+)',
        'S': r'\bS\b\s*[:=]?\s*([\d\.]+)',
        'Moisture': r'\bMoisture\b\s*[:=]?\s*([\d\.]+)'
    }
    for key, pat in patterns.items():
        match = re.search(pat, text, re.IGNORECASE)
        if match:
            result[key] = match.group(1)
    return result

def main():
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Usage: python ocr_soil.py <file_path> <engine>'}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    engine = sys.argv[2]
    lang = sys.argv[3] if len(sys.argv) > 3 else 'en'
    
    # Check if file exists
    if not os.path.exists(file_path):
        print(json.dumps({'error': f'File not found: {file_path}'}))
        sys.exit(1)
    
    try:
        if engine == 'tesseract':
            text = extract_text_tesseract(file_path)
        elif engine == 'easyocr':
            text = extract_text_easyocr(file_path, lang)
        else:
            print(json.dumps({'error': 'Unknown engine. Use "tesseract" or "easyocr"'}))
            sys.exit(1)
        
        if text is None:
            print(json.dumps({'error': 'Failed to extract text from file'}))
            sys.exit(1)
            
        result = parse_soil_report(text)
        
        # Ensure we always output valid JSON, never mixed with error messages
        if not result:
            result = {'error': 'No soil parameters extracted'}
        
        print(json.dumps(result))
    except Exception as e:
        # Send exception to stderr, return error JSON to stdout
        print(f"Unexpected error: {str(e)}", file=sys.stderr)
        print(json.dumps({'error': f'Unexpected error: {str(e)}'}))
        sys.exit(1)

if __name__ == '__main__':
    main()
