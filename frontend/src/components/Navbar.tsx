import React, { useState } from 'react';
import { Compass, Menu, X, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Identity */}
          <a 
            href="#main-content" 
            className="flex items-center gap-3 group focus:rounded-xl focus:outline-hidden"
            aria-label="AccessMap Home"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20 group-hover:bg-teal-700 transition-colors">
              <Compass className="w-6 h-6 transition-transform group-hover:rotate-45" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                AccessMap
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">
                Verified Ingress Intelligence
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
            <a 
              href="#hero" 
              className="text-sm font-semibold text-slate-700 hover:text-teal-700 transition-colors"
            >
              Home
            </a>
            <a 
              href="#features" 
              className="text-sm font-semibold text-slate-700 hover:text-teal-700 transition-colors"
            >
              Explore Places
            </a>
            <a 
              href="#how-it-works" 
              className="text-sm font-semibold text-slate-700 hover:text-teal-700 transition-colors"
            >
              How It Works
            </a>
            <a 
              href="#community" 
              className="text-sm font-semibold text-slate-700 hover:text-teal-700 transition-colors"
            >
              About
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              type="button" 
              onClick={() => alert('Authentication will be connected in Phase 3.2 backend integration.')}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <a 
              href="#features"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold shadow-md shadow-teal-600/20 hover:bg-teal-700 hover:shadow-lg transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-2" aria-label="Mobile Navigation">
            <a 
              href="#hero" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-teal-50 hover:text-teal-700"
            >
              Home
            </a>
            <a 
              href="#features" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-teal-50 hover:text-teal-700"
            >
              Explore Places
            </a>
            <a 
              href="#how-it-works" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-teal-50 hover:text-teal-700"
            >
              How It Works
            </a>
            <a 
              href="#community" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-teal-50 hover:text-teal-700"
            >
              About
            </a>
          </nav>
          <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
            <button 
              type="button" 
              onClick={() => alert('Authentication will be connected in Phase 3.2 backend integration.')}
              className="w-full text-center px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Sign In
            </button>
            <a 
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold shadow-sm hover:bg-teal-700"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;