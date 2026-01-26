/**
 * Comprehensive list of Indian cities, towns, and villages
 * Organized by state for rural and urban areas
 */

export interface IndianLocation {
  name: string;
  state: string;
  type: 'city' | 'town' | 'village' | 'district';
}

export const INDIAN_LOCATIONS: IndianLocation[] = [
  // Tamil Nadu - Major Cities
  { name: 'Chennai', state: 'Tamil Nadu', type: 'city' },
  { name: 'Coimbatore', state: 'Tamil Nadu', type: 'city' },
  { name: 'Madurai', state: 'Tamil Nadu', type: 'city' },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu', type: 'city' },
  { name: 'Trichy', state: 'Tamil Nadu', type: 'city' },
  { name: 'Salem', state: 'Tamil Nadu', type: 'city' },
  { name: 'Tirunelveli', state: 'Tamil Nadu', type: 'city' },
  { name: 'Erode', state: 'Tamil Nadu', type: 'city' },
  { name: 'Vellore', state: 'Tamil Nadu', type: 'city' },
  { name: 'Thoothukudi', state: 'Tamil Nadu', type: 'city' },
  { name: 'Thanjavur', state: 'Tamil Nadu', type: 'city' },
  { name: 'Dindigul', state: 'Tamil Nadu', type: 'city' },
  { name: 'Kanchipuram', state: 'Tamil Nadu', type: 'city' },
  { name: 'Karur', state: 'Tamil Nadu', type: 'city' },
  { name: 'Rajapalayam', state: 'Tamil Nadu', type: 'town' },
  { name: 'Pollachi', state: 'Tamil Nadu', type: 'town' },
  { name: 'Sivakasi', state: 'Tamil Nadu', type: 'town' },
  { name: 'Pudukkottai', state: 'Tamil Nadu', type: 'town' },
  { name: 'Kumbakonam', state: 'Tamil Nadu', type: 'town' },
  { name: 'Tirupur', state: 'Tamil Nadu', type: 'city' },
  { name: 'Ambur', state: 'Tamil Nadu', type: 'town' },
  { name: 'Palani', state: 'Tamil Nadu', type: 'town' },
  { name: 'Udumalaipettai', state: 'Tamil Nadu', type: 'town' },
  { name: 'Arakkonam', state: 'Tamil Nadu', type: 'town' },
  { name: 'Ranipet', state: 'Tamil Nadu', type: 'town' },
  { name: 'Namakkal', state: 'Tamil Nadu', type: 'town' },
  { name: 'Hosur', state: 'Tamil Nadu', type: 'town' },
  { name: 'Krishnagiri', state: 'Tamil Nadu', type: 'town' },
  { name: 'Dharmapuri', state: 'Tamil Nadu', type: 'town' },
  { name: 'Virudhunagar', state: 'Tamil Nadu', type: 'town' },

  // Kerala - Major Cities
  { name: 'Thiruvananthapuram', state: 'Kerala', type: 'city' },
  { name: 'Kochi', state: 'Kerala', type: 'city' },
  { name: 'Kozhikode', state: 'Kerala', type: 'city' },
  { name: 'Calicut', state: 'Kerala', type: 'city' },
  { name: 'Thrissur', state: 'Kerala', type: 'city' },
  { name: 'Kollam', state: 'Kerala', type: 'city' },
  { name: 'Palakkad', state: 'Kerala', type: 'city' },
  { name: 'Alappuzha', state: 'Kerala', type: 'city' },
  { name: 'Malappuram', state: 'Kerala', type: 'city' },
  { name: 'Kannur', state: 'Kerala', type: 'city' },
  { name: 'Kottayam', state: 'Kerala', type: 'city' },
  { name: 'Wayanad', state: 'Kerala', type: 'district' },
  { name: 'Pathanamthitta', state: 'Kerala', type: 'city' },
  { name: 'Kasaragod', state: 'Kerala', type: 'city' },
  { name: 'Idukki', state: 'Kerala', type: 'district' },
  { name: 'Munnar', state: 'Kerala', type: 'town' },
  { name: 'Pala', state: 'Kerala', type: 'town' },
  { name: 'Thiruvalla', state: 'Kerala', type: 'town' },
  { name: 'Thalassery', state: 'Kerala', type: 'town' },
  { name: 'Attingal', state: 'Kerala', type: 'town' },

  // Karnataka - Major Cities
  { name: 'Bangalore', state: 'Karnataka', type: 'city' },
  { name: 'Bengaluru', state: 'Karnataka', type: 'city' },
  { name: 'Mysore', state: 'Karnataka', type: 'city' },
  { name: 'Mysuru', state: 'Karnataka', type: 'city' },
  { name: 'Hubli', state: 'Karnataka', type: 'city' },
  { name: 'Mangalore', state: 'Karnataka', type: 'city' },
  { name: 'Belgaum', state: 'Karnataka', type: 'city' },
  { name: 'Gulbarga', state: 'Karnataka', type: 'city' },
  { name: 'Davangere', state: 'Karnataka', type: 'city' },
  { name: 'Bellary', state: 'Karnataka', type: 'city' },
  { name: 'Bijapur', state: 'Karnataka', type: 'city' },
  { name: 'Shimoga', state: 'Karnataka', type: 'city' },
  { name: 'Tumkur', state: 'Karnataka', type: 'city' },
  { name: 'Raichur', state: 'Karnataka', type: 'city' },
  { name: 'Bidar', state: 'Karnataka', type: 'city' },
  { name: 'Mandya', state: 'Karnataka', type: 'city' },
  { name: 'Hassan', state: 'Karnataka', type: 'city' },
  { name: 'Udupi', state: 'Karnataka', type: 'city' },
  { name: 'Chitradurga', state: 'Karnataka', type: 'city' },

  // Andhra Pradesh
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', type: 'city' },
  { name: 'Vijayawada', state: 'Andhra Pradesh', type: 'city' },
  { name: 'Guntur', state: 'Andhra Pradesh', type: 'city' },
  { name: 'Nellore', state: 'Andhra Pradesh', type: 'city' },
  { name: 'Kurnool', state: 'Andhra Pradesh', type: 'city' },
  { name: 'Rajahmundry', state: 'Andhra Pradesh', type: 'city' },
  { name: 'Tirupati', state: 'Andhra Pradesh', type: 'city' },
  { name: 'Kadapa', state: 'Andhra Pradesh', type: 'city' },
  { name: 'Kakinada', state: 'Andhra Pradesh', type: 'city' },
  { name: 'Anantapur', state: 'Andhra Pradesh', type: 'city' },
  { name: 'Eluru', state: 'Andhra Pradesh', type: 'city' },
  { name: 'Ongole', state: 'Andhra Pradesh', type: 'city' },
  { name: 'Machilipatnam', state: 'Andhra Pradesh', type: 'city' },
  { name: 'Tenali', state: 'Andhra Pradesh', type: 'town' },
  { name: 'Proddatur', state: 'Andhra Pradesh', type: 'town' },

  // Telangana
  { name: 'Hyderabad', state: 'Telangana', type: 'city' },
  { name: 'Warangal', state: 'Telangana', type: 'city' },
  { name: 'Nizamabad', state: 'Telangana', type: 'city' },
  { name: 'Karimnagar', state: 'Telangana', type: 'city' },
  { name: 'Khammam', state: 'Telangana', type: 'city' },
  { name: 'Ramagundam', state: 'Telangana', type: 'city' },
  { name: 'Mahbubnagar', state: 'Telangana', type: 'city' },
  { name: 'Nalgonda', state: 'Telangana', type: 'city' },
  { name: 'Adilabad', state: 'Telangana', type: 'city' },
  { name: 'Sangareddy', state: 'Telangana', type: 'town' },

  // Maharashtra
  { name: 'Mumbai', state: 'Maharashtra', type: 'city' },
  { name: 'Pune', state: 'Maharashtra', type: 'city' },
  { name: 'Nagpur', state: 'Maharashtra', type: 'city' },
  { name: 'Nashik', state: 'Maharashtra', type: 'city' },
  { name: 'Aurangabad', state: 'Maharashtra', type: 'city' },
  { name: 'Solapur', state: 'Maharashtra', type: 'city' },
  { name: 'Amravati', state: 'Maharashtra', type: 'city' },
  { name: 'Kolhapur', state: 'Maharashtra', type: 'city' },
  { name: 'Ahmednagar', state: 'Maharashtra', type: 'city' },
  { name: 'Sangli', state: 'Maharashtra', type: 'city' },
  { name: 'Jalgaon', state: 'Maharashtra', type: 'city' },
  { name: 'Akola', state: 'Maharashtra', type: 'city' },
  { name: 'Latur', state: 'Maharashtra', type: 'city' },
  { name: 'Dhule', state: 'Maharashtra', type: 'city' },
  { name: 'Nanded', state: 'Maharashtra', type: 'city' },
  { name: 'Satara', state: 'Maharashtra', type: 'city' },
  { name: 'Parbhani', state: 'Maharashtra', type: 'city' },
  { name: 'Chandrapur', state: 'Maharashtra', type: 'city' },

  // Gujarat
  { name: 'Ahmedabad', state: 'Gujarat', type: 'city' },
  { name: 'Surat', state: 'Gujarat', type: 'city' },
  { name: 'Vadodara', state: 'Gujarat', type: 'city' },
  { name: 'Rajkot', state: 'Gujarat', type: 'city' },
  { name: 'Bhavnagar', state: 'Gujarat', type: 'city' },
  { name: 'Jamnagar', state: 'Gujarat', type: 'city' },
  { name: 'Junagadh', state: 'Gujarat', type: 'city' },
  { name: 'Gandhinagar', state: 'Gujarat', type: 'city' },
  { name: 'Anand', state: 'Gujarat', type: 'city' },
  { name: 'Nadiad', state: 'Gujarat', type: 'city' },
  { name: 'Mehsana', state: 'Gujarat', type: 'city' },
  { name: 'Morbi', state: 'Gujarat', type: 'city' },
  { name: 'Surendranagar', state: 'Gujarat', type: 'city' },
  { name: 'Bharuch', state: 'Gujarat', type: 'city' },
  { name: 'Vapi', state: 'Gujarat', type: 'city' },

  // Rajasthan
  { name: 'Jaipur', state: 'Rajasthan', type: 'city' },
  { name: 'Jodhpur', state: 'Rajasthan', type: 'city' },
  { name: 'Kota', state: 'Rajasthan', type: 'city' },
  { name: 'Bikaner', state: 'Rajasthan', type: 'city' },
  { name: 'Udaipur', state: 'Rajasthan', type: 'city' },
  { name: 'Ajmer', state: 'Rajasthan', type: 'city' },
  { name: 'Bhilwara', state: 'Rajasthan', type: 'city' },
  { name: 'Alwar', state: 'Rajasthan', type: 'city' },
  { name: 'Bharatpur', state: 'Rajasthan', type: 'city' },
  { name: 'Pali', state: 'Rajasthan', type: 'city' },
  { name: 'Sikar', state: 'Rajasthan', type: 'city' },
  { name: 'Tonk', state: 'Rajasthan', type: 'city' },

  // Punjab
  { name: 'Ludhiana', state: 'Punjab', type: 'city' },
  { name: 'Amritsar', state: 'Punjab', type: 'city' },
  { name: 'Jalandhar', state: 'Punjab', type: 'city' },
  { name: 'Patiala', state: 'Punjab', type: 'city' },
  { name: 'Bathinda', state: 'Punjab', type: 'city' },
  { name: 'Mohali', state: 'Punjab', type: 'city' },
  { name: 'Hoshiarpur', state: 'Punjab', type: 'city' },
  { name: 'Pathankot', state: 'Punjab', type: 'city' },
  { name: 'Moga', state: 'Punjab', type: 'city' },
  { name: 'Batala', state: 'Punjab', type: 'city' },
  { name: 'Firozpur', state: 'Punjab', type: 'city' },

  // Haryana
  { name: 'Faridabad', state: 'Haryana', type: 'city' },
  { name: 'Gurgaon', state: 'Haryana', type: 'city' },
  { name: 'Gurugram', state: 'Haryana', type: 'city' },
  { name: 'Hisar', state: 'Haryana', type: 'city' },
  { name: 'Rohtak', state: 'Haryana', type: 'city' },
  { name: 'Panipat', state: 'Haryana', type: 'city' },
  { name: 'Karnal', state: 'Haryana', type: 'city' },
  { name: 'Sonipat', state: 'Haryana', type: 'city' },
  { name: 'Ambala', state: 'Haryana', type: 'city' },
  { name: 'Yamunanagar', state: 'Haryana', type: 'city' },
  { name: 'Panchkula', state: 'Haryana', type: 'city' },

  // Uttar Pradesh
  { name: 'Lucknow', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Kanpur', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Agra', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Varanasi', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Meerut', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Allahabad', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Prayagraj', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Bareilly', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Aligarh', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Moradabad', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Saharanpur', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Gorakhpur', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Noida', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Firozabad', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Jhansi', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Muzaffarnagar', state: 'Uttar Pradesh', type: 'city' },
  { name: 'Mathura', state: 'Uttar Pradesh', type: 'city' },

  // Madhya Pradesh
  { name: 'Indore', state: 'Madhya Pradesh', type: 'city' },
  { name: 'Bhopal', state: 'Madhya Pradesh', type: 'city' },
  { name: 'Jabalpur', state: 'Madhya Pradesh', type: 'city' },
  { name: 'Gwalior', state: 'Madhya Pradesh', type: 'city' },
  { name: 'Ujjain', state: 'Madhya Pradesh', type: 'city' },
  { name: 'Sagar', state: 'Madhya Pradesh', type: 'city' },
  { name: 'Dewas', state: 'Madhya Pradesh', type: 'city' },
  { name: 'Satna', state: 'Madhya Pradesh', type: 'city' },
  { name: 'Ratlam', state: 'Madhya Pradesh', type: 'city' },
  { name: 'Rewa', state: 'Madhya Pradesh', type: 'city' },
  { name: 'Murwara', state: 'Madhya Pradesh', type: 'city' },
  { name: 'Singrauli', state: 'Madhya Pradesh', type: 'city' },

  // West Bengal
  { name: 'Kolkata', state: 'West Bengal', type: 'city' },
  { name: 'Howrah', state: 'West Bengal', type: 'city' },
  { name: 'Durgapur', state: 'West Bengal', type: 'city' },
  { name: 'Asansol', state: 'West Bengal', type: 'city' },
  { name: 'Siliguri', state: 'West Bengal', type: 'city' },
  { name: 'Malda', state: 'West Bengal', type: 'city' },
  { name: 'Bardhaman', state: 'West Bengal', type: 'city' },
  { name: 'Kharagpur', state: 'West Bengal', type: 'city' },
  { name: 'Haldia', state: 'West Bengal', type: 'city' },
  { name: 'Raiganj', state: 'West Bengal', type: 'city' },

  // Bihar
  { name: 'Patna', state: 'Bihar', type: 'city' },
  { name: 'Gaya', state: 'Bihar', type: 'city' },
  { name: 'Bhagalpur', state: 'Bihar', type: 'city' },
  { name: 'Muzaffarpur', state: 'Bihar', type: 'city' },
  { name: 'Darbhanga', state: 'Bihar', type: 'city' },
  { name: 'Purnia', state: 'Bihar', type: 'city' },
  { name: 'Bihar Sharif', state: 'Bihar', type: 'city' },
  { name: 'Arrah', state: 'Bihar', type: 'city' },
  { name: 'Begusarai', state: 'Bihar', type: 'city' },
  { name: 'Katihar', state: 'Bihar', type: 'city' },

  // Odisha
  { name: 'Bhubaneswar', state: 'Odisha', type: 'city' },
  { name: 'Cuttack', state: 'Odisha', type: 'city' },
  { name: 'Rourkela', state: 'Odisha', type: 'city' },
  { name: 'Brahmapur', state: 'Odisha', type: 'city' },
  { name: 'Sambalpur', state: 'Odisha', type: 'city' },
  { name: 'Puri', state: 'Odisha', type: 'city' },
  { name: 'Balasore', state: 'Odisha', type: 'city' },
  { name: 'Bhadrak', state: 'Odisha', type: 'city' },
  { name: 'Baripada', state: 'Odisha', type: 'city' },

  // Jharkhand
  { name: 'Ranchi', state: 'Jharkhand', type: 'city' },
  { name: 'Jamshedpur', state: 'Jharkhand', type: 'city' },
  { name: 'Dhanbad', state: 'Jharkhand', type: 'city' },
  { name: 'Bokaro', state: 'Jharkhand', type: 'city' },
  { name: 'Deoghar', state: 'Jharkhand', type: 'city' },
  { name: 'Phusro', state: 'Jharkhand', type: 'city' },
  { name: 'Hazaribagh', state: 'Jharkhand', type: 'city' },
  { name: 'Giridih', state: 'Jharkhand', type: 'city' },

  // Chhattisgarh
  { name: 'Raipur', state: 'Chhattisgarh', type: 'city' },
  { name: 'Bhilai', state: 'Chhattisgarh', type: 'city' },
  { name: 'Bilaspur', state: 'Chhattisgarh', type: 'city' },
  { name: 'Korba', state: 'Chhattisgarh', type: 'city' },
  { name: 'Durg', state: 'Chhattisgarh', type: 'city' },
  { name: 'Rajnandgaon', state: 'Chhattisgarh', type: 'city' },
  { name: 'Jagdalpur', state: 'Chhattisgarh', type: 'city' },

  // Assam
  { name: 'Guwahati', state: 'Assam', type: 'city' },
  { name: 'Silchar', state: 'Assam', type: 'city' },
  { name: 'Dibrugarh', state: 'Assam', type: 'city' },
  { name: 'Jorhat', state: 'Assam', type: 'city' },
  { name: 'Nagaon', state: 'Assam', type: 'city' },
  { name: 'Tinsukia', state: 'Assam', type: 'city' },
  { name: 'Tezpur', state: 'Assam', type: 'city' },

  // Himachal Pradesh
  { name: 'Shimla', state: 'Himachal Pradesh', type: 'city' },
  { name: 'Dharamshala', state: 'Himachal Pradesh', type: 'city' },
  { name: 'Solan', state: 'Himachal Pradesh', type: 'city' },
  { name: 'Mandi', state: 'Himachal Pradesh', type: 'city' },
  { name: 'Palampur', state: 'Himachal Pradesh', type: 'city' },
  { name: 'Kullu', state: 'Himachal Pradesh', type: 'city' },
  { name: 'Manali', state: 'Himachal Pradesh', type: 'town' },

  // Uttarakhand
  { name: 'Dehradun', state: 'Uttarakhand', type: 'city' },
  { name: 'Haridwar', state: 'Uttarakhand', type: 'city' },
  { name: 'Roorkee', state: 'Uttarakhand', type: 'city' },
  { name: 'Haldwani', state: 'Uttarakhand', type: 'city' },
  { name: 'Rudrapur', state: 'Uttarakhand', type: 'city' },
  { name: 'Rishikesh', state: 'Uttarakhand', type: 'city' },
  { name: 'Nainital', state: 'Uttarakhand', type: 'city' },

  // Jammu and Kashmir
  { name: 'Srinagar', state: 'Jammu and Kashmir', type: 'city' },
  { name: 'Jammu', state: 'Jammu and Kashmir', type: 'city' },
  { name: 'Anantnag', state: 'Jammu and Kashmir', type: 'city' },
  { name: 'Baramulla', state: 'Jammu and Kashmir', type: 'city' },
  { name: 'Udhampur', state: 'Jammu and Kashmir', type: 'city' },

  // Goa
  { name: 'Panaji', state: 'Goa', type: 'city' },
  { name: 'Margao', state: 'Goa', type: 'city' },
  { name: 'Vasco da Gama', state: 'Goa', type: 'city' },
  { name: 'Mapusa', state: 'Goa', type: 'town' },
  { name: 'Ponda', state: 'Goa', type: 'town' },

  // Union Territories
  { name: 'New Delhi', state: 'Delhi', type: 'city' },
  { name: 'Delhi', state: 'Delhi', type: 'city' },
  { name: 'Puducherry', state: 'Puducherry', type: 'city' },
  { name: 'Pondicherry', state: 'Puducherry', type: 'city' },
  { name: 'Chandigarh', state: 'Chandigarh', type: 'city' },
  { name: 'Port Blair', state: 'Andaman and Nicobar Islands', type: 'city' },
];

/**
 * Search Indian locations by query
 */
export function searchIndianLocations(query: string): IndianLocation[] {
  if (!query || query.length < 2) {
    return INDIAN_LOCATIONS.slice(0, 10);
  }

  const lowerQuery = query.toLowerCase();
  const matches = INDIAN_LOCATIONS.filter(loc =>
    loc.name.toLowerCase().includes(lowerQuery) ||
    loc.state.toLowerCase().includes(lowerQuery)
  );

  return matches.slice(0, 20); // Return max 20 results
}
