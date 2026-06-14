// Using Google Places API (New) for highly accurate location data
export async function searchPlaces(query, province) {
  try {
    console.log(`[Function Calling] Searching Google Places for "${query}" in "${province}"...`);
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return JSON.stringify({ error: "ยังไม่ได้ตั้งค่า GOOGLE_MAPS_API_KEY" });
    }

    const searchQuery = `${query} จังหวัด${province} ประเทศไทย`;

    const url = 'https://places.googleapis.com/v1/places:searchText';
    
    // Requesting relevant fields
    const fieldMask = 'places.displayName.text,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.regularOpeningHours.weekdayDescriptions';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        languageCode: 'th'
      })
    });
    
    if (!response.ok) {
      const errText = await response.text();
      console.error('[Function Calling] Google API Error:', errText);
      
      if (response.status === 429) {
        return JSON.stringify({ 
          fallback_mode: true,
          instruction_to_ai: "โควต้า Google Maps API หมดชั่วคราว ห้ามพยายามค้นหาอีก ให้คุณจัดทริปหรือแนะนำสถานที่โดยใช้ความรู้(ข้อมูล)ในหัวของคุณเอง ห้ามแนบลิงก์แผนที่และดาวรีวิวเด็ดขาด และอย่าลืมพิมพ์บอกเจ้านายอย่างสุภาพว่า 'ตอนนี้ระบบดึงข้อมูลแผนที่โควต้าเต็มชั่วคราว ไอจังเลยขอแนะนำจากประสบการณ์ส่วนตัวนะคะ อาจจะไม่มีแผนที่น้า'" 
        });
      }

      return JSON.stringify({ 
        fallback_mode: true,
        instruction_to_ai: "เกิดข้อผิดพลาดในการเชื่อมต่อ Google API ให้คุณแนะนำสถานที่ด้วยความรู้ของคุณเองแทน และไม่ต้องแนบลิงก์แผนที่" 
      });
    }

    const data = await response.json();
    
    if (!data.places || data.places.length === 0) {
      return JSON.stringify({ message: "ไม่พบสถานที่ที่ตรงกับคำค้นหา" });
    }

    // Transform and limit results
    const results = data.places.slice(0, 8).map(place => {
      // Map price level enum to human readable
      let price = 'ไม่ระบุ';
      if (place.priceLevel === 'PRICE_LEVEL_INEXPENSIVE') price = 'ราคาประหยัด (฿)';
      else if (place.priceLevel === 'PRICE_LEVEL_MODERATE') price = 'ราคาปานกลาง (฿฿)';
      else if (place.priceLevel === 'PRICE_LEVEL_EXPENSIVE') price = 'ราคาสูง (฿฿฿)';
      else if (place.priceLevel === 'PRICE_LEVEL_VERY_EXPENSIVE') price = 'ราคาสูงมาก (฿฿฿฿)';

      // Compact opening hours
      let hours = 'ไม่ระบุเวลาทำการ';
      if (place.regularOpeningHours?.weekdayDescriptions) {
        hours = place.regularOpeningHours.weekdayDescriptions.join(' | ');
      }

      return {
        name: place.displayName?.text || 'ไม่ทราบชื่อ',
        address: place.formattedAddress || 'ไม่ระบุที่อยู่',
        rating: place.rating ? `${place.rating} ดาว (รีวิว ${place.userRatingCount} คน)` : 'ไม่มีคะแนนรีวิว',
        price_level: price,
        opening_hours: hours
      };
    });

    console.log(`[Function Calling] Found ${results.length} places from Google Maps.`);
    return JSON.stringify({ results });

  } catch (error) {
    console.error('[Function Calling] Error:', error);
    return JSON.stringify({ 
      fallback_mode: true,
      instruction_to_ai: "เซิร์ฟเวอร์ขัดข้อง ให้คุณจัดทริปด้วยความรู้ของคุณเองโดยไม่ต้องใส่ลิงก์แผนที่"
    });
  }
}
