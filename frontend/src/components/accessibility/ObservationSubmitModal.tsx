import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldAlert, Image as ImageIcon, Plus, Trash2, Calendar, Send, Upload, Camera, Loader2 } from 'lucide-react';
import { FeatureDefinition, FeatureStatus, ObservationSubmitPayload } from '../../types/accessibility';
import { accessibilityService } from '../../services/accessibilityService';

interface ObservationSubmitModalProps {
  placeId: string;
  placeName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  ENTRANCE: 'Entrance & Ingress',
  VERTICAL_ACCESS: 'Vertical Access & Elevators',
  RESTROOM: 'Restrooms & Washrooms',
  PARKING: 'Parking & Drop-Off',
  PATHWAYS: 'Pathways & Corridors',
  ADDITIONAL: 'Assistive & Communication Aids',
};

export const ObservationSubmitModal: React.FC<ObservationSubmitModalProps> = ({
  placeId,
  placeName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [catalog, setCatalog] = useState<FeatureDefinition[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ENTRANCE');
  const [featureStatuses, setFeatureStatuses] = useState<Record<string, { status: FeatureStatus; notes: string }>>({});
  const [description, setDescription] = useState<string>('');
  const [observationDate, setObservationDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [imageUrls, setImageUrls] = useState<{ url: string; caption: string }[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [newImageCaption, setNewImageCaption] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load feature catalog
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    accessibilityService.getFeatureCatalog()
      .then((defs) => {
        if (!isMounted) return;
        setCatalog(defs);
        // Default each feature to UNKNOWN
        const initialMap: Record<string, { status: FeatureStatus; notes: string }> = {};
        defs.forEach((d) => {
          initialMap[d.code] = { status: 'UNKNOWN', notes: '' };
        });
        setFeatureStatuses(initialMap);
      })
      .catch((err) => {
        if (isMounted) setErrorMessage(err.message || 'Failed to load feature list');
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(catalog.map((c) => c.category)));

  const handleStatusChange = (code: string, status: FeatureStatus) => {
    setFeatureStatuses((prev) => ({
      ...prev,
      [code]: { ...prev[code], status },
    }));
  };

  const handleNotesChange = (code: string, notes: string) => {
    setFeatureStatuses((prev) => ({
      ...prev,
      [code]: { ...prev[code], notes },
    }));
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImageUrls((prev) => [...prev, { url: newImageUrl.trim(), caption: newImageCaption.trim() }]);
    setNewImageUrl('');
    setNewImageCaption('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 10MB');
      return;
    }

    setIsUploadingPhoto(true);
    setErrorMessage(null);
    try {
      const uploadedUrl = await accessibilityService.uploadEvidenceFile(
        placeId,
        file,
        newImageCaption.trim() || undefined,
        undefined
      );
      setImageUrls((prev) => [
        ...prev,
        { url: uploadedUrl, caption: newImageCaption.trim() || file.name },
      ]);
      setNewImageCaption('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to upload evidence photograph');
      }
    } finally {
      setIsUploadingPhoto(false);
      // Reset input value so same file can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Pick features where status is not UNKNOWN, or at least 1 feature
      const itemsToSubmit = Object.entries(featureStatuses)
        .filter(([_, val]) => val.status !== 'UNKNOWN' || val.notes.trim().length > 0)
        .map(([code, val]) => ({
          featureCode: code,
          status: val.status,
          notes: val.notes.trim() || undefined,
        }));

      if (itemsToSubmit.length === 0) {
        // Submit all as explicitly reported
        Object.entries(featureStatuses).forEach(([code, val]) => {
          itemsToSubmit.push({
            featureCode: code,
            status: val.status,
            notes: val.notes.trim() || undefined,
          });
        });
      }

      const payload: ObservationSubmitPayload = {
        items: itemsToSubmit,
        description: description.trim() || undefined,
        observationDate: observationDate ? new Date(observationDate).toISOString() : new Date().toISOString(),
        evidence: imageUrls.map((img) => ({
          imageUrl: img.url,
          caption: img.caption || undefined,
        })),
      };

      await accessibilityService.submitObservation(placeId, payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to submit observation. Please check your inputs.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFeatures = catalog.filter((c) => c.category === selectedCategory);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 id="submit-modal-title" className="text-xl font-bold">
              Submit Accessibility Observation
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Auditing: <span className="text-amber-400 font-semibold">{placeName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-teal-400"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational banner */}
        <div className="px-6 py-3 bg-teal-50 border-b border-teal-200 flex items-center gap-3 text-xs text-teal-950">
          <ShieldAlert className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
          <span>
            <strong>Verification Policy:</strong> Submissions start as <em>PENDING</em>. An administrator reviews your notes and photographic evidence before official records are updated.
          </span>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold ml-2">Dismiss</button>
          </div>
        )}

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata row: Observation Date & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="obs-date" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Observation Date
              </label>
              <input
                id="obs-date"
                type="date"
                value={observationDate}
                onChange={(e) => setObservationDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="obs-desc" className="block text-xs font-semibold text-slate-700 mb-1">
                Field Audit Notes / Overview (Optional)
              </label>
              <input
                id="obs-desc"
                type="text"
                placeholder="e.g. Ground floor ramp is smooth; elevator accessible with braille chimes."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Select Accessibility Category
            </span>
            <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {CATEGORY_NAMES[cat] || cat}
                </button>
              ))}
            </div>
          </div>

          {/* Checklist Items in Selected Category */}
          <div className="space-y-4">
            {filteredFeatures.map((feat) => {
              const current = featureStatuses[feat.code] || { status: 'UNKNOWN', notes: '' };
              return (
                <div
                  key={feat.code}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{feat.name}</h4>
                      <p className="text-xs text-slate-500">{feat.description}</p>
                    </div>

                    {/* Status radio buttons */}
                    <div className="flex items-center gap-1.5 shrink-0" role="group" aria-label={`Status for ${feat.name}`}>
                      {(['AVAILABLE', 'NOT_AVAILABLE', 'UNKNOWN', 'NOT_VERIFIED'] as FeatureStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleStatusChange(feat.code, st)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                            current.status === st
                              ? st === 'AVAILABLE'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : st === 'NOT_AVAILABLE'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                : st === 'NOT_VERIFIED'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-slate-700 text-white border-slate-700 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {st === 'AVAILABLE'
                            ? 'Available'
                            : st === 'NOT_AVAILABLE'
                            ? 'Not Available'
                            : st === 'NOT_VERIFIED'
                            ? 'Needs Check'
                            : 'Unknown'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes for this feature */}
                  <input
                    type="text"
                    placeholder={`Specific measurements, slope, location, or notes for ${feat.name.toLowerCase()}...`}
                    value={current.notes}
                    onChange={(e) => handleNotesChange(feat.code, e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              );
            })}
          </div>

          {/* Evidence Photos Section */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-teal-600" />
              Photographic Evidence (Recommended for Fast Verification)
            </h4>

            {imageUrls.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {imageUrls.map((img, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                    <div className="flex items-center gap-2 truncate mr-2">
                      <img
                        src={img.url}
                        alt={img.caption || 'Evidence'}
                        className="w-10 h-10 rounded-md object-cover border border-slate-200 shrink-0"
                        onError={(e) => {
                          // Hide broken thumbnail image gracefully
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 block truncate">{img.caption || 'Photo'}</span>
                        <p className="text-slate-500 truncate text-[11px]">{img.url}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded-md shrink-0"
                      aria-label="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden File and Camera Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* File Upload Controls & Optional Caption */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-2xs"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {isUploadingPhoto ? 'Uploading...' : 'Choose Photo (Gallery)'}
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-2xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Take Photo (Camera)
                </button>

                <span className="text-[11px] text-slate-500">Max 10MB (JPEG, PNG, WebP)</span>
              </div>

              {/* Optional Caption input before upload or for manual URL */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="url"
                  placeholder="Or paste external image URL (https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="text"
                  placeholder="Photo caption (e.g. Ramp slope meter)"
                  value={newImageCaption}
                  onChange={(e) => setNewImageCaption(e.target.value)}
                  className="sm:w-56 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  disabled={!newImageUrl.trim()}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 text-white text-xs font-semibold hover:bg-slate-600 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold shadow-md hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <span>Submitting Checklist...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit for Verification</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
