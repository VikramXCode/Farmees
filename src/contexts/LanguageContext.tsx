import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  language: 'english' | 'tamil';
  setLanguage: (lang: 'english' | 'tamil') => void;
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
    'tamil': 'Tamil',
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
    'retry': 'Retry',

    // Authentication
    'farmease': 'Farmees',
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
  tamil: {
    // Common
    'welcome': 'வாருங்கள்',
    'login': 'உள்நுழைக',
    'signup': 'பதிவு செய்க',
    'logout': 'வெளியேறு',
    'home': 'முகப்பு',
    'reminders': 'நினைவூட்டல்கள்',
    'connect': 'இணைப்பு',
    'name': 'பெயர்',
    'district': 'மாவட்டம்',
    'area': 'பகுதி',
    'language': 'மொழி',
    'english': 'ஆங்கிலம்',
    'tamil': 'தமிழ்',
    'cancel': 'ரத்துசெய்',
    'save': 'சேமி',
    'add': 'சேர்',
    'edit': 'திருத்து',
    'delete': 'நீக்கு',
    'close': 'மூடு',
    'submit': 'சமர்ப்பி',
    'loading': 'ஏற்றுகிறது...',
    'error': 'பிழை',
    'success': 'வெற்றி',
    'retry': 'மீண்டும் முயற்சி செய்க',

    // Authentication
    'farmease': 'ஃபார்மீஸ்',
    'farming_made_easy': 'விவசாயம் எளிதானது',
    'full_name': 'முழு பெயர்',
    'enter_name': 'உங்கள் முழு பெயரை உள்ளிடவும்',
    'enter_district': 'உங்கள் மாவட்டத்தை உள்ளிடவும்',
    'enter_area': 'உங்கள் பகுதி/கிராமத்தை உள்ளிடவும்',
    'select_language': 'மொழியைத் தேர்ந்தெடுக்கவும்',
    'create_account': 'கணக்கை உருவாக்கவும்',
    'terms_of_service': 'தொடர்வதன் மூலம், எங்கள் சேவை விதிமுறைகளை ஏற்கிறீர்கள்',

    // Home Page
    'my_lands': 'எனது நிலங்கள்',
    'add_land': 'நிலத்தைச் சேர்',
    'crop_recommendation': 'பயிர் பரிந்துரை',
    'disease_diagnosis': 'நோய் கண்டறிதல்',
    'market_analysis': 'சந்தை ஆய்வு',
    'weather_forecast': 'வானிலை முன்னறிவிப்பு',
    'ai_assistant': 'AI உதவியாளர்',
    'land_name': 'நிலத்தின் பெயர்',
    'location': 'இடம்',
    'soil_type': 'மண் வகை',
    'current_crop': 'தற்போதைய பயிர்',
    'water_availability': 'நீர் இருப்பு',
    'high': 'அதிகம்',
    'medium': 'நடுத்தரம்',
    'low': 'குறைவு',
    'soil_report': 'மண் அறிக்கை',
    'upload_pdf': 'PDF பதிவேற்றவும்',
    'no_lands': 'நிலங்கள் எதுவும் சேர்க்கப்படவில்லை',
    'add_first_land': 'ஸ்மார்ட் விவசாயத்தைத் தொடங்க உங்கள் முதல் நிலத்தைச் சேர்க்கவும்',
    'land_selected': 'நிலம் தேர்ந்தெடுக்கப்பட்டது! இந்த நிலத்திற்கான சூழல் சார்ந்த ஆலோசனைகளை AI உதவியாளர் வழங்கும்.',
    'confirm_delete_land': 'இந்த நிலத்தை நிச்சயமாக நீக்க விரும்புகிறீர்களா?',
    'delete_land_error': 'நிலத்தை நீக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',

    // Crop Recommendation
    'crop_recommendations': 'பயிர் பரிந்துரைகள்',
    'suitability': 'பொருத்தம்',
    'season': 'பருவம்',
    'expected_yield': 'எதிர்பார்க்கப்படும் மகசூல்',
    'market_price': 'சந்தை விலை',
    'get_detailed_plan': 'விரிவான திட்டத்தைப் பெறவும்',
    'select_land_for_recommendations': 'பயிர் பரிந்துரைகளைப் பார்க்க "எனது நிலங்கள்" என்பதிலிருந்து ஒரு நிலத்தைத் தேர்ந்தெடுக்கவும்',

    // Disease Diagnosis
    'crop_disease': 'பயிர் நோய்',
    'pest_bug': 'பூச்சி/வண்டு',
    'upload_crop_image': 'பயிர் படத்தை பதிவேற்றவும்',
    'upload_pest_image': 'பூச்சி/வண்டு படம் அல்லது விளக்கத்தை பதிவேற்றவும்',
    'take_photo': 'புகைப்படம் எடுக்கவும்',
    'describe_pest': 'பூச்சியை விவரிக்கவும்',
    'analyze_image': 'படத்தை ஆய்வு செய்யவும்',
    'analyze_description': 'விளக்கத்தை ஆய்வு செய்யவும்',
    'disease_analysis_results': 'நோய் ஆய்வு முடிவுகள்',
    'pest_analysis_results': 'பூச்சி ஆய்வு முடிவுகள்',
    'confidence': 'நம்பிக்கை',
    'symptoms': 'அறிகுறிகள்',
    'treatment': 'சிகிச்சை',
    'prevention': 'தடுப்புமுறை',
    'add_to_reminders': 'நினைவூட்டல்களில் சேர்க்கவும்',
    'share_with_farmers': 'விவசாயிகளுடன் பகிரவும்',

    // Market Analysis
    'market_prices': 'சந்தை விலைகள்',
    'current_price': 'தற்போதைய விலை',
    'previous_price': 'முந்தைய விலை',
    'demand': 'தேவை',
    'forecast': 'முன்னறிவிப்பு',
    'set_price_alert': 'விலை எச்சரிக்கையை அமைக்கவும்',
    'find_buyers': 'வாங்குபவர்களைக் கண்டறியவும்',
    'avg_rice_price': 'சராசரி நெல் விலை',
    'market_demand': 'சந்தை தேவை',
    'active_markets': 'செயலில் உள்ள சந்தைகள்',

    // Weather Forecast
    'current_weather': 'தற்போதைய வானிலை',
    'temperature': 'வெப்பநிலை',
    'humidity': 'ஈரப்பதம்',
    'wind_speed': 'காற்றின் வேகம்',
    'weather_alerts': 'வானிலை எச்சரிக்கைகள்',
    'day_forecast': '7-நாள் முன்னறிவிப்பு',
    'farming_recommendations': 'விவசாய பரிந்துரைகள்',
    'heavy_rain_expected': 'கனமழை எதிர்பார்க்கப்படுகிறது',
    'avoid_spraying': 'தெளிப்பதை தவிர்க்கவும், வயல் வடிகாலையை உறுதி செய்யவும், தயாராக உள்ள பயிர்களை அறுவடை செய்யவும்.',

    // Reminders
    'reminders_tasks': 'நினைவூட்டல்கள் & பணிகள்',
    'today': 'இன்று',
    'upcoming': 'வரவிருக்கும்',
    'completed': 'முடிந்தது',
    'todays_tasks': 'இன்றைய பணிகள்',
    'upcoming_tasks': 'வரவிருக்கும் பணிகள்',
    'completed_tasks': 'முடிந்த பணிகள்',
    'no_tasks_today': 'இன்று பணிகள் ஏதுமில்லை. சிறப்பு!',
    'no_upcoming_tasks': 'வரவிருக்கும் பணிகள் ஏதுமில்லை.',
    'priority': 'முன்னுரிமை',
    'date': 'தேதி',

    // Connect
    'connect_with_farmers': 'விவசாயிகளுடன் இணைக்க',
    'nearby_farmers': 'அருகிலுள்ள விவசாயிகள்',
    'pest_alerts': 'பூச்சி எச்சரிக்கைகள்',
    'map_view': 'வரைபடக் காட்சி',
    'load_more_farmers': 'மேலும் விவசாயிகளை ஏற்றவும்',
    'report_alert': 'எச்சரிக்கையைப் புகாரளி',
    'alert_statistics': 'எச்சரிக்கை புள்ளிவிவரங்கள்',
    'this_week': 'இந்த வாரம்',
    'high_severity': 'அதிக தீவிரம்',
    'medium_severity': 'நடுத்தர தீவிரம்',
    'resolved': 'தீர்க்கப்பட்டது',
    'chat': 'அரட்டை',
    'call': 'அழைப்பு',
    'report_similar': 'இதே போன்றதைப் புகாரளி',
    'get_help': 'உதவி பெறவும்',
    'contact_farmer': 'விவசாயியைத் தொடர்பு கொள்ளவும்',

    // AI Assistant
    'farm_assistant': 'விவசாய உதவியாளர்',
    'ask_about_farming': 'விவசாயம் பற்றி ஏதேனும் கேட்கவும்...',
    'context': 'சூழல்',
    'hello_assistant': 'வணக்கம்! நான் உங்கள் விவசாய உதவியாளர். பயிர் பராமரிப்பு, பூச்சி மேலாண்மை, வானிலை திட்டமிடல் மற்றும் பலவற்றில் என்னால் உதவ முடியும். இன்று உங்களுக்கு எப்படி உதவலாம்?',

    // Government Schemes
    'government_schemes': 'அரசு திட்டங்கள்',
    'schemes': 'திட்டங்கள்',
    'scheme_details': 'திட்ட விவரங்கள்',
    'eligibility': 'தகுதி',
    'how_to_apply': 'விண்ணப்பிப்பது எப்படி',
    'contact_info': 'தொடர்பு தகவல்',
    'apply_online': 'ஆன்லைனில் விண்ணப்பிக்கவும்',
    'view_details': 'விவரங்களைப் பார்க்கவும்',
    'search_schemes': 'திட்டங்களைத் தேடு...',
    'all_categories': 'அனைத்து வகைகளும்',
    'insurance_schemes': 'காப்பீடு',
    'pricing_schemes': 'விலை ஆதரவு',
    'subsidy_schemes': 'மானியங்கள்',
    'testing_schemes': 'சோதனை & பகுப்பாய்வு',
    'no_schemes_found': 'திட்டங்கள் எதுவும் இல்லை',
    'back_to_schemes': 'திட்டங்களுக்குத் திரும்பு',
    'scheme_category': 'வகை',
    'application_process': 'விண்ணப்ப செயல்முறை',
    'learn_more': 'மேலும் அறிக',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<'english' | 'tamil'>(() => {
    const savedLanguage = localStorage.getItem('farmease_language');
    // Default to english if saved language is invalid or was 'malayalam'
    if (savedLanguage === 'english' || savedLanguage === 'tamil') {
      return savedLanguage;
    }
    return 'english';
  });

  useEffect(() => {
    localStorage.setItem('farmease_language', language);

    // Update document font family based on language
    if (language === 'tamil') {
      // Use a font that supports Tamil well if available, like Noto Sans Tamil
      document.documentElement.style.fontFamily = 'Noto Sans Tamil, Inter, system-ui, sans-serif';
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
