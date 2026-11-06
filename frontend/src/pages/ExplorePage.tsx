import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Filter, 
  RotateCcw, 
  Map as MapIcon, 
  List, 
  Info, 
  Building2, 
  GraduationCap, 
  Train, 
  Utensils, 
  Store, 
  Landmark,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { StatusBadge } from '../components/common/StatusBadge';
import { SAMPLE_PLACES } from '../services/mockData';
import { FeatureType, PlaceCategory } from '../types/accessibility';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'ALL');
  const [requiredFeatures, setRequiredFeatures] = useState<FeatureType[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [showMapView, setShowMapView] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // Sync state if URL search query changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
    }
    const cat = searchParams.get('category');
    if (cat !== null) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Categories list
  const categories: { label: string; value: string }[] = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'Hospitals', value: 'HOSPITAL' },
    { label: 'Colleges', value: 'COLLEGE' },
    { label: 'Transit Hubs', value: 'TRANSIT_STATION' },
    { label: 'Public Offices', value: 'PUBLIC_OFFICE' },
    { label: 'Shopping Malls', value: 'SHOPPING_MALL' },
    { label: 'Restaurants', value: 'RESTAURANT' },
  ];

  // Feature filters list
  const featureFilters: { label: string; type: FeatureType }[] = [
    { label: 'Step-Free Entrance', type: 'STEP_FREE_ENTRANCE' },
    { label: 'Working Elevator', type: 'ELEVATOR' },
    { label: 'Ramp Access', type: 'RAMP' },
    { label: 'Accessible Restroom', type: 'ACCESSIBLE_RESTROOM' },
    { label: 'Accessible Parking', type: 'ACCESSIBLE_PARKING' },
    { label: 'Transit Access', type: 'PUBLIC_TRANSPORT_ACCESSIBILITY' },
  ];

  const toggleFeatureFilter = (type: FeatureType) => {
    setRequiredFeatures((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setRequiredFeatures([]);
    setSelectedPlaceId(null);
    setSearchParams({});
  };

  // Filter computation
  const filteredPlaces = useMemo(() => {
    return SAMPLE_PLACES.filter((place) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = place.name.toLowerCase().includes(query);
        const matchesAddress = place.address.toLowerCase().includes(query);
        const matchesCity = place.city.toLowerCase().includes(query);
        if (!matchesName && !matchesAddress && !matchesCity) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'ALL' && place.category !== selectedCategory) {
        return false;
      }

      // 3. Required Features Filter (feature must be AVAILABLE)
      if (requiredFeatures.length > 0) {
        for (const reqFeat of requiredFeatures) {
          const feat = place.features.find((f) => f.featureType === reqFeat);
          if (!feat || feat.status !== 'AVAILABLE') {
            return false;
          }
        }
      }

      return true;
    });
  }, [searchQuery, selectedCategory, requiredFeatures]);

  const getCategoryIcon = (category: PlaceCategory) => {
    switch (category) {
      case 'HOSPITAL': return <Building2 className="w-4 h-4 text-teal-600" />;
      case 'COLLEGE': return <GraduationCap className="w-4 h-4 text-blue-600" />;
      case 'TRANSIT_STATION': return <Train className="w-4 h-4 text-amber-600" />;
      case 'PUBLIC_OFFICE': return <Landmark className="w-4 h-4 text-indigo-600" />;
      case 'SHOPPING_MALL': return <Store className="w-4 h-4 text-purple-600" />;
      case 'RESTAURANT': return <Utensils className="w-4 h-4 text-rose-600" />;
      default: return <MapPin className="w-4 h-4 text-slate-600" />;
    }
  };

  // Trigger brief skeleton loading on filter changes for realistic UX feel
  const triggerSimulatedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
  };

  return (
    <PageLayout className="bg-slate-100/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header & Subtitle */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Discover Accessible Places
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Explore places by verified physical accessibility criteria, entrance gradients, and restroom amenities.
            </p>
          </div>

          {/* Prototype Notice Banner */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium self-start md:self-auto shadow-2xs">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Prototype Demonstration: Showing synthetic illustrative records.</span>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* Search & Filter Toolbar                                             */}
        {/* ------------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-8">
          <form onSubmit={triggerSimulatedSearch} className="flex flex-col lg:flex-row gap-4">
            
            {/* Search Input */}
            <div className="relative grow">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <label htmlFor="explore-search" className="sr-only">Search places</label>
              <input
                id="explore-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by venue name, address, or city..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
              />
            </div>

            {/* Category Select */}
            <div className="w-full lg:w-64">
              <label htmlFor="category-select" className="sr-only">Category</label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowMapView(true)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showMapView
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                aria-pressed={showMapView}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMapView(false)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  !showMapView
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                aria-pressed={!showMapView}
              >
                <List className="w-3.5 h-3.5" />
                <span>List Only</span>
              </button>
            </div>
          </form>

          {/* Checkbox Filter Chips */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mr-2">
              <Filter className="w-3 h-3 text-teal-700" /> Require Available:
            </span>
            {featureFilters.map((f) => {
              const isChecked = requiredFeatures.includes(f.type);
              return (
                <button
                  key={f.type}
                  type="button"
                  onClick={() => toggleFeatureFilter(f.type)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isChecked
                      ? 'bg-teal-50 text-teal-800 border-teal-300 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  aria-pressed={isChecked}
                >
                  {isChecked ? (
                    <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{f.label}</span>
                </button>
              );
            })}

            {(searchQuery || selectedCategory !== 'ALL' || requiredFeatures.length > 0) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-auto text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer py-1 px-2 rounded-md hover:bg-rose-50"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* Main Content: Split Map & Listing View                             */}
        {/* ------------------------------------------------------------------- */}
        <div className={`grid gap-6 ${showMapView ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
          
          {/* Left Side: Places Listing */}
          <div className={`${showMapView ? 'lg:col-span-7' : 'w-full'} space-y-4`}>
            
            {/* Status bar */}
            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
              <span>Showing <strong>{filteredPlaces.length}</strong> matching venues</span>
              <span>All records marked with verification state</span>
            </div>

            {/* Loading State Skeleton */}
            {isLoading && (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 h-44 flex flex-col justify-between">
                    <div className="h-4 bg-slate-200 rounded-md w-1/3 mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded-md w-1/2 mb-4"></div>
                    <div className="h-6 bg-slate-100 rounded-md w-3/4"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {!isLoading && hasError && (
              <div className="p-8 rounded-2xl bg-white border border-rose-200 text-center shadow-xs">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900">Failed to query places</h3>
                <p className="text-xs text-slate-600 mt-1 mb-4">An error occurred while loading places.</p>
                <button
                  onClick={() => setHasError(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !hasError && filteredPlaces.length === 0 && (
              <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No places found</h3>
                <p className="text-sm text-slate-600 max-w-sm mx-auto mt-2 mb-6">
                  No venues match your current combination of category and required accessibility criteria.
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

            {/* Places List Cards */}
            {!isLoading && !hasError && filteredPlaces.map((place) => {
              const isSelected = selectedPlaceId === place.id;
              return (
                <article
                  key={place.id}
                  onClick={() => setSelectedPlaceId(place.id)}
                  className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
                    isSelected 
                      ? 'border-teal-600 ring-2 ring-teal-600/20 shadow-md' 
                      : 'border-slate-200/90 hover:border-teal-400'
                  }`}
                  aria-selected={isSelected}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-slate-100 shrink-0">
                        {getCategoryIcon(place.category)}
                      </div>
                      <div>
                        <h2 className="font-bold text-base text-slate-900 leading-snug">
                          {place.name}
                        </h2>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{place.address}, {place.city}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                      {place.category}
                    </span>
                  </div>

                  {/* Feature Status Indicators */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                    {place.features.map((feat) => (
                      <div key={feat.id} className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-600 font-medium">
                          {feat.featureType.replace(/_/g, ' ')}:
                        </span>
                        <StatusBadge status={feat.status} />
                      </div>
                    ))}
                  </div>

                  {/* Card Footer: Metadata & Disclaimer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>Coordinates: {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}</span>
                      <span>•</span>
                      <span>Last audited {place.lastAuditedDaysAgo}d ago</span>
                    </div>
                    <span className="text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200 self-start sm:self-auto">
                      Illustrative Demo Record
                    </span>
                  </div>
                </article>
              );
            })}

          </div>

          {/* Right Side: MapLibre Vector Map Integration Viewport */}
          {showMapView && (
            <div className="lg:col-span-5">
              <div className="sticky top-28 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapIcon className="w-4 h-4 text-teal-600" />
                    <h3 className="font-bold text-sm text-slate-900">Spatial Map Viewport</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">MapLibre GL Container</span>
                </div>

                {/* Map View Canvas Container */}
                <div 
                  className="relative w-full h-[420px] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex flex-col items-center justify-center p-6 text-center"
                  role="region"
                  aria-label="MapLibre spatial discovery vector map"
                >
                  {/* Stylized vector map grid background */}
                  <div 
                    className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] bg-[size:32px_32px]"
                  />

                  {/* Interactive Pins on Map */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                    {filteredPlaces.slice(0, 5).map((place, idx) => {
                      const isSelected = selectedPlaceId === place.id;
                      const offsets = [
                        { top: '35%', left: '42%' },
                        { top: '55%', left: '60%' },
                        { top: '25%', left: '68%' },
                        { top: '70%', left: '30%' },
                        { top: '45%', left: '22%' },
                      ][idx % 5];

                      return (
                        <button
                          key={place.id}
                          onClick={() => setSelectedPlaceId(place.id)}
                          style={{ position: 'absolute', top: offsets.top, left: offsets.left }}
                          className={`group -translate-x-1/2 -translate-y-1/2 p-2 rounded-full cursor-pointer transition-transform hover:scale-125 focus:outline-hidden ${
                            isSelected ? 'scale-125 z-20' : 'z-10'
                          }`}
                          aria-label={`View ${place.name} on map`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                            isSelected ? 'bg-amber-400 text-slate-900 ring-4 ring-amber-300/50' : 'bg-teal-600 text-white'
                          }`}>
                            <MapPin className="w-4 h-4" />
                          </div>
                          {/* Tooltip on pin */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none">
                            {place.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom Map Info Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between p-2.5 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>MapLibre GL Vector Tile Engine</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">EPSG:4326 PostGIS</span>
                  </div>
                </div>

                {/* Selected Place Detail Preview in Map Sidebar */}
                {selectedPlaceId && (
                  <div className="mt-3 p-3 rounded-xl bg-teal-50/70 border border-teal-200 text-xs">
                    <p className="font-bold text-teal-950">
                      Selected: {SAMPLE_PLACES.find((p) => p.id === selectedPlaceId)?.name}
                    </p>
                    <p className="text-teal-800 text-[11px] mt-0.5">
                      Pin synchronized with list item. Click list card to navigate.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </PageLayout>
  );
};

export default ExplorePage;