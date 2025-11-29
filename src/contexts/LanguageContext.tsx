import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  language: 'english' | 'malayalam';
  setLanguage: (lang: 'english' | 'malayalam') => void;
  t: (key: string) => string;
}

const translations = {
  english: {
    // Common
    'welcome': 'Welcome',
    'login': 'Login',
    'signup': 'Sign Up',
    'logout': 'Logout',
    'home': 'Home',
    'reminders': 'Reminders',
    'connect': 'Connect',
    'name': 'Name',
    'district': 'District',
    'area': 'Area',
    'language': 'Language',
    'english': 'English',
    'malayalam': 'Malayalam',
    'cancel': 'Cancel',
    'save': 'Save',
    'add': 'Add',
    'edit': 'Edit',
    'delete': 'Delete',
    'close': 'Close',
    'submit': 'Submit',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    
    // Authentication
    'farmease': 'FarmEase',
    'farming_made_easy': 'Farming Made Easy',
    'full_name': 'Full Name',
    'enter_name': 'Enter your full name',
    'enter_district': 'Enter your district',
    'enter_area': 'Enter your area/village',
    'select_language': 'Select Language',
    'create_account': 'Create Account',
    'terms_of_service': 'By continuing, you agree to our Terms of Service',
    
    // Home Page
    'my_lands': 'My Lands',
    'add_land': 'Add Land',
    'crop_recommendation': 'Crop Recommendation',
    'disease_diagnosis': 'Disease Diagnosis',
    'market_analysis': 'Market Analysis',
    'weather_forecast': 'Weather Forecast',
    'ai_assistant': 'AI Assistant',
    'land_name': 'Land Name',
    'location': 'Location',
    'soil_type': 'Soil Type',
    'current_crop': 'Current Crop',
    'water_availability': 'Water Availability',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low',
    'soil_report': 'Soil Report',
    'upload_pdf': 'Upload PDF',
    'no_lands': 'No lands added yet',
    'add_first_land': 'Add your first land to get started with smart farming',
    'land_selected': 'Land selected! The AI assistant will now provide context-aware advice for this land.',
    'confirm_delete_land': 'Are you sure you want to delete this land?',
    'delete_land_error': 'Failed to delete land. Please try again.',
    
    // Crop Recommendation
    'crop_recommendations': 'Crop Recommendations',
    'suitability': 'Suitability',
    'season': 'Season',
    'expected_yield': 'Expected Yield',
    'market_price': 'Market Price',
    'get_detailed_plan': 'Get Detailed Plan',
    'select_land_for_recommendations': 'Select a land from "My Lands" to see crop recommendations',
    
    // Disease Diagnosis
    'crop_disease': 'Crop Disease',
    'pest_bug': 'Pest/Bug',
    'upload_crop_image': 'Upload Crop Image',
    'upload_pest_image': 'Upload Pest/Bug Image or Description',
    'take_photo': 'Take Photo',
    'describe_pest': 'Describe the pest/bug',
    'analyze_image': 'Analyze Image',
    'analyze_description': 'Analyze Description',
    'disease_analysis_results': 'Disease Analysis Results',
    'pest_analysis_results': 'Pest Analysis Results',
    'confidence': 'Confidence',
    'symptoms': 'Symptoms',
    'treatment': 'Treatment',
    'prevention': 'Prevention',
    'add_to_reminders': 'Add to Reminders',
    'share_with_farmers': 'Share with Farmers',
    
    // Market Analysis
    'market_prices': 'Market Prices',
    'current_price': 'Current Price',
    'previous_price': 'Previous Price',
    'demand': 'Demand',
    'forecast': 'Forecast',
    'set_price_alert': 'Set Price Alert',
    'find_buyers': 'Find Buyers',
    'avg_rice_price': 'Avg Rice Price',
    'market_demand': 'Market Demand',
    'active_markets': 'Active Markets',
    
    // Weather Forecast
    'current_weather': 'Current Weather',
    'temperature': 'Temperature',
    'humidity': 'Humidity',
    'wind_speed': 'Wind Speed',
    'weather_alerts': 'Weather Alerts',
    'day_forecast': '7-Day Forecast',
    'farming_recommendations': 'Farming Recommendations',
    'heavy_rain_expected': 'Heavy Rain Expected',
    'avoid_spraying': 'Avoid spraying, ensure field drainage, harvest ready crops.',
    
    // Reminders
    'reminders_tasks': 'Reminders & Tasks',
    'today': 'Today',
    'upcoming': 'Upcoming',
    'completed': 'Completed',
    'todays_tasks': 'Today\'s Tasks',
    'upcoming_tasks': 'Upcoming Tasks',
    'completed_tasks': 'Completed Tasks',
    'no_tasks_today': 'No tasks for today. Great job staying on top of things!',
    'no_upcoming_tasks': 'No upcoming tasks scheduled.',
    'priority': 'Priority',
    'date': 'Date',
    
    // Connect
    'connect_with_farmers': 'Connect with Farmers',
    'nearby_farmers': 'Nearby Farmers',
    'pest_alerts': 'Pest Alerts',
    'map_view': 'Map View',
    'load_more_farmers': 'Load More Farmers',
    'report_alert': 'Report Alert',
    'alert_statistics': 'Alert Statistics',
    'this_week': 'This Week',
    'high_severity': 'High Severity',
    'medium_severity': 'Medium Severity',
    'resolved': 'Resolved',
    'chat': 'Chat',
    'call': 'Call',
    'report_similar': 'Report Similar',
    'get_help': 'Get Help',
    'contact_farmer': 'Contact Farmer',
    
    // AI Assistant
    'farm_assistant': 'Farm Assistant',
    'ask_about_farming': 'Ask about farming...',
    'context': 'Context',
    'hello_assistant': 'Hello! I\'m your farming assistant. I can help you with crop care, pest management, weather planning, and more. How can I assist you today?',
    
    // Government Schemes
    'government_schemes': 'Government Schemes',
    'schemes': 'Schemes',
    'scheme_details': 'Scheme Details',
    'eligibility': 'Eligibility',
    'how_to_apply': 'How to Apply',
    'contact_info': 'Contact Information',
    'apply_online': 'Apply Online',
    'view_details': 'View Details',
    'search_schemes': 'Search schemes...',
    'all_categories': 'All Categories',
    'insurance_schemes': 'Insurance',
    'pricing_schemes': 'Pricing Support',
    'subsidy_schemes': 'Subsidies',
    'testing_schemes': 'Testing & Analysis',
    'no_schemes_found': 'No schemes found',
    'back_to_schemes': 'Back to Schemes',
    'scheme_category': 'Category',
    'application_process': 'Application Process',
    'learn_more': 'Learn More',
  },
  malayalam: {
    // Common
    'welcome': 'സ്വാഗതം',
    'login': 'ലോഗിൻ',
    'signup': 'രജിസ്റ്റർ',
    'logout': 'ലോഗൗട്ട്',
    'home': 'ഹോം',
    'reminders': 'ഓർമ്മപ്പെടുത്തലുകൾ',
    'connect': 'കണക്റ്റ്',
    'name': 'പേര്',
    'district': 'ജില്ല',
    'area': 'പ്രദേശം',
    'language': 'ഭാഷ',
    'english': 'ഇംഗ്ലീഷ്',
    'malayalam': 'മലയാളം',
    'cancel': 'റദ്ദാക്കുക',
    'save': 'സേവ്',
    'add': 'ചേർക്കുക',
    'edit': 'എഡിറ്റ്',
    'delete': 'ഡിലീറ്റ്',
    'close': 'ക്ലോസ്',
    'submit': 'സബ്മിറ്റ്',
    'loading': 'ലോഡിംഗ്...',
    'error': 'എറർ',
    'success': 'സക്സസ്',
    
    // Authentication
    'farmease': 'ഫാംഈസ്',
    'farming_made_easy': 'കാർഷികം എളുപ്പമാക്കി',
    'full_name': 'പൂർണ്ണ നാമം',
    'enter_name': 'നിങ്ങളുടെ പൂർണ്ണ നാമം നൽകുക',
    'enter_district': 'നിങ്ങളുടെ ജില്ല നൽകുക',
    'enter_area': 'നിങ്ങളുടെ പ്രദേശം/ഗ്രാമം നൽകുക',
    'select_language': 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    'create_account': 'അക്കൗണ്ട് സൃഷ്ടിക്കുക',
    'terms_of_service': 'തുടരുന്നതിലൂടെ, നിങ്ങൾ ഞങ്ങളുടെ സേവന നിബന്ധനകൾ അംഗീകരിക്കുന്നു',
    
    // Home Page
    'my_lands': 'എന്റെ ഭൂമികൾ',
    'add_land': 'ഭൂമി ചേർക്കുക',
    'crop_recommendation': 'വിള ശുപാർശ',
    'disease_diagnosis': 'രോഗ നിർണയം',
    'market_analysis': 'മാർക്കറ്റ് വിശകലനം',
    'weather_forecast': 'കാലാവസ്ഥാ പ്രവചനം',
    'ai_assistant': 'AI അസിസ്റ്റന്റ്',
    'land_name': 'ഭൂമിയുടെ പേര്',
    'location': 'സ്ഥലം',
    'soil_type': 'മണ്ണിന്റെ തരം',
    'current_crop': 'നിലവിലെ വിള',
    'water_availability': 'ജല ലഭ്യത',
    'high': 'ഉയർന്ന',
    'medium': 'ഇടത്തരം',
    'low': 'കുറഞ്ഞ',
    'soil_report': 'മണ്ണ് റിപ്പോർട്ട്',
    'upload_pdf': 'PDF അപ്ലോഡ് ചെയ്യുക',
    'no_lands': 'ഇതുവരെ ഭൂമികൾ ചേർത്തിട്ടില്ല',
    'add_first_land': 'സ്മാർട്ട് കാർഷികം ആരംഭിക്കാൻ നിങ്ങളുടെ ആദ്യ ഭൂമി ചേർക്കുക',
    'land_selected': 'ഭൂമി തിരഞ്ഞെടുത്തു! AI അസിസ്റ്റന്റ് ഇപ്പോൾ ഈ ഭൂമിക്കായി സന്ദർഭാനുസൃത ഉപദേശം നൽകും.',
    'confirm_delete_land': 'നിങ്ങൾക്ക് ഈ ഭൂമി ഇല്ലാതാക്കണോ?',
    'delete_land_error': 'ഭൂമി ഇല്ലാതാക്കാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക.',
    
    // Crop Recommendation
    'crop_recommendations': 'വിള ശുപാർശകൾ',
    'suitability': 'അനുയോജ്യത',
    'season': 'സീസൺ',
    'expected_yield': 'പ്രതീക്ഷിത വിളവ്',
    'market_price': 'മാർക്കറ്റ് വില',
    'get_detailed_plan': 'വിശദ പദ്ധതി നേടുക',
    'select_land_for_recommendations': 'വിള ശുപാർശകൾ കാണാൻ "എന്റെ ഭൂമികൾ" ൽ നിന്ന് ഒരു ഭൂമി തിരഞ്ഞെടുക്കുക',
    
    // Disease Diagnosis
    'crop_disease': 'വിള രോഗം',
    'pest_bug': 'കീടം/ബഗ്',
    'upload_crop_image': 'വിള ചിത്രം അപ്ലോഡ് ചെയ്യുക',
    'upload_pest_image': 'കീടം/ബഗ് ചിത്രം അല്ലെങ്കിൽ വിവരണം അപ്ലോഡ് ചെയ്യുക',
    'take_photo': 'ഫോട്ടോ എടുക്കുക',
    'describe_pest': 'കീടത്തെ വിവരിക്കുക',
    'analyze_image': 'ചിത്രം വിശകലനം ചെയ്യുക',
    'analyze_description': 'വിവരണം വിശകലനം ചെയ്യുക',
    'disease_analysis_results': 'രോഗ വിശകലന ഫലങ്ങൾ',
    'pest_analysis_results': 'കീട വിശകലന ഫലങ്ങൾ',
    'confidence': 'ആത്മവിശ്വാസം',
    'symptoms': 'ലക്ഷണങ്ങൾ',
    'treatment': 'ചികിത്സ',
    'prevention': 'തടയൽ',
    'add_to_reminders': 'ഓർമ്മപ്പെടുത്തലുകളിൽ ചേർക്കുക',
    'share_with_farmers': 'കർഷകരുമായി പങ്കിടുക',
    
    // Market Analysis
    'market_prices': 'മാർക്കറ്റ് വിലകൾ',
    'current_price': 'നിലവിലെ വില',
    'previous_price': 'മുൻ വില',
    'demand': 'ആവശ്യം',
    'forecast': 'പ്രവചനം',
    'set_price_alert': 'വില അലേർട്ട് സജ്ജമാക്കുക',
    'find_buyers': 'വാങ്ങുന്നവരെ കണ്ടെത്തുക',
    'avg_rice_price': 'ശരാശരി അരി വില',
    'market_demand': 'മാർക്കറ്റ് ആവശ്യം',
    'active_markets': 'സജീവ മാർക്കറ്റുകൾ',
    
    // Weather Forecast
    'current_weather': 'നിലവിലെ കാലാവസ്ഥ',
    'temperature': 'താപനില',
    'humidity': 'ആർദ്രത',
    'wind_speed': 'കാറ്റിന്റെ വേഗത',
    'weather_alerts': 'കാലാവസ്ഥാ അലേർട്ടുകൾ',
    'day_forecast': '7-ദിവസ പ്രവചനം',
    'farming_recommendations': 'കാർഷിക ശുപാർശകൾ',
    'heavy_rain_expected': 'കനത്ത മഴ പ്രതീക്ഷിക്കുന്നു',
    'avoid_spraying': 'മഴ കാരണം സ്പ്രേ ഒഴിവാക്കുക, ഫീൽഡ് ഡ്രെയിനേജ് ഉറപ്പാക്കുക, തയ്യാറായ വിളകൾ വിളവെടുക്കുക.',
    
    // Reminders
    'reminders_tasks': 'ഓർമ്മപ്പെടുത്തലുകൾ & ടാസ്ക്കുകൾ',
    'today': 'ഇന്ന്',
    'upcoming': 'വരാനിരിക്കുന്ന',
    'completed': 'പൂർത്തിയാക്കിയ',
    'todays_tasks': 'ഇന്നത്തെ ടാസ്ക്കുകൾ',
    'upcoming_tasks': 'വരാനിരിക്കുന്ന ടാസ്ക്കുകൾ',
    'completed_tasks': 'പൂർത്തിയാക്കിയ ടാസ്ക്കുകൾ',
    'no_tasks_today': 'ഇന്നത്തെ ടാസ്ക്കുകൾ ഒന്നുമില്ല. കാര്യങ്ങൾ നന്നായി നടത്തുന്നതിൽ മികച്ച ജോലി!',
    'no_upcoming_tasks': 'വരാനിരിക്കുന്ന ടാസ്ക്കുകൾ ഒന്നും ഷെഡ്യൂൾ ചെയ്തിട്ടില്ല.',
    'priority': 'പ്രാധാന്യം',
    'date': 'തീയതി',
    
    // Connect
    'connect_with_farmers': 'കർഷകരുമായി കണക്റ്റ് ചെയ്യുക',
    'nearby_farmers': 'സമീപ കർഷകർ',
    'pest_alerts': 'കീട അലേർട്ടുകൾ',
    'map_view': 'മാപ്പ് വ്യൂ',
    'load_more_farmers': 'കൂടുതൽ കർഷകരെ ലോഡ് ചെയ്യുക',
    'report_alert': 'അലേർട്ട് റിപ്പോർട്ട് ചെയ്യുക',
    'alert_statistics': 'അലേർട്ട് സ്ഥിതിവിവരക്കണക്കുകൾ',
    'this_week': 'ഈ ആഴ്ച',
    'high_severity': 'ഉയർന്ന ഗുരുത്വാകർഷണം',
    'medium_severity': 'ഇടത്തരം ഗുരുത്വാകർഷണം',
    'resolved': 'പരിഹരിച്ചു',
    'chat': 'ചാറ്റ്',
    'call': 'കോൾ',
    'report_similar': 'സമാനമായത് റിപ്പോർട്ട് ചെയ്യുക',
    'get_help': 'സഹായം നേടുക',
    'contact_farmer': 'കർഷകനെ കോൺടാക്റ്റ് ചെയ്യുക',
    
    // AI Assistant
    'farm_assistant': 'കാർഷിക അസിസ്റ്റന്റ്',
    'ask_about_farming': 'കാർഷികത്തെക്കുറിച്ച് ചോദിക്കുക...',
    'context': 'സന്ദർഭം',
    'hello_assistant': 'ഹലോ! ഞാൻ നിങ്ങളുടെ കാർഷിക അസിസ്റ്റന്റാണ്. വിള പരിപാലനം, കീട നിയന്ത്രണം, കാലാവസ്ഥാ ആസൂത്രണം എന്നിവയിൽ എനിക്ക് സഹായിക്കാനാകും. ഇന്ന് എങ്ങനെ സഹായിക്കാനാകും?',
    
    // Government Schemes
    'government_schemes': 'സർക്കാർ പദ്ധതികൾ',
    'schemes': 'പദ്ധതികൾ',
    'scheme_details': 'പദ്ധതിയുടെ വിശദാംശങ്ങൾ',
    'eligibility': 'യോഗ്യത',
    'how_to_apply': 'എങ്ങനെ അപേക്ഷിക്കാം',
    'contact_info': 'ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ',
    'apply_online': 'ഓൺലൈൻ അപേക്ഷിക്കുക',
    'view_details': 'വിശദാംശങ്ങൾ കാണുക',
    'search_schemes': 'പദ്ധതികൾ തിരയുക...',
    'all_categories': 'എല്ലാ വിഭാഗങ്ങളും',
    'insurance_schemes': 'ഇൻഷുറൻസ്',
    'pricing_schemes': 'വില പിന്തുണ',
    'subsidy_schemes': 'സബ്സിഡികൾ',
    'testing_schemes': 'ടെസ്റ്റിംഗ് & വിശകലനം',
    'no_schemes_found': 'പദ്ധതികൾ കണ്ടെത്തിയില്ല',
    'back_to_schemes': 'പദ്ധതികളിലേക്ക് തിരികെ',
    'scheme_category': 'വിഭാഗം',
    'application_process': 'അപേക്ഷാ പ്രക്രിയ',
    'learn_more': 'കൂടുതലറിയുക',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<'english' | 'malayalam'>(() => {
    const savedLanguage = localStorage.getItem('farmease_language');
    return (savedLanguage as 'english' | 'malayalam') || 'english';
  });

  useEffect(() => {
    localStorage.setItem('farmease_language', language);
    
    // Update document font family based on language
    if (language === 'malayalam') {
      document.documentElement.style.fontFamily = 'Noto Sans Malayalam, Inter, system-ui, sans-serif';
    } else {
      document.documentElement.style.fontFamily = 'Inter, system-ui, sans-serif';
    }
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.english] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
