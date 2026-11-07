import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  // Stop camera tracks helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start camera stream
  const startCamera = async () => {
    stopCamera();
    setErrorMessage(null);
    setCapturedPhotoUrl(null);
    setCapturedFile(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasPermission(false);
      setErrorMessage('Camera access is not supported by your browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasPermission(true);
    } catch (err: unknown) {
      setHasPermission(false);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage('Camera permission was denied. Please allow camera access in your browser settings.');
        } else {
          setErrorMessage(err.message || 'Unable to access device camera.');
        }
      } else {
        setErrorMessage('Unable to access device camera.');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `evidence_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      setCapturedFile(file);
      setCapturedPhotoUrl(previewUrl);
    }, 'image/jpeg', 0.88);
  };

  const handleConfirm = () => {
    if (capturedFile) {
      onCapture(capturedFile);
      onClose();
    }
  };

  const handleRetake = () => {
    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
    }
    setCapturedPhotoUrl(null);
    setCapturedFile(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
    >
      <div className="bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 px-6 flex items-center justify-between border-b border-slate-800 text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-teal-400" />
            <h3 id="camera-modal-title" className="text-base font-bold">
              Capture Photo Evidence
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder area */}
        <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
          {errorMessage ? (
            <div className="p-6 text-center text-rose-300 text-xs flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-rose-400" />
              <p className="font-semibold text-sm">Camera Unavailable</p>
              <p className="max-w-xs">{errorMessage}</p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-3 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                Retry Camera
              </button>
            </div>
          ) : capturedPhotoUrl ? (
            <img
              src={capturedPhotoUrl}
              alt="Captured evidence preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls footer */}
        <div className="p-4 px-6 bg-slate-950 flex items-center justify-between">
          {capturedPhotoUrl ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all"
              >
                <Check className="w-4 h-4" />
                Use Photo
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSnap}
                disabled={!hasPermission}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold shadow-lg shadow-teal-500/30 disabled:opacity-50 transition-all active:scale-95"
              >
                <Camera className="w-5 h-5" />
                Snap Evidence
              </button>
              <div className="w-16" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

