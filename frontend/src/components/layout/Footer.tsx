import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Mail, ShieldCheck, Heart, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800" aria-label="Footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3 mb-4 focus:outline-hidden group">
              <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-slate-900 font-bold shadow-md group-hover:bg-teal-400 transition-colors">
                <Compass className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">AccessMap</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-4">
              An intelligent physical accessibility discovery and verification platform. Helping wheelchair users, semi-ambulatory citizens, and families find reliable, dignified access.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-teal-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>WCAG 2.1 AA Compliant Architecture</span>
            </div>
          </div>

          {/* Platform Routes */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Platform Navigation
            </h3>
            <ul className="space-y-2.5 text-sm" aria-label="Platform Links">
              <li>
                <Link to="/" className="hover:text-teal-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-teal-400 transition-colors">Explore Places</Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-teal-400 transition-colors">How It Works</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-teal-400 transition-colors">About AccessMap</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-teal-400 transition-colors">Contact &amp; Feedback</Link>
              </li>
            </ul>
          </div>

          {/* Verification Standards */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Verification Model
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400" aria-label="Verification standard notes">
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Available (Audited &lt; 180d)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span>Not Available (Confirmed)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>Unknown (Never Inaccessible)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Needs Verification (Stale)</span>
              </li>
            </ul>
          </div>

          {/* Contact / Project Information */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Project Communication
            </h3>
            <div className="space-y-3 text-sm">
              <p className="text-slate-400 text-xs leading-relaxed">
                Open-source engineering project dedicated to physical mobility intelligence.
              </p>
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" aria-hidden="true" />
                <span>Distributed Community Initiative</span>
              </div>
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
          <p>© 2026 AccessMap. Open Software Engineering Portfolio Platform.</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-slate-400 transition-colors">Architecture &amp; Rules</Link>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span>Built with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" aria-hidden="true" />
              <span>for universal accessibility</span>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;