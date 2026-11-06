import React, { useState } from 'react';
import { Search, MapPin, Sparkles } from 'lucide-react';
import { ThreeDHero } from './ThreeDHero';

interface HeroProps {
  onSearch?: (query: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
    const target = document.getElementById('features');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickFilter = (category: string) => {
    setQuery(category);
    if (onSearch) {
      onSearch(category);
    }
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
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" aria-hidden="true" />
              <span>Verified Physical Accessibility Intelligence</span>
            </div>

            {/* Main Heading */}
            <h1 
              id="hero-heading" 
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]"
            >
              Explore Places. <br />
              <span className="text-teal-700 underline decoration-teal-300 decoration-wavy decoration-2">
                Without Barriers.
              </span>
            </h1>

            {/* Supporting Mission Statement */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              AccessMap helps people with mobility considerations, wheelchair users, and families discover reliable, real-world accessibility conditions. Every ramp, elevator, and entrance is backed by our rigorous <strong>Four-State Verification Model</strong>.
            </p>

            {/* Accessible Search Form */}
            <form 
              onSubmit={handleSubmit} 
              className="mt-8 max-w-xl"
              role="search"
              aria-label="Search accessible places"
            >
              <div className="flex flex-col sm:flex-row gap-2.5 p-2 bg-white rounded-2xl border border-slate-300 shadow-md shadow-slate-200/50 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/20 transition-all">
                <div className="relative grow flex items-center">
                  <MapPin className="absolute left-3.5 w-5 h-5 text-teal-700 pointer-events-none" aria-hidden="true" />
                  <label htmlFor="place-search" className="sr-only">
                    Search for hospitals, colleges, stations, or addresses
                  </label>
                  <input
                    id="place-search"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search hospitals, universities, transit hubs..."
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

              {/* Quick Filter Tags */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Quick Filters:</span>
                {['Hospitals', 'Transit Hubs', 'Universities', 'Restaurants'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleQuickFilter(cat)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition-colors cursor-pointer border border-slate-200/80"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </form>

            {/* Trust Markers Strip */}
            <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">4-State</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Verification Rule</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-teal-700">WCAG AA</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Standard Compliant</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">100%</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Crowdsourced &amp; Audited</p>
              </div>
            </div>

          </div>

          {/* Right Column: 3D Accessibility Model / 2D Vector Fallback */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-lg">
              <ThreeDHero />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;