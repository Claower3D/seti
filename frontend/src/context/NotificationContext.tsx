import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';

interface Toast {
    id: string;
    senderName: string;
    senderAvatar: string;
    content: string;
    type: 'message' | 'notification';
    senderId: number;
}

interface NotificationContextType {
    ws: WebSocket | null;
    toasts: Toast[];
    removeToast: (id: string) => void;
    lastMessage: any;
    unreadCount: number;
    refreshUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const location = useLocation();
    const wsRef = useRef<WebSocket | null>(null);

    const refreshUnreadCount = async () => {
        try {
            const res = await api.get('/messages/unread-count');
            setUnreadCount(res.data.count || 0);
        } catch {}
    };

    useEffect(() => {
        if (user) refreshUnreadCount();
    }, [user]);

    useEffect(() => {
        if (!user?.id) {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
                setWs(null);
            }
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(`${protocol}//${window.location.host}/ws?userId=${user.id}`);

        socket.onopen = () => {
            console.log('Global WebSocket connected');
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const action = data.action || 'send';
            const msg = data.message || data;

            setLastMessage(data);

            if (action === 'read_receipt' || action === 'read') {
                refreshUnreadCount();
            }

            // Logic to show popup
            if (action === 'send' && msg.senderId !== user.id) {
                // Increment unread count globally if it's a new incoming message
                setUnreadCount(prev => prev + 1);

                // DON'T show popup if we are already in the chat with this person
                const isCurrentChat = location.pathname === '/messages' && 
                                    (new URLSearchParams(window.location.search).get('withId') === msg.senderId.toString() || 
                                     (window as any).lastSelectedFriendId === msg.senderId);
                
                if (!isCurrentChat) {
                    const id = Math.random().toString(36).substr(2, 9);
                    const toast: Toast = {
                        id,
                        senderName: msg.sender?.username || 'Друг',
                        senderAvatar: msg.sender?.avatar || '',
                        content: msg.content || 'Отправил файл',
                        type: 'message',
                        senderId: msg.senderId
                    };

                    setToasts(prev => [...prev, toast]);

                    // Auto-remove after 5 seconds
                    setTimeout(() => {
                        removeToast(id);
                    }, 5000);
                }
            }
        };

        socket.onclose = () => {
            console.log('Global WebSocket disconnected');
            // Basic reconnection logic can be added here
        };

        wsRef.current = socket;
        setWs(socket);

        return () => {
            socket.close();
        };
    }, [user?.id, location.pathname]);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ ws, toasts, removeToast, lastMessage, unreadCount, refreshUnreadCount }}>
            {children}
            <GlobalToasts />
        </NotificationContext.Provider>
    );
};

const GlobalToasts = () => {
    const { toasts, removeToast } = useNotifications();
    const navigate = useNavigate();

    return (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 999999, display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'none' }}>
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        onClick={() => {
                            navigate('/messages', { state: { selectedFriendId: toast.senderId } });
                            removeToast(toast.id);
                        }}
                        style={{ 
                            pointerEvents: 'auto',
                            background: 'rgba(10, 15, 30, 0.85)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid var(--primary)',
                            borderRadius: '16px',
                            padding: '16px',
                            width: '320px',
                            cursor: 'pointer',
                            boxShadow: '0 15px 40px rgba(0,0,0,0.4), var(--glow)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Glow decorative element */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)', boxShadow: 'var(--glow-strong)' }} />
                        
                        <img src={toast.senderAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + toast.senderName} 
                             alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid var(--border-bright)' }} />
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '0.9rem', marginBottom: '2px', textShadow: 'var(--glow)' }}>
                                {toast.senderName}
                            </div>
                            <div style={{ color: 'white', fontSize: '0.85rem', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {toast.content}
                            </div>
                        </div>

                        <button 
                            onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// Internal icon for the close button
const X = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
