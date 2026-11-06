import React, { Suspense, useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, OrbitControls, RoundedBox } from '@react-three/drei';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { ShieldCheck, Compass } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* WebGL Error Boundary                                                       */
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
    console.warn('WebGL initialization failed in CityHeroScene:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/* -------------------------------------------------------------------------- */
/* Stylized Miniature Accessible City Elements                                */
/* -------------------------------------------------------------------------- */

const FloatingPin: React.FC<{ position: [number, number, number]; color?: string }> = ({ position, color = '#0d9488' }) => {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#99f6e4" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.14, 0.32, 24]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.24, 24]} />
        <meshStandardMaterial color="#14b8a6" transparent opacity={0.6} />
      </mesh>
    </group>
  );
};

const Tree: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.3, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <coneGeometry args={[0.22, 0.45, 8]} />
        <meshStandardMaterial color="#10b981" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <coneGeometry args={[0.16, 0.35, 8]} />
        <meshStandardMaterial color="#34d399" roughness={0.4} />
      </mesh>
    </group>
  );
};

const MiniatureCityModel: React.FC = () => {
  return (
    <group position={[0, -0.35, 0]}>
      {/* 1. Base City Platform Slab */}
      <RoundedBox args={[4.2, 0.18, 4.2]} radius={0.08} smoothness={4} position={[0, -0.09, 0]} receiveShadow>
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </RoundedBox>

      {/* 2. Asphalt Roadway & Crosswalk */}
      <mesh position={[0, 0.005, 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.1, 0.9]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
      {/* Crosswalk Stripes */}
      {[-1.2, -0.6, 0, 0.6, 1.2].map((x, idx) => (
        <mesh key={idx} position={[x, 0.01, 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.25, 0.6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      ))}

      {/* 3. Main Civic Facility (Center Left) with Accessible Entrance Ramp */}
      <group position={[-0.8, 0.8, -0.7]}>
        {/* Main Building Block */}
        <RoundedBox args={[1.5, 1.6, 1.3]} radius={0.05} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </RoundedBox>
        {/* Glass Entrance Canopy */}
        <mesh position={[0, -0.3, 0.72]}>
          <boxGeometry args={[1.1, 0.05, 0.35]} />
          <meshStandardMaterial color="#0d9488" transparent opacity={0.8} />
        </mesh>
        {/* Step-Free Glass Door Portal */}
        <mesh position={[0, -0.55, 0.66]}>
          <boxGeometry args={[0.8, 0.45, 0.02]} />
          <meshStandardMaterial color="#99f6e4" transparent opacity={0.4} />
        </mesh>
        {/* Accessible Ingress Ramp */}
        <group position={[0.7, -0.7, 0.85]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh rotation={[-0.18, 0, 0]} position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[0.45, 0.05, 1.1]} />
            <meshStandardMaterial color="#ccfbf1" roughness={0.3} />
          </mesh>
          {/* Ramp Railings */}
          <mesh position={[-0.24, 0.16, 0]}>
            <boxGeometry args={[0.03, 0.24, 1.1]} />
            <meshStandardMaterial color="#0d9488" metalness={0.4} />
          </mesh>
          <mesh position={[0.24, 0.16, 0]}>
            <boxGeometry args={[0.03, 0.24, 1.1]} />
            <meshStandardMaterial color="#0d9488" metalness={0.4} />
          </mesh>
        </group>
      </group>

      {/* 4. Healthcare / Hospital Tower (Back Right) */}
      <group position={[1.1, 1.2, -0.8]}>
        <RoundedBox args={[1.2, 2.4, 1.1]} radius={0.05} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#f1f5f9" roughness={0.2} />
        </RoundedBox>
        {/* Emerald Cross Badge */}
        <mesh position={[0, 0.7, 0.56]}>
          <boxGeometry args={[0.4, 0.12, 0.04]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>
        <mesh position={[0, 0.7, 0.56]}>
          <boxGeometry args={[0.12, 0.4, 0.04]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>
        {/* Exterior Elevator Core (Glass Vertical Mobility) */}
        <mesh position={[-0.66, 0, 0]} castShadow>
          <boxGeometry args={[0.22, 2.2, 0.4]} />
          <meshStandardMaterial color="#0f766e" transparent opacity={0.7} />
        </mesh>
      </group>

      {/* 5. Transit Station Hub (Front Right) */}
      <group position={[1.0, 0.35, 1.2]}>
        <RoundedBox args={[1.4, 0.7, 0.9]} radius={0.04} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#0f172a" roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0.2, 0.46]}>
          <boxGeometry args={[1.0, 0.15, 0.02]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* 6. Green Parks & Urban Trees */}
      <mesh position={[-1.2, 0.01, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial color="#dcfce7" roughness={0.6} />
      </mesh>
      <Tree position={[-1.4, 0.01, 1.3]} />
      <Tree position={[-0.9, 0.01, 1.4]} />
      <Tree position={[-1.2, 0.01, 0.9]} />
      <Tree position={[1.7, 0.01, -0.2]} />

      {/* 7. Floating Verified Location Markers */}
      <FloatingPin position={[-0.8, 1.9, -0.7]} color="#0d9488" />
      <FloatingPin position={[1.1, 2.7, -0.8]} color="#10b981" />
      <FloatingPin position={[1.0, 1.0, 1.2]} color="#0284c7" />
    </group>
  );
};

/* -------------------------------------------------------------------------- */
/* Resilient 2D Architectural Vector Fallback                                 */
/* -------------------------------------------------------------------------- */
const ArchitecturalCityFallback2D: React.FC<{ reason?: string }> = ({ reason }) => {
  return (
    <div 
      className="w-full h-full min-h-[380px] flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-teal-50/40 to-slate-100 rounded-3xl p-6 border border-slate-200/90 shadow-inner"
      role="region"
      aria-label="Accessible 2D architectural diagram of accessible city"
    >
      <svg 
        viewBox="0 0 440 340" 
        className="w-full max-w-[340px] h-auto drop-shadow-md"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cityRamp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
        </defs>

        {/* Foundation Grid */}
        <polygon points="220,40 400,140 220,240 40,140" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
        
        {/* Roadway */}
        <polygon points="120,185 240,250 200,270 80,205" fill="#334155" />
        
        {/* Building 1: Civic Center with Ramp */}
        <polygon points="110,130 180,90 180,180 110,220" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
        <polygon points="110,130 180,90 220,115 150,155" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
        {/* Entrance Ramp */}
        <polygon points="150,155 190,180 190,195 150,170" fill="url(#cityRamp)" />

        {/* Building 2: Medical Tower */}
        <polygon points="260,70 330,30 330,160 260,200" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
        <polygon points="260,70 330,30 370,55 300,95" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
        {/* Cross Icon */}
        <circle cx="295" cy="110" r="14" fill="#dcfce7" />
        <line x1="295" y1="102" x2="295" y2="118" stroke="#10b981" strokeWidth="3" />
        <line x1="287" y1="110" x2="303" y2="110" stroke="#10b981" strokeWidth="3" />

        {/* Floating Pin Pins */}
        <g transform="translate(145, 60)">
          <circle cx="0" cy="0" r="14" fill="#0d9488" />
          <circle cx="0" cy="0" r="6" fill="#ffffff" />
          <polygon points="0,14 -5,6 5,6" fill="#0d9488" />
        </g>
        <g transform="translate(295, 10)">
          <circle cx="0" cy="0" r="14" fill="#10b981" />
          <circle cx="0" cy="0" r="6" fill="#ffffff" />
          <polygon points="0,14 -5,6 5,6" fill="#10b981" />
        </g>
      </svg>

      <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
        <span>{reason || '2D Accessible Vector City View'}</span>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Reusable CityHeroScene Component                                           */
/* -------------------------------------------------------------------------- */
export const CityHeroScene: React.FC<{ className?: string }> = ({ className = '' }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isWebGLSupported, setIsWebGLSupported] = useState<boolean>(true);

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

  if (prefersReducedMotion) {
    return <ArchitecturalCityFallback2D reason="Reduced Motion Mode Active" />;
  }

  if (!isWebGLSupported) {
    return <ArchitecturalCityFallback2D reason="WebGL Not Available — 2D View Active" />;
  }

  return (
    <div 
      className={`relative w-full h-[400px] sm:h-[460px] lg:h-[500px] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-100/90 via-teal-50/20 to-slate-100/80 border border-slate-200/90 shadow-sm ${className}`}
      role="figure"
      aria-label="Interactive 3D model of an accessible city with sloped ramps, vertical elevators, level transit hubs, and verified location pins."
    >
      <ThreeErrorBoundary fallback={<ArchitecturalCityFallback2D reason="WebGL Error Fallback" />}>
        <Canvas
          shadows
          camera={{ position: [4.2, 3.6, 4.6], fov: 40 }}
          style={{ pointerEvents: 'auto' }}
        >
          {/* Lighting Rig */}
          <ambientLight intensity={0.85} />
          <directionalLight 
            position={[6, 9, 5]} 
            intensity={1.25} 
            castShadow 
            shadow-mapSize={[1024, 1024]}
          />
          <pointLight position={[-4, 3, -2]} color="#14b8a6" intensity={0.5} />
          <pointLight position={[3, 2, 3]} color="#38bdf8" intensity={0.4} />

          {/* Interactive Floating City Scene */}
          <Suspense fallback={null}>
            <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.25}>
              <MiniatureCityModel />
            </Float>
          </Suspense>

          {/* User Controls with Angle Constraints */}
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            maxPolarAngle={Math.PI / 2.15}
            minPolarAngle={Math.PI / 4.8}
            dampingFactor={0.05}
          />
        </Canvas>
      </ThreeErrorBoundary>

      {/* Floating Interactive Badge */}
      <div className="absolute bottom-4 left-4 right-4 sm:right-auto flex items-center justify-between sm:justify-start gap-2.5 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm pointer-events-none">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-teal-600" />
          <span>Interactive Accessible City 3D</span>
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Drag to inspect</span>
      </div>
    </div>
  );
};

export default CityHeroScene;