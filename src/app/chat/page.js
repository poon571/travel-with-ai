"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./chat.module.css";
import { Send, Plus, Menu, User, Bot, MapPin, LogOut, MessageSquare, MoreVertical, Trash2, Settings } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { regions } from "@/lib/provinces";

const PlaceReviews = ({ query }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/places/reviews?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (data.reviews) setReviews(data.reviews);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  if (loading || reviews.length === 0) return null;

  return (
    <div className={styles.reviewsContainer}>
      {reviews.map((r, i) => (
        <div key={i} className={styles.reviewCard}>
          <div className={styles.reviewHeader}>
            {r.authorPhoto ? (
              <img src={r.authorPhoto} alt={r.author} className={styles.reviewAuthorImg} />
            ) : (
              <div className={styles.reviewAuthorImg} style={{ backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={14} />
              </div>
            )}
            <div className={styles.reviewAuthorName}>{r.author}</div>
            <div className={styles.reviewRating}>
              {'⭐️'.repeat(Math.round(r.rating))}
            </div>
          </div>
          <div className={styles.reviewText} style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.text}</div>
        </div>
      ))}
    </div>
  );
};

const MarkdownComponents = {
  p: ({node, ...props}) => <div style={{ marginBottom: '0.8rem' }} {...props} />,
  a: ({node, ...props}) => {
    const href = props.href || '';
    let rawQuery = null;
    if (href.includes('google.com/maps/search/?api=1&query=')) {
      rawQuery = href.split('query=')[1];
    } else if (href.startsWith('https://map/?q=')) {
      rawQuery = href.split('q=')[1];
    } else if (href.includes('map:')) {
      rawQuery = href.split('map:')[1];
    }

    if (rawQuery) {
      // Replace underscores or pluses with spaces and decode
      const query = decodeURIComponent(rawQuery.replace(/_/g, ' ').replace(/\+/g, ' '));
      return (
        <span key={query}>
          <strong style={{ color: 'var(--text-color)', borderBottom: '2px solid #3b82f6' }}>{props.children}</strong>
          <div style={{ marginTop: '0.8rem', marginBottom: '0.8rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <iframe 
              width="100%" 
              height="250" 
              frameBorder="0" 
              scrolling="no" 
              marginHeight="0" 
              marginWidth="0" 
              src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
            />
          </div>
          <PlaceReviews query={query} />
        </span>
      );
    }
    return <a {...props} target="_blank" rel="noopener noreferrer">{props.children}</a>;
  }
};

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState("beach");
  const [languageMode, setLanguageMode] = useState("standard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("เชียงราย");
  const [isIncognito, setIsIncognito] = useState(false);
  const [incognitoAlertOpen, setIncognitoAlertOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [deleteChatId, setDeleteChatId] = useState(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  
  // User Profile Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');
  const [displayName, setDisplayName] = useState("");
  const [profilePic, setProfilePic] = useState("🧑");
  const [customApiKey, setCustomApiKey] = useState("");
  const [customModel, setCustomModel] = useState("");
  
  const [tempDisplayName, setTempDisplayName] = useState("");
  const [tempProfilePic, setTempProfilePic] = useState("");
  const [tempCustomApiKey, setTempCustomApiKey] = useState("");
  const [tempCustomModel, setTempCustomModel] = useState("");
  const [tempProfileImage, setTempProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  const [chatHistoryList, setChatHistoryList] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const router = useRouter();
  
  const messagesEndRef = useRef(null);

  // Fetch Chat History & Settings
  useEffect(() => {
    fetch("/api/chats")
      .then(res => res.json())
      .then(data => {
        if (data.chats) setChatHistoryList(data.chats);
      })
      .catch(console.error);

    fetch("/api/user/settings")
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setDisplayName(data.display_name || "");
          setProfilePic(data.profile_pic || "🧑");
          setCustomApiKey(data.custom_api_key || "");
          setCustomModel(data.custom_model || "");
        }
      })
      .catch(console.error);
  }, []);

  const loadChat = async (id) => {
    try {
      const res = await fetch(`/api/chats/${id}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        setActiveChatId(id);
        if (window.innerWidth <= 768) setSidebarOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveChatId(null);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        alert('ลบข้อมูลและบัญชีของคุณออกจากระบบเรียบร้อยแล้ว');
        router.push("/login");
      } else {
        const data = await res.json();
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const requestDeleteChat = (e, id) => {
    e.stopPropagation();
    setDeleteChatId(id);
    setMenuOpenId(null);
  };

  const confirmDeleteChat = async () => {
    if (!deleteChatId) return;
    try {
      const res = await fetch(`/api/chats/${deleteChatId}`, { method: 'DELETE' });
      if (res.ok) {
        setChatHistoryList(prev => prev.filter(c => c.id !== deleteChatId));
        if (activeChatId === deleteChatId) {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
    setDeleteChatId(null);
  };

  const openSettings = () => {
    setSettingsTab('profile');
    setTempDisplayName(displayName);
    setTempProfilePic(profilePic);
    setTempCustomApiKey(customApiKey);
    setTempCustomModel(customModel);
    setTempProfileImage(null);
    setPreviewImage(profilePic.startsWith('/') || profilePic.startsWith('http') ? profilePic : null);
    setSettingsOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTempProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
      setTempProfilePic(""); // clear emoji
    }
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const formData = new FormData();
      formData.append("display_name", tempDisplayName);
      if (tempProfileImage) {
        formData.append("profile_image", tempProfileImage);
      } else {
        formData.append("profile_pic", tempProfilePic);
      }
      formData.append("custom_api_key", tempCustomApiKey);
      formData.append("custom_model", tempCustomModel);

      const res = await fetch("/api/user/settings", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setDisplayName(tempDisplayName);
        if (data.profile_pic) {
          setProfilePic(data.profile_pic);
        }
        setCustomApiKey(tempCustomApiKey);
        setCustomModel(tempCustomModel);
        setSettingsOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Theme Change
  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    
    // Add user message to UI
    const newMessages = [...messages, { role: "user", text: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages,
          province: selectedProvince,
          chatId: activeChatId,
          languageMode: languageMode,
          isIncognito: isIncognito
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, { role: "ai", text: data.text }]);
        if (data.chatId && !activeChatId) {
          setActiveChatId(data.chatId);
          // Refresh history list
          fetch("/api/chats")
            .then(res => res.json())
            .then(d => { if(d.chats) setChatHistoryList(d.chats) });
        }
      } else {
        console.error(data.error);
        if (response.status === 401) {
          alert('⚠️ เซสชั่นหมดอายุหรือฐานข้อมูลถูกรีเซ็ต (Render Free Tier) ระบบจะพากลับไปหน้าล็อคอินให้ครับ');
          router.push('/login');
          return;
        }
        setMessages((prev) => [...prev, { role: "ai", text: `⚠️ ${data.error || "ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ"}` }]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "ai", text: "ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่ายครับ" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className={styles.sidebarOverlay} 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
        <div className={styles.sidebarHeader}>
          <button className={styles.newChatBtn} onClick={handleNewChat}>
            <Plus size={18} /> แชทใหม่
          </button>
          
          <button 
            onClick={() => {
              const newState = !isIncognito;
              setIsIncognito(newState);
              if (newState) {
                setIncognitoAlertOpen(true);
              }
            }}
            className={styles.newChatBtn} 
            style={{ marginTop: '0.8rem', backgroundColor: isIncognito ? '#ef4444' : 'var(--bg-color)', color: isIncognito ? 'white' : 'var(--text-color)', border: isIncognito ? 'none' : '1px solid var(--border-color)' }}
          >
            {isIncognito ? '👻 โหมดไร้ตัวตน (เปิด)' : '👻 โหมดไร้ตัวตน (ปิด)'}
          </button>
          
          <div className={styles.provinceSelector}>
            <label className={styles.provinceLabel}><MapPin size={14} /> เลือกจังหวัดเป้าหมาย</label>
            <select 
              value={selectedProvince} 
              onChange={(e) => setSelectedProvince(e.target.value)}
              className={styles.provinceSelect}
              disabled={activeChatId !== null} // Disable changing province in existing chat
            >
              {regions.map((region) => (
                <optgroup key={region.name} label={region.name}>
                  {region.provinces.map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        
        <div className={styles.historyList}>
          {chatHistoryList.map(chat => (
            <div 
              key={chat.id} 
              className={`${styles.historyItem} ${activeChatId === chat.id ? styles.activeHistoryItem : ''}`}
              onClick={() => loadChat(chat.id)}
            >
              <div className={styles.historyItemContent}>
                <MessageSquare size={16} style={{marginRight: '8px'}} />
                <span className={styles.historyTitle}>{chat.title}</span>
              </div>
              <div className={styles.historyItemMenuWrapper}>
                <button 
                  className={styles.moreBtn} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === chat.id ? null : chat.id);
                  }}
                >
                  <MoreVertical size={16} />
                </button>
                {menuOpenId === chat.id && (
                  <div className={styles.dropdownMenu}>
                    <button className={styles.dropdownItem} onClick={(e) => requestDeleteChat(e, chat.id)}>
                      <Trash2 size={14} /> ลบแชท
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.sidebarFooter}>
          <select 
            value={languageMode} 
            onChange={(e) => setLanguageMode(e.target.value)}
            className={styles.themeSelect}
            style={{ marginBottom: '0.8rem' }}
          >
            <option value="standard">🇹🇭 ภาษากลาง</option>
            <option value="local">🗣️ ภาษาถิ่น</option>
            <option value="ayutthaya">🏰 แม่หญิงอยุธยา</option>
            <option value="sukhothai">📜 สุโขทัยสไตล์</option>
            <option value="palace">🌸 แม่หญิงชาววัง</option>
          </select>
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
            className={styles.themeSelect}
            style={{ marginBottom: '0.8rem' }}
          >
            <option value="light">☀️ สว่าง (Light)</option>
            <option value="dark">🌙 มืด (Dark)</option>
            <option value="beach">🏖️ ชายหาด (Beach)</option>
          </select>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={openSettings} className={styles.logoutBtn} style={{ flex: 1, backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}>
              <Settings size={16} /> ตั้งค่า
            </button>
            <button onClick={handleLogout} className={styles.logoutBtn} style={{ flex: 1 }}>
              <LogOut size={16} /> ออก
            </button>
          </div>
          <div style={{ marginTop: '0.8rem', textAlign: 'center' }}>
            <button onClick={() => setPrivacyOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text-color)', opacity: 0.7, fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
              🛡️ นโยบายความเป็นส่วนตัว & เครดิต
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className={styles.main}>
        <div className={styles.topbar} style={{ backgroundColor: isIncognito ? '#ef4444' : 'var(--bg-color)', color: isIncognito ? 'white' : 'var(--text-color)', transition: 'background-color 0.3s' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: 'inherit' }}>
            <Menu size={24} />
          </button>
          <span style={{ marginLeft: '1rem', fontWeight: 'bold' }}>
            เที่ยวกับไอ {isIncognito && '(👻 โหมดไร้ตัวตน)'}
          </span>
        </div>

        <div className={styles.chatContainer}>
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <h2>🏖️ เที่ยวกับไอ (Travel with AI)</h2>
              <p>สวัสดีค่ะ! ไอจังพร้อมเป็นผู้ช่วยจัดทริปให้คุณแล้วค่ะ</p>
              <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
                ตอนนี้คุณเลือกไปเที่ยว: <strong>{selectedProvince}</strong> <br/>
                ตัวอย่างคำถาม: "มีงบ 3000 ไป 2 คน แนะนำหน่อย", "ร้านอาหารพื้นเมืองอร่อยๆ"
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.userMessage : styles.aiMessage}`}>
                <div className={`${styles.avatar} ${msg.role === 'ai' ? styles.aiAvatar : ''}`}>
                  {msg.role === 'user' ? (
                    profilePic.startsWith('/') || profilePic.startsWith('http') ? (
                      <Image src={profilePic} alt="User" width={48} height={48} style={{ objectFit: 'cover', width: '100%', height: '100%' }} unoptimized={profilePic.startsWith('http')} />
                    ) : (
                      <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>
                        {profilePic && profilePic.length < 5 ? profilePic : <User size={20} />}
                      </span>
                    )
                  ) : (
                    <Image src="/ai-profile.jpg" alt="Ai-chan" width={48} height={48} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  )}
                </div>
                <div className={`${styles.messageContent} ${styles.markdown}`}>
                  <ReactMarkdown components={MarkdownComponents}>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className={`${styles.messageWrapper} ${styles.aiMessage}`}>
              <div className={`${styles.avatar} ${styles.aiAvatar}`}>
                <Image src="/ai-profile.jpg" alt="Ai-chan" width={48} height={48} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              </div>
              <div className={styles.messageContent}>
                <span className="typing-indicator">กำลังคิด...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <form className={styles.inputWrapper} onSubmit={handleSubmit}>
            <textarea
              className={styles.textarea}
              placeholder="พิมพ์ข้อความที่ต้องการสอบถาม..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button type="submit" className={styles.sendButton} disabled={!input.trim() || isLoading}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteChatId && (
        <div className={styles.modalOverlay} onClick={() => setDeleteChatId(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>🗑️ ยืนยันการลบแชท</h3>
            <p>คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการสนทนานี้? ข้อมูลจะถูกลบและไม่สามารถกู้คืนได้</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteChatId(null)}>ยกเลิก</button>
              <button className={styles.confirmDeleteBtn} onClick={confirmDeleteChat}>ลบแชท</button>
            </div>
          </div>
        </div>
      )}

      {/* Incognito Alert Modal */}
      {incognitoAlertOpen && (
        <div className={styles.modalOverlay} onClick={() => setIncognitoAlertOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ borderTop: '4px solid #ef4444' }}>
            <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>👻 โหมดไร้ตัวตนกำลังทำงาน!</h3>
            <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
              ในโหมดนี้ ระบบหลังบ้านจะถูกสั่ง <strong>"ห้ามบันทึกประวัติการสนทนา"</strong> เด็ดขาด
            </p>
            <p style={{ lineHeight: '1.6', color: 'var(--text-color)', opacity: 0.8 }}>
              ทันทีที่คุณรีเฟรช (F5) หรือปิดหน้าเว็บนี้ ข้อความแชททั้งหมดจะสูญหายอย่างถาวรเพื่อรักษาสิทธิความเป็นส่วนตัวของคุณครับ
            </p>
            <div className={styles.modalActions} style={{ marginTop: '1.5rem' }}>
              <button 
                className={styles.sendButton} 
                style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', color: '#fff', width: '100%', backgroundColor: '#ef4444', fontWeight: 'bold' }} 
                onClick={() => setIncognitoAlertOpen(false)}
              >
                เข้าใจแล้ว เริ่มแชทเลย!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className={styles.modalOverlay} onClick={() => !isSavingSettings && setSettingsOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>⚙️ การตั้งค่า</h3>
            
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem', marginTop: '1rem' }}>
              <button 
                onClick={() => setSettingsTab('profile')} 
                style={{ padding: '0.5rem', background: 'none', border: 'none', borderBottom: settingsTab === 'profile' ? '2px solid #3b82f6' : '2px solid transparent', color: settingsTab === 'profile' ? '#3b82f6' : 'var(--text-color)', fontWeight: settingsTab === 'profile' ? 'bold' : 'normal', cursor: 'pointer' }}
              >
                โปรไฟล์ส่วนตัว
              </button>
              <button 
                onClick={() => setSettingsTab('bot')} 
                style={{ padding: '0.5rem', background: 'none', border: 'none', borderBottom: settingsTab === 'bot' ? '2px solid #3b82f6' : '2px solid transparent', color: settingsTab === 'bot' ? '#3b82f6' : 'var(--text-color)', fontWeight: settingsTab === 'bot' ? 'bold' : 'normal', cursor: 'pointer' }}
              >
                ตั้งค่าบอท (AI)
              </button>
            </div>

            {settingsTab === 'profile' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>ชื่อที่ให้บอทเรียก</label>
                  <input 
                    type="text" 
                    value={tempDisplayName} 
                    onChange={(e) => setTempDisplayName(e.target.value)} 
                    placeholder="เช่น พี่ปุณ, ท่านประธาน..."
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>รูปโปรไฟล์</label>
                  
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                      {previewImage ? (
                        <img src={previewImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : tempProfilePic ? (
                        tempProfilePic
                      ) : <User size={30} color="var(--text-color)" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ fontSize: '0.9rem', width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-color)', opacity: 0.6 }}>หรือใช้อิโมจิ</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                  </div>

                  <input 
                    type="text" 
                    value={tempProfilePic} 
                    onChange={(e) => {
                      setTempProfilePic(e.target.value);
                      setPreviewImage(null);
                      setTempProfileImage(null);
                    }} 
                    placeholder="เช่น 🧑, 🦸, 🐶"
                    maxLength={2}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  />
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>เขตอันตราย (Danger Zone)</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-color)', opacity: 0.7, marginBottom: '0.8rem' }}>ตามนโยบาย PDPA คุณมีสิทธิลบข้อมูลส่วนบุคคลของคุณทั้งหมดออกจากระบบ (Right to Erasure)</p>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      if (confirm('คำเตือน: การลบบัญชีจะเป็นการลบข้อมูลโปรไฟล์และการสนทนาทั้งหมดของคุณอย่างถาวร และไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่?')) {
                        handleDeleteAccount();
                      }
                    }}
                    style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
                  >
                    🗑️ ลบบัญชีและข้อมูลทั้งหมด
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Custom API Key (Gemini)</label>
                  <input 
                    type="password" 
                    value={tempCustomApiKey} 
                    onChange={(e) => setTempCustomApiKey(e.target.value)} 
                    placeholder="ปล่อยว่างเพื่อใช้ API ของระบบ"
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-color)', opacity: 0.7, display: 'block', marginTop: '0.3rem' }}>
                    ระบุ API Key ของคุณเองเพื่อใช้งานส่วนตัว (ข้อมูลจะถูกบันทึกไว้ในฐานข้อมูล)
                  </span>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>AI Model</label>
                  <select 
                    value={!['', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'].includes(tempCustomModel) ? 'other' : tempCustomModel} 
                    onChange={(e) => {
                      if (e.target.value === 'other') {
                        setTempCustomModel('gemini-');
                      } else {
                        setTempCustomModel(e.target.value);
                      }
                    }} 
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  >
                    <option value="">ค่าเริ่มต้น (gemini-3.1-flash-lite)</option>
                    <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (ใหม่ล่าสุด เน้นความเร็ว)</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash (ฉลาดและเสถียร)</option>
                    <option value="other">อื่นๆ (กำหนดเอง)</option>
                  </select>
                  {!['', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'].includes(tempCustomModel) && (
                    <input 
                      type="text" 
                      value={tempCustomModel} 
                      onChange={(e) => setTempCustomModel(e.target.value)} 
                      placeholder="ระบุชื่อโมเดล เช่น gemini-2.5-pro"
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', marginTop: '0.5rem' }}
                    />
                  )}
                </div>
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setSettingsOpen(false)} disabled={isSavingSettings}>ยกเลิก</button>
              <button 
                className={styles.sendButton} 
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', color: '#fff' }} 
                onClick={saveSettings} 
                disabled={isSavingSettings}
              >
                {isSavingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy & Credits Modal */}
      {privacyOpen && (
        <div className={styles.modalOverlay} onClick={() => setPrivacyOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>🛡️ นโยบายความเป็นส่วนตัว & เครดิต</h3>
            
            <div style={{ fontSize: '0.9rem', lineHeight: '1.6', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <h4 style={{ color: '#3b82f6', marginTop: '0.5rem' }}>นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)</h4>
              <p>เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ ข้อมูลรหัสผ่านจะถูกเข้ารหัส (Hashed) เพื่อความปลอดภัยสูงสุด ข้อมูลการสนทนาและประวัติการเดินทางจะถูกจัดเก็บเพื่อใช้ในการให้บริการของระบบเท่านั้น <strong>เราไม่มีนโยบายนำข้อมูลของคุณไปขายหรือเปิดเผยให้บุคคลที่สาม</strong></p>
              <p>ผู้ใช้มีสิทธิลบข้อมูลทั้งหมดของตนเองออกจากระบบได้อย่างถาวรผ่านเมนู "ตั้งค่า"</p>

              <h4 style={{ color: '#3b82f6', marginTop: '1.5rem' }}>เครดิตและลิขสิทธิ์ (Credits)</h4>
              <ul style={{ paddingLeft: '1.5rem', listStyleType: 'disc' }}>
                <li><strong>AI Engine:</strong> ขับเคลื่อนและประมวลผลโดย <a href="https://deepmind.google/technologies/gemini/" target="_blank" style={{ color: '#3b82f6' }}>Google Gemini API</a></li>
                <li><strong>Map & Places Data:</strong> ข้อมูลแผนที่ รีวิว และการค้นหาสถานที่โดย <a href="https://developers.google.com/maps" target="_blank" style={{ color: '#3b82f6' }}>Google Maps Platform</a></li>
                <li><strong>UI & Icons:</strong> พัฒนาด้วย React/Next.js และไอคอนจาก Lucide React</li>
                <li><strong>Images & Assets:</strong> ภาพโปรไฟล์ AI และภาพพื้นหลังถูกสร้างขึ้นหรือนำมาจากแหล่งที่อนุญาตให้ใช้งานฟรี (Free-to-use / AI Generated)</li>
              </ul>
            </div>

            <div className={styles.modalActions} style={{ marginTop: '1.5rem' }}>
              <button className={styles.sendButton} style={{ padding: '0.5rem 1rem', borderRadius: '8px', color: '#fff', width: '100%' }} onClick={() => setPrivacyOpen(false)}>
                รับทราบและปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
