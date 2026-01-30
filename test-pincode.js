async function testPincodes() {
  const testPincodes = ['642001', '110001', '400001', '600001', '560001', '700001'];
  
  for (const pincode of testPincodes) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&addressdetails=1&limit=1`;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing pincode: ${pincode}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Farmees-App/1.0'
        }
      });
      
      const data = await response.json();
      console.log(`Response status: ${response.status}`);
      console.log(`Results found: ${data.length}`);
      
      if (data.length > 0) {
        const result = data[0];
        console.log(`✓ SUCCESS`);
        console.log(`  Display Name: ${result.display_name}`);
        console.log(`  State: ${result.address?.state || 'N/A'}`);
        console.log(`  City: ${result.address?.city || result.address?.town || result.address?.village || 'N/A'}`);
        console.log(`  Coordinates: ${result.lat}, ${result.lon}`);
      } else {
        console.log('✗ FAILED - No results found');
        console.log('Response:', JSON.stringify(data, null, 2));
      }
      
      // Respect Nominatim usage policy - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1100));
    } catch (error) {
      console.error(`✗ ERROR: ${error.message}`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}\n`);
}

testPincodes();
