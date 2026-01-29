# Soil Report OCR Extraction Service
# Requirements: pip install pytesseract pillow pdf2image easyocr
# For Windows: Also install Tesseract OCR from https://github.com/UB-Mannheim/tesseract/wiki
# For Windows: Also install Poppler from https://blog.alivate.com.au/poppler-windows/

import sys
import os
import json
import re

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
                images = convert_from_path(file_path, dpi=300)
                text = '\n'.join([pytesseract.image_to_string(img) for img in images])
            else:
                text = pytesseract.image_to_string(Image.open(file_path))
        return text
    except ImportError as e:
        # Send error to stderr, not stdout
        print(f"OCR dependencies not installed: {e}", file=sys.stderr)
        raise Exception(f"OCR dependencies not installed: {e}")
    except Exception as e:
        # Send error to stderr, not stdout
        print(f"OCR error: {e}", file=sys.stderr)
        raise

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
        raise Exception(f"EasyOCR dependencies not installed: {e}")
    except Exception as e:
        # Send error to stderr, not stdout
        print(f"EasyOCR error: {e}", file=sys.stderr)
        raise

def parse_soil_report(text):
    # Enhanced extraction with comprehensive pattern matching for various formats
    import re
    result = {}
    
    # Normalize text: fix common OCR errors
    text = text.replace('|', 'I')  # Common OCR error
    text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
    
    # Comprehensive patterns for all soil parameters with multiple format variations
    # Order matches typical soil report: Soil Type, OC, pH, EC, N, Zn, P, Fe, K, S
    # Each pattern handles: full names, abbreviations, with/without parentheses, various separators
    patterns = {
        # Soil Type (appears first in reports)
        'SoilType': [
            r'(?:Soil\s*Type)\s*[:\-=]?\s*([A-Za-z\s\-]+?)(?:\n|$|(?=Nitrogen)|(?=Organic)|(?=pH))',
            r'Texture\s*[:\-=]?\s*([A-Za-z\s\-]+?)(?:\n|$|,|\.|;)',
        ],
        
        # Organic Carbon (usually appears early)
        'OC': [
            r'(?:Organic\s*Carbon|Org[\.\s]*Carbon)\s*[:\-=]?\s*([\d\.]+)\s*(%|percent|ppm|mg[\/\s]*kg)?',
            r'(?:O\.?\s*C\.?|OC)\s*[:\-=]?\s*([\d\.]+)\s*(%|percent|ppm|mg[\/\s]*kg)?',
            r'\bOrganic\b\s+([\d\.]+)\s*(%|ppm)?',  # Handle "Organic 0.72%"
            r'Carbon\s*[:\-=]?\s*([\d\.]+)\s*(%|ppm)?',  # Just "Carbon: 0.72%"
        ],
        
        # pH Level
        'pH': [
            r'\bpH\b\s*[:\-=]?\s*(?:level|value)?\s*[:\-]?\s*([\d\.]+)',
            r'pH\s*[:\-=]?\s*([\d\.]+)',
            r'pH\s+([\d\.]+)',  # Handle "pH 6.5"
        ],
        
        # Electrical Conductivity
        'EC': [
            r'(?:EC|Electrical\s*Conductivity|E\.C\.?)\s*[:\-=]?\s*([\d\.]+)\s*(dS/m|dS\/m|mS/cm|mmhos/cm|dSm-1)?',
            r'Conductivity\s*[:\-=]?\s*([\d\.]+)\s*(dS/m|mS/cm)?',
        ],
        
        # Macronutrients - Nitrogen (appears early in results)
        'N': [
            r'(?:Available\s*)?Nitrogen\s*(?:\([Nn]\))?\s*[:\-=]?\s*([\d\.]+)\s*(kg[\/\s]*ha|ppm|mg[\/\s]*kg|%|percent)?',
            r'\bNitrogen\b\s*[:\-=]?\s*([\d\.]+)\s*(kg[\/\s]*ha|ppm|mg[\/\s]*kg)?',
            r'\bN\s*[:\-=]\s*([\d\.]+)\s*(kg[\/\s]*ha|ppm|mg[\/\s]*kg)?',
        ],
        
        # Micronutrient - Zinc (often listed after N in reports, sometimes combined with OC line)
        'Zn': [
            r'(?:Available\s*)?Zinc\s*(?:\([Zz]n\))?\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
            r'\bZinc\b\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
            r'\bZn\b\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
            r'%\s+([\d\.]+)\s+(ppm)',  # Handle "0.72% 0.9 ppm" format (Zn after OC) with unit
            r'Organic.*?([\d\.]+)\s+(ppm)',  # Zn on same line as Organic Carbon with unit
        ],
        
        # Phosphorus
        'P': [
            r'(?:Available\s*)?Phosphorus\s*(?:\([Pp]\))?\s*[:\-=]?\s*([\d\.]+)\s*(kg[\/\s]*ha|ppm|mg[\/\s]*kg|%)?',
            r'(?:Available\s*)?Phosphorous\s*(?:\([Pp]\))?\s*[:\-=]?\s*([\d\.]+)\s*(kg[\/\s]*ha|ppm|mg[\/\s]*kg|%)?',
            r'\bPhosphorus\b\s*[:\-=]?\s*([\d\.]+)\s*(kg[\/\s]*ha|ppm|mg[\/\s]*kg)?',
            r'\bP\s*[:\-=]\s*([\d\.]+)\s*(kg[\/\s]*ha|ppm|mg[\/\s]*kg)?',
            r'(?:P2O5)\s*[:\-=]?\s*([\d\.]+)\s*(kg[\/\s]*ha|ppm|mg[\/\s]*kg)?',
        ],
        
        # Iron
        'Fe': [
            r'(?:Available\s*)?Iron\s*(?:\([Ff]e\))?\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
            r'\bIron\b\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
            r'\bFe\b\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
            r'lron\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',  # OCR error: l instead of I
        ],
        
        # Potassium
        'K': [
            r'(?:Available\s*)?Potassium\s*(?:\([kK]{1,2}\))?\s*[:\-=]?\s*([\d\.]+)\s*(kg[\/\s]*ha|ppm|mg[\/\s]*kg|%)?',
            r'\bPotassium\b\s*[:\-=]?\s*([\d\.]+)\s*(kg[\/\s]*ha|ppm|mg[\/\s]*kg)?',
            r'\b[kK]\s*[:\-=]\s*([\d\.]+)\s*(kg[\/\s]*ha|ppm|mg[\/\s]*kg)?',
            r'(?:K2O)\s*[:\-=]?\s*([\d\.]+)\s*(kg[\/\s]*ha|ppm|mg[\/\s]*kg)?',
        ],
        
        # Sulphur/Sulfur
        'S': [
            r'(?:Available\s*)?(?:Sulfur|Sulphur)\s*(?:\([Ss]\))?\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg|kg[\/\s]*ha)?',
            r'\b(?:Sulfur|Sulphur)\b\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg|kg[\/\s]*ha)?',
            r'\bS\b\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg|kg[\/\s]*ha)?',
            r'(?:Sulphur|Sulfur).*?([\d\.]+)(?:\s*(?:ppm|mg[\/\s]*kg|kg[\/\s]*ha))?',  # More flexible
        ],
        
        # Other Micronutrients
        'B': [
            r'(?:Available\s*)?Boron\s*(?:\([Bb]\))?\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
            r'\bBoron\b\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
            r'\bB\b\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
        ],
        'Cu': [
            r'(?:Available\s*)?Copper\s*(?:\([Cc]u\))?\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
            r'\bCopper\b\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
            r'\bCu\b\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
        ],
        'Mn': [
            r'(?:Available\s*)?Manganese\s*(?:\([Mm]n\))?\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
            r'\bManganese\b\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
            r'\bMn\b\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
        ],
        'Mo': [
            r'(?:Molybdenum|Mo)\s*(?:\([Mm]o\))?\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
            r'\bMolybdenum\b\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
        ],
        
        # Secondary nutrients
        'Ca': [
            r'(?:Calcium|Ca)\s*(?:\([Cc]a\))?\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg|meq[\/\s]*100g|cmol[\/\s]*kg)?',
            r'\bCalcium\b\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
        ],
        'Mg': [
            r'(?:Magnesium|Mg)\s*(?:\([Mm]g\))?\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg|meq[\/\s]*100g|cmol[\/\s]*kg)?',
            r'\bMagnesium\b\s*[:\-=]?\s*([\d\.]+)\s*(ppm|mg[\/\s]*kg)?',
        ],
        
        # Other parameters
        'Moisture': [
            r'(?:Moisture|Water\s*Content)\s*[:\-=]?\s*([\d\.]+)\s*(%|percent)?',
        ],
    }
    
    # Try all patterns for each parameter
    for key, pattern_list in patterns.items():
        for pattern in pattern_list:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = match.group(1).strip()
                
                # Get unit if available
                if len(match.groups()) > 1 and match.group(2):
                    unit = match.group(2).strip()
                    # Normalize common unit variations
                    unit = re.sub(r'\s+', '', unit)  # Remove spaces in units
                    unit = unit.replace('/', '/')  # Normalize slashes
                    result[key] = f"{value} {unit}".strip()
                else:
                    result[key] = value
                break  # Stop after first successful match
    
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
        
        # Include ALL raw extracted text for debugging/display
        result['_raw_text'] = text.strip()  # Full text, not truncated
        
        # Ensure we always output valid JSON, never mixed with error messages
        if not result or len(result) == 1:  # Only _raw_text
            result['error'] = 'No soil parameters extracted'
        
        print(json.dumps(result))
    except Exception as e:
        # Send exception to stderr, return error JSON to stdout
        print(f"Unexpected error: {str(e)}", file=sys.stderr)
        print(json.dumps({'error': f'Unexpected error: {str(e)}'}))
        sys.exit(1)

if __name__ == '__main__':
    main()
