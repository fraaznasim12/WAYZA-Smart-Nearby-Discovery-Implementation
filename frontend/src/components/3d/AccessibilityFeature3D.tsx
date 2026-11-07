import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { DoorOpen, ArrowUpRight, ArrowUpDown, Building2 } from 'lucide-react';

export type Feature3DType = 'ENTRANCE' | 'RAMP' | 'ELEVATOR' | 'BUILDING';

interface AccessibilityFeature3DProps {
  type: Feature3DType;
  className?: string;
  interactive?: boolean;
}

// ---------------------------------------------------------------------------
// 3D Geometry Models for Accessibility Features
// ---------------------------------------------------------------------------

const RampModel: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!reducedMotion && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.4, 0]}>
      {/* Base Landing */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.6, 0.1, 1.6]} />
        <meshStandardMaterial color="#0d9488" roughness={0.3} />
      </mesh>

      {/* Inclined Ramp Surface */}
      <mesh position={[0, 0.4, 0]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[1.2, 0.08, 1.8]} />
        <meshStandardMaterial color="#14b8a6" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Dual Safety Handrails */}
      <mesh position={[-0.62, 0.7, 0]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.8, 12]} />
        <meshStandardMaterial color="#fcd34d" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0.62, 0.7, 0]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.8, 12]} />
        <meshStandardMaterial color="#fcd34d" metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Handrail Support Posts */}
      {[-0.6, 0, 0.6].map((z, idx) => (
        <group key={idx}>
          <mesh position={[-0.62, 0.35 + z * 0.18, z]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <mesh position={[0.62, 0.35 + z * 0.18, z]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const ElevatorModel: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const cabinRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!reducedMotion && cabinRef.current) {
      // Gentle vertical movement simulating elevator travel
      cabinRef.current.position.y = Math.sin(clock.getElapsedTime() * 1.2) * 0.3;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer Shaft Glass Columns */}
      <mesh position={[-0.65, 0, -0.65]}>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 8]} />
        <meshStandardMaterial color="#0f766e" metalness={0.7} />
      </mesh>
      <mesh position={[0.65, 0, -0.65]}>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 8]} />
        <meshStandardMaterial color="#0f766e" metalness={0.7} />
      </mesh>
      <mesh position={[-0.65, 0, 0.65]}>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 8]} />
        <meshStandardMaterial color="#0f766e" metalness={0.7} />
      </mesh>
      <mesh position={[0.65, 0, 0.65]}>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 8]} />
        <meshStandardMaterial color="#0f766e" metalness={0.7} />
      </mesh>

      {/* Moving Elevator Cabin */}
      <group ref={cabinRef}>
        {/* Floor */}
        <mesh position={[0, -0.45, 0]}>
          <boxGeometry args={[1.1, 0.08, 1.1]} />
          <meshStandardMaterial color="#0d9488" />
        </mesh>
        {/* Roof */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[1.1, 0.08, 1.1]} />
          <meshStandardMaterial color="#0f766e" />
        </mesh>
        {/* Back Wall */}
        <mesh position={[0, 0, -0.5]}>
          <boxGeometry args={[1.0, 0.85, 0.05]} />
          <meshStandardMaterial color="#2dd4bf" transparent opacity={0.75} roughness={0.1} />
        </mesh>
        {/* Side Walls */}
        <mesh position={[-0.5, 0, 0]}>
          <boxGeometry args={[0.05, 0.85, 1.0]} />
          <meshStandardMaterial color="#2dd4bf" transparent opacity={0.75} roughness={0.1} />
        </mesh>
        <mesh position={[0.5, 0, 0]}>
          <boxGeometry args={[0.05, 0.85, 1.0]} />
          <meshStandardMaterial color="#2dd4bf" transparent opacity={0.75} roughness={0.1} />
        </mesh>
        {/* Accessible Control Column with Braille Indicator */}
        <mesh position={[0.42, 0, 0.2]}>
          <boxGeometry args={[0.06, 0.4, 0.12]} />
          <meshStandardMaterial color="#fcd34d" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
};

