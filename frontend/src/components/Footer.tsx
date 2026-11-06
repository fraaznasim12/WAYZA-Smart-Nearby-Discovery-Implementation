import React from 'react';
import { Compass, Mail, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800" aria-label="Footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-slate-900 font-bold shadow-md">
                <Compass className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">AccessMap</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-4">
              An intelligent physical accessibility discovery and verification platform. Helping wheelchair users, semi-ambulatory citizens, and families find reliable, dignified access.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-teal-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>WCAG 2.1 AA Compliant Interface</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm" aria-label="Platform Links">
              <li>
                <a href="#hero" className="hover:text-teal-400 transition-colors">Home</a>
              </li>
              <li>
                <a href="#features" className="hover:text-teal-400 transition-colors">Explore Places</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-teal-400 transition-colors">How It Works</a>
              </li>
              <li>
                <a href="#community" className="hover:text-teal-400 transition-colors">Community Audits</a>
              </li>
            </ul>
          </div>

          {/* Four-State Standard */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Verification
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400" aria-label="Verification standard notes">
              <li>Available (Verified &lt; 180d)</li>
              <li>Not Available (Confirmed)</li>
              <li>Unknown (Never Inaccessible)</li>
              <li>Needs Verification (Stale)</li>
            </ul>
          </div>

          {/* Contact / Project Placeholder */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Project Contact
            </h3>
            <div className="space-y-3 text-sm">
              <p className="text-slate-400 text-xs leading-relaxed">
                Open software engineering project for physical accessibility intelligence.
              </p>
              <a 
                href="mailto:contact@accessmap.local" 
                className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-xs font-semibold"
              >
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                <span>contact@accessmap.local</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 AccessMap. Built with accessibility and engineering integrity.</p>
          <p className="flex items-center gap-1.5">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" aria-hidden="true" />
            <span>for universal accessibility</span>
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;