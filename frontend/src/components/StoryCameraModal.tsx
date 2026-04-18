import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Image as ImageIcon, RotateCcw, Zap, ZapOff, Circle, Send } from 'lucide-react';

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
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashOn, setFlashOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const startCamera = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setCameraError(null);
    setIsReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setIsReady(true);
      }
    } catch (err: any) {
      setCameraError('Нет доступа к камере. Разрешите доступ в настройках браузера.');
    }
  }, [facingMode]);

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setCapturedFile(null);
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isOpen, startCamera]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], `story_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setCapturedFile(file);
      }
    }, 'image/jpeg', 0.92);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    startCamera();
  };

  const handleSend = () => {
    if (capturedFile) {
      onUpload(capturedFile);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCapturedImage(url);
    setCapturedFile(file);
  };

  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'black',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{ width: '100%', height: '100%', maxWidth: '450px', position: 'relative', overflow: 'hidden' }}>

            {/* CANVAS (hidden, for capture) */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* CAMERA VIEW */}
            {!capturedImage && (
              <>
                {cameraError ? (
                  <div style={{
                    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '32px',
                    background: '#0a0a0f', color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: '1rem'
                  }}>
                    <Camera size={48} color='rgba(255,255,255,0.2)' />
                    <p>{cameraError}</p>
                    <button
                      onClick={() => galleryInputRef.current?.click()}
                      style={{ background: 'var(--primary)', border: 'none', borderRadius: '16px', color: 'black', fontWeight: '800', padding: '14px 28px', cursor: 'pointer', fontSize: '1rem' }}
                    >
                      Выбрать из галереи
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                      }}
                    />
                  </motion.div>
                )}

                {/* TOP BAR */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  padding: '24px 20px 20px',
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  zIndex: 10,
                }}>
                  <button onClick={onClose} style={{
                    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)', color: 'white',
                    width: '44px', height: '44px', borderRadius: '50%',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <X size={22} />
                  </button>

                  <span style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem', letterSpacing: '0.05em', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                    ИСТОРИЯ
                  </span>

                  <button onClick={() => setFlashOn(f => !f)} style={{
                    background: flashOn ? 'rgba(255,220,0,0.2)' : 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${flashOn ? 'rgba(255,220,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: flashOn ? '#ffdc00' : 'white',
                    width: '44px', height: '44px', borderRadius: '50%',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {flashOn ? <Zap size={20} /> : <ZapOff size={20} />}
                  </button>
                </div>

                {/* BOTTOM CONTROLS */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '32px 40px 52px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  zIndex: 10,
                }}>
                  {/* GALLERY BUTTON — bottom left */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => galleryInputRef.current?.click()}
                    style={{
                      width: '56px', height: '56px', borderRadius: '16px',
                      background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
                      border: '1.5px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <ImageIcon size={26} color='white' />
                  </motion.button>

                  {/* SHUTTER BUTTON — center */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCapture}
                    disabled={!isReady}
                    style={{
                      width: '80px', height: '80px', borderRadius: '50%',
                      background: 'white',
                      border: '5px solid rgba(255,255,255,0.3)',
                      cursor: isReady ? 'pointer' : 'not-allowed',
                      opacity: isReady ? 1 : 0.4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 30px rgba(255,255,255,0.3)',
                      outline: '3px solid rgba(255,255,255,0.15)',
                      outlineOffset: '4px',
                    }}
                  >
                    <Circle size={28} color='black' fill='black' />
                  </motion.button>

                  {/* FLIP CAMERA — bottom right */}
                  <motion.button
                    whileTap={{ scale: 0.9, rotate: 180 }}
                    onClick={handleFlipCamera}
                    style={{
                      width: '56px', height: '56px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
                      border: '1.5px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <RotateCcw size={24} />
                  </motion.button>
                </div>
              </>
            )}

            {/* PREVIEW captured image */}
            {capturedImage && (
              <motion.div
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ width: '100%', height: '100%', position: 'relative' }}
              >
                <img
                  src={capturedImage}
                  alt="preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* PREVIEW TOP */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  padding: '24px 20px 20px',
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
                  display: 'flex', alignItems: 'center',
                  zIndex: 10,
                }}>
                  <button onClick={handleRetake} style={{
                    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.15)', color: 'white',
                    width: '44px', height: '44px', borderRadius: '50%',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <RotateCcw size={20} />
                  </button>
                  <span style={{
                    flex: 1, textAlign: 'center', color: 'white', fontWeight: '800',
                    fontSize: '1.1rem', letterSpacing: '0.05em', textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                  }}>
                    ИСТОРИЯ
                  </span>
                  <div style={{ width: 44 }} />
                </div>

                {/* SEND BUTTON */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '32px 32px 52px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                  display: 'flex', justifyContent: 'flex-end',
                  zIndex: 10,
                }}>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={handleSend}
                    disabled={isUploading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      background: 'linear-gradient(135deg, var(--primary, #00f2ff), var(--secondary, #7b2ff7))',
                      border: 'none', borderRadius: '30px',
                      color: 'white', fontWeight: '800', fontSize: '1.05rem',
                      padding: '16px 32px', cursor: isUploading ? 'wait' : 'pointer',
                      opacity: isUploading ? 0.7 : 1,
                      boxShadow: '0 0 30px rgba(0,242,255,0.4)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {isUploading ? (
                      <>Публикация...</>
                    ) : (
                      <><Send size={20} /> Опубликовать</>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Hidden gallery input */}
            <input
              type="file"
              ref={galleryInputRef}
              hidden
              accept="image/*,video/*"
              onChange={handleGalleryChange}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
