import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNotifications } from './NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface CallContextType {
    callState: 'idle' | 'outgoing' | 'incoming' | 'active';
    callFriend: any;
    callIsVideo: boolean;
    isMuted: boolean;
    isVideoOff: boolean;
    isSpeaker: boolean;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    startCall: (friend: any, video: boolean) => Promise<void>;
    acceptCall: () => Promise<void>;
    endCall: () => void;
    toggleMute: () => void;
    toggleVideo: () => void;
    toggleSpeaker: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { ws, lastMessage } = useNotifications();
    
    const [callState, setCallState] = useState<'idle' | 'outgoing' | 'incoming' | 'active'>('idle');
    const [callFriend, setCallFriend] = useState<any>(null);
    const [callIsVideo, setCallIsVideo] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(true); // Default to speaker for web calls
    
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
    
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);
    const dialtoneRef = useRef<HTMLAudioElement | null>(null);

    const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ];

    // Initialize audio elements for tones
    useEffect(() => {
        const ring = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3'); // Incoming call
        ring.loop = true;
        ringtoneRef.current = ring;

        const dial = new Audio('https://assets.mixkit.co/active_storage/sfx/1358/1358-preview.mp3'); // Dialing tone
        dial.loop = true;
        dialtoneRef.current = dial;
        
        return () => {
            ring.pause();
            dial.pause();
        };
    }, []);

    const playRingtone = () => ringtoneRef.current?.play().catch(() => {});
    const stopRingtone = () => { if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; } };
    
    const playDialtone = () => dialtoneRef.current?.play().catch(() => {});
    const stopDialtone = () => { if (dialtoneRef.current) { dialtoneRef.current.pause(); dialtoneRef.current.currentTime = 0; } };

    const endCall = useCallback(() => {
        if (ws && callFriend && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'call_end', receiverId: callFriend.id }));
        }
        
        stopRingtone();
        stopDialtone();

        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
        }
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        
        setLocalStream(null);
        setRemoteStream(null);
        setCallState('idle');
        setCallFriend(null);
        setIsMuted(false);
        setIsVideoOff(false);
    }, [ws, callFriend, localStream]);

    const startCall = useCallback(async (friend: any, video: boolean) => {
        if (!ws) return;
        setCallFriend(friend);
        setCallIsVideo(video);
        setCallState('outgoing');
        playDialtone();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
            setLocalStream(stream);

            const pc = new RTCPeerConnection({ iceServers });
            pcRef.current = pc;
            stream.getTracks().forEach(t => pc.addTrack(t, stream));

            const remoteS = new MediaStream();
            setRemoteStream(remoteS);
            pc.ontrack = (e) => {
                e.streams[0].getTracks().forEach(t => remoteS.addTrack(t));
            };

            pc.onicecandidate = (e) => {
                if (e.candidate && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ action: 'call_ice', receiverId: friend.id, candidate: e.candidate }));
                }
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.send(JSON.stringify({ action: 'call_offer', receiverId: friend.id, offer, isVideo: video }));
        } catch (err: any) {
            console.error('Failed to start call:', err);
            alert('Не удалось получить доступ к камере или микрофону. Убедитесь, что они не используются другим приложением.');
            endCall();
        }
    }, [ws, endCall]);

    const acceptCall = useCallback(async () => {
        if (!ws || !callFriend || !pendingOfferRef.current) return;
        setCallState('active');
        stopRingtone();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callIsVideo });
            setLocalStream(stream);

            const pc = new RTCPeerConnection({ iceServers });
            pcRef.current = pc;
            stream.getTracks().forEach(t => pc.addTrack(t, stream));

            const remoteS = new MediaStream();
            setRemoteStream(remoteS);
            pc.ontrack = (e) => {
                e.streams[0].getTracks().forEach(t => remoteS.addTrack(t));
            };

            pc.onicecandidate = (e) => {
                if (e.candidate && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ action: 'call_ice', receiverId: callFriend.id, candidate: e.candidate }));
                }
            };

            await pc.setRemoteDescription(pendingOfferRef.current);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ action: 'call_answer', receiverId: callFriend.id, answer }));
        } catch (err: any) {
            console.error('Failed to accept call:', err);
            alert('Не удалось получить доступ к камере или микрофону. Убедитесь, что они не используются другим приложением.');
            endCall();
        }
    }, [ws, callFriend, callIsVideo, endCall]);

    const toggleMute = () => {
        if (!localStream) return;
        localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
        setIsMuted(m => !m);
    };

    const toggleVideo = () => {
        if (!localStream) return;
        localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
        setIsVideoOff(v => !v);
    };

    const toggleSpeaker = () => {
        setIsSpeaker(s => !s);
        // On web, actual speaker switching is hard without specific hardware API support (setSinkId)
        // We'll just toggle the state for UI and potentially use native Capacitor plugin in future.
    };

    // Handle incoming signaling messages
    useEffect(() => {
        if (!lastMessage) return;
        const data = lastMessage;

        if (data.action === 'call_offer' && callState === 'idle') {
            const sender = data.sender || { id: data.senderId, username: 'Звонок', avatar: '' };
            setCallFriend(sender);
            setCallIsVideo(!!data.isVideo);
            pendingOfferRef.current = data.offer;
            setCallState('incoming');
            playRingtone();
            return;
        }

        if (data.action === 'call_answer' && pcRef.current) {
            pcRef.current.setRemoteDescription(data.answer);
            setCallState('active');
            stopDialtone();
            return;
        }

        if (data.action === 'call_ice' && pcRef.current) {
            pcRef.current.addIceCandidate(data.candidate).catch(() => {});
            return;
        }

        if (data.action === 'call_end') {
            stopRingtone();
            stopDialtone();
            if (localStream) localStream.getTracks().forEach(t => t.stop());
            if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
            setLocalStream(null);
            setRemoteStream(null);
            setCallState('idle');
            setCallFriend(null);
            return;
        }
    }, [lastMessage, callState, localStream]);

    return (
        <CallContext.Provider value={{ 
            callState, callFriend, callIsVideo, isMuted, isVideoOff, isSpeaker, 
            localStream, remoteStream, startCall, acceptCall, endCall, toggleMute, toggleVideo, toggleSpeaker 
        }}>
            {children}
            <AnimatePresence>
                {callState !== 'idle' && callFriend && (
                    <CallScreen />
                )}
            </AnimatePresence>
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error('useCall must be used within CallProvider');
    return context;
};

