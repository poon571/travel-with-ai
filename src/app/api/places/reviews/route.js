import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    const url = 'https://places.googleapis.com/v1/places:searchText';
    
    // Request only the reviews and basic info of the top match
    const fieldMask = 'places.reviews';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'th'
      })
    });
    
    if (!response.ok) {
      const errText = await response.text();
      console.error('[Reviews API] Error:', errText);
      return NextResponse.json({ error: "API Error" }, { status: 500 });
    }

    const data = await response.json();
    
    if (!data.places || data.places.length === 0 || !data.places[0].reviews) {
      return NextResponse.json({ reviews: [] });
    }

    // Return the reviews from the first matched place
    const reviews = data.places[0].reviews.slice(0, 5).map(r => ({
      author: r.authorAttribution?.displayName || 'ผู้ไม่ประสงค์ออกนาม',
      authorPhoto: r.authorAttribution?.photoUri || null,
      rating: r.rating || 0,
      text: r.text?.text || r.originalText?.text || '',
      time: r.relativePublishTimeDescription || ''
    }));

    return NextResponse.json({ reviews });

  } catch (error) {
    console.error('[Reviews API] Catch Error:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
