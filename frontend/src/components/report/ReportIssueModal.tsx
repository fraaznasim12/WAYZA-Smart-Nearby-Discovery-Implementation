import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Upload,
  Camera,
  Trash2,
  Calendar,
  MapPin,
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  Check,
  Lightbulb,
} from 'lucide-react';
import { ReportCategory, ReportCreatePayload } from '../../types/report';
import { reportService } from '../../services/reportService';
import { aiService } from '../../services/aiService';
import { AiReportAssistanceResponse } from '../../types/ai';
import { CameraModal } from './CameraModal';

interface ReportIssueModalProps {
  placeId: string;
  placeName: string;
  placeAddress?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_CATEGORIES: { category: ReportCategory; title: string; description: string }[] = [
  {
    category: 'INACCESSIBLE_ENTRANCE',
    title: 'Inaccessible Entrance',
    description: 'Entrance has steps, steep threshold, or lacks level access.',
  },
  {
    category: 'DAMAGED_OR_MISSING_RAMP',
    title: 'Damaged or Missing Ramp',
    description: 'Ramp is missing, broken, too steep (>1:12), or lacks handrails.',
  },
  {
    category: 'ELEVATOR_UNAVAILABLE',
    title: 'Elevator Unavailable',
    description: 'Elevator is broken, locked, power-off, or lacks braille buttons.',
  },
  {
    category: 'INACCESSIBLE_WASHROOM',
    title: 'Inaccessible Washroom',
    description: 'Door too narrow, grab bars missing, or washroom locked.',
  },
  {
    category: 'BLOCKED_PATHWAY',
    title: 'Blocked Accessible Pathway',
    description: 'Corridor or ramp blocked by goods, parked bikes, or debris.',
  },
  {
    category: 'INACCESSIBLE_PARKING',
    title: 'Inaccessible Parking',
    description: 'Reserved wheelchair bay occupied, unmarked, or obstructed.',
  },
  {
    category: 'MISSING_SIGNAGE',
    title: 'Missing Accessibility Signage',
    description: 'Lacks tactile paving, high-contrast signs, or braille indicators.',
  },
  {
    category: 'OTHER',
    title: 'Other Accessibility Issue',
    description: 'Any other barrier to mobility, vision, or hearing access.',
  },
];

interface AttachedPhoto {
  file?: File;
  previewUrl: string;
  caption: string;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  placeId,
  placeName,
  placeAddress,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [category, setCategory] = useState<ReportCategory>('INACCESSIBLE_ENTRANCE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [observationDate, setObservationDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [detectingGps, setDetectingGps] = useState(false);

  const [attachedPhotos, setAttachedPhotos] = useState<AttachedPhoto[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // AI Assistance states
  const [isAiImproving, setIsAiImproving] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiReportAssistanceResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      setTitle('');
      setDescription('');
      setCategory('INACCESSIBLE_ENTRANCE');
      setObservationDate(new Date().toISOString().slice(0, 10));
      setLatitude(undefined);
      setLongitude(undefined);
      setAttachedPhotos([]);
      setErrorMessage(null);
      setIsSuccess(false);
      setIsAiImproving(false);
      setAiSuggestions(null);
      setAiError(null);
    }
  }, [isOpen]);