// ─── Global Call Screen Component ───
const CallScreen = () => {
    const { 
        callFriend, callIsVideo, callState, isMuted, isVideoOff, isSpeaker,
        localStream, remoteStream, acceptCall, endCall, toggleMute, toggleVideo, toggleSpeaker 
    } = useCall();
    
    if (!callFriend) return null;
    
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (callState !== 'active') return;
        const interval = setInterval(() => setDuration(d => d + 1), 1000);
        return () => clearInterval(interval);
    }, [callState]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const connected = callState === 'active';

    return (
        <motion.div 
            initial={{ opacity: 0, y: 100 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ 
                position: 'fixed', inset: 0, zIndex: 999999, 
                background: callIsVideo ? '#000' : 'linear-gradient(135deg, #0a0a20, #1a1a3a)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
        >
            {/* Remote media element (hidden for audio-only calls, fullscreen for video) */}
            {remoteStream && (
                <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    style={{ 
                        position: 'absolute', 
                        inset: 0, 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        display: callIsVideo ? 'block' : 'none',
                        zIndex: 0
                    }} 
                />
            )}
            
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                <motion.div 
                    animate={!connected ? { scale: [1, 1.1, 1], rotate: [0, 2, -2, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 3 }}
                    style={{ position: 'relative' }}
                >
                    {!connected && (
                        <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', border: '2px solid var(--primary)', opacity: 0.3, animation: 'ping 2s infinite' }} />
                    )}
                    <img 
                        src={callFriend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${callFriend.username}`} 
                        alt="" 
                        style={{ width: '140px', height: '140px', borderRadius: '40px', border: '3px solid var(--primary)', boxShadow: 'var(--glow-strong)' }} 
                    />
                </motion.div>

                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', color: 'white', marginBottom: '8px', textShadow: '0 0 20px rgba(0,0,0,0.5)' }}>{callFriend.username}</h2>
                    <p style={{ color: 'var(--primary)', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                        {callState === 'incoming' ? 'Входящий вызов...' : 
                         callState === 'outgoing' ? 'Набор номера...' : 
                         `Соединение установлено • ${formatTime(duration)}`}
                    </p>
                </div>
            </div>

            {/* Local picture-in-picture for video calls */}
            {callIsVideo && localStream && (
                <motion.div 
                    drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    style={{ position: 'absolute', bottom: '180px', right: '20px', width: '100px', height: '150px', borderRadius: '16px', border: '2px solid var(--primary)', overflow: 'hidden', zIndex: 20 }}
                >
                    <video ref={localVideoRef} autoPlay playsInline muted 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                </motion.div>
            )}

            {/* Controls */}
            <div style={{ position: 'absolute', bottom: '60px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                {callState === 'incoming' ? (
                    <>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={endCall}
                            style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#ff3b3b', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(255,59,59,0.4)' }}>
                            <PhoneOff size={32} />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={acceptCall}
                            style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#00d26a', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(0,210,106,0.4)' }}>
                            <Phone size={32} />
                        </motion.button>
                    </>
                ) : (
                    <>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={toggleMute}
                            style={{ width: '60px', height: '60px', borderRadius: '50%', background: isMuted ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </motion.button>
                        
                        {callIsVideo && (
                            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleVideo}
                                style={{ width: '60px', height: '60px', borderRadius: '50%', background: isVideoOff ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                            </motion.button>
                        )}

                        <motion.button whileTap={{ scale: 0.9 }} onClick={toggleSpeaker}
                            style={{ width: '60px', height: '60px', borderRadius: '50%', background: isSpeaker ? 'var(--primary)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: isSpeaker ? 'black' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isSpeaker ? 'var(--glow)' : 'none' }}>
                            {isSpeaker ? <Volume2 size={24} /> : <VolumeX size={24} />}
                        </motion.button>

                        <motion.button whileTap={{ scale: 0.9 }} onClick={endCall}
                            style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#ff3b3b', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(255,59,59,0.4)' }}>
                            <PhoneOff size={32} />
                        </motion.button>
                    </>
                )}
            </div>

            <style>{`
                @keyframes ping {
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
            `}</style>
        </motion.div>
    );
};
