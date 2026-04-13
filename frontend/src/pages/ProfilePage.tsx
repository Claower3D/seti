import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, Calendar, MapPin, FileText, Heart, MessageCircle, MoreHorizontal, Trash2, Check, X } from "lucide-react";
import { EditProfileModal } from "../components/EditProfileModal";

export const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    setLoading(true);
    api.get(`/profile/${username}`).then(res => setProfileUser(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLike = async (postId: number) => {
    try {
      await api.post(`/posts/${postId}/like`);
      setProfileUser((prev: any) => ({
        ...prev,
        posts: prev.posts.map((p: any) =>
          p.id === postId ? { ...p, liked: !p.liked, likesCount: (p.likesCount || 0) + (p.liked ? -1 : 1) } : p
        ),
      }));
    } catch { console.error("Failed to like"); }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm("далить запись?")) return;
    try {
      await api.delete(`/posts/${postId}`);
      setProfileUser((prev: any) => ({ ...prev, posts: prev.posts.filter((p: any) => p.id !== postId) }));
    } catch { console.error("Failed to delete"); }
    setOpenMenu(null);
  };

  const handleEditStart = (post: any) => { setEditingId(post.id); setEditText(post.content); setOpenMenu(null); };

  const handleEditSave = async (postId: number) => {
    if (!editText.trim()) return;
    try {
      await api.patch(`/posts/${postId}`, { content: editText });
      setProfileUser((prev: any) => ({ ...prev, posts: prev.posts.map((p: any) => p.id === postId ? { ...p, content: editText } : p) }));
      setEditingId(null);
    } catch { console.error("Failed to edit"); }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        style={{ width: "40px", height: "40px", border: "4px solid var(--primary-color)", borderTopColor: "transparent", borderRadius: "50%" }} />
    </div>
  );

  if (!profileUser) return (
    <div style={{ textAlign: "center", padding: "80px", color: "var(--text-secondary)" }}>ользователь не найден</div>
  );

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel" style={{ overflow: "hidden", marginBottom: "30px", border: "1px solid rgba(0,242,255,0.1)" }}>
        <div style={{ height: "200px", background: "linear-gradient(45deg, #050608, #1a1a2e)", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 50% 50%, rgba(0,242,255,0.1) 0%, transparent 70%)" }}></div>
          <div style={{ position: "absolute", bottom: "-50px", left: "24px" }}>
            <img src={profileUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.username}`} alt="avatar"
              style={{ width: "120px", height: "120px", borderRadius: "24px", border: "4px solid var(--bg-color)", boxShadow: "var(--neon-glow)", objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: "8px", right: "8px", width: "18px", height: "18px", background: "#00ff00", borderRadius: "50%", border: "3px solid var(--bg-color)", boxShadow: "0 0 10px #00ff00" }}></div>
          </div>
        </div>

        <div style={{ padding: "70px 24px 30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <h1 style={{ fontSize: "2.2rem", fontWeight: "900", marginBottom: "4px", letterSpacing: "-1px" }} className="neon-text">{profileUser.username}</h1>
              <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  <Calendar size={15} className="neon-text-purple" />
                  SETI User since {new Date(profileUser.createdAt).toLocaleDateString()}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  <MapPin size={15} className="neon-text" /> Earth Sector
                </div>
              </div>
              <p style={{ color: "#cbd5e1", fontSize: "1.05rem", lineHeight: "1.6", marginBottom: "24px", maxWidth: "600px", borderLeft: "2px solid var(--primary-color)", paddingLeft: "16px" }}>
                {profileUser.bio || "тот пользователь ещё не заполнил биографию."}
              </p>
            </div>
            {isOwnProfile && (
              <button className="btn-primary" onClick={() => setIsEditModalOpen(true)}>
                <Edit3 size={18} /> едактировать
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "40px", marginTop: "10px" }}>
            {[{ label: "осты", value: (profileUser.posts || []).length }, { label: "рузья", value: (profileUser.friends || []).length }, { label: "импульсы", value: 0 }].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: "1.8rem", fontWeight: "900", lineHeight: 1 }} className="neon-text-purple">{value}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <FileText className="neon-text" size={24} />
        <h2 style={{ fontSize: "1.6rem", fontWeight: "900", letterSpacing: "-0.5px" }}>рхив данных</h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <AnimatePresence>
          {(profileUser.posts || []).length > 0 ? profileUser.posts.map((post: any, index: number) => (
            <motion.div key={post.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }} className="glass-panel"
              style={{ padding: "24px", borderLeft: index % 2 === 0 ? "4px solid var(--primary-color)" : "4px solid var(--secondary-color)" }}>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--primary-color)", boxShadow: "0 0 5px var(--primary-color)" }}></div>
                  {new Date(post.createdAt).toLocaleString()}
                </div>
                {isOwnProfile && (
                  <div style={{ position: "relative" }} ref={openMenu === post.id ? menuRef : null}>
                    <button onClick={() => setOpenMenu(openMenu === post.id ? null : post.id)}
                      style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px", display: "flex" }}>
                      <MoreHorizontal size={20} />
                    </button>
                    <AnimatePresence>
                      {openMenu === post.id && (
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                          className="glass-panel" style={{ position: "absolute", right: 0, top: "32px", zIndex: 100, minWidth: "160px", padding: "8px", border: "1px solid rgba(0,242,255,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
                          <button onClick={() => handleEditStart(post)}
                            style={{ width: "100%", background: "none", border: "none", color: "#e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "600" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,242,255,0.08)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                            <Edit3 size={16} style={{ color: "var(--primary-color)" }} /> едактировать
                          </button>
                          <button onClick={() => handleDelete(post.id)}
                            style={{ width: "100%", background: "none", border: "none", color: "#e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "600" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,0,100,0.08)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                            <Trash2 size={16} style={{ color: "#ff3060" }} /> далить
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {editingId === post.id ? (
                <div style={{ marginBottom: "20px" }}>
                  <textarea className="input-field" value={editText} onChange={e => setEditText(e.target.value)} autoFocus
                    style={{ width: "100%", minHeight: "80px", resize: "none", fontSize: "1.05rem", marginBottom: "12px" }} />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => handleEditSave(post.id)} className="btn-primary"
                      style={{ padding: "8px 20px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Check size={16} /> Сохранить
                    </button>
                    <button onClick={() => setEditingId(null)}
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", cursor: "pointer", padding: "8px 20px", borderRadius: "10px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
                      <X size={16} /> тмена
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: "1.1rem", lineHeight: "1.7", color: "#f1f5f9", marginBottom: "20px" }}>{post.content}</p>
              )}

              <div style={{ display: "flex", gap: "24px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <button onClick={() => handleLike(post.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", fontWeight: "700", color: post.liked ? "#ff3060" : "var(--text-secondary)" }}>
                  <Heart size={20} fill={post.liked ? "#ff3060" : "none"} style={{ filter: post.liked ? "drop-shadow(0 0 6px #ff3060)" : "none", transition: "all 0.2s" }} />
                  {post.likesCount > 0 ? post.likesCount : "айк"}
                </button>
                <button style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", fontWeight: "700" }}>
                  <MessageCircle size={20} /> омментарий
                </button>
              </div>
            </motion.div>
          )) : (
            <div className="glass-panel" style={{ padding: "60px", textAlign: "center", color: "var(--text-secondary)", border: "1px dashed var(--border-color)" }}>
              {isOwnProfile ? " вас пока нет постов. апишите первый!" : " пользователя пока нет постов."}
            </div>
          )}
        </AnimatePresence>
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}
        currentUser={profileUser} onUpdate={(updated: any) => setProfileUser({ ...profileUser, ...updated })} />
    </div>
  );
};