  const handleAiImprove = async () => {
    if (!description.trim() || description.trim().length < 5) {
      setAiError('Please enter at least 5 characters in the description first for AI to analyze.');
      return;
    }
    setAiError(null);
    setIsAiImproving(true);
    try {
      const response = await aiService.improveReport({
        draftDescription: description.trim(),
        placeId,
        featureCode: category,
      });
      setAiSuggestions(response);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAiError(err.message);
      } else {
        setAiError('Failed to get AI assistance for this report.');
      }
    } finally {
      setIsAiImproving(false);
    }
  };

  const handleApplyAiDescription = () => {
    if (aiSuggestions?.improvedDescription) {
      setDescription(aiSuggestions.improvedDescription);
    }
  };

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (attachedPhotos.length + selectedFiles.length > 5) {
      setErrorMessage('You can attach a maximum of 5 photographs.');
      return;
    }

    const newAttachments: AttachedPhoto[] = [];
    for (const file of selectedFiles) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage(`'${file.name}' is not an image file.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage(`'${file.name}' exceeds the 10MB size limit.`);
        return;
      }
      newAttachments.push({
        file,
        previewUrl: URL.createObjectURL(file),
        caption: file.name,
      });
    }

    setAttachedPhotos((prev) => [...prev, ...newAttachments]);
    setErrorMessage(null);
    e.target.value = '';
  };

  const handleCameraCapture = (file: File) => {
    if (attachedPhotos.length >= 5) {
      setErrorMessage('You can attach a maximum of 5 photographs.');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setAttachedPhotos((prev) => [
      ...prev,
      { file, previewUrl, caption: `Camera Photo #${prev.length + 1}` },
    ]);
    setErrorMessage(null);
  };

  const handleRemovePhoto = (index: number) => {
    setAttachedPhotos((prev) => {
      const target = prev[index];
      if (target && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
        setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
        setDetectingGps(false);
      },
      (err) => {
        setDetectingGps(false);
        setErrorMessage(`Location error: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (title.trim().length < 3) {
      setErrorMessage('Title must be at least 3 characters.');
      return;
    }
    if (description.trim().length < 5) {
      setErrorMessage('Description must be at least 5 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ReportCreatePayload = {
        placeId,
        category,
        title: title.trim(),
        description: description.trim(),
        observationDate: new Date(observationDate).toISOString(),
        latitude,
        longitude,
      };

      const files = attachedPhotos.map((p) => p.file).filter((f): f is File => f !== undefined);
      await reportService.submitReport(payload, files);

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to submit accessibility report. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 id="report-modal-title" className="text-lg font-bold">
                  Report Accessibility Barrier
                </h2>
                <p className="text-xs text-slate-300 truncate max-w-sm">
                  {placeName} {placeAddress ? `• ${placeAddress}` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSuccess ? (
            <div className="p-8 text-center space-y-4 my-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Report Submitted for Review
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Thank you for contributing to barrier-free accessibility in India! Your report has been logged with status{' '}
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  PENDING
                </span>
                . An administrator will review your notes and photographic evidence.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <button type="button" onClick={() => setErrorMessage(null)} className="font-bold ml-2">
                    Dismiss
                  </button>
                </div>
              )}

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Barrier Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {REPORT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.category}
                      type="button"
                      onClick={() => setCategory(cat.category)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        category === cat.category
                          ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-400/30'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white'
                      }`}
                    >
                      <span className="block text-xs font-bold text-slate-900">{cat.title}</span>
                      <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">{cat.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="report-title" className="block text-xs font-bold text-slate-700 mb-1">
                    Issue Title *
                  </label>
                  <input
                    id="report-title"
                    type="text"
                    required
                    placeholder="e.g. Broken entrance ramp with steep slope"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label htmlFor="report-date" className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Observation Date *
                  </label>
                  <input
                    id="report-date"
                    type="date"
                    required
                    max={new Date().toISOString().slice(0, 10)}
                    value={observationDate}
                    onChange={(e) => setObservationDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="report-desc" className="block text-xs font-bold text-slate-700">
                    Detailed Barrier Description *
                  </label>
                  <button
                    type="button"
                    onClick={handleAiImprove}
                    disabled={isAiImproving || !description.trim()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Get AI suggestions to improve description grammar, clarity, and missing details"
                  >
                    {isAiImproving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    )}
                    {isAiImproving ? 'Analyzing...' : 'Enhance with AI'}
                  </button>
                </div>
                <textarea
                  id="report-desc"
                  rows={3}
                  required
                  placeholder="Describe the exact barrier, measurements, floor, or circumstances (e.g. 3 steps at gate 2 without ramp, elevator out of service)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />

                {aiError && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{aiError}</p>
                )}

                {aiSuggestions && (
                  <div className="mt-2.5 p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        AI Quality Suggestions
                      </span>
                      <button
                        type="button"
                        onClick={() => setAiSuggestions(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                      >
                        Dismiss
                      </button>
                    </div>

                    {aiSuggestions.grammarCorrectionsSummary && (
                      <p className="text-[11px] text-purple-800 leading-relaxed">
                        {aiSuggestions.grammarCorrectionsSummary}
                      </p>
                    )}

                    {aiSuggestions.improvedDescription && aiSuggestions.improvedDescription !== description && (
                      <div className="bg-white p-2.5 rounded-lg border border-purple-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-600">Polished draft:</span>
                          <button
                            type="button"
                            onClick={handleApplyAiDescription}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white font-medium text-[11px] transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Use this version
                          </button>
                        </div>
                        <p className="text-slate-800 italic text-[11px] leading-relaxed">
                          "{aiSuggestions.improvedDescription}"
                        </p>
                      </div>
                    )}

                    {aiSuggestions.missingInformationTips && aiSuggestions.missingInformationTips.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-purple-900 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3 text-amber-500" />
                          Tips to make this report easier to verify:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-purple-800 pl-1">
                          {aiSuggestions.missingInformationTips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* GPS Coordinates (Optional) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    Exact Incident GPS Coordinates (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={detectingGps}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-bold hover:bg-teal-100 disabled:opacity-50"
                  >
                    {detectingGps ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {detectingGps ? 'Locating...' : 'Detect GPS'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude (e.g. 19.076)"
                    value={latitude ?? ''}
                    onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude (e.g. 72.877)"
                    value={longitude ?? ''}
                    onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Photographic Evidence Attachment */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Photographic Evidence
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Upload up to 5 clear photos of the barrier (Max 10MB each, JPEG/PNG/WebP)
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    {attachedPhotos.length}/5 Photos
                  </span>
                </div>

                {/* Upload Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={attachedPhotos.length >= 5}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Choose from Gallery
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    disabled={attachedPhotos.length >= 5}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Take Photo (Camera)
                  </button>
                </div>

                {/* Attached Photo Thumbnails */}
                {attachedPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {attachedPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden group shadow-2xs flex flex-col"
                      >
                        <div className="aspect-4/3 bg-slate-900 relative">
                          <img
                            src={photo.previewUrl}
                            alt={photo.caption}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-slate-900/70 hover:bg-rose-600 text-white transition-colors"
                            aria-label="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-1.5 text-[10px] text-slate-600 truncate font-medium">
                          {photo.caption}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Report...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Accessibility Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </>
  );
};
