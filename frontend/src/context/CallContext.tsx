import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNotifications } from './NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

// ─── Native Audio Plugin Bridge ───────────────────────────────────────────────
const NativeAudio = {
    async setCallMode(active: boolean) {
        if (!Capacitor.isNativePlatform()) return;
        try {
            await (Capacitor as any).Plugins.AudioPlugin.setCallMode({ active });
        } catch (e) {
            console.warn('[AudioPlugin] setCallMode failed:', e);
        }
    },
    async setSpeakerOn(enabled: boolean) {
        if (!Capacitor.isNativePlatform()) return;
        try {
            await (Capacitor as any).Plugins.AudioPlugin.setSpeakerOn({ enabled });
        } catch (e) {
            console.warn('[AudioPlugin] setSpeakerOn failed:', e);
        }
    },
};

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
    const [isSpeaker, setIsSpeaker] = useState(!Capacitor.isNativePlatform());

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);
    const dialtoneRef = useRef<HTMLAudioElement | null>(null);

    const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ];

    useEffect(() => {
        const ring = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
        ring.loop = true;
        ringtoneRef.current = ring;
        const dial = new Audio('https://assets.mixkit.co/active_storage/sfx/1358/1358-preview.mp3');
        dial.loop = true;
        dialtoneRef.current = dial;
        return () => { ring.pause(); dial.pause(); };
    }, []);

    const playRingtone = () => ringtoneRef.current?.play().catch(() => {});
    const stopRingtone = () => {
        if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; }
    };
    const playDialtone = () => dialtoneRef.current?.play().catch(() => {});
    const stopDialtone = () => {
        if (dialtoneRef.current) { dialtoneRef.current.pause(); dialtoneRef.current.currentTime = 0; }
    };

    const resetCallState = useCallback(() => {
        NativeAudio.setCallMode(false);
        setLocalStream(null);
        setRemoteStream(null);
        setCallState('idle');
        setCallFriend(null);
        setIsMuted(false);
        setIsVideoOff(false);
        setIsSpeaker(!Capacitor.isNativePlatform());
    }, []);

    // ─── End Call ─────────────────────────────────────────────────────────────
    const endCall = useCallback(() => {
        if (ws && callFriend && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'call_end', receiverId: callFriend.id }));
        }
        stopRingtone();
        stopDialtone();
        if (localStream) localStream.getTracks().forEach(t => t.stop());
        if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
        resetCallState();
    }, [ws, callFriend, localStream, resetCallState]);

    // ─── Start Call (Caller) ──────────────────────────────────────────────────
    const startCall = useCallback(async (friend: any, video: boolean) => {
        if (!ws) return;
        setCallFriend(friend);
        setCallIsVideo(video);
        setCallState('outgoing');
        playDialtone();

        try {
            // 1. Get media FIRST — before any audio mode switch
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
            setLocalStream(stream);

            // 2. Now activate Android audio mode (AFTER mic is already captured)
            await NativeAudio.setCallMode(true);
            await NativeAudio.setSpeakerOn(false); // earpiece by default for caller
            setIsSpeaker(false);

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

    // ─── Accept Call (Receiver) ───────────────────────────────────────────────
    const acceptCall = useCallback(async () => {
        if (!ws || !callFriend || !pendingOfferRef.current) return;
        setCallState('active');
        stopRingtone();

        try {
            // 1. Get media FIRST — before any audio mode switch
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callIsVideo });
            setLocalStream(stream);

            // 2. Activate Android audio mode AFTER mic is captured, speaker ON
            await NativeAudio.setCallMode(true);
            await NativeAudio.setSpeakerOn(true);
            setIsSpeaker(true);

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
        const next = !isSpeaker;
        setIsSpeaker(next);
        NativeAudio.setSpeakerOn(next);
    };

    // ─── Signaling messages ───────────────────────────────────────────────────
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
            // Caller: turn speaker ON once connected so they can hear clearly
            NativeAudio.setSpeakerOn(true);
            setIsSpeaker(true);
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
            resetCallState();
            return;
        }
    }, [lastMessage, callState, localStream, resetCallState]);

    return (
        <CallContext.Provider value={{
            callState, callFriend, callIsVideo, isMuted, isVideoOff, isSpeaker,
            localStream, remoteStream, startCall, acceptCall, endCall, toggleMute, toggleVideo, toggleSpeaker
        }}>
            {children}
            <AnimatePresence>
                {callState !== 'idle' && callFriend && <CallScreen />}
            </AnimatePresence>
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error('useCall must be used within CallProvider');
    return context;
};

