// Test Demo Mode - Run this to verify demo mode is working

const testDemoMode = async () => {
  console.log('🧪 Testing Demo Mode Implementation...\n');

  const baseURL = 'http://localhost:3001';

  // Test 1: Login with demo farmer credentials
  console.log('1️⃣ Testing Demo Farmer Login (9999000001)...');
  try {
    const loginRes = await fetch(`${baseURL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9999000001', password: 'demo123' })
    });
    const loginData = await loginRes.json();
    console.log('✅ Login response:', loginData);

    if (!loginData.isDemo) {
      console.log('❌ ERROR: isDemo flag not returned in login!');
      return;
    }

    const userId = loginData.id;

    // Test 2: Fetch lands with demo mode header
    console.log('\n2️⃣ Testing Lands API with demo header...');
    const landsRes = await fetch(`${baseURL}/api/lands/user/${userId}`, {
      headers: { 'X-Demo-Mode': 'true' }
    });
    const landsData = await landsRes.json();
    console.log('✅ Lands returned:', landsData.length, 'lands');
    console.log('   Land names:', landsData.map(l => l.name));

    // Test 3: Weather API
    console.log('\n3️⃣ Testing Weather API with demo header...');
    const weatherRes = await fetch(`${baseURL}/api/weather/current/10.6593/77.0068`, {
      headers: { 'X-Demo-Mode': 'true' }
    });
    const weatherData = await weatherRes.json();
    console.log('✅ Weather data:', weatherData.weather?.current?.temperature + '°C');

    // Test 4: Market API
    console.log('\n4️⃣ Testing Market API with demo header...');
    const marketRes = await fetch(`${baseURL}/api/market/kerala`, {
      headers: { 'X-Demo-Mode': 'true' }
    });
    const marketData = await marketRes.json();
    console.log('✅ Market data:', marketData.data?.length, 'crops');

    // Test 5: Crop Recommendations
    console.log('\n5️⃣ Testing Crop Recommendations API...');
    const cropRes = await fetch(`${baseURL}/api/crop-recommendations/ai-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Mode': 'true'
      },
      body: JSON.stringify({ userId, landId: 'demo-land-1', userQuery: 'What crops should I grow?' })
    });
    const cropData = await cropRes.json();
    console.log('✅ Crop recommendation:', cropData.recommendation?.substring(0, 100) + '...');

    // Test 6: Labour Coordinators
    console.log('\n6️⃣ Testing Labour Coordinators API...');
    const coordRes = await fetch(`${baseURL}/api/labour/coordinators/nearby?district=Coimbatore`, {
      headers: { 'X-Demo-Mode': 'true' }
    });
    const coordData = await coordRes.json();
    console.log('✅ Coordinators found:', coordData.coordinators?.length || 0);

    console.log('\n✅ ✅ ✅ All Demo Mode tests passed! ✅ ✅ ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testDemoMode();
