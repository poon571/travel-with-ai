"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!consent) {
      setError("กรุณายอมรับนโยบายความเป็นส่วนตัว (PDPA) ก่อนสมัครสมาชิก");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Automatically redirect to login after success
        router.push("/login");
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backButton}>
        <ArrowLeft size={20} /> กลับหน้าแรก
      </Link>
      
      <div className={styles.card}>
        <h1 className={styles.title}>สมัครสมาชิกใหม่</h1>
        <p className={styles.subtitle}>มาร่วมจัดทริป 77 จังหวัดทั่วไทยกับไอจังกันเถอะ!</p>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>ตั้งชื่อผู้ใช้งาน (Username)</label>
            <input
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="อย่างน้อย 4 ตัวอักษร"
              minLength={4}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>ตั้งรหัสผ่าน (Password)</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 4 ตัวอักษร"
              minLength={4}
              required
            />
          </div>
          <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1.5rem', display: 'flex' }}>
            <input 
              type="checkbox" 
              id="pdpa-consent" 
              checked={consent} 
              onChange={(e) => setConsent(e.target.checked)} 
              required 
              style={{ marginTop: '0.2rem', cursor: 'pointer' }}
            />
            <label htmlFor="pdpa-consent" style={{ fontSize: '0.85rem', color: 'var(--text-color)', lineHeight: '1.4', cursor: 'pointer', textAlign: 'left' }}>
              ฉันยอมรับ <strong onClick={(e) => { e.preventDefault(); setPrivacyOpen(true); }} style={{ color: '#3b82f6', textDecoration: 'underline' }}>ข้อตกลงและนโยบายความเป็นส่วนตัว (PDPA)</strong> รวมถึงยินยอมให้ระบบเก็บและประมวลผลข้อมูลการสนทนาเพื่อใช้ในการจัดแผนการเดินทาง (ข้อมูลรหัสผ่านจะถูกเข้ารหัสเพื่อความปลอดภัย)
            </label>
          </div>
          
          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>
        
        <div className={styles.linkText}>
          มีบัญชีอยู่แล้ว? <Link href="/login" className={styles.link}>เข้าสู่ระบบ</Link>
        </div>
      </div>

      {/* PDPA Modal */}
      {privacyOpen && (
        <div className={styles.modalOverlay} onClick={() => setPrivacyOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', color: '#1a202c', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', color: '#2b6cb0', fontSize: '1.5rem', fontWeight: 'bold' }}>🛡️ ข้อตกลงและนโยบายความเป็นส่วนตัว (PDPA)</h2>
            
            <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
              <h3 style={{ marginTop: '1rem', color: '#2d3748', fontSize: '1.1rem', fontWeight: 'bold' }}>PDPA คืออะไร?</h3>
              <p><strong>PDPA (Personal Data Protection Act)</strong> หรือ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล คือกฎหมายที่ให้ความคุ้มครองข้อมูลส่วนบุคคลของคนไทย เพื่อไม่ให้ถูกนำไปใช้หรือเปิดเผยโดยไม่ได้รับความยินยอม ซึ่งผู้ใช้มีสิทธิที่จะทราบวัตถุประสงค์ในการเก็บข้อมูล และมีสิทธิขอลบข้อมูลของตนเองได้ทุกเมื่อ</p>
              
              <h3 style={{ marginTop: '1.5rem', color: '#2d3748', fontSize: '1.1rem', fontWeight: 'bold' }}>📌 ข้อตกลงการใช้งานแอปพลิเคชันของเรา</h3>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.5rem' }}><strong>ข้อมูลที่จัดเก็บ:</strong> เราจัดเก็บเฉพาะชื่อผู้ใช้ (Username), รหัสผ่าน (Password ที่ถูกเข้ารหัส Hash อย่างปลอดภัย), และประวัติการสนทนาของคุณเพื่อใช้ในการวางแผนการเดินทางเท่านั้น</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>การใช้ข้อมูล:</strong> ข้อมูลของคุณจะถูกใช้เพื่อประมวลผลและสร้างแผนการเดินทางผ่านระบบ AI (Google Gemini API) เท่านั้น</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>การไม่เปิดเผยข้อมูล:</strong> เราขอให้คำมั่นสัญญาว่าจะ <strong>ไม่มีการนำข้อมูลส่วนบุคคลของคุณไปขาย เผยแพร่ หรือส่งต่อให้บุคคลที่สาม</strong> (Third Party) เพื่อการโฆษณาหรือวัตถุประสงค์อื่นใดโดยเด็ดขาด</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>สิทธิของคุณ (Right to Erasure):</strong> คุณมีสิทธิเต็มที่ในการ <strong>"ลบข้อมูลทั้งหมด"</strong> ของคุณออกจากฐานข้อมูลของเราอย่างถาวร โดยสามารถทำได้ด้วยตนเองผ่านเมนู "ตั้งค่า &gt; ลบบัญชีและข้อมูลทั้งหมด" ภายในแอปพลิเคชัน</li>
              </ul>
              
              <p style={{ marginTop: '1rem', fontStyle: 'italic', color: '#718096', fontSize: '0.85rem' }}>* การทำเครื่องหมายยอมรับในหน้าสมัครสมาชิก ถือว่าคุณได้อ่านและเข้าใจนโยบายนี้อย่างครบถ้วนแล้ว</p>
            </div>

            <button onClick={() => setPrivacyOpen(false)} style={{ marginTop: '1.5rem', width: '100%', padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: 'background 0.2s' }} onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'} onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}>
              รับทราบและปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
