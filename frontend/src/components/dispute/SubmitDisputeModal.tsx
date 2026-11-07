import React, { useState, useRef } from 'react';
import {
  X,
  Scale,
  Upload,
  Camera,
  Trash2,
  Send,
  Loader2,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { DisputeCategory, DisputeCreatePayload, Dispute } from '../../types/dispute';
import { disputeService } from '../../services/disputeService';
import { CameraModal } from '../report/CameraModal';

interface SubmitDisputeModalProps {
  placeId: string;
  placeName: string;
  reportId?: string;
  reportTitle?: string;
  featureCode?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (dispute: Dispute) => void;
}

const DISPUTE_CATEGORIES: { category: DisputeCategory; label: string; description: string }[] = [
  {
    category: 'INCORRECT_ACCESSIBILITY_INFO',
    label: 'Incorrect Accessibility Information',
    description: 'Current verified accessibility status does not match physical reality on the ground.',
  },
  {
    category: 'OUTDATED_FACILITY_INFO',
    label: 'Outdated Facility Information',
    description: 'The facility has undergone renovations, updates, or changes since last verified.',
  },
  {
    category: 'INCORRECT_REPORT_APPROVAL',
    label: 'Contested Report Approval',
    description: 'An approved community report contains inaccurate, staged, or misleading observations.',
  },
  {
    category: 'INCORRECT_REPORT_REJECTION',
    label: 'Contested Report Rejection',
    description: 'A genuine accessibility barrier report was mistakenly rejected by moderation.',
  },
  {
    category: 'FEATURE_STATUS_CHANGE',
    label: 'Physical Infrastructure Modified / Restored',
    description: 'Barrier was resolved or fixed, and feature accessibility needs to be reinstated.',
  },
];

const STANDARD_FEATURES = [
  { code: 'WHEELCHAIR_ACCESSIBLE_ENTRANCE', label: 'Wheelchair Accessible Entrance' },
  { code: 'STEP_FREE_ENTRANCE', label: 'Step-Free Entrance' },
  { code: 'ENTRANCE_RAMP', label: 'Entrance Ramp' },
  { code: 'AUTOMATIC_DOORS', label: 'Automatic Doors' },
  { code: 'ELEVATOR_AVAILABILITY', label: 'Elevator Availability' },
  { code: 'ELEVATOR_ACCESSIBILITY', label: 'Elevator Accessibility' },
  { code: 'HANDRAILS', label: 'Handrails' },
  { code: 'ACCESSIBLE_WASHROOM', label: 'Accessible Washroom' },
  { code: 'WHEELCHAIR_ACCESSIBLE_RESTROOM', label: 'Wheelchair Accessible Restroom' },
  { code: 'ACCESSIBLE_PARKING', label: 'Accessible Parking' },
  { code: 'RESERVED_WHEELCHAIR_PARKING', label: 'Reserved Wheelchair Parking' },
  { code: 'WHEELCHAIR_ACCESSIBLE_PATHWAYS', label: 'Wheelchair Accessible Pathways' },
  { code: 'BRAILLE_SIGNAGE', label: 'Braille Signage' },
  { code: 'TACTILE_INDICATORS', label: 'Tactile Indicators' },
  { code: 'STAFF_ASSISTANCE', label: 'Staff Assistance' },
];

interface AttachedPhoto {
  file?: File;
  previewUrl: string;
  caption: string;
}

export const SubmitDisputeModal: React.FC<SubmitDisputeModalProps> = ({
  placeId,
  placeName,
  reportId,
  reportTitle,
  featureCode: initialFeatureCode,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [category, setCategory] = useState<DisputeCategory>('INCORRECT_ACCESSIBILITY_INFO');
  const [featureCode, setFeatureCode] = useState(initialFeatureCode || 'WHEELCHAIR_ACCESSIBLE_ENTRANCE');
  const [explanation, setExplanation] = useState('');
  const [photos, setPhotos] = useState<AttachedPhoto[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 5 - photos.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    const newPhotos: AttachedPhoto[] = filesToAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      caption: file.name,
    }));

    setPhotos((prev) => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCameraCapture = (file: File) => {
    if (photos.length >= 5) return;
    const newPhoto: AttachedPhoto = {
      file,
      previewUrl: URL.createObjectURL(file),
      caption: `Camera photo ${photos.length + 1}`,
    };
    setPhotos((prev) => [...prev, newPhoto]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const target = prev[index];
      if (target?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explanation.trim()) {
      setErrorMsg('Please provide an explanation of the dispute and reasons.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: DisputeCreatePayload = {
        placeId,
        reportId,
        featureCode: featureCode || undefined,
        category,
        explanation: explanation.trim(),
      };

      const files = photos.map((p) => p.file).filter((f): f is File => f !== undefined);
      const dispute = await disputeService.submitDispute(payload, files);

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
        if (onSuccess) onSuccess(dispute);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit dispute';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 p-6 md:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-12 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-2xl font-bold text-white">Dispute Submitted</h3>
            <p className="text-slate-400 max-w-md mx-auto text-sm">
              Your dispute has been logged under peer review. A neutral moderator will investigate the physical evidence and audit trail.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Dispute Accessibility Information</h2>
                <p className="text-sm text-slate-400">
                  Venue: <span className="text-slate-200 font-medium">{placeName}</span>
                  {reportTitle && <span> &bull; Contesting Report: &quot;{reportTitle}&quot;</span>}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-sm flex items-start gap-2">
                <Info className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Dispute Category
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {DISPUTE_CATEGORIES.map((item) => (
                    <label
                      key={item.category}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        category === item.category
                          ? 'bg-amber-500/10 border-amber-500/50 text-white'
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="disputeCategory"
                        value={item.category}
                        checked={category === item.category}
                        onChange={() => setCategory(item.category)}
                        className="mt-1 text-amber-500 focus:ring-amber-400"
                      />
                      <div>
                        <div className="text-sm font-semibold">{item.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Target Feature */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Disputed Accessibility Feature
                </label>
                <select
                  value={featureCode}
                  onChange={(e) => setFeatureCode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                >
                  {STANDARD_FEATURES.map((f) => (
                    <option key={f.code} value={f.code}>
                      {f.label} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Detailed Explanation & Grounds for Dispute <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain why the current record or decision is inaccurate. Describe recent renovations, physical measurements, or evidence confirming the actual accessibility status..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm leading-relaxed"
                  required
                />
              </div>

              {/* Photo Evidence Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Supporting Photographs (Optional, up to 5)
                  </label>
                  <span className="text-xs text-slate-400">{photos.length}/5 uploaded</span>
                </div>

                <div className="flex gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photos.length >= 5}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 transition disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 text-amber-400" />
                    Choose from Gallery
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    disabled={photos.length >= 5}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 transition disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    Take Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map((photo, index) => (
                      <div
                        key={index}
                        className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-800 aspect-video"
                      >
                        <img
                          src={photo.previewUrl}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1.5 right-1.5 p-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-md opacity-90 transition"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-amber-600/25 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Dispute...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Dispute
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {isCameraOpen && (
        <CameraModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(file) => {
            handleCameraCapture(file);
            setIsCameraOpen(false);
          }}
        />
      )}
    </div>
  );
};

