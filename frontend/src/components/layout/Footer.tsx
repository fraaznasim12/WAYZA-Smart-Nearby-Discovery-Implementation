import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#101C36] text-slate-300 border-t border-[#17365B]" aria-label="Footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3 mb-4 focus:outline-hidden group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F9D91] to-[#2DD4BF] flex items-center justify-center text-white font-bold shadow-md transition-transform group-hover:scale-105">
                <Compass className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">AccessMap</span>
            </Link>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mb-4">
              An enterprise-grade physical accessibility discovery and verification platform. Helping wheelchair users, semi-ambulatory citizens, and families find reliable, dignified, and independently audited access.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#17365B] border border-white/10 text-xs text-[#2DD4BF] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>WCAG 2.2 AA Standard • PostGIS Spatial Core</span>
            </div>
          </div>

          {/* Platform Routes */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Platform Navigation
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300" aria-label="Platform Links">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-emerald-400 transition-colors">Explore Places</Link>
              </li>
              <li>
                <Link to="/assistant" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span>AI Assistant</span>
                  <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold">NEW</span>
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-emerald-400 transition-colors">About AccessMap</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact &amp; Support</Link>
              </li>
            </ul>
          </div>

          {/* Verification Standards */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Verification Model
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300" aria-label="Verification standard notes">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Available (Audited &lt; 180d)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span>Not Available (Confirmed)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>Unknown (Never Inaccessible)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Needs Verification (Pending/Stale)</span>
              </li>
            </ul>
          </div>

          {/* Contact / Project Information */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Architecture & Trust
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                Open, community-audited mobility intelligence backed by strict four-state verification and photographic proof.
              </p>
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" aria-hidden="true" />
                <span>Zero Commercial Hallucinations</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#1E3A5F] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} AccessMap Platform. Dedicated to universal physical accessibility.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/how-it-works" className="hover:text-white transition-colors">Audit Methodology</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Accessibility Feedback</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;