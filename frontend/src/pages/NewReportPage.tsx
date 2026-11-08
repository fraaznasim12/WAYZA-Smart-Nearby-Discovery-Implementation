import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import {
  Building2,
  Search,
  MapPin,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Calendar,
  UploadCloud,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Star,
  Plus,
  Loader2,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { placeService } from '../services/placeService';
import { reportService } from '../services/reportService';
import { Place, PlaceCreatePayload } from '../types/place';
import {
  ReportType,
  ReportCategory,
  ObservationStatus,
  ImpactLevel,
  ObservationSource,
  AccessibilityFeature,
  ReportCreatePayload,
} from '../types/report';

const ACCESSIBILITY_FEATURES: {
  id: AccessibilityFeature;
  label: string;
  category: ReportCategory;
  description: string;
}[] = [
  {
    id: 'WHEELCHAIR_ENTRANCE',
    label: 'Wheelchair entrance & circulation',
    category: 'INACCESSIBLE_ENTRANCE',
    description: 'Main entrances, wide doors, internal corridors, turning spaces',
  },
  {
    id: 'STEP_FREE_RAMP',
    label: 'Step-free entrance or ramp',
    category: 'DAMAGED_OR_MISSING_RAMP',
    description: 'Permanent ramps, gradient, handrails, curb cuts',
  },
  {
    id: 'ACCESSIBLE_RESTROOM',
    label: 'Accessible restroom',
    category: 'INACCESSIBLE_WASHROOM',
    description: 'Grab bars, wide door, emergency cord, wheelchair turning space',
  },
  {
    id: 'ELEVATOR_ACCESS',
    label: 'Elevator & vertical access',
    category: 'ELEVATOR_UNAVAILABLE',
    description: 'Lifts, accessible buttons, audio announcements, escalators',
  },
  {
    id: 'MOBILITY_PARKING',
    label: 'Dedicated mobility parking',
    category: 'INACCESSIBLE_PARKING',
    description: 'Designated accessible bays, proximity to entrance, signage',
  },
  {
    id: 'PUBLIC_TRANSPORT',
    label: 'Public transport & drop-off access',
    category: 'BLOCKED_PATHWAY',
    description: 'Bus/metro connectivity, accessible drop-off zone, clear walkways',
  },
  {
    id: 'BRAILLE_TACTILE',
    label: 'Braille & tactile guidance',
    category: 'MISSING_SIGNAGE',
    description: 'Tactile paving, braille plaques, tactile directory maps',
  },
  {
    id: 'AUDIO_ASSISTANCE',
    label: 'Audio assistance & signage',
    category: 'MISSING_SIGNAGE',
    description: 'High-contrast signs, audio guidance, induction hearing loops',
  },
  {
    id: 'SEATING_WAITING',
    label: 'Seating & waiting facilities',
    category: 'OTHER',
    description: 'Accessible benches, priority seating in queues and lobbies',
  },
  {
    id: 'OTHER',
    label: 'Other accessibility aspect',
    category: 'OTHER',
    description: 'Any other specific barrier or accessibility facility observed',
  },
];

const OBSERVATION_STATUS_OPTIONS: { id: ObservationStatus; label: string; desc: string }[] = [
  { id: 'AVAILABLE', label: 'Available', desc: 'Fully operational and accessible to visitors' },
  { id: 'PARTIALLY_AVAILABLE', label: 'Partially Available', desc: 'Partially functional or has obstacles' },
  { id: 'NOT_AVAILABLE', label: 'Not Available', desc: 'Missing, broken, locked, or inaccessible' },
  { id: 'NOT_SURE', label: 'Not Sure', desc: 'Could not clearly verify or confirm condition' },
];

const IMPACT_LEVEL_OPTIONS: { id: ImpactLevel; label: string; desc: string }[] = [
  { id: 'PREVENTS_ACCESS', label: 'Prevents access completely', desc: 'User cannot enter or use this facility at all' },
  { id: 'MAKES_MOVEMENT_DIFFICULT', label: 'Makes movement difficult', desc: 'Major struggle or safety risk for disabled visitors' },
  { id: 'REQUIRES_ASSISTANCE', label: 'Requires additional assistance', desc: 'Cannot be used independently without human help' },
  { id: 'MINOR_INCONVENIENCE', label: 'Causes minor inconvenience', desc: 'Usable with slight delay or manageable discomfort' },
  { id: 'OTHER', label: 'Other specific impact', desc: 'Different impact on navigation or dignity' },
];

const OBSERVATION_SOURCE_OPTIONS: { id: ObservationSource; label: string; desc: string }[] = [
  { id: 'PERSONALLY_VISITED', label: 'Personally visited', desc: 'I visited this place myself and directly witnessed this' },
  { id: 'ACCOMPANIED_VISITOR', label: 'Accompanied another visitor', desc: 'I was accompanying a friend, family member, or client' },
  { id: 'OTHER_INFORMATION', label: 'Other verified information', desc: 'Verified through community notice, photo, or official advisory' },
];

const VENUE_CATEGORIES = [
  { value: 'HOSPITAL', label: 'Hospital / Medical Centre' },
  { value: 'RAILWAY_STATION', label: 'Railway Station / Metro' },
  { value: 'BUS_STATION', label: 'Bus Station' },
  { value: 'SHOPPING_MALL', label: 'Shopping Mall / Market' },
  { value: 'RESTAURANT', label: 'Restaurant / Cafe' },
  { value: 'PUBLIC_OFFICE', label: 'Government / Public Office' },
  { value: 'EDUCATIONAL_INSTITUTION', label: 'College / University / School' },
  { value: 'HOTEL', label: 'Hotel / Lodging' },
  { value: 'PARK', label: 'Public Park / Garden' },
  { value: 'THEATER', label: 'Cinema / Theater / Auditorium' },
  { value: 'OTHER', label: 'Other Public Venue' },
];

export const NewReportPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard Step (1 to 6)
  const [step, setStep] = useState<number>(1);

  // Form State
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [reportType, setReportType] = useState<ReportType>('ACCESSIBILITY_ISSUE');
  const [feature, setFeature] = useState<AccessibilityFeature>('WHEELCHAIR_ENTRANCE');
  const [observationStatus, setObservationStatus] = useState<ObservationStatus>('NOT_AVAILABLE');
  const [impact, setImpact] = useState<ImpactLevel>('MAKES_MOVEMENT_DIFFICULT');
  const [isPresent, setIsPresent] = useState<string>('YES');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Visit details
  const todayStr = new Date().toISOString().split('T')[0];
  const [visitDate, setVisitDate] = useState<string>(todayStr);
  const [observationSource, setObservationSource] = useState<ObservationSource>('PERSONALLY_VISITED');
  const [visitContext, setVisitContext] = useState<string>('');

  // Rating & Review (for VISIT_REVIEW or optional)
  const [rating, setRating] = useState<number>(0);
  const [whatLiked, setWhatLiked] = useState<string>('');
  const [whatImproved, setWhatImproved] = useState<string>('');
  const [whatToKnow, setWhatToKnow] = useState<string>('');

  // Photos
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirmation checkbox
  const [confirmedAccuracy, setConfirmedAccuracy] = useState<boolean>(false);

  // Place Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // "Suggest Place" Modal / Inline form
  const [showSuggestModal, setShowSuggestModal] = useState<boolean>(false);
  const [suggestForm, setSuggestForm] = useState<PlaceCreatePayload>({
    name: '',
    category: 'HOSPITAL',
    address: '',
    city: '',
    state: '',
    country: 'India',
    latitude: 28.6139,
    longitude: 77.2090,
  });
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Debounced Place Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const resp = await placeService.getPlaces({ q: searchQuery.trim(), size: 8 });
        setSearchResults(resp.content || []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setSearchError(err.message);
        } else {
          setSearchError('Failed to search venues');
        }
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Photo Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxFiles = 5;
    const maxSize = 10 * 1024 * 1024; // 10MB

    const newFiles: File[] = [];
    for (const file of files) {
      if (selectedFiles.length + newFiles.length >= maxFiles) {
        alert(`You can upload a maximum of ${maxFiles} photos.`);
        break;
      }
      if (!validImageTypes.includes(file.type)) {
        alert(`Unsupported file type: ${file.name}. Only JPEG, PNG, and WebP images are allowed.`);
        continue;
      }
      if (file.size > maxSize) {
        alert(`File too large: ${file.name}. Maximum file size is 10MB.`);
        continue;
      }
      newFiles.push(file);
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...selectedFiles, ...newFiles];
      setSelectedFiles(updatedFiles);

      // Create previews
      const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
      setPhotoPreviews([...photoPreviews, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  // Auto-generate title if not manually filled
  useEffect(() => {
    if (!title || title.startsWith('Accessibility ') || title.startsWith('Visit Review ')) {
      const placeName = selectedPlace ? selectedPlace.name : 'Venue';
      if (reportType === 'VISIT_REVIEW') {
        setTitle(`Visit Review of ${placeName}`);
      } else if (reportType === 'ACCESSIBILITY_IMPROVEMENT') {
        const featObj = ACCESSIBILITY_FEATURES.find((f) => f.id === feature);
        setTitle(`Accessible ${featObj?.label || 'Facility'} at ${placeName}`);
      } else {
        const featObj = ACCESSIBILITY_FEATURES.find((f) => f.id === feature);
        setTitle(`Accessibility Issue with ${featObj?.label || 'Facility'} at ${placeName}`);
      }
    }
  }, [reportType, feature, selectedPlace]);

  // Handle Suggesting a new venue
  const handleSuggestPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestForm.name.trim() || !suggestForm.address.trim()) {
      setSuggestError('Venue name and address are required.');
      return;
    }
    setIsSuggesting(true);
    setSuggestError(null);
    try {
      const created = await placeService.suggestPlace(suggestForm);
      setSelectedPlace(created);
      setShowSuggestModal(false);
      setSuggestForm({
        name: '',
        category: 'HOSPITAL',
        address: '',
        city: '',
        state: '',
        country: 'India',
        latitude: 28.6139,
        longitude: 77.2090,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSuggestError(err.message);
      } else {
        setSuggestError('Failed to suggest place. Please check details and try again.');
      }
    } finally {
      setIsSuggesting(false);
    }
  };

  // Step Validation
  const canProceedFromStep1 = !!selectedPlace;
  const canProceedFromStep2 = !!reportType;
  const canProceedFromStep3 =
    reportType === 'VISIT_REVIEW'
      ? description.trim().length >= 10
      : description.trim().length >= 15 && !!title.trim();
  const canProceedFromStep4 = !!visitDate && !!observationSource;
  const canSubmit = confirmedAccuracy && !isSubmitting && canProceedFromStep1 && canProceedFromStep3;

  // Final Submission
  const handleSubmit = async () => {
    if (!selectedPlace) {
      setSubmitError('Please select a place.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setSubmitError('Please provide a detailed description (at least 10 characters).');
      return;
    }
    if (!confirmedAccuracy) {
      setSubmitError('Please confirm that your report is accurate.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const featObj = ACCESSIBILITY_FEATURES.find((f) => f.id === feature);
    const category: ReportCategory =
      reportType === 'VISIT_REVIEW' ? 'OTHER' : featObj?.category || 'OTHER';

    const fullDescription =
      visitContext.trim().length > 0
        ? `${description.trim()}\n\n[Additional Context]: ${visitContext.trim()}`
        : description.trim();

    const payload: ReportCreatePayload = {
      placeId: selectedPlace.id,
      reportType,
      category,
      issueType: feature,
      title: title.trim(),
      description: fullDescription,
      observationDate: new Date(visitDate).toISOString(),
      observationStatus: reportType === 'VISIT_REVIEW' ? undefined : observationStatus,
      impact: reportType === 'VISIT_REVIEW' ? undefined : impact,
      isPresent: reportType === 'VISIT_REVIEW' ? undefined : isPresent,
      observationSource,
      rating: rating > 0 ? rating : undefined,
      whatLiked: whatLiked.trim() || undefined,
      whatImproved: whatImproved.trim() || undefined,
      whatToKnow: whatToKnow.trim() || undefined,
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
    };

    try {
      await reportService.submitReport(payload, selectedFiles);
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/reports');
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to submit report. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Select Place' },
    { num: 2, label: 'Report Type' },
    { num: 3, label: 'Observations' },
    { num: 4, label: 'Visit Details' },
    { num: 5, label: 'Photos & Rating' },
    { num: 6, label: 'Review & Submit' },
  ];

  return (
    <PageLayout className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#F7F9FC]">
      {/* Top Breadcrumb & Cancel */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Reports
        </Link>
        <span className="text-xs font-medium text-slate-400">Step {step} of 6</span>
      </div>

      {/* Page Title & Intro */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight font-display">
          Add Your Community Report
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Help build India's most reliable and transparent accessibility directory by sharing verified observations.
        </p>
      </div>

      {/* Progress Bar & Steps Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-8 shadow-xs">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-teal-600 transition-all duration-300 -z-0"
            style={{ width: `${((step - 1) / (stepsList.length - 1)) * 100}%` }}
          />

          {stepsList.map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (isCompleted) setStep(s.num);
                }}
                disabled={!isCompleted && !isCurrent}
                className="relative z-10 flex flex-col items-center group focus:outline-hidden"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-teal-600 text-white cursor-pointer hover:bg-teal-700'
                      : isCurrent
                      ? 'bg-[#102A43] text-white ring-4 ring-teal-100 shadow-sm'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`hidden sm:block text-[11px] font-semibold mt-1.5 transition-colors ${
                    isCurrent ? 'text-[#102A43]' : isCompleted ? 'text-teal-700' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
        {/* STEP 1: SELECT PLACE */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Step 1</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Which place would you like to report?</h2>
              <p className="text-xs text-slate-500 mt-1">
                Search for an active public hospital, railway station, mall, office, or university in India.
              </p>
            </div>

            {/* Selected Place Banner */}
            {selectedPlace ? (
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-600 text-white mt-0.5">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold uppercase mb-1">
                      {selectedPlace.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{selectedPlace.name}</h3>
                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      {selectedPlace.address}
                      {selectedPlace.city && `, ${selectedPlace.city}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlace(null)}
                  className="text-xs font-semibold text-teal-800 hover:text-teal-950 underline shrink-0 cursor-pointer"
                >
                  Change Place
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by venue name, city, or address (e.g. AIIMS Delhi, Metro Station, Mall...)"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-hidden transition-all"
                  />
                  {isSearching && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                    </div>
                  )}
                </div>

                {searchError && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    {searchError}
                  </p>
                )}

                {/* Suggestions List */}
                {searchResults.length > 0 && (
                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white max-h-72 overflow-y-auto shadow-xs">
                    {searchResults.map((place) => (
                      <div
                        key={place.id}
                        onClick={() => {
                          setSelectedPlace(place);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{place.name}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {place.address} {place.city ? `• ${place.city}` : ''}
                          </p>
                        </div>
                        <span className="shrink-0 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {place.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* No results or Suggest a Place */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-slate-700">Can't find the place you're looking for?</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Suggest a new venue to undergo community review before becoming canonical.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSuggestModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-teal-600" />
                    Suggest a New Place
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: REPORT TYPE */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Step 2</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">What would you like to share?</h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose the category that best describes your report for{' '}
                <span className="font-semibold text-slate-700">{selectedPlace?.name}</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Barrier */}
              <div
                onClick={() => setReportType('ACCESSIBILITY_ISSUE')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  reportType === 'ACCESSIBILITY_ISSUE'
                    ? 'border-rose-500 bg-rose-50/30 shadow-md ring-2 ring-rose-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    Accessibility Issue or Barrier
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Report an obstacle, broken ramp, out-of-order elevator, steep stairs, or lack of accessible restrooms.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-rose-600 font-bold text-[11px]">Highlights Barriers</span>
                  {reportType === 'ACCESSIBILITY_ISSUE' && (
                    <CheckCircle2 className="w-4 h-4 text-rose-600" />
                  )}
                </div>
              </div>

              {/* Option 2: Improvement */}
              <div
                onClick={() => setReportType('ACCESSIBILITY_IMPROVEMENT')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  reportType === 'ACCESSIBILITY_IMPROVEMENT'
                    ? 'border-emerald-500 bg-emerald-50/30 shadow-md ring-2 ring-emerald-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    Accessibility Facility or Improvement
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Highlight a newly built ramp, working wheelchair lift, braille signs, or accessible parking bays.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-600 font-bold text-[11px]">Positive Highlights</span>
                  {reportType === 'ACCESSIBILITY_IMPROVEMENT' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
              </div>

              {/* Option 3: Visit Review */}
              <div
                onClick={() => setReportType('VISIT_REVIEW')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  reportType === 'VISIT_REVIEW'
                    ? 'border-teal-500 bg-teal-50/30 shadow-md ring-2 ring-teal-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-3">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    General Visit Experience & Review
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Share your overall navigation experience, staff helpfulness, tips for fellow visitors, and photos.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-teal-600 font-bold text-[11px]">Visitor Reviews</span>
                  {reportType === 'VISIT_REVIEW' && (
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ACCESSIBILITY OBSERVATIONS */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Step 3</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {reportType === 'VISIT_REVIEW'
                  ? 'Describe Your Experience'
                  : 'Which accessibility feature are you reporting?'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {reportType === 'VISIT_REVIEW'
                  ? 'Tell us what happened during your visit so other disabled visitors know what to expect.'
                  : 'Select the specific feature and tell us what you observed on site.'}
              </p>
            </div>

            {reportType !== 'VISIT_REVIEW' ? (
              <div className="space-y-6">
                {/* Feature Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Accessibility Feature
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ACCESSIBILITY_FEATURES.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setFeature(item.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          feature === item.id
                            ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-1 ring-teal-400'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                            feature === item.id
                              ? 'border-teal-600 bg-teal-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {feature === item.id && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.label}</p>
                          <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What did you observe? */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    What did you observe?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {OBSERVATION_STATUS_OPTIONS.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setObservationStatus(opt.id)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          observationStatus === opt.id
                            ? 'border-teal-500 bg-teal-50/60 font-bold text-teal-900 ring-1 ring-teal-400'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-xs font-bold">{opt.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact on visitors */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    What impact does this have on visitors?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {IMPACT_LEVEL_OPTIONS.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setImpact(opt.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          impact === opt.id
                            ? 'border-teal-500 bg-teal-50/60 font-bold text-teal-900 ring-1 ring-teal-400'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-xs font-bold">{opt.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Is this issue still present? */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Is this issue still present?
                  </label>
                  <div className="flex gap-3">
                    {[
                      { val: 'YES', label: 'Yes, still present' },
                      { val: 'NO', label: 'No, resolved or fixed' },
                      { val: 'NOT_SURE', label: 'Not sure / Unconfirmed' },
                    ].map((opt) => (
                      <label
                        key={opt.val}
                        onClick={() => setIsPresent(opt.val)}
                        className={`flex-1 p-3 rounded-xl border text-center cursor-pointer transition-all ${
                          isPresent === opt.val
                            ? 'border-teal-500 bg-teal-50 text-teal-900 font-bold'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Title & Detailed Description */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Report Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Brief headline (e.g. Ramp gradient too steep at Gate 2)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-xs sm:text-sm text-slate-900 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      What exactly happened? Describe what you observed and where it occurred.{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Be specific: e.g. At the southern entrance, there are 4 steps without a handrail or ramp. The alternate ramp on the east side was locked with a chain."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-xs sm:text-sm text-slate-900 outline-hidden"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>Minimum 15 characters</span>
                      <span className={description.trim().length < 15 ? 'text-amber-600' : 'text-teal-600 font-medium'}>
                        {description.trim().length} characters
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* VISIT REVIEW Step 3 Form */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Review Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. Visit Review of AIIMS OPD block"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-xs sm:text-sm text-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    What was your experience like? <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe how easy or difficult it was to navigate, the attitude of staff, and any specific tips..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-xs sm:text-sm text-slate-900 outline-hidden"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>Minimum 10 characters</span>
                    <span className={description.trim().length < 10 ? 'text-amber-600' : 'text-teal-600 font-medium'}>
                      {description.trim().length} characters
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: VISIT DETAILS */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Step 4</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">When and how did you observe this?</h2>
              <p className="text-xs text-slate-500 mt-1">
                Help moderators understand the recency and directness of this observation.
              </p>
            </div>

            {/* Visit Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                When did you visit this place? <span className="text-rose-500">*</span>
              </label>
              <div className="relative max-w-xs">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  max={todayStr}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-xs sm:text-sm text-slate-900 outline-hidden"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Future dates are not permitted.</p>
            </div>

            {/* Observation Source */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                How did you observe this facility or barrier? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {OBSERVATION_SOURCE_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setObservationSource(opt.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      observationSource === opt.id
                        ? 'border-teal-500 bg-teal-50/60 shadow-xs ring-1 ring-teal-400'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-900">{opt.label}</p>
                      {observationSource === opt.id && (
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional context textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Additional visit context <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={visitContext}
                onChange={(e) => setVisitContext(e.target.value)}
                placeholder="E.g. Visited around 2 PM on a weekday. The security guard informed me that the lift key is kept with the duty manager."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-xs sm:text-sm text-slate-900 outline-hidden"
              />
            </div>
          </div>
        )}

        {/* STEP 5: RATING, REVIEW & PHOTOS */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Step 5</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Rating, Review & Evidence Photos</h2>
              <p className="text-xs text-slate-500 mt-1">
                Photographic evidence substantially speeds up verification by moderators and community advocates.
              </p>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Overall Experience Rating <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(rating === starVal ? 0 : starVal)}
                    className="p-1 text-slate-300 hover:text-amber-400 transition-colors focus:outline-hidden"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        starVal <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {rating === 1 && '1 - Very Poor Accessibility'}
                    {rating === 2 && '2 - Difficult Navigation'}
                    {rating === 3 && '3 - Average / Mixed Access'}
                    {rating === 4 && '4 - Good Accessibility'}
                    {rating === 5 && '5 - Excellent Accessibility'}
                  </span>
                )}
              </div>
            </div>

            {/* Structured Feedback Questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  What did you like about this place? <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={whatLiked}
                  onChange={(e) => setWhatLiked(e.target.value)}
                  placeholder="E.g. Helpful staff, wide doorways, clean accessible washroom..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-teal-500 text-xs text-slate-900 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  What could be improved? <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={whatImproved}
                  onChange={(e) => setWhatImproved(e.target.value)}
                  placeholder="E.g. Lower the reception counter height, repair the elevator alarm..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-teal-500 text-xs text-slate-900 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                What should other visitors know? <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={whatToKnow}
                onChange={(e) => setWhatToKnow(e.target.value)}
                placeholder="E.g. Best to enter through Gate 3 which is level and has a guard to assist."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 text-xs text-slate-900 outline-hidden"
              />
            </div>

            {/* Photo Upload Area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Attach Evidence Photos <span className="text-slate-400 font-normal">(Up to 5 images, max 10MB each)</span>
                </label>
                <span className="text-xs text-slate-400 font-medium">
                  {selectedFiles.length} of 5 attached
                </span>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files) {
                    addFiles(Array.from(e.dataTransfer.files));
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-teal-50/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Click to browse files or drag and drop photos here
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports JPEG, PNG, or WebP. Take photo directly using mobile camera where supported.
                </p>
              </div>

              {/* Previews Grid */}
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                  {photoPreviews.map((previewUrl, index) => (
                    <div
                      key={index}
                      className="group relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs"
                    >
                      <img
                        src={previewUrl}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(index);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white shadow-xs hover:bg-rose-700 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 6: FINAL REVIEW & SUBMISSION */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Step 6</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Review Your Report Before Submitting</h2>
              <p className="text-xs text-slate-500 mt-1">
                Please double-check your answers. You can edit any section before confirming.
              </p>
            </div>

            {submitError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <p className="font-bold mb-0.5">Submission Error</p>
                <p>{submitError}</p>
              </div>
            )}

            {submitSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Report Submitted Successfully!</p>
                  <p>Redirecting to your reports dashboard...</p>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            <div className="space-y-4">
              {/* Venue Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-teal-600 text-white mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Selected Place</span>
                    <h4 className="text-sm font-bold text-slate-900">{selectedPlace?.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedPlace?.address}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-teal-700 hover:underline shrink-0"
                >
                  Edit
                </button>
              </div>

              {/* Type & Observation Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Report Details</span>
                  <div className="flex flex-wrap items-center gap-2 mt-1 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#102A43] text-white">
                      {reportType === 'ACCESSIBILITY_ISSUE' && 'Accessibility Barrier'}
                      {reportType === 'ACCESSIBILITY_IMPROVEMENT' && 'Accessibility Improvement'}
                      {reportType === 'VISIT_REVIEW' && 'Visit Review'}
                    </span>
                    {reportType !== 'VISIT_REVIEW' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-800">
                        {ACCESSIBILITY_FEATURES.find((f) => f.id === feature)?.label}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs font-bold text-teal-700 hover:underline shrink-0"
                >
                  Edit
                </button>
              </div>

              {/* Visit Information */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Visit Info</span>
                  <p className="text-xs text-slate-700 mt-1">
                    <span className="font-semibold">Visited on:</span> {visitDate} •{' '}
                    <span className="font-semibold">Source:</span>{' '}
                    {OBSERVATION_SOURCE_OPTIONS.find((s) => s.id === observationSource)?.label}
                  </p>
                  {visitContext && (
                    <p className="text-xs text-slate-500 mt-1 italic">"{visitContext}"</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="text-xs font-bold text-teal-700 hover:underline shrink-0"
                >
                  Edit
                </button>
              </div>

              {/* Photos & Ratings */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Rating & Photos</span>
                  {rating > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-amber-500 text-xs font-bold">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>{rating} of 5 Stars</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-600 mt-1">
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} photo(s) attached`
                      : 'No photos attached'}
                  </p>
                  {photoPreviews.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {photoPreviews.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt="preview"
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                        />
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="text-xs font-bold text-teal-700 hover:underline shrink-0"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Accuracy Confirmation Checkbox */}
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedAccuracy}
                  onChange={(e) => setConfirmedAccuracy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
                />
                <span className="text-xs text-slate-700 leading-relaxed font-medium">
                  I confirm that this report is accurate to the best of my knowledge and based on real observations.
                  I understand this information helps disabled people across India travel with dignity.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation Actions */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <Link
              to="/reports"
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-semibold"
            >
              Cancel
            </Link>
          )}

          {step < 6 ? (
            <button
              type="button"
              disabled={
                (step === 1 && !canProceedFromStep1) ||
                (step === 2 && !canProceedFromStep2) ||
                (step === 3 && !canProceedFromStep3) ||
                (step === 4 && !canProceedFromStep4)
              }
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Submit Community Report
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Suggest Place Modal */}
      {showSuggestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Suggest a New Place</h3>
                  <p className="text-[11px] text-slate-500">Will undergo review before canonical listing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSuggestModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {suggestError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 mb-4">
                {suggestError}
              </p>
            )}

            <form onSubmit={handleSuggestPlace} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Venue Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={suggestForm.name}
                  onChange={(e) => setSuggestForm({ ...suggestForm, name: e.target.value })}
                  placeholder="E.g. District Civil Hospital"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={suggestForm.category}
                  onChange={(e) => setSuggestForm({ ...suggestForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-teal-500 bg-white"
                >
                  {VENUE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Street Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={suggestForm.address}
                  onChange={(e) => setSuggestForm({ ...suggestForm, address: e.target.value })}
                  placeholder="E.g. Ring Road, Near Metro Pillar 140"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={suggestForm.city || ''}
                    onChange={(e) => setSuggestForm({ ...suggestForm, city: e.target.value })}
                    placeholder="E.g. New Delhi"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={suggestForm.state || ''}
                    onChange={(e) => setSuggestForm({ ...suggestForm, state: e.target.value })}
                    placeholder="E.g. Delhi"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Latitude <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={suggestForm.latitude}
                    onChange={(e) =>
                      setSuggestForm({ ...suggestForm, latitude: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Longitude <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={suggestForm.longitude}
                    onChange={(e) =>
                      setSuggestForm({ ...suggestForm, longitude: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSuggestModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSuggesting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors"
                >
                  {isSuggesting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save & Select Place
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