const EntranceModel: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!reducedMotion && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Flat Ground Level (Step-Free) */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[1.8, 0.08, 1.6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </mesh>

      {/* Door Frame Posts */}
      <mesh position={[-0.55, 0.3, 0]}>
        <boxGeometry args={[0.1, 1.4, 0.15]} />
        <meshStandardMaterial color="#0d9488" metalness={0.4} />
      </mesh>
      <mesh position={[0.55, 0.3, 0]}>
        <boxGeometry args={[0.1, 1.4, 0.15]} />
        <meshStandardMaterial color="#0d9488" metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[1.2, 0.1, 0.15]} />
        <meshStandardMaterial color="#0d9488" metalness={0.4} />
      </mesh>

      {/* Glass Sliding Doors (Open Wide for Wheelchair Ingress) */}
      <mesh position={[-0.4, 0.3, 0.02]}>
        <boxGeometry args={[0.35, 1.25, 0.03]} />
        <meshStandardMaterial color="#5eead4" transparent opacity={0.65} />
      </mesh>
      <mesh position={[0.4, 0.3, 0.02]}>
        <boxGeometry args={[0.35, 1.25, 0.03]} />
        <meshStandardMaterial color="#5eead4" transparent opacity={0.65} />
      </mesh>

      {/* Accessibility Emblem Icon — rotation belongs on the mesh, not the geometry */}
      <mesh position={[0, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
        <meshStandardMaterial color="#0284c7" />
      </mesh>
    </group>
  );
};

const BuildingModel: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!reducedMotion && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.25;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {/* Ground Surface */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.06, 24]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {/* Main Building Body */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.1, 1.4, 0.9]} />
        <meshStandardMaterial color="#0f766e" roughness={0.3} />
      </mesh>
      {/* Windows Grid */}
      {[-0.25, 0.25].map((x) =>
        [-0.1, 0.3, 0.7].map((y, idx) => (
          <mesh key={`${x}-${idx}`} position={[x, y, 0.46]}>
            <planeGeometry args={[0.2, 0.22]} />
            <meshStandardMaterial color="#99f6e4" emissive="#14b8a6" emissiveIntensity={0.2} />
          </mesh>
        ))
      )}
      {/* Illuminated Accessible Entrance Arch */}
      <mesh position={[0, -0.05, 0.48]}>
        <boxGeometry args={[0.35, 0.45, 0.06]} />
        <meshStandardMaterial color="#fcd34d" metalness={0.4} roughness={0.2} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------------------
// Main Component with Fallbacks
// ---------------------------------------------------------------------------

export const AccessibilityFeature3D: React.FC<AccessibilityFeature3DProps> = ({
  type,
  className = 'w-24 h-24',
  interactive = true,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Static fallback icon for users with reduced motion or when WebGL fails
  const renderFallback = () => {
    switch (type) {
      case 'RAMP':
        return <ArrowUpRight className="w-8 h-8 text-teal-600" />;
      case 'ELEVATOR':
        return <ArrowUpDown className="w-8 h-8 text-teal-600" />;
      case 'BUILDING':
        return <Building2 className="w-8 h-8 text-teal-600" />;
      case 'ENTRANCE':
      default:
        return <DoorOpen className="w-8 h-8 text-teal-600" />;
    }
  };

  const renderModel = () => {
    switch (type) {
      case 'RAMP':
        return <RampModel reducedMotion={prefersReducedMotion} />;
      case 'ELEVATOR':
        return <ElevatorModel reducedMotion={prefersReducedMotion} />;
      case 'BUILDING':
        return <BuildingModel reducedMotion={prefersReducedMotion} />;
      case 'ENTRANCE':
      default:
        return <EntranceModel reducedMotion={prefersReducedMotion} />;
    }
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex items-center justify-center border border-teal-500/20 shadow-md ${className}`}
      aria-label={`3D visualization for ${type}`}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-3 animate-pulse">
            {renderFallback()}
          </div>
        }
      >
        <Canvas
          camera={{ position: [2.2, 1.8, 2.4], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          className="w-full h-full"
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[4, 5, 3]} intensity={1.4} />
          <pointLight position={[-3, 2, -2]} intensity={0.5} color="#5eead4" />

          {prefersReducedMotion ? (
            renderModel()
          ) : (
            <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.4}>
              {renderModel()}
            </Float>
          )}

          {interactive && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2}
            />
          )}
        </Canvas>
      </Suspense>
    </div>
  );
};

