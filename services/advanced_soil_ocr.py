#!/usr/bin/env python3
"""
Advanced Soil Report OCR Parser
================================
Production-ready parser for ANY soil report format (government/private labs)
Handles low-quality images, varied layouts, OCR errors

Author: Farmees Team
Date: 2026-01-29
"""

import sys
import os
import json
import re
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime

# Image processing
import cv2
import numpy as np
from PIL import Image

# OCR
import pytesseract

# Text processing
from collections import defaultdict


class ImagePreprocessor:
    """Handles image preprocessing for optimal OCR results"""
    
    @staticmethod
    def preprocess(image_path: str) -> Tuple[np.ndarray, str]:
        """
        Preprocess image for OCR
        Returns: (processed_image, error_message)
        """
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                return None, "Failed to read image"
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Deskew
            gray = ImagePreprocessor._deskew(gray)
            
            # Denoise
            denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
            
            # Adaptive thresholding
            binary = cv2.adaptiveThreshold(
                denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY, 11, 2
            )
            
            # Morphological operations to remove noise
            kernel = np.ones((1, 1), np.uint8)
            processed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
            
            # Enhance contrast
            processed = cv2.equalizeHist(processed)
            
            return processed, None
            
        except Exception as e:
            return None, f"Preprocessing error: {str(e)}"
    
    @staticmethod
    def _deskew(image: np.ndarray) -> np.ndarray:
        """Automatically deskew image"""
        try:
            coords = np.column_stack(np.where(image > 0))
            angle = cv2.minAreaRect(coords)[-1]
            
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            
            # Only deskew if angle is significant
            if abs(angle) > 0.5:
                (h, w) = image.shape[:2]
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                rotated = cv2.warpAffine(
                    image, M, (w, h),
                    flags=cv2.INTER_CUBIC,
                    borderMode=cv2.BORDER_REPLICATE
                )
                return rotated
            
            return image
        except:
            return image


class OCREngine:
    """Handles OCR extraction with optimal configurations"""
    
    @staticmethod
    def extract_text(image: np.ndarray) -> str:
        """Extract text from preprocessed image"""
        try:
            # Convert numpy array to PIL Image
            pil_image = Image.fromarray(image)
            
            # OCR configuration for best accuracy
            custom_config = r'--oem 3 --psm 6 -l eng'
            
            # Extract text
            text = pytesseract.image_to_string(pil_image, config=custom_config)
            
            return text.strip()
            
        except Exception as e:
            print(f"OCR error: {e}", file=sys.stderr)
            return ""


class TextNormalizer:
    """Normalizes OCR text and fixes common errors"""
    
    # Common OCR error mappings
    OCR_CORRECTIONS = {
        'kq/ha': 'kg/ha',
        'kglha': 'kg/ha',
        'kg /ha': 'kg/ha',
        'kg/ ha': 'kg/ha',
        'pprn': 'ppm',
        'ppnn': 'ppm',
        'dS/rn': 'dS/m',
        'dSlm': 'dS/m',
        'meq/l00g': 'meq/100g',
        'rneq/100g': 'meq/100g',
    }
    
    @staticmethod
    def normalize(text: str) -> str:
        """Normalize OCR text"""
        if not text:
            return ""
        
        # Fix common OCR errors
        for error, correction in TextNormalizer.OCR_CORRECTIONS.items():
            text = text.replace(error, correction)
        
        # Fix common character substitutions
        # O (letter) vs 0 (zero) - context dependent
        # l (letter) vs 1 (number) - context dependent
        text = re.sub(r'(\d+)O(\d+)', r'\g<1>0\g<2>', text)  # 2O4 -> 204
        text = re.sub(r'l(\d)', r'1\g<1>', text)  # l2 -> 12
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n\s*\n', '\n', text)
        
        return text.strip()


