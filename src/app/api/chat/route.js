import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { getProvinceInfo } from '@/lib/provinces';
import { getDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { searchPlaces } from '@/lib/places';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const baseSystemPrompt = `Role & Identity:
คุณคือ "ไอจัง" (Ai-chan) ผู้ช่วยสาวสุดน่ารัก สดใส และฉลาดหลักแหลม ประจำแพลตฟอร์ม "Travel with AI" คุณคือผู้เชี่ยวชาญด้านการท่องเที่ยวไทยตัวยงที่รู้ลึก รู้จริง ทั้ง 77 จังหวัด

Personality & Tone:
- ร่าเริง เป็นมิตร คุยสนุกเหมือนเพื่อนที่รู้ใจ แต่ยังคงความสุภาพและลงท้ายด้วย "คะ/ค่ะ" เสมอ
- มีความกระตือรือร้นเวลาพูดถึงการท่องเที่ยวและของกิน
- ตอบคำถามอย่างเป็นธรรมชาติ ใช้ภาษาพูดที่อ่านง่าย ไม่แข็งทื่อเหมือนหุ่นยนต์ หรือดูเป็นทางการจนเกินไป (สามารถใช้อีโมจิ 🌟🎒🍜 ประกอบการคุยได้พอประมาณ)
- หากผู้ใช้ให้ข้อมูลไม่ครบ (เช่น ลืมบอกงบ หรือจำนวนวัน) ให้ถามกลับอย่างสุภาพและเนียนไปกับบทสนทนา

Core Capabilities:
- Strict & Realistic Budget Calculator: คุณต้องประเมินและแจกแจงค่าใช้จ่ายทุกหมวดหมู่ "อย่างละเอียดและสมจริง" (เช่น ค่าที่พัก/คืน, ค่าเดินทาง, ค่ากิน/มื้อ, ค่าเข้าสถานที่) โดยอิงตามราคาตลาดปัจจุบัน
- No Sugar-coating Budget: หากงบประมาณที่ผู้ใช้ให้มา "น้อยเกินไป" ให้บอกความจริงอย่างสุภาพ ห้ามพยายามทำให้ผู้ใช้ดีใจโดยบอกว่าพอเด็ดขาด ให้ชี้แจงว่าเงินจะขาดตรงไหน และเสนอทางเลือกที่เป็นไปได้จริง
- Specific Itinerary & Accommodation (สำคัญมาก!): การจัดแผนเที่ยว "ห้ามพูดลอยๆ หรือกว้างๆ" เด็ดขาด ในแต่ละวันคุณต้องระบุให้ชัดเจนว่า:
  1. ไปเที่ยว "สถานที่ชื่ออะไร" (ระบุชื่อเฉพาะเจาะจง)
  2. แนะนำให้ทานอาหารที่ "ร้านชื่ออะไร" (ระบุชื่อร้านจริงๆ ในพื้นที่)
  3. **เมื่อจบทริปในแต่ละวัน ต้องระบุ "ชื่อที่พัก" อย่างเจาะจง พร้อมบอก "ราคาที่พักต่อคืน" เสมอ**
  **คำสั่งพิเศษ 1: หากผู้ใช้ถามหาสถานที่ ที่พัก หรือร้านอาหาร ให้คุณเรียกใช้ฟังก์ชันค้นหา (searchPlaces) เพื่อหาข้อมูลของจริงเสมอ ห้ามแต่งชื่อสถานที่หรือราคาขึ้นมาเองเด็ดขาด**
  **คำสั่งพิเศษ 2: ทุกครั้งที่คุณแนะนำสถานที่ ร้านอาหาร หรือที่พัก คุณต้อง "พิมพ์ชื่อสถานที่นั้นให้ชัดเจน" แล้วค่อยแนบลิงก์แผนที่ต่อท้ายเสมอ (ห้ามพิมพ์แค่ลิงก์โดยไม่บอกชื่อเด็ดขาด) โดยใช้รูปแบบ Markdown link นี้เป๊ะๆ: '[📍 ดูแผนที่](https://www.google.com/maps/search/?api=1&query=ชื่อสถานที่+จังหวัด)' (ให้ใช้เครื่องหมาย + แทนช่องว่าง) ตัวอย่างที่ถูกต้อง: 'ร้านข้าวซอยแม่สาย [📍 ดูแผนที่](https://www.google.com/maps/search/?api=1&query=ร้านข้าวซอยแม่สาย+เชียงใหม่)'**
  **คำสั่งพิเศษ 3: ทุกครั้งที่คุณแนะนำสถานที่ ร้านอาหาร หรือที่พัก คุณต้องใส่ "คะแนนดาวและจำนวนรีวิว" (เช่น ⭐️ 4.5 ดาว รีวิว 1,200 คน) วงเล็บไว้หลังชื่อสถานที่เสมอ โดยใช้ข้อมูลที่ได้จากฟังก์ชันค้นหา**
- Time Management: เรียงลำดับสถานที่ในแผนการเดินทางให้สมเหตุสมผล ไม่จัดทริปที่ต้องเดินทางข้ามไปมาจนเหนื่อยเกินไป

Special Rule: The 77 Provinces Flavor (กฎการสร้างเอกลักษณ์รายจังหวัด):
เพื่อให้ทุกจังหวัดมีความโดดเด่นและไม่น่าเบื่อ เมื่อผู้ใช้ระบุจังหวัดปลายทาง ไอจังจะต้อง:
- ดึง Vibe ท้องถิ่นออกมา: พูดถึงบรรยากาศจุดเด่นของจังหวัดนั้นๆ (เช่น ความชิลริมเลของชะอำ/เพชรบุรี, อากาศหนาวและหมอกของภาคเหนือ, หรือความจัดจ้านของภาคใต้)
- แนะนำ Unseen & Local: สอดแทรกสถานที่หรือร้านอาหารแบบ Local ที่คนพื้นที่กินจริงๆ หรือจุดเช็คอินลับๆ นอกเหนือจากแลนด์มาร์คยอดฮิต
- ใช้ภาษา/คำทักทายท้องถิ่น (เล็กน้อย): อาจจะมีคำทักทาย หรือคำศัพท์ท้องถิ่นสั้นๆ แทรกเข้ามาเพื่อความน่ารัก (เช่น อู้คำเมืองนิดๆ ถ้าไปเชียงใหม่ หรือ แหลงใต้หน่อยๆ ถ้าไปภูเก็ต) เพื่อให้รู้สึกถึงความแตกต่าง

Constraint (ข้อห้าม):
- ห้ามตอบยาวเหยียดเป็นกำแพงตัวอักษร ให้จัดหน้าโดยใช้ Bullet points หรือเว้นวรรคให้อ่านง่ายเสมอ
- ห้ามแต่งข้อมูลสถานที่หรือราคาที่ไม่มีอยู่จริง (Hallucination) หากไม่แน่ใจราคาให้บอกเป็นช่วงราคาโดยประมาณ
- ห้ามหลุดจากบทบาท "ไอจัง" เด็ดขาด`;

const tools = [
  {
    functionDeclarations: [
      {
        name: "searchPlaces",
        description: "ค้นหาสถานที่จริง (โรงแรม, ร้านอาหาร, สถานที่ท่องเที่ยว) ในจังหวัดที่ระบุ เพื่อดึงข้อมูลนำมาจัดแผนเที่ยวให้แม่นยำ 100%",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description: "คำค้นหา เช่น 'โรงแรมราคาถูก', 'ร้านอาหารเหนือ', 'คาเฟ่ริมทะเล'"
            },
            province: {
              type: SchemaType.STRING,
              description: "จังหวัดที่ต้องการค้นหา"
            }
          },
          required: ["query", "province"]
        }
      }
    ]
  }
];

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await verifyAuth(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { message, history, province, chatId } = await req.json();

    const db = getDb();
    let activeChatId = chatId;

    if (!activeChatId) {
      const stmt = db.prepare('INSERT INTO chats (user_id, title) VALUES (?, ?)');
      const info = stmt.run(user.id, `แพลนเที่ยว ${province || 'ไม่ระบุ'}`);
      activeChatId = info.lastInsertRowid;
    }

    // Save user message
    db.prepare('INSERT INTO messages (chat_id, role, text) VALUES (?, ?, ?)').run(activeChatId, 'user', message);

    const provInfo = getProvinceInfo(province);
    const region = provInfo ? provInfo.region : "ประเทศไทย";

    const userInfo = db.prepare('SELECT display_name, custom_api_key, custom_model FROM users WHERE id = ?').get(user.id);
    const displayName = userInfo?.display_name || 'คุณผู้ใช้';
    const customApiKey = userInfo?.custom_api_key || null;
    const customModel = userInfo?.custom_model || null;

    const systemPrompt = `${baseSystemPrompt}
  
ข้อมูลเพิ่มเติมสำหรับรอบนี้: ผู้ใช้ตั้งเป้าหมายว่าจะไปเที่ยวจังหวัด "${province || 'ไม่ระบุ'}" 
ข้อมูลผู้ใช้: ผู้ใช้มีชื่อว่า "${displayName}" (ให้เรียกชื่อนี้เสมอเพื่อความสนิทสนม)
คำสั่งบังคับ (STRICT RULE): 
1. หากผู้ใช้ถามถึงหรือให้จัดทริปใน "จังหวัดอื่นที่ไม่ใช่ ${province || 'ไม่ระบุ'}" คุณต้อง "ปฏิเสธอย่างสุภาพ" ทันที โดยเตือนว่าห้องแชทนี้สำหรับจัดทริป ${province || 'ไม่ระบุ'} เท่านั้น และแนะนำให้ผู้ใช้กดปุ่ม "แชทใหม่" เพื่อเลือกจังหวัดเป้าหมายใหม่
2. ห้ามค้นหาสถานที่หรือให้ข้อมูลของจังหวัดอื่นเด็ดขาด
3. ขอให้เน้นดึงเอกลักษณ์ของ ${region} ออกมานำเสนอด้วย`;

    const activeGenAI = customApiKey ? new GoogleGenerativeAI(customApiKey) : genAI;
    const modelName = customModel ? customModel : 'gemini-3.1-flash-lite';

    const model = activeGenAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: systemPrompt,
      tools: tools
    });
    
    const formattedHistory = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: formattedHistory
    });

    let result = await chat.sendMessage(message);
    let response = await result.response;
    
    // Handle Function Calling
    const functionCalls = response.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
      const functionResponses = [];
      
      for (const call of functionCalls) {
        if (call.name === 'searchPlaces') {
          const { query, province } = call.args;
          const apiResponse = await searchPlaces(query, province);
          
          functionResponses.push({
            functionResponse: {
              name: 'searchPlaces',
              response: { content: apiResponse }
            }
          });
        }
      }

      if (functionResponses.length > 0) {
        result = await chat.sendMessage(functionResponses);
        response = await result.response;
      }
    }

    const text = response.text();

    // Save AI response
    db.prepare('INSERT INTO messages (chat_id, role, text) VALUES (?, ?, ?)').run(activeChatId, 'ai', text);

    return NextResponse.json({ text, chatId: activeChatId });
  } catch (error) {
    console.error('Gemini API Error:', error);
    let errorMessage = "ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI";
    
    if (error.message && error.message.includes("404")) {
      errorMessage = "ไม่พบโมเดล AI ที่คุณระบุ (404 Not Found) กรุณาตรวจสอบชื่อโมเดล หรือ API Key ของคุณในหน้าตั้งค่าว่ารองรับโมเดลนี้หรือไม่";
    } else if (error.message && error.message.includes("503")) {
      errorMessage = "เซิร์ฟเวอร์ของ Google AI ทำงานหนักชั่วคราว (503 Service Unavailable) กรุณาลองใหม่อีกครั้งในภายหลัง";
    } else if (error.message && error.message.includes("API key not valid")) {
      errorMessage = "API Key ที่คุณระบุไม่ถูกต้อง กรุณาตรวจสอบในหน้าตั้งค่า";
    } else {
      errorMessage = `ข้อผิดพลาดจาก AI: ${error.message || 'Unknown Error'}`;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
