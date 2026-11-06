import React from 'react';
import { 
  Accessibility, 
  DoorOpen, 
  Bath, 
  ArrowUpDown, 
  Car, 
  TrainFront, 
  CheckCircle2, 
  ShieldAlert 
} from 'lucide-react';
import { StatusBadge } from './common/StatusBadge';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  specs: string[];
  sampleStatus: 'AVAILABLE' | 'NOT_AVAILABLE' | 'UNKNOWN' | 'NOT_VERIFIED';
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  specs,
  sampleStatus,
}) => {
  return (
    <div className="flex flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-teal-500/50 transition-all group">
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors shadow-2xs">
            {icon}
          </div>
          <StatusBadge status={sampleStatus} />
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
          {title}
        </h3>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Audited Criteria:
        </p>
        <ul className="space-y-1.5" aria-label={`Audit criteria for ${title}`}>
          {specs.map((spec, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" aria-hidden="true" />
              <span>{spec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const AccessibilityFeatures: React.FC = () => {
  const features: FeatureCardProps[] = [
    {
      title: 'Wheelchair Accessibility',
      description: 'Audits door width clearance, corridor turning radius (60" minimum), and zero threshold obstacles throughout the venue.',
      icon: <Accessibility className="w-6 h-6" aria-hidden="true" />,
      specs: ['32"+ clear doorway width', 'Smooth continuous pathways', 'Accessible counter heights'],
      sampleStatus: 'AVAILABLE',
    },
    {
      title: 'Step-Free Entrance',
      description: 'Verifies level thresholds and automatic or low-resistance power-assisted entrance doors for seamless ground-level ingress.',
      icon: <DoorOpen className="w-6 h-6" aria-hidden="true" />,
      specs: ['Level landing entrance', 'Automatic or push-plate door', 'No unassisted single steps'],
      sampleStatus: 'AVAILABLE',
    },
    {
      title: 'Accessible Restrooms',
      description: 'Tracks roll-in wheelchair dimensions, sturdy grab rails, roll-under sink plumbing, and operable emergency call buttons.',
      icon: <Bath className="w-6 h-6" aria-hidden="true" />,
      specs: ['Grab bars (horizontal & vertical)', 'Roll-under sink clearance', 'Emergency assistance pull cord'],
      sampleStatus: 'AVAILABLE',
    },
    {
      title: 'Elevators & Ramps',
      description: 'Monitors ramp incline ratios (< 1:12 slope) with handrails, and elevator cab clearances with tactile braille buttons and audio prompts.',
      icon: <ArrowUpDown className="w-6 h-6" aria-hidden="true" />,
      specs: ['1:12 maximum ramp slope', 'Elevator cab dimensions ≥ 51" x 68"', 'Tactile braille & audible chimes'],
      sampleStatus: 'NOT_AVAILABLE',
    },
    {
      title: 'Accessible Parking',
      description: 'Identifies dedicated van-accessible bays with wide striped access aisles located within 50 meters of the primary entrance.',
      icon: <Car className="w-6 h-6" aria-hidden="true" />,
      specs: ['8ft parking bay + 8ft aisle', 'Clear access route to doors', 'Prominent posted signage'],
      sampleStatus: 'NOT_VERIFIED',
    },
    {
      title: 'Public Transport Accessibility',
      description: 'Maps step-free train and bus transit boarding, platform gap ramps, functioning station elevators, and tactile guidance paving.',
      icon: <TrainFront className="w-6 h-6" aria-hidden="true" />,
      specs: ['Elevator from street to platform', 'Tactile edge warning tiles', 'Level or ramped coach boarding'],
      sampleStatus: 'UNKNOWN',
    },
  ];

  return (
    <section 
      id="features" 
      className="py-16 md:py-24 bg-slate-50 border-t border-slate-200" 
      aria-labelledby="features-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/70 text-teal-800 text-xs font-semibold mb-3">
            <span>Standardized Physical Metrics</span>
          </div>
          <h2 id="features-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            What AccessMap Tracks
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            Accessibility is never treated as a single vague checkbox. We audit individual structural features to give you accurate, actionable intelligence before you arrive.
          </p>
        </div>

        {/* 4-State Reminder Notice */}
        <div className="mb-10 p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 flex items-start sm:items-center gap-3 text-xs text-teal-900">
          <ShieldAlert className="w-5 h-5 text-teal-700 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
          <p>
            <strong>Core Verification Rule:</strong> An <em>Unknown</em> status means a venue has not been audited yet—it is <strong>never</strong> assumed to be inaccessible. Missing data prompts our community to audit it!
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default AccessibilityFeatures;