class FieldExtractor:
    """Extracts structured data from normalized text"""
    
    @staticmethod
    def extract_farmer_details(text: str) -> Dict[str, Optional[str]]:
        """Extract farmer information"""
        details = {
            "name": None,
            "state": None,
            "district": None,
            "village": None
        }
        
        # Name patterns
        name_patterns = [
            r'(?:Farmer\s*Name|Name\s*of\s*Farmer|Name)[:\-\s]+([A-Z][a-zA-Z\s\.]{2,30})',
            r'Name[:\-\s]+([A-Z][a-zA-Z\s\.]{2,30})',
        ]
        
        for pattern in name_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                details["name"] = match.group(1).strip()
                break
        
        # State patterns
        state_patterns = [
            r'State[:\-\s]+([A-Za-z\s]{4,30})',
            r'\b(Karnataka|Tamil Nadu|Telangana|Maharashtra|Kerala|Andhra Pradesh|Punjab|Haryana)\b',
        ]
        
        for pattern in state_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                details["state"] = match.group(1).strip()
                break
        
        # District patterns
        district_patterns = [
            r'District[:\-\s]+([A-Za-z\s]{3,30})',
            r'Dist[:\-\s]+([A-Za-z\s]{3,30})',
        ]
        
        for pattern in district_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                details["district"] = match.group(1).strip()
                break
        
        # Village patterns
        village_patterns = [
            r'Village[:\-\s]+([A-Za-z\s]{2,30})',
            r'Taluk[:\-\s]+([A-Za-z\s]{2,30})',
        ]
        
        for pattern in village_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                details["village"] = match.group(1).strip()
                break
        
        return details
    
    @staticmethod
    def extract_soil_metrics(text: str) -> Dict[str, Optional[float]]:
        """Extract soil nutrient metrics"""
        metrics = {
            "nitrogen_kg_ha": None,
            "phosphorus_kg_ha": None,
            "potassium_kg_ha": None,
            "ph": None,
            "organic_carbon_percent": None,
            "ec_ds_m": None
        }
        
        # Nitrogen patterns
        n_patterns = [
            r'(?:Available\s*)?(?:Nitrogen|N)\s*(?:\([Nn]\))?\s*[:\-=]?\s*([\d\.]+)\s*(?:kg[\/\s]*ha)?',
            r'\bN\b\s*[:\-=]\s*([\d\.]+)\s*(?:kg[\/\s]*ha)?',
        ]
        metrics["nitrogen_kg_ha"] = FieldExtractor._extract_numeric(text, n_patterns)
        
        # Phosphorus patterns
        p_patterns = [
            r'(?:Available\s*)?(?:Phosphorus|Phosphorous|P|P2O5)\s*(?:\([Pp]\))?\s*[:\-=]?\s*([\d\.]+)\s*(?:kg[\/\s]*ha)?',
            r'\bP\b\s*[:\-=]\s*([\d\.]+)\s*(?:kg[\/\s]*ha)?',
        ]
        metrics["phosphorus_kg_ha"] = FieldExtractor._extract_numeric(text, p_patterns)
        
        # Potassium patterns
        k_patterns = [
            r'(?:Available\s*)?(?:Potassium|K|K2O)\s*(?:\([kK]{1,2}\))?\s*[:\-=]?\s*([\d\.]+)\s*(?:kg[\/\s]*ha)?',
            r'\b[kK]\b\s*[:\-=]\s*([\d\.]+)\s*(?:kg[\/\s]*ha)?',
        ]
        metrics["potassium_kg_ha"] = FieldExtractor._extract_numeric(text, k_patterns)
        
        # pH patterns
        ph_patterns = [
            r'\bpH\b\s*[:\-=]?\s*(?:level|value)?\s*[:\-]?\s*([\d\.]+)',
        ]
        metrics["ph"] = FieldExtractor._extract_numeric(text, ph_patterns)
        
        # Organic Carbon patterns
        oc_patterns = [
            r'(?:Organic\s*Carbon|Org[\.\s]*Carbon)\s*[:\-=]?\s*([\d\.]+)\s*(?:%|percent)?',
            r'(?:O\.?\s*C\.?|OC)\s*[:\-=]?\s*([\d\.]+)\s*(?:%|percent)?',
            r'\bOrganic\b\s+([\d\.]+)\s*(?:%|percent)?',
        ]
        metrics["organic_carbon_percent"] = FieldExtractor._extract_numeric(text, oc_patterns)
        
        # EC patterns
        ec_patterns = [
            r'(?:EC|Electrical\s*Conductivity|E\.C\.?)\s*[:\-=]?\s*([\d\.]+)\s*(?:dS[\/\s]*m)?',
        ]
        metrics["ec_ds_m"] = FieldExtractor._extract_numeric(text, ec_patterns)
        
        return metrics
    
    @staticmethod
    def extract_micronutrients(text: str) -> Dict[str, Optional[float]]:
        """Extract micronutrient data"""
        micronutrients = {
            "zinc": None,
            "iron": None,
            "boron": None,
            "copper": None,
            "manganese": None,
            "sulfur": None
        }
        
        # Zinc
        zn_patterns = [
            r'(?:Available\s*)?(?:Zinc|Zn)\s*(?:\([Zz]n\))?\s*[:\-=]?\s*([\d\.]+)',
        ]
        micronutrients["zinc"] = FieldExtractor._extract_numeric(text, zn_patterns)
        
        # Iron
        fe_patterns = [
            r'(?:Available\s*)?(?:Iron|Fe)\s*(?:\([Ff]e\))?\s*[:\-=]?\s*([\d\.]+)',
        ]
        micronutrients["iron"] = FieldExtractor._extract_numeric(text, fe_patterns)
        
        # Boron
        b_patterns = [
            r'(?:Available\s*)?(?:Boron|B)\s*(?:\([Bb]\))?\s*[:\-=]?\s*([\d\.]+)',
        ]
        micronutrients["boron"] = FieldExtractor._extract_numeric(text, b_patterns)
        
        # Copper
        cu_patterns = [
            r'(?:Available\s*)?(?:Copper|Cu)\s*(?:\([Cc]u\))?\s*[:\-=]?\s*([\d\.]+)',
        ]
        micronutrients["copper"] = FieldExtractor._extract_numeric(text, cu_patterns)
        
        # Manganese
        mn_patterns = [
            r'(?:Available\s*)?(?:Manganese|Mn)\s*(?:\([Mm]n\))?\s*[:\-=]?\s*([\d\.]+)',
        ]
        micronutrients["manganese"] = FieldExtractor._extract_numeric(text, mn_patterns)
        
        # Sulfur
        s_patterns = [
            r'(?:Available\s*)?(?:Sulfur|Sulphur)\s*(?:\([Ss]\))?\s*[:\-=]?\s*([\d\.]+)',
        ]
        micronutrients["sulfur"] = FieldExtractor._extract_numeric(text, s_patterns)
        
        return micronutrients
    
    @staticmethod
    def extract_advisory(text: str) -> List[str]:
        """Extract advisory recommendations"""
        advisories = []
        
        # Look for recommendation sections
        advisory_section_patterns = [
            r'(?:Advisory|Recommendation|Remarks|Suggestion)[s]?\s*[:\-]?\s*(.+?)(?:\n\n|$)',
            r'(?:Apply|Use|Add)\s+.+?(?:\.|$)',
        ]
        
        for pattern in advisory_section_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE | re.DOTALL)
            for match in matches:
                advisory_text = match.group(1) if len(match.groups()) > 0 else match.group(0)
                # Split into sentences
                sentences = re.split(r'[.;]\s*', advisory_text)
                for sentence in sentences:
                    sentence = sentence.strip()
                    if len(sentence) > 10 and not sentence.startswith('__'):
                        advisories.append(sentence)
        
        # Look for specific recommendations
        recommendation_keywords = [
            'apply', 'use', 'add', 'suitable', 'recommended', 'maintain',
            'lime', 'gypsum', 'zinc', 'sulphate', 'urea', 'DAP', 'MOP',
            'compost', 'FYM', 'organic matter'
        ]
        
        lines = text.split('\n')
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in recommendation_keywords):
                if len(line.strip()) > 15 and len(line.strip()) < 200:
                    if line.strip() not in advisories:
                        advisories.append(line.strip())
        
        # Remove duplicates while preserving order
        seen = set()
        unique_advisories = []
        for adv in advisories:
            if adv.lower() not in seen:
                seen.add(adv.lower())
                unique_advisories.append(adv)
        
        return unique_advisories[:10]  # Limit to top 10
    
    @staticmethod
    def extract_metadata(text: str) -> Dict[str, Optional[str]]:
        """Extract report metadata"""
        metadata = {
            "sample_number": None,
            "report_date": None,
            "lab_name": None
        }
        
        # Sample number patterns
        sample_patterns = [
            r'(?:Sample\s*(?:No|Number|ID)|Report\s*(?:No|Number))[:\-\s]+([A-Z0-9\-\/]+)',
        ]
        
        for pattern in sample_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                metadata["sample_number"] = match.group(1).strip()
                break
        
        # Date patterns
        date_patterns = [
            r'(?:Date|Report\s*Date)[:\-\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
            r'(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                metadata["report_date"] = match.group(1).strip()
                break
        
        # Lab name patterns
        lab_patterns = [
            r'(Soil\s*Testing\s*Laboratory)',
            r'(Department\s*of\s*Agriculture)',
        ]
        
        for pattern in lab_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                metadata["lab_name"] = match.group(1).strip()
                break
        
        return metadata
    
    @staticmethod
    def _extract_numeric(text: str, patterns: List[str]) -> Optional[float]:
        """Extract numeric value using multiple patterns"""
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    value_str = match.group(1).strip()
                    # Remove any non-numeric characters except decimal point
                    value_str = re.sub(r'[^\d\.]', '', value_str)
                    value = float(value_str)
                    return value
                except (ValueError, IndexError):
                    continue
        return None


class ConfidenceCalculator:
    """Calculates extraction confidence score"""
    
    @staticmethod
    def calculate(result: Dict[str, Any]) -> float:
        """
        Calculate confidence score (0.0 - 1.0) based on extraction completeness
        """
        total_fields = 0
        filled_fields = 0
        
        # Farmer details (weight: 0.2)
        farmer_fields = result.get("farmer_details", {})
        for key, value in farmer_fields.items():
            total_fields += 1
            if value:
                filled_fields += 1
        
        # Soil metrics (weight: 0.5)
        soil_fields = result.get("soil_metrics", {})
        for key, value in soil_fields.items():
            total_fields += 2  # Higher weight
            if value is not None:
                filled_fields += 2
        
        # Micronutrients (weight: 0.2)
        micro_fields = result.get("micronutrients", {})
        for key, value in micro_fields.items():
            total_fields += 1
            if value is not None:
                filled_fields += 1
        
        # Metadata (weight: 0.1)
        meta_fields = result.get("report_metadata", {})
        for key, value in meta_fields.items():
            total_fields += 0.5
            if value:
                filled_fields += 0.5
        
        if total_fields == 0:
            return 0.0
        
        confidence = filled_fields / total_fields
        return round(confidence, 2)


def parse_soil_report_image(image_path: str) -> Dict[str, Any]:
    """
    Main function to parse soil report image
    
    Args:
        image_path: Path to soil report image (.png)
    
    Returns:
        Dictionary with structured soil report data
    """
    
    # Initialize result structure
    result = {
        "farmer_details": {
            "name": None,
            "state": None,
            "district": None,
            "village": None
        },
        "soil_metrics": {
            "nitrogen_kg_ha": None,
            "phosphorus_kg_ha": None,
            "potassium_kg_ha": None,
            "ph": None,
            "organic_carbon_percent": None,
            "ec_ds_m": None
        },
        "micronutrients": {
            "zinc": None,
            "iron": None,
            "boron": None,
            "copper": None,
            "manganese": None,
            "sulfur": None
        },
        "advisory": [],
        "report_metadata": {
            "sample_number": None,
            "report_date": None,
            "lab_name": None
        },
        "confidence_score": 0.0,
        "raw_text": "",
        "error": None
    }
    
    # Check if file exists
    if not os.path.exists(image_path):
        result["error"] = f"File not found: {image_path}"
        return result
    
    try:
        # Step 1: Preprocess image
        processed_image, error = ImagePreprocessor.preprocess(image_path)
        if error:
            result["error"] = error
            return result
        
        # Step 2: Extract text using OCR
        raw_text = OCREngine.extract_text(processed_image)
        if not raw_text:
            result["error"] = "No text extracted from image"
            return result
        
        result["raw_text"] = raw_text
        
        # Step 3: Normalize text
        normalized_text = TextNormalizer.normalize(raw_text)
        
        # Step 4: Extract structured data
        result["farmer_details"] = FieldExtractor.extract_farmer_details(normalized_text)
        result["soil_metrics"] = FieldExtractor.extract_soil_metrics(normalized_text)
        result["micronutrients"] = FieldExtractor.extract_micronutrients(normalized_text)
        result["advisory"] = FieldExtractor.extract_advisory(normalized_text)
        result["report_metadata"] = FieldExtractor.extract_metadata(normalized_text)
        
        # Step 5: Calculate confidence
        result["confidence_score"] = ConfidenceCalculator.calculate(result)
        
        return result
        
    except Exception as e:
        result["error"] = f"Unexpected error: {str(e)}"
        return result


def main():
    """CLI entry point"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python advanced_soil_ocr.py <image_path>"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    # Parse the image
    result = parse_soil_report_image(image_path)
    
    # Output JSON
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
