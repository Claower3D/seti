import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, RotateCcw, Zap, ZapOff, Send, Video } from 'lucide-react';

interface StoryCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export const StoryCameraModal: React.FC<StoryCameraModalProps> = ({ isOpen, onClose, onUpload, isUploading }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<BlobPart[]>([]);
  const holdTimerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashOn, setFlashOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedVideoUrl, setCapturedVideoUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimerRef = useRef<any>(null);
  const MAX_VIDEO_SEC = 15;

  const startCamera = useCallback(async () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setCameraError(null);
    setIsReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setIsReady(true);
      }
    } catch {
      setCameraError('Нет доступа к камере. Разрешите доступ в настройках браузера.');
    }
  }, [facingMode]);

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setCapturedFile(null);
      setCapturedVideoUrl(null);
      setRecordSeconds(0);
      startCamera();
    } else {
      stopEverything();
    }
    return () => stopEverything();
  }, [isOpen, startCamera]);

  const stopEverything = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    clearInterval(recordTimerRef.current);
    clearTimeout(holdTimerRef.current);
  };

  // ── Photo capture ──
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    canvas.toBlob(blob => {
      if (blob) setCapturedFile(new File([blob], `story_${Date.now()}.jpg`, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  };

  // ── Video record start ──
  const startVideoRecord = () => {
    if (!streamRef.current || isRecordingVideo) return;
    setIsRecordingVideo(true);
    setRecordSeconds(0);
    videoChunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4';

    const mr = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => { if (e.data.size > 0) videoChunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(videoChunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setCapturedVideoUrl(url);
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      setCapturedFile(new File([blob], `story_video_${Date.now()}.${ext}`, { type: mimeType }));
    };
    mr.start(100);

    recordTimerRef.current = setInterval(() => {
      setRecordSeconds(s => {
        if (s + 1 >= MAX_VIDEO_SEC) { stopVideoRecord(); return MAX_VIDEO_SEC; }
        return s + 1;
      });
    }, 1000);
  };

  // ── Video record stop ──
  const stopVideoRecord = () => {
    clearInterval(recordTimerRef.current);
    setIsRecordingVideo(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // ── Shutter: tap = photo, hold = video ──
  const handleShutterDown = () => {
    holdTimerRef.current = setTimeout(() => { startVideoRecord(); }, 250);
  };

  const handleShutterUp = () => {
    clearTimeout(holdTimerRef.current);
    if (isRecordingVideo) { stopVideoRecord(); }
    else { handleCapture(); }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    setCapturedVideoUrl(null);
    setRecordSeconds(0);
    startCamera();
  };

  const handleSend = () => { if (capturedFile) onUpload(capturedFile); };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('video/')) { setCapturedVideoUrl(url); setCapturedImage(null); }
    else { setCapturedImage(url); setCapturedVideoUrl(null); }
    setCapturedFile(file);
  };

  const isPreviewing = !!(capturedImage || capturedVideoUrl);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', height: '100%', maxWidth: '450px', position: 'relative', overflow: 'hidden' }}>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* ── CAMERA VIEW ── */}
            {!isPreviewing && (
              <>
                {cameraError ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '32px', background: '#0a0a0f', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                    <Video size={48} color='rgba(255,255,255,0.2)' />
                    <p>{cameraError}</p>
                    <button onClick={() => galleryInputRef.current?.click()} style={{ background: 'var(--primary)', border: 'none', borderRadius: '16px', color: 'black', fontWeight: '800', padding: '14px 28px', cursor: 'pointer' }}>
                      Выбрать из галереи
                    </button>
                  </div>
                ) : (
                  <video ref={videoRef} autoPlay playsInline muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />
                )}

                {/* Recording progress bar */}
                {isRecordingVideo && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.2)', zIndex: 15 }}>
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: `${(recordSeconds / MAX_VIDEO_SEC) * 100}%` }}
                      transition={{ duration: 1, ease: 'linear' }}
                      style={{ height: '100%', background: '#ff3060', boxShadow: '0 0 8px #ff3060' }} />
                  </div>
                )}

                {/* Recording timer badge */}
                {isRecordingVideo && (
                  <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,48,96,0.9)', borderRadius: '20px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 15 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', animation: 'pulse 1s infinite' }} />
                    <span style={{ color: 'white', fontWeight: '800', fontSize: '0.9rem' }}>
                      {recordSeconds}с / {MAX_VIDEO_SEC}с
                    </span>
                  </div>
                )}

                {/* TOP BAR */}
                {!isRecordingVideo && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '24px 20px 20px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={22} />
                    </button>
                    <span style={{ color: 'white', fontWeight: '800', fontSize: '1rem', letterSpacing: '0.05em', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                      ИСТОРИЯ
                    </span>
                    <button onClick={() => setFlashOn(f => !f)} style={{ background: flashOn ? 'rgba(255,220,0,0.2)' : 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: `1px solid ${flashOn ? 'rgba(255,220,0,0.4)' : 'rgba(255,255,255,0.1)'}`, color: flashOn ? '#ffdc00' : 'white', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {flashOn ? <Zap size={20} /> : <ZapOff size={20} />}
                    </button>
                  </div>
                )}

                {/* HINT */}
                {!isRecordingVideo && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 8 }}>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', fontWeight: '700', textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                      Нажми — фото<br />Удержи — видео
                    </p>
                  </div>
                )}

                {/* BOTTOM CONTROLS */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 40px 52px', background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>

                  {/* Gallery */}
                  {!isRecordingVideo && (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => galleryInputRef.current?.click()}
                      style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={26} color='white' />
                    </motion.button>
                  )}

                  {/* Shutter */}
                  <motion.button
                    onMouseDown={handleShutterDown}
                    onMouseUp={handleShutterUp}
                    onTouchStart={handleShutterDown}
                    onTouchEnd={handleShutterUp}
                    disabled={!isReady}
                    animate={isRecordingVideo ? { scale: [1, 0.92, 1] } : {}}
                    transition={isRecordingVideo ? { repeat: Infinity, duration: 0.8 } : {}}
                    style={{
                      width: isRecordingVideo ? '88px' : '80px',
                      height: isRecordingVideo ? '88px' : '80px',
                      borderRadius: '50%',
                      background: isRecordingVideo ? '#ff3060' : 'white',
                      border: isRecordingVideo ? '5px solid rgba(255,48,96,0.4)' : '5px solid rgba(255,255,255,0.3)',
                      cursor: isReady ? 'pointer' : 'not-allowed',
                      opacity: isReady ? 1 : 0.4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isRecordingVideo ? '0 0 30px rgba(255,48,96,0.6)' : '0 0 30px rgba(255,255,255,0.3)',
                      outline: '3px solid rgba(255,255,255,0.15)',
                      outlineOffset: '4px',
                      transition: 'background 0.2s, box-shadow 0.2s',
                      userSelect: 'none',
                    }}>
                    {isRecordingVideo
                      ? <div style={{ width: '28px', height: '28px', background: 'white', borderRadius: '6px' }} />
                      : <div style={{ width: '28px', height: '28px', background: 'black', borderRadius: '50%' }} />
                    }
                  </motion.button>

                  {/* Flip */}
                  {!isRecordingVideo && (
                    <motion.button whileTap={{ scale: 0.9, rotate: 180 }}
                      onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')}
                      style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <RotateCcw size={24} />
                    </motion.button>
                  )}
                </div>
              </>
            )}

            {/* ── PREVIEW ── */}
            {isPreviewing && (
              <motion.div initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }}
                style={{ width: '100%', height: '100%', position: 'relative' }}>

                {capturedVideoUrl ? (
                  <video src={capturedVideoUrl} autoPlay loop muted playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={capturedImage!} alt="preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}

                {/* Preview type badge */}
                <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '6px 16px', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em' }}>
                    {capturedVideoUrl ? '🎬 ВИДЕО' : '📸 ФОТО'}
                  </span>
                </div>

                {/* Top bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '24px 20px 20px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)', display: 'flex', alignItems: 'center', zIndex: 10 }}>
                  <button onClick={handleRetake} style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RotateCcw size={20} />
                  </button>
                  <span style={{ flex: 1, textAlign: 'center', color: 'white', fontWeight: '800', fontSize: '1.1rem', letterSpacing: '0.05em' }}>ИСТОРИЯ</span>
                  <div style={{ width: 44 }} />
                </div>

                {/* Send button */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 32px 52px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', justifyContent: 'flex-end', zIndex: 10 }}>
                  <motion.button whileTap={{ scale: 0.92 }} onClick={handleSend} disabled={isUploading}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(135deg, var(--primary, #00f2ff), var(--secondary, #7b2ff7))', border: 'none', borderRadius: '30px', color: 'white', fontWeight: '800', fontSize: '1.05rem', padding: '16px 32px', cursor: isUploading ? 'wait' : 'pointer', opacity: isUploading ? 0.7 : 1, boxShadow: '0 0 30px rgba(0,242,255,0.4)', letterSpacing: '0.05em' }}>
                    {isUploading ? 'Публикация...' : <><Send size={20} /> Опубликовать</>}
                  </motion.button>
                </div>
              </motion.div>
            )}

            <input type="file" ref={galleryInputRef} hidden accept="image/*,video/*" onChange={handleGalleryChange} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
