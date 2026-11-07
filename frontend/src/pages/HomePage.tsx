import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Accessibility, 
  DoorOpen, 
  Bath, 
  ArrowUpDown, 
  Car, 
  TrainFront,
  Users,
  Camera,
  Flag,
  HeartHandshake,
  Compass,
  ExternalLink,
} from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { CityHeroScene } from '../components/3d/CityHeroScene';
import { StatusBadge } from '../components/common/StatusBadge';
import { placeService } from '../services/placeService';
import { Place } from '../types/place';

export const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredPlaces, setFeaturedPlaces] = useState<Place[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    placeService.getPlaces({ page: 0, size: 3 })
      .then((res) => {
        if (isMounted) {
          setFeaturedPlaces(res.content || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load real featured places from API', err);
      })
      .finally(() => {
        if (isMounted) setLoadingFeatured(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const featureCards = [
    {
      title: 'Wheelchair Ingress & Circulation',
      desc: 'Accurately measured doorway widths (>80cm), zero-step thresholds, and smooth corridor turning radius.',
      icon: <Accessibility className="w-5 h-5 text-[#0F766E]" />,
      status: 'AVAILABLE' as const,
    },
    {
      title: 'Step-Free Entrances & Landings',
      desc: 'Level access routes from street grade, automatic sensor-operated sliding doors, and clear vestibules.',
      icon: <DoorOpen className="w-5 h-5 text-[#0F766E]" />,
      status: 'AVAILABLE' as const,
    },
    {
      title: 'Accessible Restrooms',
      desc: 'Sturdy grab bars, outward-swinging doors, roll-in wash basins, and emergency call cords.',
      icon: <Bath className="w-5 h-5 text-[#0F766E]" />,
      status: 'AVAILABLE' as const,
    },
    {
      title: 'Elevator & Vertical Access',
      desc: 'Audited elevator cabins with braille buttons, audio announcements, and compliant 1:12 ramp alternatives.',
      icon: <ArrowUpDown className="w-5 h-5 text-[#0F766E]" />,
      status: 'NOT_AVAILABLE' as const,
    },
    {
      title: 'Dedicated Mobility Parking',
      desc: 'Demarcated van-accessible bays with striped transfer aisles within 50 meters of the main entrance.',
      icon: <Car className="w-5 h-5 text-[#0F766E]" />,
      status: 'NOT_VERIFIED' as const,
    },
    {
      title: 'Transit Interchange Access',
      desc: 'Tactile paving guidance paths, low-floor bus access, and step-free train platform connections.',
      icon: <TrainFront className="w-5 h-5 text-[#0F766E]" />,
      status: 'UNKNOWN' as const,
    },
  ];

  return (
    <PageLayout>
      {/* --------------------------------------------------------------------- */}
      {/* 1. HERO SECTION                                                       */}
      {/* --------------------------------------------------------------------- */}
      <section className="relative pt-8 pb-16 md:pt-16 md:pb-24 overflow-hidden bg-[#F7F9FC]" aria-labelledby="hero-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Heading, Mission, Search */}
            <div className="lg:col-span-7 flex flex-col justify-center text-left">
              <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-[#E8F5F1] border border-[#0F766E]/20 text-[#0F766E] text-xs font-bold mb-6 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#0F766E] shrink-0" aria-hidden="true" />
                <span>Next-Generation Accessibility Intelligence</span>
              </div>

              <h1 
                id="hero-title"
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#102A43] leading-[1.12]"
              >
                Explore Places. <br />
                <span className="text-[#0F766E] underline decoration-[#10B981]/50 decoration-wavy decoration-2">
                  Without Barriers.
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-[#486581] leading-relaxed max-w-2xl font-normal">
                Eliminate navigation anxiety before you leave home. AccessMap gives wheelchair users, semi-ambulatory citizens, and families reliable, crowd-audited physical accessibility intelligence backed by our strict <strong>Four-State Verification Model</strong>.
              </p>

              {/* Accessible Search Form */}
              <form onSubmit={handleSearchSubmit} className="mt-8 max-w-xl" role="search" aria-label="Search accessible places">
                <div className="flex flex-col sm:flex-row gap-2.5 p-2 bg-white rounded-2xl border border-[#D9E2EC] shadow-md shadow-slate-900/5 focus-within:border-[#0F766E] focus-within:ring-2 focus-within:ring-[#0F766E]/20 transition-all">
                  <div className="relative grow flex items-center">
                    <MapPin className="absolute left-3.5 w-5 h-5 text-[#0F766E] pointer-events-none" aria-hidden="true" />
                    <label htmlFor="hero-search-input" className="sr-only">
                      Search for accessible hospitals, colleges, or transit hubs
                    </label>
                    <input
                      id="hero-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search hospitals, colleges, transit stations..."
                      className="w-full pl-11 pr-4 py-3 bg-transparent text-[#172B3A] placeholder-[#627D98] text-sm focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
                  >
                    <Search className="w-4 h-4" aria-hidden="true" />
                    <span>Explore Places</span>
                  </button>
                </div>

                {/* Popular Quick Navigation Pills */}
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#486581]">Quick Search:</span>
                  {[
                    { label: 'Hospitals', cat: 'HOSPITAL' },
                    { label: 'Transit Hubs', cat: 'TRANSIT_STATION' },
                    { label: 'Universities', cat: 'COLLEGE' },
                    { label: 'Civic Offices', cat: 'PUBLIC_OFFICE' },
                    { label: 'Malls & Retail', cat: 'SHOPPING_MALL' },
                  ].map((item) => (
                    <Link
                      key={item.cat}
                      to={`/explore?category=${item.cat}`}
                      className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-[#E8F5F1] hover:text-[#0F766E] hover:border-[#0F766E]/40 text-[#486581] font-medium transition-colors border border-[#D9E2EC] shadow-2xs"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </form>

              {/* Trust Indicators */}
              <div className="mt-10 pt-8 border-t border-[#D9E2EC] grid grid-cols-3 gap-4 max-w-lg">
                <div>
                  <p className="text-xl sm:text-2xl font-extrabold text-[#102A43]">4-State</p>
                  <p className="text-xs font-semibold text-[#486581] mt-0.5">Verification Rule</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-extrabold text-[#0F766E]">WCAG 2.2 AA</p>
                  <p className="text-xs font-semibold text-[#486581] mt-0.5">Accessibility Target</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-extrabold text-[#102A43]">PostGIS</p>
                  <p className="text-xs font-semibold text-[#486581] mt-0.5">Spatial Proximity</p>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Miniature Accessible City Scene */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-lg p-2 bg-white rounded-3xl border border-[#D9E2EC] shadow-xl shadow-slate-900/5">
                <CityHeroScene />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 2. REAL DATABASE FEATURED PLACES (API DATA)                           */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-16 md:py-20 bg-white border-t border-[#D9E2EC]" aria-labelledby="featured-places-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5F1] text-[#0F766E] text-xs font-bold mb-3 border border-[#0F766E]/20">
                <Compass className="w-3.5 h-3.5" />
                <span>Real-Time Database Records</span>
              </div>
              <h2 id="featured-places-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#102A43]">
                Audited Locations in Platform
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#486581] max-w-2xl">
                Directly queried from the live database. Explore real venues audited across standardized accessibility metrics.
              </p>
            </div>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#0F766E] hover:text-[#115E59] group"
            >
              <span>View all venues in database</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-[#D9E2EC] animate-pulse space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-8 bg-slate-200 rounded-xl w-1/2"></div>
                </div>
              ))}
            </div>
          ) : featuredPlaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPlaces.map((place) => (
                <div 
                  key={place.id} 
                  className="p-6 rounded-2xl bg-[#F7F9FC] border border-[#D9E2EC] shadow-2xs hover:shadow-md hover:border-[#0F766E]/50 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-white text-[#0F766E] border border-[#D9E2EC] uppercase tracking-wider">
                        {place.category}
                      </span>
                      <span className="text-xs font-semibold text-[#486581] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
                        {place.city || place.state || 'India'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#102A43] group-hover:text-[#0F766E] transition-colors leading-snug">
                      {place.name}
                    </h3>
                    <p className="mt-2 text-xs text-[#486581] line-clamp-2 leading-relaxed">
                      {place.description || place.address}
                    </p>

                    {/* Features Preview */}
                    <div className="mt-4 pt-4 border-t border-[#D9E2EC] flex flex-wrap gap-1.5">
                      {place.features && place.features.slice(0, 3).map((feat) => (
                        <StatusBadge key={feat.id || feat.featureType} status={feat.status} className="text-[10px] py-0.5 px-2" />
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#D9E2EC]/70 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#486581]">
                      {place.features?.length || 21} criteria audited
                    </span>
                    <Link
                      to={`/explore?q=${encodeURIComponent(place.name)}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:text-[#115E59]"
                    >
                      <span>Inspect Profile</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#F7F9FC] rounded-2xl border border-[#D9E2EC]">
              <p className="text-sm text-[#486581]">Live venues are being initialized in your environment.</p>
              <Link to="/explore" className="mt-3 inline-block text-xs font-bold text-[#0F766E]">
                Open Explore Page
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. AUDITED ACCESSIBILITY CRITERIA                                     */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-16 md:py-24 bg-[#F7F9FC] border-t border-[#D9E2EC]" aria-labelledby="features-preview-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5F1] text-[#0F766E] text-xs font-bold mb-3 border border-[#0F766E]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Standardized Audit Framework</span>
            </div>
            <h2 id="features-preview-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#102A43]">
              Audited Physical Infrastructure
            </h2>
            <p className="mt-4 text-base text-[#486581] leading-relaxed">
              We never reduce accessibility to a superficial checkbox. Every physical venue is audited across six core mobility and sensory dimensions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((feat, idx) => (
              <div 
                key={idx} 
                className="p-6 rounded-2xl bg-white border border-[#D9E2EC] shadow-2xs hover:shadow-md hover:border-[#0F766E]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#E8F5F1] border border-[#0F766E]/20 text-[#0F766E] flex items-center justify-center shadow-2xs">
                      {feat.icon}
                    </div>
                    <StatusBadge status={feat.status} />
                  </div>
                  <h3 className="text-base font-bold text-[#102A43]">{feat.title}</h3>
                  <p className="mt-2 text-xs text-[#486581] leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F766E] text-white font-bold text-sm hover:bg-[#115E59] shadow-md shadow-teal-900/10 transition-all"
            >
              <span>Search Verified Venues in Your Area</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 4. HOW ACCESSMAP WORKS                                                */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-16 md:py-24 bg-white border-t border-[#D9E2EC]" aria-labelledby="how-it-works-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 id="how-it-works-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#102A43]">
              How AccessMap Works
            </h2>
            <p className="mt-4 text-base text-[#486581] leading-relaxed">
              Transparent, accountable navigation intelligence across three verified steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-[#F7F9FC] border border-[#D9E2EC] shadow-2xs hover:border-[#0F766E]/40 transition-all">
              <span className="text-3xl font-black text-[#0F766E] font-mono">01</span>
              <h3 className="text-lg font-bold text-[#102A43] mt-4 mb-2">Discover & Filter</h3>
              <p className="text-xs text-[#486581] leading-relaxed">
                Filter by personal mobility needs: step-free access, functioning elevators, or accessible restrooms. Discover locations on a synchronized MapLibre vector map.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-[#F7F9FC] border border-[#D9E2EC] shadow-2xs hover:border-[#0F766E]/40 transition-all">
              <span className="text-3xl font-black text-[#0F766E] font-mono">02</span>
              <h3 className="text-lg font-bold text-[#102A43] mt-4 mb-2">Inspect 4-State Audits</h3>
              <p className="text-xs text-[#486581] leading-relaxed">
                Review unambiguous 4-state badges, photo evidence, and 3D architectural spatial cutaways with verified freshness timestamps.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-[#F7F9FC] border border-[#D9E2EC] shadow-2xs hover:border-[#0F766E]/40 transition-all">
              <span className="text-3xl font-black text-[#0F766E] font-mono">03</span>
              <h3 className="text-lg font-bold text-[#102A43] mt-4 mb-2">Contribute & Protect Trust</h3>
              <p className="text-xs text-[#486581] leading-relaxed">
                Submit field observations, capture barrier photographs, and flag stale information through an active, peer-moderated dispute queue.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0F766E] hover:text-[#115E59]"
            >
              <span>Explore the complete engineering specifications and verification rules</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 5. COMMUNITY AUDITING & DISPUTES                                      */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-16 md:py-24 bg-[#F7F9FC] border-t border-[#D9E2EC]" aria-labelledby="community-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5F1] text-[#0F766E] text-xs font-bold mb-4 border border-[#0F766E]/20">
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Crowdsourced Physical Auditing</span>
              </div>
              <h2 id="community-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#102A43] leading-tight">
                Powered by Community. <br />
                <span className="text-[#0F766E]">Verified with Integrity.</span>
              </h2>
              <p className="mt-4 text-base text-[#486581] leading-relaxed max-w-xl">
                Physical infrastructure changes constantly. Ramps undergo maintenance, elevators break down, and entrance layouts shift. AccessMap harnesses local community contributors to ensure data never goes stale.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white border border-[#D9E2EC] text-[#0F766E] shrink-0 shadow-2xs">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#102A43]">Photo Proof Submissions</h3>
                    <p className="text-xs text-[#486581] mt-0.5">Attach visual evidence showing exact door thresholds, ramp inclines, and bathroom grab rails.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white border border-[#D9E2EC] text-[#0F766E] shrink-0 shadow-2xs">
                    <Flag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#102A43]">Transparent Dispute Queue</h3>
                    <p className="text-xs text-[#486581] mt-0.5">Community members can challenge inaccurate reports, triggering administrative re-verification.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-8 rounded-3xl bg-white border border-[#D9E2EC] shadow-md">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F5F1] text-[#0F766E] flex items-center justify-center mb-6 border border-[#0F766E]/20">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#102A43] mb-2">Join as an Auditor</h3>
                <p className="text-xs text-[#486581] leading-relaxed mb-6">
                  Help people navigate your city with freedom. Document, audit, and verify accessibility features in your neighborhood.
                </p>
                <Link
                  to="/register"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs shadow-md shadow-teal-900/10 transition-all"
                >
                  <span>Sign Up as Contributor</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default HomePage;