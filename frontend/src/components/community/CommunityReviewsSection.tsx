import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Info,
  PenLine,
} from 'lucide-react';
import { reviewService, PlaceReview, PagedReviews } from '../../services/reviewService';
import { ShareExperienceModal } from './ShareExperienceModal';

interface CommunityReviewsSectionProps {
  placeId: string;
  placeName: string;
  isAuthenticated: boolean;
}

const StarDisplay: React.FC<{ rating: number; size?: 'sm' | 'md' }> = ({
  rating,
  size = 'sm',
}) => {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${
            s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
          }`}
        />
      ))}
    </div>
  );
};

const FLAG_LABELS: Record<string, string> = {
  hadAccessibleEntrance: '♿ Accessible Entrance',
  hadAccessibleRestroom: '🚻 Accessible Restroom',
  hadAccessibleParking: '🅿️ Accessible Parking',
  hadElevator: '🛗 Elevator',
  hadStepFreePath: '🚶 Step-Free Path',
  hadStaffAssistance: '🤝 Staff Assistance',
};

/**
 * Renders community-submitted reviews for a place with pagination.
 * Reviews are clearly labelled as "Community submitted — not independently verified."
 */
export const CommunityReviewsSection: React.FC<CommunityReviewsSectionProps> = ({
  placeId,
  placeName,
  isAuthenticated,
}) => {
  const [pagedData, setPagedData] = useState<PagedReviews | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadReviews = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reviewService.getReviews(placeId, page, 5);
      setPagedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    loadReviews(currentPage);
  }, [loadReviews, currentPage]);

  const handleReviewSuccess = () => {
    loadReviews(0);
    setCurrentPage(0);
  };

  const totalPages = pagedData?.page.totalPages ?? 0;
  const totalElements = pagedData?.page.totalElements ?? 0;
  const reviews: PlaceReview[] = pagedData?.content ?? [];

  return (
    <section aria-labelledby="community-reviews-heading" className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            id="community-reviews-heading"
            className="text-base font-bold text-[#101C36] flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-[#0F9D91]" />
            Community Reviews
            {totalElements > 0 && (
              <span className="text-sm font-normal text-slate-500">({totalElements})</span>
            )}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Info className="w-3 h-3 text-amber-500" />
            <span className="text-xs text-amber-600">
              Community submitted — not independently verified
            </span>
          </div>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                       text-white bg-[#0F9D91] hover:bg-[#0d8a7e] transition-colors shadow-sm"
          >
            <PenLine className="w-3.5 h-3.5" />
            Share Experience
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#0F9D91] animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="text-sm text-slate-500 py-4 text-center bg-slate-50 rounded-xl">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && reviews.length === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-500">No reviews yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Be the first to share your accessibility experience at this venue.
          </p>
          {!isAuthenticated && (
            <p className="text-xs text-slate-400 mt-2">
              <a href="/login" className="text-[#0F9D91] underline">
                Sign in
              </a>{' '}
              to leave a review.
            </p>
          )}
        </div>
      )}

      {/* Review list */}
      {!isLoading && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs"
            >
              {/* Reviewer info + rating */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-violet-500
                                  flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {review.reviewerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#101C36]">{review.reviewerName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarDisplay rating={review.rating} />
                      {review.visitDate && (
                        <span className="text-xs text-slate-400">
                          Visited{' '}
                          {new Date(review.visitDate).toLocaleDateString('en-IN', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(review.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* Review text */}
              {review.reviewText && (
                <p className="text-sm text-[#334E68] leading-relaxed mb-3">{review.reviewText}</p>
              )}

              {/* Observed accessibility flags */}
              {Object.entries(FLAG_LABELS).some(
                ([key]) => (review as unknown as Record<string, boolean>)[key]
              ) && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {Object.entries(FLAG_LABELS).map(([key, label]) => {
                    const val = (review as unknown as Record<string, boolean>)[key];
                    if (!val) return null;
                    return (
                      <span
                        key={key}
                        className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Accessibility notes */}
              {review.accessibilitySummary && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700">
                  <span className="font-semibold">Accessibility notes: </span>
                  {review.accessibilitySummary}
                </div>
              )}

              {/* Community disclaimer badge */}
              <div className="mt-2 flex items-center gap-1">
                <Info className="w-2.5 h-2.5 text-amber-400" />
                <span className="text-[10px] text-amber-600">
                  Community submitted — not independently verified
                </span>
              </div>
            </article>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 0}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30
                           hover:bg-slate-50 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage >= totalPages - 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30
                           hover:bg-slate-50 transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Guest prompt if not authenticated and reviews exist */}
      {!isAuthenticated && !isLoading && reviews.length > 0 && (
        <div className="mt-4 text-center text-sm text-slate-500">
          <a href="/login" className="text-[#0F9D91] font-medium hover:underline">
            Sign in
          </a>{' '}
          to share your accessibility experience at this venue.
        </div>
      )}

      {/* Share Experience Modal */}
      <ShareExperienceModal
        placeId={placeId}
        placeName={placeName}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleReviewSuccess}
      />
    </section>
  );
};

