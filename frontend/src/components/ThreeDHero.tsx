import React, { Suspense, useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, OrbitControls, RoundedBox } from '@react-three/drei';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { ShieldCheck, Compass } from 'lucide-react';

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
/* 3D Scene Components                                                        */
/* -------------------------------------------------------------------------- */

// Floating Pin Marker
const LocationPin: React.FC = () => {
  return (
    <group position={[0, 1.4, 0]}>
      {/* Upper sphere with teal glow */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial color="#0d9488" roughness={0.2} metalness={0.2} />
      </mesh>

      {/* Inner beacon core */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#5eead4" emissiveIntensity={0.6} />
      </mesh>

      {/* Tapered cone point */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.26, 0.5, 32]} />
        <meshStandardMaterial color="#0f766e" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Accessibility aura ring */}
      <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.4, 32]} />
        <meshStandardMaterial color="#14b8a6" transparent opacity={0.6} roughness={0.1} />
      </mesh>
    </group>
  );
};

// Accessible Architectural Spatial Elements
const AccessibleModel: React.FC = () => {
  return (
    <group position={[0, -0.4, 0]}>
      {/* Ground Foundation Slab */}
      <RoundedBox args={[3.2, 0.16, 3.2]} radius={0.06} smoothness={4} position={[0, -0.08, 0]} receiveShadow>
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
      </RoundedBox>

      {/* Raised Step-Free Platform */}
      <RoundedBox args={[1.8, 0.36, 1.6]} radius={0.06} smoothness={4} position={[0.5, 0.18, -0.5]} castShadow receiveShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </RoundedBox>

      {/* Gentle Access Ramp (1:12 slope representation) */}
      <group position={[-0.7, 0.1, 0.3]} rotation={[0, -Math.PI / 4, 0]}>
        <mesh rotation={[-0.18, 0, 0]} position={[0, 0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.08, 1.4]} />
          <meshStandardMaterial color="#ccfbf1" roughness={0.3} />
        </mesh>

        {/* Ramp Guide Rails */}
        <mesh position={[-0.48, 0.22, 0]}>
          <boxGeometry args={[0.04, 0.35, 1.4]} />
          <meshStandardMaterial color="#0d9488" metalness={0.4} roughness={0.2} />
        </mesh>
        <mesh position={[0.48, 0.22, 0]}>
          <boxGeometry args={[0.04, 0.35, 1.4]} />
          <meshStandardMaterial color="#0d9488" metalness={0.4} roughness={0.2} />
        </mesh>
      </group>

      {/* Step-Free Entrance Portal Frame */}
      <group position={[0.5, 0.8, -1.2]}>
        {/* Left Post */}
        <mesh position={[-0.55, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.9, 0.08]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} />
        </mesh>
        {/* Right Post */}
        <mesh position={[0.55, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.9, 0.08]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} />
        </mesh>
        {/* Top Header */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.18, 0.08, 0.08]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} />
        </mesh>
        {/* Glazed Automatic Door Glass */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.02, 0.82, 0.02]} />
          <meshStandardMaterial color="#99f6e4" transparent opacity={0.35} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
};

/* -------------------------------------------------------------------------- */
/* Resilient 2D Architectural Diagram Fallback                                */
/* -------------------------------------------------------------------------- */
const ArchitecturalFallback2D: React.FC<{ reason?: string }> = ({ reason }) => {
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
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="platformGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
        </defs>

        {/* Foundation Grid Lines */}
        <line x1="60" y1="240" x2="340" y2="240" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="60" y1="210" x2="340" y2="210" stroke="#e2e8f0" strokeWidth="1" />

        {/* Ground Base */}
        <rect x="70" y="230" width="260" height="20" rx="4" fill="#e2e8f0" />

        {/* Sloped Ramp */}
        <polygon points="90,230 200,170 200,185 90,245" fill="url(#rampGrad)" />
        <line x1="90" y1="215" x2="200" y2="155" stroke="#0d9488" strokeWidth="3" />

        {/* Raised Entrance Platform */}
        <rect x="200" y="160" width="130" height="70" rx="4" fill="url(#platformGrad)" stroke="#cbd5e1" strokeWidth="2" />

        {/* Step-Free Entrance Portal */}
        <rect x="235" y="90" width="60" height="70" rx="4" fill="#ccfbf1" fillOpacity="0.5" stroke="#0f172a" strokeWidth="3" />
        <line x1="265" y1="90" x2="265" y2="160" stroke="#0f172a" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Floating Verified Pin Indicator */}
        <g transform="translate(265, 45)">
          <circle cx="0" cy="0" r="16" fill="#0d9488" />
          <circle cx="0" cy="0" r="7" fill="#ffffff" />
          <polygon points="0,16 -6,7 6,7" fill="#0d9488" />
        </g>

        {/* Labels & Callouts */}
        <text x="135" y="260" textAnchor="middle" fill="#0f766e" fontSize="11" fontWeight="700">
          Slope &lt; 1:12
        </text>
        <text x="265" y="180" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="700">
          Step-Free Threshold
        </text>
      </svg>

      <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
        <span>{reason || '2D Architectural Vector View (Active)'}</span>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Main ThreeDHero Component                                                  */
/* -------------------------------------------------------------------------- */
export const ThreeDHero: React.FC = () => {
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

  // Progressive Fallback: Respect reduced motion and WebGL availability
  if (prefersReducedMotion) {
    return <ArchitecturalFallback2D reason="Reduced Motion Mode Active" />;
  }

  if (!isWebGLSupported) {
    return <ArchitecturalFallback2D reason="2D Accessible Vector Fallback" />;
  }

  return (
    <div 
      className="relative w-full h-[380px] sm:h-[440px] lg:h-[480px] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-100/90 via-teal-50/30 to-slate-100/80 border border-slate-200/90 shadow-sm"
      role="figure"
      aria-label="Interactive 3D model of an accessible building ingress featuring a sloped ramp, step-free portal, and floating verified location pin."
    >
      <ThreeErrorBoundary fallback={<ArchitecturalFallback2D reason="WebGL Context Fallback" />}>
        <Canvas
          shadows
          camera={{ position: [3.8, 3.2, 4.2], fov: 42 }}
          style={{ pointerEvents: 'auto' }}
        >
          {/* Lighting Rig */}
          <ambientLight intensity={0.8} />
          <directionalLight 
            position={[5, 8, 4]} 
            intensity={1.3} 
            castShadow 
            shadow-mapSize={[1024, 1024]}
          />
          <pointLight position={[-4, 2, -2]} color="#14b8a6" intensity={0.6} />

          {/* Interactive Floating 3D Model */}
          <Suspense fallback={null}>
            <Float speed={1.6} rotationIntensity={0.2} floatIntensity={0.35}>
              <AccessibleModel />
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

      {/* Visual Overlay Pill */}
      <div className="absolute bottom-4 left-4 right-4 sm:right-auto flex items-center justify-between sm:justify-start gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm pointer-events-none">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-teal-600" />
          <span>Interactive 3D Spatial Model</span>
        </div>
        <span className="text-[10px] text-slate-600 uppercase tracking-wider font-mono">Drag to rotate</span>
      </div>
    </div>
  );
};

export default ThreeDHero;