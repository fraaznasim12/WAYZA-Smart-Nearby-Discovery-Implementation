import React, { Suspense, useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, OrbitControls } from '@react-three/drei';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { Category3DScene, resolveVenueCategory, Venue3DCategory } from './3d/Category3DScene';

/* -------------------------------------------------------------------------- */
/* WebGL Error Boundary (Progressive Enhancement Guarantee)                  */
/* -------------------------------------------------------------------------- */
interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ThreeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('WebGL context failed to initialize; falling back to 2D view.', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/* -------------------------------------------------------------------------- */
/* Floating Pin Marker                                                        */
/* -------------------------------------------------------------------------- */
const LocationPin: React.FC = () => {
  return (
    <group position={[0, 1.45, 0]}>
      {/* Upper sphere with teal glow */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#0F9D91" roughness={0.2} metalness={0.2} />
      </mesh>

      {/* Inner beacon core */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#2DD4BF" emissiveIntensity={0.6} />
      </mesh>

      {/* Tapered cone point */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.24, 0.48, 32]} />
        <meshStandardMaterial color="#17365B" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Accessibility aura ring */}
      <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.4, 32]} />
        <meshStandardMaterial color="#2DD4BF" transparent opacity={0.65} roughness={0.1} />
      </mesh>
    </group>
  );
};

/* -------------------------------------------------------------------------- */
/* Resilient 2D Architectural Diagram Fallback                                */
/* -------------------------------------------------------------------------- */
const ArchitecturalFallback2D: React.FC<{ reason?: string; categoryTitle?: string }> = ({ reason, categoryTitle }) => {
  return (
    <div 
      className="w-full h-full min-h-[380px] flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-teal-50/40 to-slate-100 rounded-3xl p-6 border border-slate-200/80 shadow-inner"
      role="region"
      aria-label="Accessible 2D architectural diagram representation"
    >
      <svg 
        viewBox="0 0 400 320" 
        className="w-full max-w-[320px] h-auto drop-shadow-md"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="rampGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F9D91" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#17365B" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="platformGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
        </defs>

        {/* Base Grid Blueprint */}
        <rect x="40" y="240" width="320" height="40" rx="4" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="40" y1="260" x2="360" y2="260" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />

        {/* Sloped Ramp */}
        <polygon points="90,240 200,180 200,240" fill="url(#rampGrad)" />
        <line x1="90" y1="235" x2="200" y2="175" stroke="#0F9D91" strokeWidth="3" />

        {/* Raised Entrance Platform */}
        <rect x="200" y="180" width="130" height="60" rx="4" fill="url(#platformGrad)" stroke="#cbd5e1" strokeWidth="2" />

        {/* Step-Free Entrance Portal */}
        <rect x="235" y="110" width="60" height="70" rx="4" fill="#ccfbf1" fillOpacity="0.5" stroke="#101C36" strokeWidth="3" />
        <line x1="265" y1="110" x2="265" y2="180" stroke="#101C36" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Floating Verified Pin Indicator */}
        <g transform="translate(265, 65)">
          <circle cx="0" cy="0" r="16" fill="#0F9D91" />
          <circle cx="0" cy="0" r="7" fill="#ffffff" />
          <polygon points="0,16 -6,7 6,7" fill="#0F9D91" />
        </g>

        {/* Labels & Callouts */}
        <text x="135" y="275" textAnchor="middle" fill="#0F9D91" fontSize="11" fontWeight="700">
          Slope &le; 1:12
        </text>
        <text x="265" y="200" textAnchor="middle" fill="#101C36" fontSize="11" fontWeight="700">
          Step-Free Threshold
        </text>
      </svg>

      <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
        <ShieldCheck className="w-3.5 h-3.5 text-[#0F9D91]" />
        <span>{categoryTitle ? `${categoryTitle} (2D Vector View)` : reason || '2D Architectural Vector View (Active)'}</span>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Main ThreeDHero Component                                                  */
/* -------------------------------------------------------------------------- */
interface ThreeDHeroProps {
  category?: string;
  query?: string;
}

export const ThreeDHero: React.FC<ThreeDHeroProps> = ({ category, query }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isWebGLSupported, setIsWebGLSupported] = useState<boolean>(true);

  // Runtime WebGL Capability Probe
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setIsWebGLSupported(false);
      }
    } catch {
      setIsWebGLSupported(false);
    }
  }, []);

  // Determine active category based on prop or query
  const resolvedCategory: Venue3DCategory = resolveVenueCategory(category || query);

  // Human-readable titles for category overlay badge
  const categoryTitles: Record<Venue3DCategory, string> = {
    HOSPITAL: 'Healthcare & Hospital Ingress',
    SCHOOL: 'School & Education Facility',
    COLLEGE: 'University & Academic Campus',
    RESTAURANT: 'Dining & Patio Accessibility',
    TRANSIT_STATION: 'Commuter & Transit Hub',
    SHOPPING_MALL: 'Retail Mall & Commercial Atrium',
    PUBLIC_OFFICE: 'Civic Centre & Public Office',
    GENERIC: 'Accessible Physical Architecture',
  };

  const activeTitle = categoryTitles[resolvedCategory];

  // Progressive Fallback: Respect reduced motion and WebGL availability
  if (prefersReducedMotion) {
    return <ArchitecturalFallback2D reason="Reduced Motion Mode Active" categoryTitle={activeTitle} />;
  }

  if (!isWebGLSupported) {
    return <ArchitecturalFallback2D reason="2D Accessible Vector Fallback" categoryTitle={activeTitle} />;
  }

  return (
    <div 
      className="relative w-full h-[380px] sm:h-[440px] lg:h-[480px] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-100/90 via-teal-50/20 to-slate-100/80 border border-slate-200/90 shadow-sm"
      role="figure"
      aria-label={`Interactive 3D model of ${activeTitle} featuring verified sloped ramps, step-free access, and location beacons.`}
    >
      <ThreeErrorBoundary fallback={<ArchitecturalFallback2D reason="WebGL Context Fallback" categoryTitle={activeTitle} />}>
        <Canvas
          shadows
          camera={{ position: [3.8, 3.2, 4.2], fov: 42 }}
          style={{ pointerEvents: 'auto' }}
        >
          {/* Lighting Rig */}
          <ambientLight intensity={0.85} />
          <directionalLight 
            position={[5, 8, 4]} 
            intensity={1.3} 
            castShadow 
            shadow-mapSize={[1024, 1024]}
          />
          <pointLight position={[-4, 2, -2]} color="#2DD4BF" intensity={0.6} />

          {/* Dynamic Category 3D Scene */}
          <Suspense fallback={null}>
            <Float speed={1.5} rotationIntensity={0.18} floatIntensity={0.3}>
              <Category3DScene category={resolvedCategory} />
              <LocationPin />
            </Float>
          </Suspense>

          {/* User Controls with Angle Constraints */}
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            maxPolarAngle={Math.PI / 2.15}
            minPolarAngle={Math.PI / 4.5}
            dampingFactor={0.05}
          />
        </Canvas>
      </ThreeErrorBoundary>

      {/* Visual Overlay Pill showing the active dynamic category */}
      <div className="absolute bottom-4 left-4 right-4 sm:right-auto flex items-center justify-between sm:justify-start gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-sm pointer-events-none transition-all">
        <div className="flex items-center gap-1.5 text-[#101C36]">
          <Sparkles className="w-3.5 h-3.5 text-[#0F9D91]" />
          <span>{activeTitle}</span>
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Drag to rotate</span>
      </div>
    </div>
  );
};

export default ThreeDHero;
