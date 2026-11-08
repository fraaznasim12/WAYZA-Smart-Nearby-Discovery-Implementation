import React, { useState } from 'react';
import {
  X,
  Star,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { reviewService, CreateReviewPayload } from '../../services/reviewService';

interface ShareExperienceModalProps {
  placeId: string;
  placeName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ACCESSIBILITY_FLAGS = [
  { key: 'hadAccessibleEntrance', label: 'Accessible Entrance', emoji: '♿' },
  { key: 'hadAccessibleRestroom', label: 'Accessible Restroom', emoji: '🚻' },
  { key: 'hadAccessibleParking', label: 'Accessible Parking', emoji: '🅿️' },
  { key: 'hadElevator', label: 'Elevator / Lift', emoji: '🛗' },
  { key: 'hadStepFreePath', label: 'Step-Free Path', emoji: '🚶' },
  { key: 'hadStaffAssistance', label: 'Staff Assistance Available', emoji: '🤝' },
] as const;

type FlagKey = (typeof ACCESSIBILITY_FLAGS)[number]['key'];

/**
 * Modal for submitting a community accessibility review for a place.
 *
 * Community submissions are labelled "not independently verified"
 * and go through a PENDING → APPROVED moderation lifecycle.
 */
export const ShareExperienceModal: React.FC<ShareExperienceModalProps> = ({
  placeId,
  placeName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [visitDate, setVisitDate] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [accessibilitySummary, setAccessibilitySummary] = useState('');
  const [flags, setFlags] = useState<Record<FlagKey, boolean>>({
    hadAccessibleEntrance: false,
    hadAccessibleRestroom: false,
    hadAccessibleParking: false,
    hadElevator: false,
    hadStepFreePath: false,
    hadStaffAssistance: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const toggleFlag = (key: FlagKey) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setSubmitError('Please select a star rating before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload: CreateReviewPayload = {
      rating,
      visitDate: visitDate || undefined,
      reviewText: reviewText.trim() || undefined,
      accessibilitySummary: accessibilitySummary.trim() || undefined,
      ...flags,
    };

    try {
      await reviewService.submitReview(placeId, payload);
      setSubmitted(true);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
    // Reset form after close animation
    setTimeout(() => {
      setRating(0);
      setHoverRating(0);
      setVisitDate('');
      setReviewText('');
      setAccessibilitySummary('');
      setFlags({
        hadAccessibleEntrance: false,
        hadAccessibleRestroom: false,
        hadAccessibleParking: false,
        hadElevator: false,
        hadStepFreePath: false,
        hadStaffAssistance: false,
      });
      setSubmitted(false);
      setSubmitError(null);
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full sm:max-w-xl bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 id="share-modal-title" className="text-base font-bold text-[#101C36]">
              Share Your Experience
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{placeName}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          /* Success state */
          <div className="px-5 py-10 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#0F9D91]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#101C36]">Review Submitted!</h3>
              <p className="text-sm text-slate-600 mt-1 max-w-xs mx-auto">
                Thank you for contributing to AccessMap. Your review is under moderation and
                will appear once approved.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-start gap-2 max-w-sm">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                Community reviews are labelled "not independently verified" and are separate
                from our accessibility audits.
              </span>
            </div>
            <button
              onClick={handleClose}
              className="mt-2 px-6 py-2.5 rounded-xl bg-[#0F9D91] text-white text-sm font-semibold
                         hover:bg-[#0d8a7e] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* Review form */
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
            {/* Community disclaimer */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                Your review is a <strong>community contribution</strong> and will be clearly
                labelled "not independently verified." It will not modify our audited
                accessibility profiles.
              </span>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-sm font-semibold text-[#101C36] mb-2">
                Overall Rating <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1" role="group" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        (hoverRating || rating) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm font-medium text-slate-600">
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Visit Date */}
            <div>
              <label
                htmlFor="visit-date"
                className="block text-sm font-semibold text-[#101C36] mb-1.5"
              >
                Visit Date <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="visit-date"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white
                           text-[#101C36] focus:outline-none focus:ring-2 focus:ring-[#0F9D91]/40
                           focus:border-[#0F9D91] transition-all"
              />
            </div>

            {/* Review Text */}
            <div>
              <label
                htmlFor="review-text"
                className="block text-sm font-semibold text-[#101C36] mb-1.5"
              >
                Your Experience{' '}
                <span className="text-slate-400 font-normal">(optional, up to 2000 chars)</span>
              </label>
              <textarea
                id="review-text"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Describe your visit, what worked well, what could be improved…"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white
                           text-[#101C36] placeholder:text-slate-400 resize-none focus:outline-none
                           focus:ring-2 focus:ring-[#0F9D91]/40 focus:border-[#0F9D91] transition-all"
              />
              <p className="text-right text-xs text-slate-400 mt-0.5">
                {reviewText.length}/2000
              </p>
            </div>

            {/* Accessibility Flags */}
            <div>
              <label className="block text-sm font-semibold text-[#101C36] mb-2">
                Accessibility Features Observed{' '}
                <span className="text-slate-400 font-normal">(select all that apply)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ACCESSIBILITY_FLAGS.map(({ key, label, emoji }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleFlag(key)}
                    aria-pressed={flags[key]}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium
                                transition-all text-left
                                ${
                                  flags[key]
                                    ? 'border-[#0F9D91] bg-teal-50 text-[#0F9D91]'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                  >
                    <span className="text-base">{emoji}</span>
                    <span className="text-xs leading-tight">{label}</span>
                    {flags[key] && <CheckCircle2 className="w-3.5 h-3.5 ml-auto shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessibility Summary */}
            <div>
              <label
                htmlFor="a11y-summary"
                className="block text-sm font-semibold text-[#101C36] mb-1.5"
              >
                Accessibility Notes{' '}
                <span className="text-slate-400 font-normal">(optional, up to 1000 chars)</span>
              </label>
              <textarea
                id="a11y-summary"
                value={accessibilitySummary}
                onChange={(e) => setAccessibilitySummary(e.target.value)}
                maxLength={1000}
                rows={2}
                placeholder="E.g. Ramp at the main entrance but narrow doorways inside…"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white
                           text-[#101C36] placeholder:text-slate-400 resize-none focus:outline-none
                           focus:ring-2 focus:ring-[#0F9D91]/40 focus:border-[#0F9D91] transition-all"
              />
            </div>

            {/* Error */}
            {submitError && (
              <div className="flex items-start gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100
                           rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#0F9D91]
                           rounded-xl hover:bg-[#0d8a7e] transition-colors disabled:opacity-50
                           flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