// ─── Global Call Screen ───────────────────────────────────────────────────────
const CallScreen = () => {
    const {
        callFriend, callIsVideo, callState, isMuted, isVideoOff, isSpeaker,
        localStream, remoteStream, acceptCall, endCall, toggleMute, toggleVideo, toggleSpeaker
    } = useCall();

    if (!callFriend) return null;

    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const localVideoRef  = useRef<HTMLVideoElement>(null);
    const [duration, setDuration] = useState(0);

    // Attach remote stream to the correct media element
    useEffect(() => {
        if (!remoteStream) return;
        if (callIsVideo && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
        // Always attach to audio element — the audio track plays regardless of video
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, callIsVideo]);

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

    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const connected = callState === 'active';
    const isNative = Capacitor.isNativePlatform();

    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 999999,
                background: callIsVideo ? '#000' : 'linear-gradient(135deg, #0a0a20, #1a1a3a)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                // Respect device safe areas (notch / gesture bar)
                paddingTop: 'env(safe-area-inset-top, 0px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            {/* Hidden audio element — always present for audio routing */}
            <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

            {/* Remote video */}
            {callIsVideo && (
                <video
                    ref={remoteVideoRef}
                    autoPlay playsInline
                    style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'cover', zIndex: 0
                    }}
                />
            )}

            {/* Avatar + status */}
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
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', color: 'white', marginBottom: '8px', textShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
                        {callFriend.username}
                    </h2>
                    <p style={{ color: 'var(--primary)', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                        {callState === 'incoming' ? 'Входящий вызов...' :
                         callState === 'outgoing' ? 'Набор номера...' :
                         `Соединение установлено • ${fmt(duration)}`}
                    </p>
                </div>
            </div>

            {/* Local PiP (video calls) */}
            {callIsVideo && localStream && (
                <motion.div
                    drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    style={{ position: 'absolute', bottom: '200px', right: '20px', width: '100px', height: '150px', borderRadius: '16px', border: '2px solid var(--primary)', overflow: 'hidden', zIndex: 20 }}
                >
                    <video ref={localVideoRef} autoPlay playsInline muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                </motion.div>
            )}

            {/* ─── Controls ─────────────────────────────────────────── */}
            <div style={{
                position: 'absolute',
                // On native: extra padding for gesture bar; on web: standard
                bottom: isNative ? 'calc(env(safe-area-inset-bottom, 24px) + 36px)' : '60px',
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                zIndex: 30,
                flexWrap: 'wrap',
                justifyContent: 'center',
                padding: '0 20px',
            }}>
                {callState === 'incoming' ? (
                    <>
                        {/* Decline */}
                        <motion.button whileTap={{ scale: 0.9 }} onClick={endCall} style={btnStyle('#ff3b3b', 72)}>
                            <PhoneOff size={32} />
                        </motion.button>
                        {/* Accept */}
                        <motion.button whileTap={{ scale: 0.9 }} onClick={acceptCall} style={btnStyle('#00d26a', 72)}>
                            <Phone size={32} />
                        </motion.button>
                    </>
                ) : (
                    <>
                        {/* Mute */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleMute}
                                style={btnStyle(isMuted ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)', 60, true)}>
                                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                            </motion.button>
                            <span style={labelStyle}>{isMuted ? 'Микр. выкл.' : 'Микрофон'}</span>
                        </div>

                        {/* Video toggle */}
                        {callIsVideo && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={toggleVideo}
                                    style={btnStyle(isVideoOff ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)', 60, true)}>
                                    {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                                </motion.button>
                                <span style={labelStyle}>{isVideoOff ? 'Камера выкл.' : 'Камера'}</span>
                            </div>
                        )}

                        {/* Speaker toggle — always visible, more prominent on native */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleSpeaker}
                                style={{
                                    ...btnStyle(isSpeaker ? 'var(--primary)' : 'rgba(255,255,255,0.1)', 60, true),
                                    color: isSpeaker ? 'black' : 'white',
                                    boxShadow: isSpeaker ? 'var(--glow-strong)' : 'none',
                                    border: isSpeaker ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                }}>
                                {isSpeaker ? <Volume2 size={24} /> : <VolumeX size={24} />}
                            </motion.button>
                            <span style={{ ...labelStyle, color: isSpeaker ? 'var(--primary)' : 'rgba(255,255,255,0.5)' }}>
                                {isSpeaker ? 'Динамик' : 'Наушник'}
                            </span>
                        </div>

                        {/* End call */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={endCall} style={btnStyle('#ff3b3b', 72)}>
                                <PhoneOff size={32} />
                            </motion.button>
                            <span style={labelStyle}>Сбросить</span>
                        </div>
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const btnStyle = (bg: string, size: number, hasBorder = false): React.CSSProperties => ({
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    background: bg,
    border: hasBorder ? '1px solid rgba(255,255,255,0.2)' : 'none',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: bg === '#ff3b3b' ? '0 0 30px rgba(255,59,59,0.4)' : bg === '#00d26a' ? '0 0 30px rgba(0,210,106,0.4)' : 'none',
    flexShrink: 0,
});

const labelStyle: React.CSSProperties = {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'center',
    whiteSpace: 'nowrap',
};
