import React from 'react';
import { Users, Camera, ShieldCheck, HeartHandshake, ArrowRight, Flag } from 'lucide-react';

export const CommunitySection: React.FC = () => {
  return (
    <section 
      id="community" 
      className="py-16 md:py-24 bg-slate-50 border-t border-slate-200" 
      aria-labelledby="community-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid: Content + Action Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold mb-4">
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Crowdsourced Verification</span>
            </div>

            <h2 id="community-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Powered by Community. <br />
              <span className="text-teal-700">Verified with Integrity.</span>
            </h2>

            <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-xl">
              Physical infrastructure changes constantly. Ramps undergo repair, elevators break down, and entrance gates change. AccessMap harnesses local community contributors to ensure data never goes stale.
            </p>

            {/* Feature List */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-teal-700 shrink-0 shadow-2xs">
                  <Camera className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Photo Proof Submissions</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Attach visual evidence showing exact door threshold levels, ramp angles, and bathroom layouts.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-teal-700 shrink-0 shadow-2xs">
                  <Flag className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Dispute &amp; Correction Queue</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Community members can challenge incorrect reports, triggering peer re-verification.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-teal-700 shrink-0 shadow-2xs">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">180-Day Staleness Countdown</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Reports older than 180 days are flagged as <em>Needs Verification</em> to invite fresh audits.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Card */}
          <div className="lg:col-span-5">
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mb-6 shadow-2xs">
                <HeartHandshake className="w-6 h-6" aria-hidden="true" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Become an AccessMap Auditor
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Help people navigate your city with freedom. Join our community of local auditors to document and verify accessibility features in your neighborhood.
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => alert('Community auditor onboarding will be activated with user profiles in Phase 3.2.')}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                >
                  <span>Join Contributor Program</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <p className="text-center text-[11px] text-slate-500">
                  Open, non-profit community initiative adhering to WCAG 2.1 AA.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default CommunitySection;