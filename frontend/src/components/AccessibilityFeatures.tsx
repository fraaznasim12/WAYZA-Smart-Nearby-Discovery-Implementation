import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Accessibility, 
  DoorOpen, 
  Bath, 
  ArrowUpDown, 
  Car, 
  TrainFront, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export interface AccessibilityDimension {
  featureKey: string;
  title: string;
  shortLabel: string;
  description: string;
  icon: React.ReactNode;
  specs: string[];
  accentColor: string;
}

export const ACCESSIBILITY_DIMENSIONS: AccessibilityDimension[] = [
  {
    featureKey: 'WHEELCHAIR_ACCESSIBLE_ENTRANCE',
    title: 'Wheelchair Ingress & Circulation',
    shortLabel: 'Wheelchair Ingress',
    description: 'Continuous level pathways, minimum 32-inch clear doorway widths, and 60-inch turning radius without threshold obstacles.',
    icon: <Accessibility className="w-6 h-6" aria-hidden="true" />,
    specs: ['32"+ doorway clearance', 'Smooth, level thresholds', '60" turning radius'],
    accentColor: 'from-[#0F9D91] to-[#2DD4BF]',
  },
  {
    featureKey: 'STEP_FREE_ENTRANCE',
    title: 'Step-Free Entrances & Landings',
    shortLabel: 'Step-Free Entrance',
    description: 'Level ground-floor access or power-assisted automated sliding/push-plate entry doors without single unassisted steps.',
    icon: <DoorOpen className="w-6 h-6" aria-hidden="true" />,
    specs: ['Level landing entrance', 'Automatic or push-plate door', 'Zero exterior step obstacles'],
    accentColor: 'from-[#17365B] to-[#6D5EF6]',
  },
  {
    featureKey: 'ACCESSIBLE_RESTROOM',
    title: 'Accessible Restrooms',
    shortLabel: 'Accessible Restroom',
    description: 'Spacious single-occupant or dedicated stalls with sturdy wall grab bars, roll-under sink plumbing, and emergency call cords.',
    icon: <Bath className="w-6 h-6" aria-hidden="true" />,
    specs: ['Horizontal & vertical grab bars', 'Roll-under sink clearance', 'Emergency assistance button'],
    accentColor: 'from-[#0F9D91] to-[#10B981]',
  },
  {
    featureKey: 'ELEVATOR_AVAILABILITY',
    title: 'Elevator & Vertical Access',
    shortLabel: 'Elevator Access',
    description: 'Gentle ramps (< 1:12 slope) with dual continuous handrails, and elevator cabs with tactile braille buttons and audible arrival chimes.',
    icon: <ArrowUpDown className="w-6 h-6" aria-hidden="true" />,
    specs: ['Gentle slope ramps (≤ 1:12)', 'Tactile braille keypad', 'Audible floor chimes & voice'],
    accentColor: 'from-[#6D5EF6] to-[#FF826E]',
  },
  {
    featureKey: 'ACCESSIBLE_PARKING',
    title: 'Dedicated Mobility Parking',
    shortLabel: 'Mobility Parking',
    description: 'Marked van-accessible bays with wide striped side access aisles located within 50 meters of the primary accessible ingress.',
    icon: <Car className="w-6 h-6" aria-hidden="true" />,
    specs: ['Wide van-accessible bays', 'Striped side access aisles', '≤ 50m to main entrance'],
    accentColor: 'from-[#17365B] to-[#0F9D91]',
  },
  {
    featureKey: 'PUBLIC_TRANSPORT_ACCESSIBILITY',
    title: 'Transit Interchange Access',
    shortLabel: 'Transit Access',
    description: 'Direct step-free connectivity to metro, bus, or commuter rail terminals with tactile ground surface indicators (TGSI).',
    icon: <TrainFront className="w-6 h-6" aria-hidden="true" />,
    specs: ['Tactile guidance pathways', 'Direct curb-to-platform ramps', 'Accessible boarding assistance'],
    accentColor: 'from-[#0F9D91] to-[#2DD4BF]',
  },
];

export const AccessibilityFeatures: React.FC = () => {
  const navigate = useNavigate();

  const handleDimensionClick = (featureKey: string) => {
    // Navigate to Explore page with selected feature filter parameter
    navigate(`/explore?feature=${encodeURIComponent(featureKey)}`);
  };

  return (
    <section className="py-20 bg-[#F5F8FC] border-t border-slate-200/60" aria-labelledby="accessibility-features-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
            <span>Audited Physical Infrastructure</span>
          </div>

          <h2 id="accessibility-features-title" className="text-3xl sm:text-4xl font-extrabold text-[#101C36] tracking-tight">
            Six Dimensions of Verified Physical Access
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Click any dimension below to discover real-world venues audited against that exact accessibility standard.
          </p>
        </div>

        {/* 6 Feature Dimension Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ACCESSIBILITY_DIMENSIONS.map((dim) => (
            <button
              key={dim.featureKey}
              onClick={() => handleDimensionClick(dim.featureKey)}
              className="text-left flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-teal-500/60 hover:-translate-y-1 transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F9D91] focus:ring-offset-2"
              aria-label={`Filter places by ${dim.title}`}
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${dim.accentColor} text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                    {dim.icon}
                  </div>
                  
                  {/* Informational Action Badge (No misleading global available/unavailable badge) */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                    <span>Filter places</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#101C36] group-hover:text-[#0F9D91] transition-colors">
                  {dim.title}
                </h3>

                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {dim.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 w-full">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Audited Standards:
                </p>
                <ul className="space-y-1.5" aria-label={`Audit criteria for ${dim.title}`}>
                  {dim.specs.map((spec, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0F9D91] shrink-0" aria-hidden="true" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          ))}
        </div>

      </div>
    </section>
  );
};
