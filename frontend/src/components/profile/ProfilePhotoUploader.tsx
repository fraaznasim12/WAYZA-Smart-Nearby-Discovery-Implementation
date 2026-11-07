import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Trash2,
  X,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ZoomIn,
  VideoOff,
} from 'lucide-react';
import { avatarService } from '../../services/avatarService';

interface ProfilePhotoUploaderProps {
  currentAvatarUrl?: string | null;
  onAvatarUpdated: (newAvatarUrl: string | null) => void;
  className?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  currentAvatarUrl,
  onAvatarUpdated,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'IDLE' | 'CAMERA' | 'PREVIEW'>('IDLE');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraFallbackInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Cleanup on unmount or dialog close
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Handle closing the modal
  const handleClose = () => {
    stopCameraStream();
    setMode('IDLE');
    setPreviewUrl(null);
    setSelectedFile(null);
    setUploadProgress(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setCameraError(null);
    setZoom(1);
    setIsOpen(false);
  };

  // 1. Gallery selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`Photo exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    // Validate MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage('Supported formats: JPEG, PNG, or WebP only.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setMode('PREVIEW');
  };

  // 2. Start Live Camera (only on explicit user click)
  const startCamera = async () => {
    setCameraError(null);
    setErrorMessage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setCameraError('Browser camera API is not supported. Use file camera capture instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      setMode('CAMERA');

      // Hook up stream after state changes
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => {
            console.error('Video play error:', err);
          });
        }
      }, 100);
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      let msg = 'Camera permission denied or camera unavailable.';
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied. Please allow camera access in your browser settings.';
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        msg = 'No camera device found on this system.';
        setHasCamera(false);
      }
      setCameraError(msg);
      stopCameraStream();
    }
  };

  // 3. Capture frame from camera
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 640, video.videoHeight || 640);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center crop square from video stream
    const startX = ((video.videoWidth || size) - size) / 2;
    const startY = ((video.videoHeight || size) - size) / 2;
    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const capturedFile = new File([blob], `camera-photo-${Date.now()}.png`, {
          type: 'image/png',
        });
        stopCameraStream();
        setSelectedFile(capturedFile);
        const objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
        setMode('PREVIEW');
      },
      'image/png',
      0.95
    );
  };

  // 4. Upload photo to backend
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadProgress(0);
    setErrorMessage(null);

    try {
      const data = await avatarService.uploadAvatar(selectedFile, (progress) => {
        setUploadProgress(progress);
      });
      setSuccessMessage('Profile photo updated successfully!');
      onAvatarUpdated(data.avatarUrl);
      setTimeout(() => {
        handleClose();
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setErrorMessage(msg);
      setUploadProgress(null);
    }
  };

  // 5. Delete existing avatar
  const handleDeleteAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;

    try {
      await avatarService.deleteAvatar();
      setSuccessMessage('Profile photo removed.');
      onAvatarUpdated(null);
      setTimeout(() => {
        handleClose();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove profile photo.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button / Current Avatar Display */}
      <div className="relative group inline-block">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-teal-400/40 bg-slate-800 shadow-lg relative flex items-center justify-center">
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt="User profile avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-teal-300 font-bold text-2xl uppercase">
              <Camera className="w-8 h-8 opacity-70" />
            </div>
          )}

          {/* Hover overlay with Camera trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Change profile photo"
            className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold cursor-pointer"
          >
            <Camera className="w-5 h-5 text-teal-300 mb-0.5" />
            <span>Change</span>
          </button>
        </div>
      </div>

      {/* Upload & Camera Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="photo-uploader-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h2 id="photo-uploader-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-teal-600" />
                <span>Profile Photo</span>
              </h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close photo uploader"
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Alert Feedback Messages */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* View 1: Initial Choices (IDLE Mode) */}
              {mode === 'IDLE' && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 mb-3 flex items-center justify-center">
                      {currentAvatarUrl ? (
                        <img
                          src={currentAvatarUrl}
                          alt="Current avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-10 h-10 text-slate-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Choose a new photograph for your AccessMap profile. JPEG, PNG, or WebP up to 5 MB.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: Gallery */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all flex flex-col items-center justify-center gap-2 text-slate-700 hover:text-teal-700 cursor-pointer group"
                    >
                      <div className="p-3 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold">Choose from Gallery</span>
                      <span className="text-[11px] text-slate-400">PNG, JPG, or WebP</span>
                    </button>

                    {/* Option 2: Live Camera */}
                    <button
                      type="button"
                      onClick={startCamera}
                      className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all flex flex-col items-center justify-center gap-2 text-slate-700 hover:text-teal-700 cursor-pointer group"
                    >
                      <div className="p-3 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold">Take Photo with Camera</span>
                      <span className="text-[11px] text-slate-400">Uses device webcam</span>
                    </button>
                  </div>

                  {/* Fallback Camera File Input (Mobile device native camera prompt) */}
                  {!hasCamera && (
                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        onClick={() => cameraFallbackInputRef.current?.click()}
                        className="text-xs text-teal-600 underline font-semibold"
                      >
                        Try native device camera capture
                      </button>
                    </div>
                  )}

                  {/* Remove photo option if user currently has one */}
                  {currentAvatarUrl && (
                    <div className="pt-4 border-t border-slate-100 flex justify-center">
                      <button
                        type="button"
                        onClick={handleDeleteAvatar}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-700 py-1.5 px-3 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Current Photo</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* View 2: Live Camera Stream */}
              {mode === 'CAMERA' && (
                <div className="space-y-4">
                  {cameraError ? (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                      <div className="font-bold flex items-center gap-1.5 mb-1">
                        <VideoOff className="w-4 h-4 text-amber-600" />
                        <span>Camera Access Notice</span>
                      </div>
                      <p>{cameraError}</p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setMode('IDLE')}
                          className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 font-semibold text-xs text-slate-700 cursor-pointer"
                        >
                          Back to Gallery
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="relative aspect-square max-w-xs mx-auto rounded-3xl overflow-hidden bg-black shadow-inner">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover transform -scale-x-100"
                        />
                        {/* Circular framing guide */}
                        <div className="absolute inset-0 pointer-events-none border-2 border-white/40 rounded-full m-6" />
                      </div>

                      <div className="mt-4 flex items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            stopCameraStream();
                            setMode('IDLE');
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Capture Photo</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* View 3: Image Preview & Adjustment */}
              {mode === 'PREVIEW' && previewUrl && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-36 h-36 mx-auto rounded-full overflow-hidden border-4 border-teal-500/30 bg-slate-900 shadow-xl relative">
                      <img
                        src={previewUrl}
                        alt="Avatar preview"
                        style={{ transform: `scale(${zoom})` }}
                        className="w-full h-full object-cover transition-transform duration-100"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Preview of your new profile photo
                    </p>
                  </div>

                  {/* Zoom Slider */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="range"
                      min="1"
                      max="2.5"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      aria-label="Adjust zoom level"
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                    <span className="text-[11px] font-mono text-slate-500 w-8 text-right">
                      {zoom.toFixed(1)}x
                    </span>
                  </div>

                  {/* Upload Progress Bar */}
                  {uploadProgress !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                        <span>Uploading & Processing...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-teal-600 h-2 rounded-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      disabled={uploadProgress !== null}
                      onClick={() => {
                        setMode('IDLE');
                        setPreviewUrl(null);
                        setSelectedFile(null);
                        setZoom(1);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Choose Different</span>
                    </button>

                    <button
                      type="button"
                      disabled={uploadProgress !== null}
                      onClick={handleUpload}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md disabled:opacity-60 cursor-pointer transition-transform active:scale-95"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{uploadProgress !== null ? 'Uploading...' : 'Save Photo'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="true"
              />
              <input
                ref={cameraFallbackInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

