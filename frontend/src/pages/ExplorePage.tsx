import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  RotateCcw,
  Map as MapIcon,
  List,
  Building2,
  GraduationCap,
  Train,
  Utensils,
  Store,
  Landmark,
  Coffee,
  BookOpen,
  Trees,
  Film,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Phone,
  Globe,
  ExternalLink,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { StatusBadge } from '../components/common/StatusBadge';
import { PlaceMap } from '../components/map/PlaceMap';
import { placeService } from '../services/placeService';
import { Place, PageMetadata } from '../types/place';
import { AccessibilityProfileSection } from '../components/accessibility/AccessibilityProfileSection';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search Input State (controlled inputs)
  const [searchInput, setSearchInput] = useState<string>(searchParams.get('q') || '');
  const [cityInput, setCityInput] = useState<string>(searchParams.get('city') || '');
  const [stateInput, setStateInput] = useState<string>(searchParams.get('state') || '');

  // Applied Filter State (triggers API query)
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'ALL');
  const [cityFilter, setCityFilter] = useState<string>(searchParams.get('city') || '');
  const [stateFilter, setStateFilter] = useState<string>(searchParams.get('state') || '');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize] = useState<number>(10);

  // Geolocation & Nearby State
  const [isNearbyActive, setIsNearbyActive] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [radiusMeters, setRadiusMeters] = useState<number>(5000);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoSuccessMessage, setGeoSuccessMessage] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Data & Selection State
  const [places, setPlaces] = useState<Place[]>([]);
  const [pageMetadata, setPageMetadata] = useState<PageMetadata>({
    size: 10,
    number: 0,
    totalElements: 0,
    totalPages: 0,
  });
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [showMapView, setShowMapView] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const detailsRef = useRef<HTMLDivElement | null>(null);

  // Sync state with URL parameters
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearchQuery(q);
    setSearchInput(q);
    const cat = searchParams.get('category') || 'ALL';
    setSelectedCategory(cat);
    const city = searchParams.get('city') || '';
    setCityFilter(city);
    setCityInput(city);
    const stateVal = searchParams.get('state') || '';
    setStateFilter(stateVal);
    setStateInput(stateVal);
  }, [searchParams]);

  // Smooth scroll to selected place details on mobile / viewport focus
  useEffect(() => {
    if (selectedPlaceId && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedPlaceId]);

  // Categories list covering full taxonomy
  const categories = useMemo(
    () => [
      { label: 'All Categories', value: 'ALL' },
      // Healthcare
      { label: 'Hospitals', value: 'HOSPITAL' },
      { label: 'Clinics', value: 'CLINIC' },
      { label: 'Doctors / Clinics', value: 'DOCTORS' },
      { label: 'Medical Centres', value: 'MEDICAL_CENTRE' },
      { label: 'Diagnostic Centres', value: 'DIAGNOSTIC_CENTRE' },
      // Education
      { label: 'Colleges', value: 'COLLEGE' },
      { label: 'Universities', value: 'UNIVERSITY' },
      { label: 'Schools', value: 'SCHOOL' },
      { label: 'Libraries', value: 'LIBRARY' },
      // Transport
      { label: 'Railway Stations', value: 'RAILWAY_STATION' },
      { label: 'Metro Stations', value: 'METRO_STATION' },
      { label: 'Bus Stations', value: 'BUS_STATION' },
      { label: 'Airports', value: 'AIRPORT' },
      { label: 'Transit Terminals', value: 'TRANSIT_STATION' },
      // Food & Hospitality
      { label: 'Restaurants', value: 'RESTAURANT' },
      { label: 'Cafes', value: 'CAFE' },
      { label: 'Hotels', value: 'HOTEL' },
      // Shopping
      { label: 'Shopping Malls', value: 'SHOPPING_MALL' },
      { label: 'Supermarkets', value: 'SUPERMARKET' },
      { label: 'Markets', value: 'MARKET' },
      // Public Facilities
      { label: 'Government Offices', value: 'PUBLIC_OFFICE' },
      { label: 'Public Parks', value: 'PARK' },
      { label: 'Community Centres', value: 'COMMUNITY_CENTRE' },
      { label: 'Public Buildings', value: 'PUBLIC_BUILDING' },
      // Other
      { label: 'Theaters', value: 'THEATER' },
      { label: 'Retail', value: 'RETAIL' },
    ],
    []
  );

  // Query Places from Backend
  const loadPlaces = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      if (isNearbyActive && userLocation) {
        // PostGIS Nearby Search with optional category filter
        const data = await placeService.getNearbyPlaces({
          lat: userLocation.lat,
          lng: userLocation.lng,
          radiusMeters: radiusMeters,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          page: currentPage,
          size: pageSize,
        });
        setPlaces(data.content);
        setPageMetadata(data.page);
      } else {
        // Standard Discovery Search
        const data = await placeService.getPlaces({
          q: searchQuery.trim() || undefined,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          city: cityFilter.trim() || undefined,
          state: stateFilter.trim() || undefined,
          features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
          page: currentPage,
          size: pageSize,
          sort: 'name,asc',
        });
        setPlaces(data.content);
        setPageMetadata(data.page);
      }
    } catch (err: unknown) {
      console.error('Failed to load places from API:', err);
      const msg = err instanceof Error ? err.message : 'Unable to query venues from server.';
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isNearbyActive, userLocation, radiusMeters, searchQuery, selectedCategory, cityFilter, stateFilter, selectedFeatures, currentPage, pageSize]);

  // Trigger query on parameter change
  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  // Handle User Geolocation explicitly (Privacy compliant: only called on explicit user click)
  const handleUseMyLocation = () => {
    setGeoError(null);
    setGeoSuccessMessage(null);

    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by your browser. Please search manually by city or venue name.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(coords);
        setIsNearbyActive(true);
        setCurrentPage(0);
        setSelectedPlaceId(null);
        const accuracyText = position.coords.accuracy ? ` (accurate to ±${Math.round(position.coords.accuracy)}m)` : '';
        setGeoSuccessMessage(`Device location detected successfully${accuracyText}. Searching accessible places near you.`);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Location permission was denied. You can allow location access in your browser settings, or enter a city or venue name below to search manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Location information is unavailable. Please verify your GPS or device location settings are enabled, or search manually.');
            break;
          case error.TIMEOUT:
            setGeoError('Location request timed out. Please try again or search manually by city.');
            break;
          default:
            setGeoError('Unable to determine your device location. Please search manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleClearLocation = () => {
    setIsNearbyActive(false);
    setUserLocation(null);
    setGeoError(null);
    setGeoSuccessMessage(null);
    setCurrentPage(0);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setCityInput('');
    setStateInput('');
    setSearchQuery('');
    setSelectedCategory('ALL');
    setCityFilter('');
    setStateFilter('');
    setSelectedFeatures([]);
    setIsNearbyActive(false);
    setUserLocation(null);
    setGeoError(null);
    setGeoSuccessMessage(null);
    setSelectedPlaceId(null);
    setCurrentPage(0);
    setSearchParams({});
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    const trimmedQuery = searchInput.trim();
    const trimmedCity = cityInput.trim();
    const trimmedState = stateInput.trim();
    setSearchQuery(trimmedQuery);
    setCityFilter(trimmedCity);
    setStateFilter(trimmedState);

    const newParams: Record<string, string> = {};
    if (trimmedQuery) newParams.q = trimmedQuery;
    if (selectedCategory !== 'ALL') newParams.category = selectedCategory;
    if (trimmedCity) newParams.city = trimmedCity;
    if (trimmedState) newParams.state = trimmedState;
    setSearchParams(newParams);
  };

  // Viewport Search when user pans/zooms map
  const handleSearchArea = async (bounds: { north: number; south: number; east: number; west: number }) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await placeService.getPlacesInViewport({
        north: bounds.north,
        south: bounds.south,
        east: bounds.east,
        west: bounds.west,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        size: 50,
      });
      setPlaces(data.content);
      setPageMetadata(data.page);
    } catch (err: unknown) {
      console.error('Viewport search error:', err);
      setApiError(err instanceof Error ? err.message : 'Failed to search map area.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'HOSPITAL':
        return <Building2 className="w-4 h-4 text-rose-600" />;
      case 'COLLEGE':
        return <GraduationCap className="w-4 h-4 text-indigo-600" />;
      case 'TRANSIT_STATION':
        return <Train className="w-4 h-4 text-emerald-600" />;
      case 'RESTAURANT':
        return <Utensils className="w-4 h-4 text-amber-600" />;
      case 'CAFE':
        return <Coffee className="w-4 h-4 text-orange-600" />;
      case 'LIBRARY':
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'PARK':
        return <Trees className="w-4 h-4 text-green-600" />;
      case 'THEATER':
        return <Film className="w-4 h-4 text-purple-600" />;
      case 'SHOPPING_MALL':
      case 'RETAIL':
        return <Store className="w-4 h-4 text-cyan-600" />;
      default:
        return <Landmark className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatDistance = (meters?: number | null) => {
    if (meters === undefined || meters === null) return null;
    if (meters < 1000) {
      return `${Math.round(meters)} m away`;
    }
    return `${(meters / 1000).toFixed(1)} km away`;
  };

  const selectedPlace = useMemo(
    () => places.find((p) => p.id === selectedPlaceId) || null,
    [places, selectedPlaceId]
  );

  return (
    <PageLayout className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* --------------------------------------------------------------------- */}
      {/* Page Header                                                           */}
      {/* --------------------------------------------------------------------- */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#102A43] sm:text-4xl">
          Discover Accessible Venues
        </h1>
        <p className="mt-2 text-sm text-[#486581] max-w-2xl">
          Search physical places, explore them geographically on the interactive map, and inspect independently verified four-state accessibility audits.
        </p>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* AI Assistant Natural Language Search Banner                           */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-[#E8F5F1] to-teal-50/80 rounded-2xl border border-[#0F766E]/20 p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#102A43] flex items-center gap-1.5">
              <span>Natural Language Search with AccessMap AI</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0F766E] text-white">
                New
              </span>
            </h2>
            <p className="text-xs text-[#486581] mt-0.5">
              Ask in plain sentences: &quot;Find hospitals in Patna with wheelchair access&quot; or &quot;Nearby places with elevators&quot;.
            </p>
          </div>
        </div>

        <Link
          to="/assistant"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0F766E] hover:bg-[#115E59] transition-all shadow-xs shrink-0 self-stretch sm:self-auto justify-center"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI Assistant</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Quick Category Filter Bar                                             */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none" role="tablist" aria-label="Category Filters">
        {[
          { label: 'All Categories', value: 'ALL', icon: <Landmark className="w-3.5 h-3.5" /> },
          { label: 'Hospitals & Clinics', value: 'HOSPITAL', icon: <Building2 className="w-3.5 h-3.5" /> },
          { label: 'Colleges & Universities', value: 'COLLEGE', icon: <GraduationCap className="w-3.5 h-3.5" /> },
          { label: 'Transit Hubs', value: 'TRANSIT_STATION', icon: <Train className="w-3.5 h-3.5" /> },
          { label: 'Restaurants & Dining', value: 'RESTAURANT', icon: <Utensils className="w-3.5 h-3.5" /> },
          { label: 'Cafes & Workspaces', value: 'CAFE', icon: <Coffee className="w-3.5 h-3.5" /> },
          { label: 'Malls & Retail', value: 'SHOPPING_MALL', icon: <Store className="w-3.5 h-3.5" /> },
          { label: 'Parks & Recreation', value: 'PARK', icon: <Trees className="w-3.5 h-3.5" /> },
        ].map((c) => {
          const isSelected = selectedCategory === c.value;
          return (
            <button
              key={c.value}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setSelectedCategory(c.value);
                setCurrentPage(0);
                const newParams: Record<string, string> = {};
                if (searchInput.trim()) newParams.q = searchInput.trim();
                if (c.value !== 'ALL') newParams.category = c.value;
                if (cityInput.trim()) newParams.city = cityInput.trim();
                if (stateInput.trim()) newParams.state = stateInput.trim();
                setSearchParams(newParams);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'bg-white text-[#486581] border border-[#D9E2EC] hover:bg-slate-50 hover:text-[#102A43]'
              }`}
            >
              {c.icon}
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Search & Discovery Controls Bar                                       */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-[#D9E2EC] p-5 shadow-xs mb-8">
        {/* Real-Time Device Location Detection Bar (Prominent Mobile-First Action) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isNearbyActive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-[#E8F5F1] text-[#0F766E]'
            }`}>
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#0F766E]" />
              ) : (
                <Navigation className={`w-4 h-4 ${isNearbyActive ? 'fill-emerald-700' : ''}`} />
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#102A43] flex items-center gap-1.5">
                <span>{isNearbyActive ? 'Nearby Places Around Your Device' : 'Discover Places Near You'}</span>
                {isNearbyActive && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    GPS Active
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-[#486581]">
                {isNearbyActive && userLocation
                  ? `Showing venues within ${(radiusMeters / 1000).toFixed(0)} km of detected coordinates${userLocation.accuracy ? ` (±${Math.round(userLocation.accuracy)}m accuracy)` : ''}`
                  : 'Detect phone GPS or browser geolocation with 1 tap to explore nearby venues'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isNearbyActive
                  ? 'bg-[#102A43] hover:bg-[#1a3d61] text-white'
                  : 'bg-[#0F766E] hover:bg-[#115E59] text-white'
              }`}
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Detecting Location...</span>
                </>
              ) : isNearbyActive ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-white" />
                  <span>Update My Location</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 fill-white" />
                  <span>Use My Current Location</span>
                </>
              )}
            </button>

            {isNearbyActive && (
              <button
                type="button"
                onClick={handleClearLocation}
                className="px-3 py-2.5 rounded-xl border border-[#D9E2EC] bg-white text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Clear device location and switch back to manual search"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* 1. Name / Keyword Search */}
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search venue name, address or landmark..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#D9E2EC] focus:outline-hidden focus:ring-2 focus:ring-[#0F766E] focus:border-[#0F766E] bg-white transition-shadow text-[#172B3A] placeholder-[#627D98]"
              />
            </div>

            {/* 2. City Filter Input */}
            <div className="md:col-span-2 relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="City (e.g. Mumbai, Patna)..."
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-[#D9E2EC] focus:outline-hidden focus:ring-2 focus:ring-[#0F766E] focus:border-[#0F766E] bg-white transition-shadow text-[#172B3A] placeholder-[#627D98]"
              />
            </div>

            {/* 3. State Filter Input */}
            <div className="md:col-span-2 relative">
              <Landmark className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="State (e.g. Maharashtra)..."
                value={stateInput}
                onChange={(e) => setStateInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-[#D9E2EC] focus:outline-hidden focus:ring-2 focus:ring-[#0F766E] focus:border-[#0F766E] bg-white transition-shadow text-[#172B3A] placeholder-[#627D98]"
              />
            </div>

            {/* 4. Category Dropdown */}
            <div className="md:col-span-2">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCategory(val);
                  setCurrentPage(0);
                  const newParams: Record<string, string> = {};
                  if (searchInput.trim()) newParams.q = searchInput.trim();
                  if (val !== 'ALL') newParams.category = val;
                  if (cityInput.trim()) newParams.city = cityInput.trim();
                  if (stateInput.trim()) newParams.state = stateInput.trim();
                  setSearchParams(newParams);
                }}
                className="w-full py-2.5 px-3 text-xs rounded-xl border border-[#D9E2EC] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F766E] cursor-pointer text-[#172B3A]"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Action Buttons */}
            <div className="md:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-3.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                title="Use current GPS location"
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                  isNearbyActive
                    ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-[#D9E2EC]'
                }`}
              >
                {isLocating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#0F766E]" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Accessibility Feature Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-[#486581] uppercase tracking-wider mr-1">
              Required Accessibility:
            </span>
            {[
              { code: 'WHEELCHAIR_ACCESSIBLE_ENTRANCE', label: 'Wheelchair Ingress' },
              { code: 'STEP_FREE_ENTRANCE', label: 'Step-Free Entrance' },
              { code: 'ENTRANCE_RAMP', label: 'Accessible Ramp' },
              { code: 'ELEVATOR_AVAILABILITY', label: 'Working Elevator' },
              { code: 'ACCESSIBLE_RESTROOM', label: 'Accessible Restroom' },
              { code: 'ACCESSIBLE_PARKING', label: 'Reserved Parking' },
            ].map((f) => {
              const active = selectedFeatures.includes(f.code);
              return (
                <button
                  key={f.code}
                  type="button"
                  onClick={() => {
                    setSelectedFeatures((prev) =>
                      active ? prev.filter((c) => c !== f.code) : [...prev, f.code]
                    );
                    setCurrentPage(0);
                  }}
                  className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#10B981] text-white border-[#10B981] shadow-2xs'
                      : 'bg-[#F7F9FC] text-[#486581] border-[#D9E2EC] hover:bg-white hover:text-[#102A43]'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Active Proximity & Filter Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {isNearbyActive && userLocation && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E8F5F1] border border-[#0F766E]/30 text-[#0F766E] font-medium">
                  <Navigation className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Proximity Search:</span>
                  <select
                    value={radiusMeters}
                    onChange={(e) => {
                      setRadiusMeters(Number(e.target.value));
                      setCurrentPage(0);
                    }}
                    className="bg-transparent font-bold border-b border-[#0F766E] text-[#0F766E] focus:outline-hidden cursor-pointer"
                  >
                    <option value={1000}>Within 1 km</option>
                    <option value={2000}>Within 2 km</option>
                    <option value={5000}>Within 5 km</option>
                    <option value={10000}>Within 10 km</option>
                    <option value={25000}>Within 25 km</option>
                    <option value={50000}>Within 50 km</option>
                  </select>
                  {userLocation.accuracy && (
                    <span className="text-[11px] text-teal-800 bg-white/70 px-2 py-0.5 rounded-md border border-teal-200 font-mono">
                      ±{Math.round(userLocation.accuracy)}m accuracy
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleClearLocation}
                    className="ml-1 text-[#0F766E] hover:text-[#115E59] p-0.5 rounded cursor-pointer"
                    title="Clear location filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {(searchQuery || selectedCategory !== 'ALL' || cityFilter || isNearbyActive || selectedFeatures.length > 0) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 bg-[#F7F9FC] p-1 rounded-xl border border-[#D9E2EC]">
              <button
                type="button"
                onClick={() => setShowMapView(true)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showMapView
                    ? 'bg-white text-[#102A43] shadow-xs'
                    : 'text-[#486581] hover:text-[#102A43]'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Split Map</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMapView(false)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  !showMapView
                    ? 'bg-white text-[#102A43] shadow-xs'
                    : 'text-[#486581] hover:text-[#102A43]'
                }`}
              >
                <List className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>List Only</span>
              </button>
            </div>
          </div>
        </form>

        {/* Real-time Location Success Banner */}
        {geoSuccessMessage && isNearbyActive && userLocation && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between gap-3 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="font-bold text-emerald-900">{geoSuccessMessage}</span>
                <span className="text-emerald-800 ml-1.5">
                  Found {pageMetadata.totalElements} accessible {pageMetadata.totalElements === 1 ? 'venue' : 'venues'} within {(radiusMeters / 1000).toFixed(0)} km.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setGeoSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1"
              title="Dismiss message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Geolocation Notice Banner */}
        {geoError && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center justify-between gap-3 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="font-bold text-amber-900">Location Access Notice</div>
                <div className="text-amber-800 mt-0.5">{geoError}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setGeoError(null)}
              className="text-amber-700 hover:text-amber-900 cursor-pointer p-1"
              title="Dismiss message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Main Content: Split Map & Listing View                                */}
      {/* --------------------------------------------------------------------- */}
      <div className={`grid gap-6 ${showMapView ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        
        {/* Left Side: Places Listing */}
        <div className={`${showMapView ? 'lg:col-span-7' : 'w-full'} space-y-4`}>
          {/* If in List-Only mode and a venue is selected, show details at top of list */}
          {!showMapView && selectedPlace && (
            <div ref={detailsRef} className="bg-white rounded-3xl border border-teal-300 p-6 shadow-md space-y-4 mb-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 shrink-0">
                    {getCategoryIcon(selectedPlace.category)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">
                      {selectedPlace.name}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                      {selectedPlace.category}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlaceId(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                  aria-label="Close details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedPlace.description && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedPlace.description}
                </p>
              )}

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>
                    {selectedPlace.address}, {selectedPlace.city} {selectedPlace.postalCode}
                  </span>
                </div>

                {selectedPlace.distanceMeters !== undefined && selectedPlace.distanceMeters !== null && (
                  <div className="flex items-center gap-2 text-blue-700 font-semibold">
                    <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Distance: {formatDistance(selectedPlace.distanceMeters)}</span>
                  </div>
                )}

                {selectedPlace.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{selectedPlace.phone}</span>
                  </div>
                )}

                {selectedPlace.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <a
                      href={selectedPlace.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:underline flex items-center gap-1"
                    >
                      <span>Visit Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <AccessibilityProfileSection placeId={selectedPlace.id} placeName={selectedPlace.name} />
              </div>
            </div>
          )}

          {/* Status Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs text-slate-500 px-1">
            <span>
              Showing <strong>{places.length}</strong> of <strong>{pageMetadata.totalElements}</strong> venues
            </span>
            <span>
              Locations indexed with PostGIS coordinates (©{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-teal-700"
              >
                OpenStreetMap
              </a>{' '}
              contributors, ODbL)
            </span>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200 h-40 flex flex-col justify-between">
                  <div className="h-4 bg-slate-200 rounded-md w-1/3 mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded-md w-1/2 mb-4"></div>
                  <div className="h-6 bg-slate-100 rounded-md w-3/4"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoading && apiError && (
            <div className="p-8 rounded-3xl bg-white border border-rose-200 text-center shadow-xs">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900">Failed to query places</h3>
              <p className="text-xs text-slate-600 mt-1 mb-4">{apiError}</p>
              <button
                onClick={loadPlaces}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Retry Request
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !apiError && places.length === 0 && (
            <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No venues found</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mt-2 mb-6">
                No places match your current search terms or proximity radius. Try selecting a different category or clearing the search filters.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}

          {/* Places Cards */}
          {!isLoading &&
            !apiError &&
            places.map((place) => {
              const isSelected = selectedPlaceId === place.id;
              const distString = formatDistance(place.distanceMeters);

              return (
                <article
                  key={place.id}
                  onClick={() => setSelectedPlaceId(place.id)}
                  className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
                    isSelected
                      ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20 shadow-md bg-[#E8F5F1]/15'
                      : 'border-[#D9E2EC] hover:border-[#0F766E]/50'
                  }`}
                  aria-selected={isSelected}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-[#F7F9FC] border border-[#D9E2EC] shrink-0 mt-0.5">
                        {getCategoryIcon(place.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-bold text-base text-[#102A43] leading-snug">
                            {place.name}
                          </h2>
                          {distString && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {distString}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#486581] flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-[#0F766E] shrink-0" />
                          <span>
                            {place.address}
                            {place.city ? `, ${place.city}` : ''}
                            {place.state ? `, ${place.state}` : ''}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#F7F9FC] text-[#486581] border border-[#D9E2EC]">
                        {place.category}
                      </span>
                      {place.sourceName === 'OPEN_STREET_MAP' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200" title="Source: OpenStreetMap (ODbL)">
                          OSM Data
                        </span>
                      )}
                    </div>
                  </div>

                  {place.description && (
                    <p className="text-xs text-[#486581] mt-3 line-clamp-2 leading-relaxed">
                      {place.description}
                    </p>
                  )}

                  {/* Accessibility Features Preview */}
                  {place.features && place.features.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                      {place.features.slice(0, 3).map((feat) => (
                        <div key={feat.id} className="flex items-center gap-1.5 text-xs">
                          <span className="text-[#486581] text-[11px]">
                            {feat.featureType.replace(/_/g, ' ')}:
                          </span>
                          <StatusBadge status={feat.status} />
                        </div>
                      ))}
                      {place.features.length > 3 && (
                        <span className="text-[11px] text-[#627D98] self-center">
                          +{place.features.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Card Footer: Metadata */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#627D98]">
                    <span>
                      Coords: {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                    </span>
                    <span className="text-[#0F766E] font-bold text-xs hover:underline flex items-center gap-1">
                      <span>View Verified Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </article>
              );
            })}

          {/* Pagination Controls */}
          {!isLoading && !apiError && pageMetadata.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="text-slate-600 font-medium">
                Page {currentPage + 1} of {pageMetadata.totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(pageMetadata.totalPages - 1, p + 1))}
                disabled={currentPage >= pageMetadata.totalPages - 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Map & Selected Venue Sidebar */}
        {showMapView && (
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-24 space-y-4">
              {/* MapLibre Container */}
              <PlaceMap
                places={places}
                selectedPlaceId={selectedPlaceId}
                onSelectPlace={(id) => setSelectedPlaceId(id)}
                userLocation={userLocation}
                onSearchArea={handleSearchArea}
              />

              {/* Selected Place Details Drawer */}
              {selectedPlace ? (
                <div ref={detailsRef} className="bg-white rounded-2xl border border-[#0F766E]/30 p-5 shadow-md space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#E8F5F1] text-[#0F766E] border border-[#0F766E]/20 shrink-0">
                        {getCategoryIcon(selectedPlace.category)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#102A43] leading-snug">
                          {selectedPlace.name}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#E8F5F1] text-[#0F766E] border border-[#0F766E]/20 font-bold">
                          {selectedPlace.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPlaceId(null)}
                      className="text-[#627D98] hover:text-[#102A43] p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title="Close details"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {selectedPlace.description && (
                    <p className="text-xs text-[#486581] leading-relaxed">
                      {selectedPlace.description}
                    </p>
                  )}

                  <div className="space-y-1.5 text-xs text-[#486581] pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                      <span>
                        {selectedPlace.address}, {selectedPlace.city} {selectedPlace.postalCode}
                      </span>
                    </div>

                    {selectedPlace.distanceMeters !== undefined && selectedPlace.distanceMeters !== null && (
                      <div className="flex items-center gap-2 text-blue-700 font-semibold">
                        <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Distance: {formatDistance(selectedPlace.distanceMeters)}</span>
                      </div>
                    )}

                    {selectedPlace.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                        <span>{selectedPlace.phone}</span>
                      </div>
                    )}

                    {selectedPlace.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                        <a
                          href={selectedPlace.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0F766E] hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>Visit Official Website</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Accessibility Profile Audit */}
                  <div className="pt-4 border-t border-slate-100">
                    <AccessibilityProfileSection placeId={selectedPlace.id} placeName={selectedPlace.name} />
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white border border-[#D9E2EC] text-center text-xs text-[#486581] shadow-2xs">
                  <span>Click any venue card or map marker to view detailed address and accessibility information.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ExplorePage;
