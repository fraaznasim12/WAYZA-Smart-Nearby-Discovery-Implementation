import React from 'react';
import { RoundedBox } from '@react-three/drei';

export type Venue3DCategory = 
  | 'HOSPITAL' 
  | 'SCHOOL' 
  | 'COLLEGE' 
  | 'RESTAURANT' 
  | 'TRANSIT_STATION' 
  | 'SHOPPING_MALL' 
  | 'PUBLIC_OFFICE' 
  | 'GENERIC';

interface Category3DProps {
  category: Venue3DCategory;
}

/**
 * Resolves a search query string or category code into a recognized Venue3DCategory.
 */
export function resolveVenueCategory(input?: string): Venue3DCategory {
  if (!input || input.trim() === '') return 'GENERIC';
  const lower = input.toLowerCase();

  if (lower.includes('hosp') || lower.includes('clinic') || lower.includes('medic') || lower.includes('doctor')) {
    return 'HOSPITAL';
  }
  if (lower.includes('school') || lower.includes('vidya') || lower.includes('academy') || lower.includes('primary')) {
    return 'SCHOOL';
  }
  if (lower.includes('univ') || lower.includes('college') || lower.includes('campus') || lower.includes('institute')) {
    return 'COLLEGE';
  }
  if (lower.includes('rest') || lower.includes('cafe') || lower.includes('coffee') || lower.includes('food') || lower.includes('dining')) {
    return 'RESTAURANT';
  }
  if (lower.includes('train') || lower.includes('rail') || lower.includes('metro') || lower.includes('transit') || lower.includes('station') || lower.includes('bus')) {
    return 'TRANSIT_STATION';
  }
  if (lower.includes('mall') || lower.includes('shop') || lower.includes('store') || lower.includes('market') || lower.includes('plaza')) {
    return 'SHOPPING_MALL';
  }
  if (lower.includes('civic') || lower.includes('public') || lower.includes('office') || lower.includes('court') || lower.includes('gov') || lower.includes('municipal')) {
    return 'PUBLIC_OFFICE';
  }

  return 'GENERIC';
}

/* -------------------------------------------------------------------------- */
/* Common Accessible Infrastructure Sub-Components                           */
/* -------------------------------------------------------------------------- */

// Standard Foundation Slab
const GroundSlab: React.FC = () => (
  <RoundedBox args={[3.4, 0.16, 3.4]} radius={0.06} smoothness={4} position={[0, -0.08, 0]} receiveShadow>
    <meshStandardMaterial color="#F1F5F9" roughness={0.4} />
  </RoundedBox>
);

// Standard Gentle Ramp (1:12 slope) with guide rails
const AccessibleRamp: React.FC<{ position?: [number, number, number]; rotation?: [number, number, number] }> = ({
  position = [-0.8, 0.08, 0.3],
  rotation = [0, -Math.PI / 4, 0],
}) => (
  <group position={position} rotation={rotation}>
    {/* Inclined Surface */}
    <mesh rotation={[-0.18, 0, 0]} position={[0, 0.08, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.9, 0.08, 1.4]} />
      <meshStandardMaterial color="#CCFBF1" roughness={0.3} />
    </mesh>
    {/* Left Rail */}
    <mesh position={[-0.46, 0.22, 0]}>
      <boxGeometry args={[0.04, 0.35, 1.4]} />
      <meshStandardMaterial color="#0F9D91" metalness={0.4} roughness={0.2} />
    </mesh>
    {/* Right Rail */}
    <mesh position={[0.46, 0.22, 0]}>
      <boxGeometry args={[0.04, 0.35, 1.4]} />
      <meshStandardMaterial color="#0F9D91" metalness={0.4} roughness={0.2} />
    </mesh>
  </group>
);

// Standard Glass Automatic Sliding Entrance
const AutomaticGlassEntrance: React.FC<{ position?: [number, number, number] }> = ({
  position = [0.5, 0.75, -1.1],
}) => (
  <group position={position}>
    <mesh position={[-0.55, 0, 0]} castShadow>
      <boxGeometry args={[0.08, 0.95, 0.08]} />
      <meshStandardMaterial color="#101C36" roughness={0.3} />
    </mesh>
    <mesh position={[0.55, 0, 0]} castShadow>
      <boxGeometry args={[0.08, 0.95, 0.08]} />
      <meshStandardMaterial color="#101C36" roughness={0.3} />
    </mesh>
    <mesh position={[0, 0.48, 0]} castShadow>
      <boxGeometry args={[1.18, 0.08, 0.08]} />
      <meshStandardMaterial color="#101C36" roughness={0.3} />
    </mesh>
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1.02, 0.88, 0.02]} />
      <meshStandardMaterial color="#99F6E4" transparent opacity={0.4} roughness={0.1} />
    </mesh>
  </group>
);

/* -------------------------------------------------------------------------- */
/* Category-Specific 3D Architectural Scenes                                 */
/* -------------------------------------------------------------------------- */

