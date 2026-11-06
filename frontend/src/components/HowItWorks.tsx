import React from 'react';
import { Search, CheckCircle, Camera, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Discover a Place',
      description: 'Search for hospitals, colleges, transit hubs, or civic buildings by proximity, category, or specific mobility requirements.',
      icon: <Search className="w-6 h-6 text-teal-600" aria-hidden="true" />,
      detail: 'Filter by personal mobility presets like "Requires Step-Free + Working Elevator".',
    },
    {
      number: '02',
      title: 'Check Accessibility Information',
      description: 'Review verified 4-state badges, photographic evidence, and 3D ingress diagrams showing exact ramp inclines and door widths.',
      icon: <CheckCircle className="w-6 h-6 text-teal-600" aria-hidden="true" />,
      detail: 'Every feature displays its audit timestamp and freshness score (valid 180 days).',
    },
    {
      number: '03',
      title: 'Contribute & Verify Reports',
      description: 'Submit on-site updates, attach photo proof of working ramps or broken elevators, and dispute outdated entries.',
      icon: <Camera className="w-6 h-6 text-teal-600" aria-hidden="true" />,
      detail: 'Community audits ensure physical accessibility intelligence remains fresh and trustworthy.',
    },
  ];

  return (
    <section 
      id="how-it-works" 
      className="py-16 md:py-24 bg-white border-t border-slate-200" 
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
            <span>Simple, Transparent Workflow</span>
          </div>
          <h2 id="how-it-works-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            How AccessMap Works
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            Bridging the gap between the digital world and real-world physical navigation in three clear steps.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="relative p-8 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-teal-500/50 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Step Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-black text-teal-700 font-mono">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {step.title}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {step.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/60 text-xs font-medium text-teal-900 bg-teal-50/50 p-3 rounded-xl border border-teal-100/80">
                {step.detail}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-12 text-center">
          <a
            href="#features"
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800 transition-colors"
          >
            <span>Explore live accessibility demonstrations</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;