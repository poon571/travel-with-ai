"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
          
          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>
        
        <div className={styles.linkText}>
          มีบัญชีอยู่แล้ว? <Link href="/login" className={styles.link}>เข้าสู่ระบบ</Link>
        </div>
      </div>
    </div>
  );
}