/** 1. Hospital / Healthcare Scene: Emergency ambulance ramp, medical cross */
const HospitalScene: React.FC = () => (
  <group>
    <GroundSlab />
    {/* Main Clinic Wing */}
    <RoundedBox args={[1.9, 1.4, 1.8]} radius={0.06} smoothness={4} position={[0.4, 0.7, -0.4]} castShadow receiveShadow>
      <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
    </RoundedBox>
    {/* Emergency Red Cross on Facade */}
    <group position={[0.4, 1.05, 0.52]}>
      <mesh castShadow>
        <boxGeometry args={[0.12, 0.4, 0.04]} />
        <meshStandardMaterial color="#FF826E" roughness={0.2} />
      </mesh>
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.12, 0.04]} />
        <meshStandardMaterial color="#FF826E" roughness={0.2} />
      </mesh>
    </group>
    {/* Accessible ER Ingress Ramp */}
    <AccessibleRamp />
    <AutomaticGlassEntrance />
  </group>
);

/** 2. School / Education Scene: Low-incline ramp, wide ground entry, educational bell tower */
const SchoolScene: React.FC = () => (
  <group>
    <GroundSlab />
    {/* Classroom Wing (Broad 2-story building) */}
    <RoundedBox args={[2.4, 1.1, 1.6]} radius={0.06} smoothness={4} position={[0.2, 0.55, -0.4]} castShadow receiveShadow>
      <meshStandardMaterial color="#FEF3C7" roughness={0.3} />
    </RoundedBox>
    {/* Pitched Roof Accent */}
    <mesh position={[0.2, 1.25, -0.4]} rotation={[0, 0, 0]} castShadow>
      <cylinderGeometry args={[0.02, 1.3, 0.35, 4]} />
      <meshStandardMaterial color="#D97706" roughness={0.4} />
    </mesh>
    {/* Wide Double Step-Free Doors */}
    <group position={[0.2, 0.45, 0.42]}>
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.8, 0.04]} />
        <meshStandardMaterial color="#17365B" roughness={0.3} />
      </mesh>
      {/* Step-free sign */}
      <mesh position={[0, 0.5, 0.02]}>
        <boxGeometry args={[0.3, 0.12, 0.02]} />
        <meshStandardMaterial color="#0F9D91" />
      </mesh>
    </group>
    {/* Wide Ramp to school courtyard */}
    <AccessibleRamp position={[-1.0, 0.06, 0.4]} rotation={[0, -Math.PI / 6, 0]} />
  </group>
);

/** 3. College / University Scene: Multi-level academic hall, exterior glass elevator core */
const CollegeScene: React.FC = () => (
  <group>
    <GroundSlab />
    {/* Main Academic Hall */}
    <RoundedBox args={[2.0, 1.6, 1.6]} radius={0.06} smoothness={4} position={[0.3, 0.8, -0.4]} castShadow receiveShadow>
      <meshStandardMaterial color="#EDE9FE" roughness={0.3} />
    </RoundedBox>
    {/* Glass Elevator Tower Shaft (Vertical Access) */}
    <group position={[-0.8, 0.9, -0.4]}>
      <mesh castShadow>
        <boxGeometry args={[0.6, 1.8, 0.6]} />
        <meshStandardMaterial color="#6D5EF6" transparent opacity={0.65} roughness={0.1} />
      </mesh>
      {/* Elevator Cab Indicator */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.5, 0.45, 0.5]} />
        <meshStandardMaterial color="#2DD4BF" emissive="#2DD4BF" emissiveIntensity={0.3} />
      </mesh>
    </group>
    <AccessibleRamp position={[-0.3, 0.08, 0.6]} rotation={[0, 0, 0]} />
  </group>
);

/** 4. Restaurant / Cafe Scene: Step-free terrace, patio umbrella, wide entry */
const RestaurantScene: React.FC = () => (
  <group>
    <GroundSlab />
    {/* Cafe Building */}
    <RoundedBox args={[1.8, 1.1, 1.6]} radius={0.06} smoothness={4} position={[0.4, 0.55, -0.5]} castShadow receiveShadow>
      <meshStandardMaterial color="#FFFBEB" roughness={0.3} />
    </RoundedBox>
    {/* Outdoor Accessible Dining Table */}
    <group position={[-0.7, 0.25, 0.3]}>
      {/* Table Top (Accessible clearance) */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.04, 24]} />
        <meshStandardMaterial color="#F5B942" roughness={0.4} />
      </mesh>
      {/* Base leg */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 12]} />
        <meshStandardMaterial color="#101C36" />
      </mesh>
      {/* Patio Umbrella */}
      <mesh position={[0, 0.8, 0]}>
        <coneGeometry args={[0.8, 0.35, 16]} />
        <meshStandardMaterial color="#FF826E" roughness={0.3} />
      </mesh>
    </group>
    <AccessibleRamp position={[0.4, 0.08, 0.5]} rotation={[0, 0, 0]} />
  </group>
);

