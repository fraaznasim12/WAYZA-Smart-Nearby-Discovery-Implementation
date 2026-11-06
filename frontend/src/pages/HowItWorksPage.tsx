import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Layers, 
  Camera, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileCheck2
} from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Discover Places Through Specific Criteria',
      desc: 'Generic search engines assume a single checkbox ("wheelchair accessible") is enough. In AccessMap, you filter specifically for what matters to your personal mobility: step-free thresholds, functioning elevators, accessible restrooms, or ramp incline limits.',
      icon: <Search className="w-7 h-7 text-teal-600" />,
      highlights: [
        'Geospatial proximity search powered by PostGIS ST_DWithin',
        'Personal mobility preference presets that auto-filter results',
        'Dual-view toggle between interactive vector map and accessible list'
      ]
    },
    {
      num: '02',
      title: 'Check Unambiguous 4-State Verification Profiles',
      desc: 'Every feature is audited against our non-negotiable Four-State Verification Model. We track the exact state, freshness timestamp, and photographic proof rather than relying on unverified claims.',
      icon: <Layers className="w-7 h-7 text-teal-600" />,
      highlights: [
        'Available: Verified on-site within 180 days',
        'Not Available: Confirmed absent or obstructed (e.g. stairs only)',
        'Unknown: Never assumed inaccessible; triggers community audits',
        'Needs Verification: Stale records older than 180 days'
      ]
    },
    {
      num: '03',
      title: 'Submit Field Accessibility Reports',
      desc: 'Anyone in the community can contribute. When visiting a hospital, university, or station, users submit quick status reports accompanied by photos of entrance ramps, doors, or elevators.',
      icon: <Camera className="w-7 h-7 text-teal-600" />,
      highlights: [
        'Secure multi-photo upload with EXIF timestamp validation',
        'Field notes describing specific conditions (e.g. "heavy manual door")',
        'Audits by Certified Contributors receive higher confidence scores'
      ]
    },
    {
      num: '04',
      title: 'Verify Community Information & Resolve Disputes',
      desc: 'Physical spaces change over time. Facilities renovate, lifts undergo maintenance, and ramps are rebuilt. Our automated 180-day staleness countdown and community dispute queue ensure information stays dependable.',
      icon: <ShieldCheck className="w-7 h-7 text-teal-600" />,
      highlights: [
        'Automated 180-day staleness countdown engine',
        'Community flagging and dispute resolution queue',
        'Official business facility claims with scheduled maintenance alerts'
      ]
    }
  ];

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        
        {/* Page Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-4">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Architecture &amp; Methodology</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            How AccessMap Works
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            A comprehensive, transparent guide to how AccessMap collects, verifies, and keeps physical accessibility data reliable for people who depend on it.
          </p>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* Step-by-Step Methodology                                            */}
        {/* ------------------------------------------------------------------- */}
        <div className="space-y-12 mb-20">
          {steps.map((step, idx) => (
            <div 
              key={idx}
              className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div className="lg:col-span-8">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-teal-700">
                    {step.num}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  {step.title}
                </h2>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
                  {step.desc}
                </p>

                <div className="space-y-2">
                  {step.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center flex flex-col justify-center items-center">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Step Objective</span>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                  {idx === 0 && 'Give users exact control over their mobility requirements.'}
                  {idx === 1 && 'Eliminate ambiguity with the 4-state domain model.'}
                  {idx === 2 && 'Empower local auditors to submit verifiable evidence.'}
                  {idx === 3 && 'Prevent data staleness with automated SLAs.'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* Deep Dive: The Four-State Verification Model                        */}
        {/* ------------------------------------------------------------------- */}
        <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 mb-16 shadow-lg">
          <div className="max-w-3xl mb-8">
            <span className="text-xs uppercase tracking-wider font-bold text-teal-400">Core Engineering Mandate</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              The Four-State Verification Standard
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Why binary true/false systems cause real-world harm, and how our 4-state model solves it.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-bold mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>AVAILABLE</span>
                </div>
                <h3 className="font-bold text-base text-white">Verified Available</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Inspected and verified functional on-site within the last 180 days. Supported by photos and auditor confirmation.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-700 text-xs font-bold mb-3">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>NOT AVAILABLE</span>
                </div>
                <h3 className="font-bold text-base text-white">Confirmed Absent</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Explicitly verified as missing or non-functional (e.g. steep stairs with no ramp, out-of-order lift).
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-700 text-slate-300 border border-slate-600 text-xs font-bold mb-3">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>UNKNOWN</span>
                </div>
                <h3 className="font-bold text-base text-white">Unaudited</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  <strong>Strict Rule:</strong> Never treated as Not Available. Indicates that no one has audited this feature yet.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700 text-xs font-bold mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  <span>NEEDS VERIFICATION</span>
                </div>
                <h3 className="font-bold text-base text-white">Stale Audit</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Audit is older than 180 days. Automatically flagged so community members know to provide a fresh update.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-3 text-xs text-slate-400">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>WCAG 2.1 AA Compliance Mandate: Status is never communicated by color alone. Every indicator pairs distinct icon glyphs and high-contrast text.</span>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all"
          >
            <span>Explore Accessible Venues</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </PageLayout>
  );
};

export default HowItWorksPage;