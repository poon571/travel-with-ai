import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  let user = null;
  if (token) {
    user = await verifyAuth(token).catch(() => null);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f8ff', color: '#1a202c', fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#0ea5e9', textAlign: 'center' }}>🏖️ เที่ยวกับไอ (Travel with AI)</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem', textAlign: 'center', maxWidth: '600px', lineHeight: '1.6' }}>
        ผู้ช่วยจัดทริป 77 จังหวัดทั่วไทยสุดฉลาด คุยสนุกเหมือนเพื่อนรู้ใจ 
        ออกแบบทริปตามงบประมาณและไลฟ์สไตล์ของคุณโดยเฉพาะ
      </p>

      {user ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>สวัสดีคุณ <strong>{user.username}</strong>! พร้อมไปเที่ยวกันหรือยัง?</p>
          <Link href="/chat" style={{ padding: '1rem 2rem', backgroundColor: '#0ea5e9', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem', display: 'inline-block' }}>
            เข้าสู่หน้าแชทเลย
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/login" style={{ padding: '1rem 2rem', backgroundColor: '#0ea5e9', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}>
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" style={{ padding: '1rem 2rem', backgroundColor: '#ffffff', color: '#0ea5e9', border: '2px solid #0ea5e9', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}>
            สมัครสมาชิกใหม่
          </Link>
        </div>
      )}
    </div>
  );
}