/** 5. Transit / Railway Scene: Commuter terminal, tactile paving strip, platform ramp */
const TransitScene: React.FC = () => (
  <group>
    <GroundSlab />
    {/* Terminal Concourse Canopy */}
    <RoundedBox args={[2.6, 0.9, 1.5]} radius={0.06} smoothness={4} position={[0, 0.45, -0.5]} castShadow receiveShadow>
      <meshStandardMaterial color="#F1F5F9" roughness={0.3} />
    </RoundedBox>
    {/* Tactile Ground Paving Strip */}
    <mesh position={[0, 0.01, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2.6, 0.25]} />
      <meshStandardMaterial color="#F5B942" roughness={0.6} />
    </mesh>
    {/* Elevated Platform Ingress Ramp */}
    <AccessibleRamp position={[-0.9, 0.08, 0.2]} rotation={[0, -Math.PI / 4, 0]} />
    {/* Station Clock / Signage Tower */}
    <group position={[1.1, 0.9, -0.5]}>
      <mesh castShadow>
        <boxGeometry args={[0.2, 1.8, 0.2]} />
        <meshStandardMaterial color="#17365B" />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.4, 0.3, 0.3]} />
        <meshStandardMaterial color="#2DD4BF" emissive="#2DD4BF" emissiveIntensity={0.4} />
      </mesh>
    </group>
  </group>
);

/** 6. Shopping Mall / Retail Scene: Glass commercial atrium, automatic doors, mobility parking */
const MallScene: React.FC = () => (
  <group>
    <GroundSlab />
    {/* Large Retail Atrium */}
    <RoundedBox args={[2.2, 1.3, 1.8]} radius={0.08} smoothness={4} position={[0.2, 0.65, -0.3]} castShadow receiveShadow>
      <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
    </RoundedBox>
    {/* Glass Shopfront Glazing */}
    <mesh position={[0.2, 0.6, 0.62]}>
      <boxGeometry args={[1.8, 0.8, 0.02]} />
      <meshStandardMaterial color="#2DD4BF" transparent opacity={0.4} roughness={0.1} />
    </mesh>
    {/* Dedicated Mobility Parking Bay Stripe */}
    <mesh position={[-0.9, 0.01, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.7, 1.1]} />
      <meshStandardMaterial color="#0F9D91" roughness={0.5} />
    </mesh>
    <AccessibleRamp position={[-0.2, 0.08, 0.8]} rotation={[0, 0, 0]} />
  </group>
);

/** 7. Civic Centre / Public Office Scene: Pillars, accessible turnstile, grand ramp */
const PublicOfficeScene: React.FC = () => (
  <group>
    <GroundSlab />
    {/* Civic Hall Hallway */}
    <RoundedBox args={[2.2, 1.3, 1.6]} radius={0.06} smoothness={4} position={[0, 0.65, -0.4]} castShadow receiveShadow>
      <meshStandardMaterial color="#EDE9FE" roughness={0.3} />
    </RoundedBox>
    {/* Civic Entrance Columns */}
    {[-0.8, -0.27, 0.27, 0.8].map((x, i) => (
      <mesh key={i} position={[x, 0.65, 0.45]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 1.3, 16]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
      </mesh>
    ))}
    {/* Front Pediment Triangular Roof */}
    <mesh position={[0, 1.45, 0.45]} castShadow>
      <coneGeometry args={[1.3, 0.35, 4]} />
      <meshStandardMaterial color="#6D5EF6" roughness={0.3} />
    </mesh>
    <AccessibleRamp position={[0, 0.08, 0.7]} rotation={[0, 0, 0]} />
  </group>
);

/** 8. Generic Accessible Venue Scene */
const GenericVenueScene: React.FC = () => (
  <group>
    <GroundSlab />
    <RoundedBox args={[1.8, 1.2, 1.6]} radius={0.06} smoothness={4} position={[0.4, 0.6, -0.4]} castShadow receiveShadow>
      <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
    </RoundedBox>
    <AccessibleRamp />
    <AutomaticGlassEntrance />
  </group>
);

/* -------------------------------------------------------------------------- */
/* Main Category Switcher Component                                           */
/* -------------------------------------------------------------------------- */

export const Category3DScene: React.FC<Category3DProps> = ({ category }) => {
  switch (category) {
    case 'HOSPITAL':
      return <HospitalScene />;
    case 'SCHOOL':
      return <SchoolScene />;
    case 'COLLEGE':
      return <CollegeScene />;
    case 'RESTAURANT':
      return <RestaurantScene />;
    case 'TRANSIT_STATION':
      return <TransitScene />;
    case 'SHOPPING_MALL':
      return <MallScene />;
    case 'PUBLIC_OFFICE':
      return <PublicOfficeScene />;
    case 'GENERIC':
    default:
      return <GenericVenueScene />;
  }
};

