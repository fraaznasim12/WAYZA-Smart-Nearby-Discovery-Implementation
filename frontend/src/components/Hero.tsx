import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Sparkles } from 'lucide-react';
import { ThreeDHero } from './ThreeDHero';
import { resolveVenueCategory } from './3d/Category3DScene';

interface HeroProps {
  onSearch?: (query: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('HOSPITAL');
  const navigate = useNavigate();

  const handleQueryChange = (val: string) => {
    setQuery(val);
    const resolved = resolveVenueCategory(val);
    if (resolved !== 'GENERIC') {
      setActiveCategory(resolved);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
    // Navigate directly to Explore page with query
    navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
  };

  const handleQuickFilter = (categoryLabel: string, categoryCode: string) => {
    setQuery(categoryLabel);
    setActiveCategory(categoryCode);
    if (onSearch) {
      onSearch(categoryLabel);
    }
    // Navigate directly to Explore with category filter
    navigate(`/explore?category=${encodeURIComponent(categoryCode)}`);
  };

  return (
    <section 
      id="hero" 
      className="relative pt-6 pb-16 md:pt-12 md:pb-24 overflow-hidden" 
      aria-labelledby="hero-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Mission Content & Search */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-6 shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#0F9D91] shrink-0" aria-hidden="true" />
              <span>Verified Physical Accessibility Intelligence</span>
            </div>

            {/* Main Heading */}
            <h1 
              id="hero-heading" 
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#101C36] leading-[1.14] font-display"
            >
              Explore Places. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0F9D91] to-[#2DD4BF]">
                Without Barriers.
              </span>
            </h1>

            {/* Supporting Mission Statement */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              AccessMap empowers individuals with mobility considerations, wheelchair users, elderly citizens, and families to navigate physical environments with certainty. Backed by our rigorous <strong>Four-State Verification Model</strong> and interactive 3D spatial cutaways.
            </p>

            {/* Accessible Search Form */}
            <form 
              onSubmit={handleSubmit} 
              className="mt-8 max-w-xl"
              role="search"
              aria-label="Search accessible places"
            >
              <div className="flex flex-col sm:flex-row gap-2.5 p-2 bg-white rounded-2xl border border-slate-300 shadow-md shadow-slate-200/50 focus-within:border-[#0F9D91] focus-within:ring-2 focus-within:ring-[#0F9D91]/20 transition-all">
                <div className="relative grow flex items-center">
                  <MapPin className="absolute left-3.5 w-5 h-5 text-[#0F9D91] pointer-events-none" aria-hidden="true" />
                  <label htmlFor="place-search" className="sr-only">
                    Search for hospitals, colleges, schools, transit stations, or venues
                  </label>
                  <input
                    id="place-search"
                    type="text"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder="Search schools, hospitals, transit, cafes..."
                    className="w-full pl-11 pr-4 py-3 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0F9D91] to-[#2DD4BF] text-white text-sm font-semibold shadow-xs hover:opacity-95 transition-all cursor-pointer shrink-0"
                >
                  <Search className="w-4 h-4" aria-hidden="true" />
                  <span>Explore Places</span>
                </button>
              </div>

              {/* Quick Filter Tags (Reacting directly to 3D and Search) */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Quick Filters:</span>
                {[
                  { label: 'Hospitals', code: 'HOSPITAL' },
                  { label: 'Schools', code: 'SCHOOL' },
                  { label: 'Universities', code: 'COLLEGE' },
                  { label: 'Transit Hubs', code: 'TRANSIT_STATION' },
                  { label: 'Restaurants', code: 'RESTAURANT' },
                  { label: 'Shopping Malls', code: 'SHOPPING_MALL' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleQuickFilter(item.label, item.code)}
                    onMouseEnter={() => setActiveCategory(item.code)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                      activeCategory === item.code
                        ? 'bg-teal-50 text-teal-800 border-teal-300 font-bold shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </form>

            {/* Trust Markers Strip */}
            <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-[#101C36]">4-State</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Verification Rule</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-[#0F9D91]">WCAG AA</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Standard Compliant</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-[#6D5EF6]">PostGIS</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Spatial Precision</p>
              </div>
            </div>

          </div>

          {/* Right Column: 3D Category-Specific Model / 2D Vector Fallback */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-lg">
              <ThreeDHero category={activeCategory} query={query} />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
