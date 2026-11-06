import React, { useState } from 'react';
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
  HeartHandshake
} from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { CityHeroScene } from '../components/3d/CityHeroScene';
import { StatusBadge } from '../components/common/StatusBadge';

export const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

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
      title: 'Wheelchair Accessibility',
      desc: 'Doorway widths, level thresholds, and smooth circulation routes.',
      icon: <Accessibility className="w-6 h-6 text-teal-600" />,
      status: 'AVAILABLE' as const,
    },
    {
      title: 'Step-Free Entrances',
      desc: 'Zero-step ingress, automatic power-assisted doors, and level landings.',
      icon: <DoorOpen className="w-6 h-6 text-teal-600" />,
      status: 'AVAILABLE' as const,
    },
    {
      title: 'Accessible Restrooms',
      desc: 'Wide turning radius, sturdy grab bars, and roll-in fixtures.',
      icon: <Bath className="w-6 h-6 text-teal-600" />,
      status: 'AVAILABLE' as const,
    },
    {
      title: 'Elevators & Ramps',
      desc: '1:12 maximum ramp slopes with rails and tactile elevator controls.',
      icon: <ArrowUpDown className="w-6 h-6 text-teal-600" />,
      status: 'NOT_AVAILABLE' as const,
    },
    {
      title: 'Accessible Parking',
      desc: 'Dedicated van-accessible bays with striped aisles near primary access.',
      icon: <Car className="w-6 h-6 text-teal-600" />,
      status: 'NOT_VERIFIED' as const,
    },
    {
      title: 'Public Transport',
      desc: 'Platform elevators, ramped boarding, and tactile pavement navigation.',
      icon: <TrainFront className="w-6 h-6 text-teal-600" />,
      status: 'UNKNOWN' as const,
    },
  ];

  return (
    <PageLayout>
      {/* --------------------------------------------------------------------- */}
      {/* Hero Section                                                          */}
      {/* --------------------------------------------------------------------- */}
      <section className="relative pt-6 pb-16 md:pt-12 md:pb-24 overflow-hidden" aria-labelledby="hero-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Mission & Search */}
            <div className="lg:col-span-7 flex flex-col justify-center text-left">
              <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-6 shadow-2xs">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0" aria-hidden="true" />
                <span>Verified Physical Accessibility Intelligence</span>
              </div>

              <h1 
                id="hero-title"
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]"
              >
                Explore Places. <br />
                <span className="text-teal-700 underline decoration-teal-300 decoration-wavy decoration-2">
                  Without Barriers.
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Eliminate navigation anxiety before you leave home. AccessMap gives wheelchair users, elderly citizens, and families reliable, crowd-audited accessibility intelligence backed by our <strong>Four-State Verification Model</strong>.
              </p>

              {/* Accessible Search Form */}
              <form onSubmit={handleSearchSubmit} className="mt-8 max-w-xl" role="search" aria-label="Search places">
                <div className="flex flex-col sm:flex-row gap-2.5 p-2 bg-white rounded-2xl border border-slate-300 shadow-md shadow-slate-200/50 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/20 transition-all">
                  <div className="relative grow flex items-center">
                    <MapPin className="absolute left-3.5 w-5 h-5 text-teal-700 pointer-events-none" aria-hidden="true" />
                    <label htmlFor="hero-search-input" className="sr-only">
                      Search for accessible hospitals, colleges, or transit hubs
                    </label>
                    <input
                      id="hero-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search hospitals, colleges, transit stations..."
                      className="w-full pl-11 pr-4 py-3 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
                  >
                    <Search className="w-4 h-4" aria-hidden="true" />
                    <span>Explore Places</span>
                  </button>
                </div>

                {/* Quick Navigation Tags */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Popular:</span>
                  {[
                    { label: 'Hospitals', cat: 'HOSPITAL' },
                    { label: 'Transit Hubs', cat: 'TRANSIT_STATION' },
                    { label: 'Universities', cat: 'COLLEGE' },
                    { label: 'Civic Offices', cat: 'PUBLIC_OFFICE' },
                  ].map((item) => (
                    <Link
                      key={item.cat}
                      to={`/explore?category=${item.cat}`}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition-colors border border-slate-200/80"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </form>

              {/* Trust Indicators */}
              <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-3 gap-4 max-w-lg">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">4-State</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Verification Rule</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-teal-700">WCAG AA</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Accessibility Standard</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">PostGIS</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Sub-50ms Geospatial</p>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Miniature Accessible City */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-lg">
                <CityHeroScene />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* Accessibility Features Showcase                                       */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-16 md:py-24 bg-white border-t border-slate-200" aria-labelledby="features-preview-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold mb-3 border border-teal-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Standardized Criteria</span>
            </div>
            <h2 id="features-preview-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Audited Physical Infrastructure
            </h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              We never reduce accessibility to a binary yes/no question. Every physical venue is audited across six core mobility metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((feat, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-teal-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-teal-700 flex items-center justify-center shadow-2xs">
                      {feat.icon}
                    </div>
                    <StatusBadge status={feat.status} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{feat.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all"
            >
              <span>Explore Verified Venues in Your Area</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* How It Works Preview                                                  */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-16 md:py-24 bg-slate-50 border-t border-slate-200" aria-labelledby="how-it-works-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 id="how-it-works-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              How AccessMap Works
            </h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              Real-world physical navigation intelligence in three simple, accountable steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-3xl font-black text-teal-700 font-mono">01</span>
              <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">Discover Places</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Filter by personal mobility needs: step-free access, functioning elevators, or accessible restrooms.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-3xl font-black text-teal-700 font-mono">02</span>
              <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">Check Verified Status</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Review unambiguous 4-state badges, photo evidence, and 3D architectural ingress paths.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-3xl font-black text-teal-700 font-mono">03</span>
              <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">Contribute &amp; Verify</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Submit field audits, report obstacles, and dispute stale records to protect community trust.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              <span>Read the complete engineering workflow and verification rules</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* Community Section                                                     */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-16 md:py-24 bg-white border-t border-slate-200" aria-labelledby="community-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold mb-4">
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Crowdsourced Verification</span>
              </div>
              <h2 id="community-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Powered by Community. <br />
                <span className="text-teal-700">Verified with Integrity.</span>
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-xl">
                Physical infrastructure changes constantly. Ramps undergo maintenance, elevators break down, and entrance layouts shift. AccessMap harnesses local community contributors to ensure data never goes stale.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-teal-50 text-teal-700 shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Photo Proof Submissions</h3>
                    <p className="text-xs text-slate-600 mt-0.5">Attach visual evidence showing exact door thresholds, ramp inclines, and bathroom grab rails.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-teal-50 text-teal-700 shrink-0">
                    <Flag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Transparent Dispute Queue</h3>
                    <p className="text-xs text-slate-600 mt-0.5">Community members can challenge inaccurate reports, triggering peer re-verification.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-md">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-6">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Join as an Auditor</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Help people navigate your city with freedom. Document and audit accessibility features in your neighborhood.
                </p>
                <Link
                  to="/register"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition-all"
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