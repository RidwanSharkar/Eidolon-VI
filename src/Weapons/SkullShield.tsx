// src/Weapons/SkullShield.tsx

import { useRef, useMemo } from 'react';
import { Group, Shape } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Pre-allocated colors for performance - avoids new THREE.Color() on every render
const SKULL_SHIELD_COLORS = {
  // Base colors
  darkGrayBone: new THREE.Color(0x8B8B8B),
  darkEmissive: new THREE.Color(0x2A2A2A),
  veryDark: new THREE.Color(0x1A1A1A),
  ivoryWhite: new THREE.Color(0xFFFFF0),
  darkCrimsonEmissive: new THREE.Color(0x8B0000),
  tanBone: new THREE.Color(0xD2B48C),
  // State-based colors
  activeRed: new THREE.Color(0x8B0000),
  rechargingRed: new THREE.Color(0x6B0000),
  inactiveRed: new THREE.Color(0x4B0000),
} as const;

// MEMORY FIX: Create shapes once at module level
const createSkullShieldShape = (): Shape => {
  const shape = new Shape();
  
  // Start at bottom center point (jaw)
  shape.moveTo(0, 0);
  
  // Bottom jaw curve
  shape.lineTo(-0.06, 0.02);
  shape.lineTo(-0.12, 0.06);
  shape.lineTo(-0.16, 0.12);
  
  // Left side of skull
  shape.lineTo(-0.22, 0.20);
  shape.lineTo(-0.26, 0.32);
  shape.lineTo(-0.28, 0.45);
  shape.lineTo(-0.26, 0.58);
  shape.lineTo(-0.22, 0.68);
  
  // Top of skull (rounded)
  shape.lineTo(-0.15, 0.78);
  shape.lineTo(-0.08, 0.85);
  shape.lineTo(0, 0.88);
  
  // Right side (mirrored)
  shape.lineTo(0.08, 0.85);
  shape.lineTo(0.15, 0.78);
  shape.lineTo(0.22, 0.68);
  shape.lineTo(0.26, 0.58);
  shape.lineTo(0.28, 0.45);
  shape.lineTo(0.26, 0.32);
  shape.lineTo(0.22, 0.20);
  shape.lineTo(0.16, 0.12);
  shape.lineTo(0.12, 0.06);
  shape.lineTo(0.06, 0.02);
  shape.lineTo(0, 0);
  
  return shape;
};

const createEyeSocketShape = (isLeft: boolean): Shape => {
  const shape = new Shape();
  const xOffset = isLeft ? -0.08 : 0.08;
  
  // Triangular eye socket
  shape.moveTo(xOffset - 0.05, 0.55);
  shape.lineTo(xOffset + 0.05, 0.55);
  shape.lineTo(xOffset, 0.70);
  shape.lineTo(xOffset - 0.05, 0.55);
  
  return shape;
};

const createNasalShape = (): Shape => {
  const shape = new Shape();
  
  // Inverted triangle for nasal cavity
  shape.moveTo(0, 0.35);
  shape.lineTo(-0.03, 0.50);
  shape.lineTo(0.03, 0.50);
  shape.lineTo(0, 0.35);
  
  return shape;
};

const createTeethPattern = (): Shape => {
  const shape = new Shape();
  
  // Bottom teeth row
  for (let i = -3; i <= 3; i++) {
    const x = i * 0.04;
    shape.moveTo(x - 0.015, 0.08);
    shape.lineTo(x + 0.015, 0.08);
    shape.lineTo(x + 0.01, 0.18);
    shape.lineTo(x - 0.01, 0.18);
    shape.lineTo(x - 0.015, 0.08);
  }
  
  return shape;
};

// Pre-created shapes
const SKULL_SHAPE = createSkullShieldShape();
const LEFT_EYE_SHAPE = createEyeSocketShape(true);
const RIGHT_EYE_SHAPE = createEyeSocketShape(false);
const NASAL_SHAPE = createNasalShape();
const TEETH_SHAPE = createTeethPattern();

// Extrude settings
const shieldExtrudeSettings = {
  steps: 1,
  depth: 0.04,
  bevelEnabled: true,
  bevelThickness: 0.008,
  bevelSize: 0.015,
  bevelOffset: 0.002,
  bevelSegments: 4
};

const socketExtrudeSettings = {
  steps: 1,
  depth: 0.02,
  bevelEnabled: true,
  bevelThickness: 0.004,
  bevelSize: 0.008,
  bevelOffset: 0.001,
  bevelSegments: 3
};

const teethExtrudeSettings = {
  steps: 1,
  depth: 0.045,
  bevelEnabled: true,
  bevelThickness: 0.002,
  bevelSize: 0.004,
  bevelOffset: 0.001,
  bevelSegments: 2
};

// MEMORY FIX: Cached geometries - created once at module load
const CACHED_GEOMETRIES = {
  skullShield: new THREE.ExtrudeGeometry(SKULL_SHAPE, shieldExtrudeSettings),
  leftEyeSocket: new THREE.ExtrudeGeometry(LEFT_EYE_SHAPE, socketExtrudeSettings),
  rightEyeSocket: new THREE.ExtrudeGeometry(RIGHT_EYE_SHAPE, socketExtrudeSettings),
  nasalCavity: new THREE.ExtrudeGeometry(NASAL_SHAPE, socketExtrudeSettings),
  teeth: new THREE.ExtrudeGeometry(TEETH_SHAPE, teethExtrudeSettings),
  eyeOrb: new THREE.SphereGeometry(0.025, 8, 8),
  crackBox: new THREE.BoxGeometry(0.002, 0.08, 0.005),
  boneStud: new THREE.CylinderGeometry(0.006, 0.010, 0.012, 6)
};

// MEMORY FIX: Cached materials - created once at module load
const CACHED_MATERIALS = {
  skullBody: new THREE.MeshStandardMaterial({
    color: SKULL_SHIELD_COLORS.darkGrayBone,
    metalness: 0.3,
    roughness: 0.6,
    emissive: SKULL_SHIELD_COLORS.darkEmissive,
    emissiveIntensity: 0.1
  }),
  socketDark: new THREE.MeshStandardMaterial({
    color: SKULL_SHIELD_COLORS.veryDark,
    metalness: 0.1,
    roughness: 0.9
  }),
  teeth: new THREE.MeshStandardMaterial({
    color: SKULL_SHIELD_COLORS.ivoryWhite,
    metalness: 0.1,
    roughness: 0.3,
    emissive: SKULL_SHIELD_COLORS.darkCrimsonEmissive,
    emissiveIntensity: 0.2
  }),
  crack: new THREE.MeshStandardMaterial({
    color: SKULL_SHIELD_COLORS.darkEmissive,
    metalness: 0.1,
    roughness: 0.9
  }),
  boneStud: new THREE.MeshStandardMaterial({
    color: SKULL_SHIELD_COLORS.tanBone,
    metalness: 0.2,
    roughness: 0.7
  })
};

// Pre-computed crack positions (using seeded random for consistency)
const CRACK_DATA = Array.from({ length: 6 }, (_, i) => {
  // Use deterministic positions based on index
  const seed = i * 0.17;
  return {
    position: [
      (Math.sin(seed * 7.3) * 0.5) * 0.4,
      0.3 + (Math.sin(seed * 3.7) * 0.5 + 0.5) * 0.4,
      0.018
    ] as [number, number, number],
    rotation: [0, 0, (Math.sin(seed * 11.3) * 0.5 + 0.5) * Math.PI] as [number, number, number],
    height: 0.08 + (Math.sin(seed * 5.1) * 0.5 + 0.5) * 0.06
  };
});

// Pre-computed bone stud positions
const BONE_STUD_POSITIONS = Array.from({ length: 16 }, (_, i) => ({
  position: [
    0.24 * Math.cos(i * Math.PI / 8),
    0.44 + 0.35 * Math.sin(i * Math.PI / 8),
    0.022
  ] as [number, number, number]
}));

interface SkullShieldProps {
  className?: string;
  isShieldActive?: boolean;
  isRecharging?: boolean;
  rechargeProgress?: number;
}

export default function SkullShield({ 
  isShieldActive = false, 
  isRecharging = false, 
  rechargeProgress = 0 
}: SkullShieldProps) {
  const shieldRef = useRef<Group>(null);
  const glowIntensity = useRef(1);
  const basePosition = [0, 0, 0] as const;

  // MEMORY FIX: Memoize eye materials based on state to avoid creating new materials per render
  const eyeMaterial = useMemo(() => {
    const color = isShieldActive 
      ? SKULL_SHIELD_COLORS.activeRed 
      : isRecharging 
        ? SKULL_SHIELD_COLORS.rechargingRed 
        : SKULL_SHIELD_COLORS.inactiveRed;
    
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: isShieldActive ? 2.0 : isRecharging ? 1.2 : 0.8,
      transparent: true,
      opacity: isShieldActive ? 0.95 : isRecharging ? 0.7 + (rechargeProgress * 0.25) : 0.5
    });
  }, [isShieldActive, isRecharging, rechargeProgress]);

  // Floating animation and glow effects based on shield state
  useFrame(() => {
    if (!shieldRef.current) return;

    // Gentle up/down floating motion
    const time = Date.now() * 0.001;
    const floatOffset = Math.sin(time * 2) * 0.05;
    shieldRef.current.position.y = basePosition[1] + floatOffset;

    // Dynamic glow based on shield state
    if (isShieldActive) {
      glowIntensity.current = 1.5 + Math.sin(time * 4) * 0.5;
    } else if (isRecharging) {
      const rechargePulse = Math.sin(time * 8) * 0.3;
      glowIntensity.current = 0.3 + (rechargeProgress * 0.8) + rechargePulse;
    } else {
      glowIntensity.current = 0.1 + Math.sin(time * 1) * 0.05;
    }
  });

  const lightColor = isShieldActive 
    ? SKULL_SHIELD_COLORS.activeRed 
    : isRecharging 
      ? SKULL_SHIELD_COLORS.rechargingRed 
      : SKULL_SHIELD_COLORS.inactiveRed;

  return (
    <group 
      ref={shieldRef} 
      position={[basePosition[0], basePosition[1], basePosition[2]]}
    >
      <group>
        {/* Main skull shield body */}
        <mesh geometry={CACHED_GEOMETRIES.skullShield} material={CACHED_MATERIALS.skullBody} />
        
        {/* Eye sockets - dark recesses */}
        <mesh 
          position={[0, 0, 0.008]} 
          geometry={CACHED_GEOMETRIES.leftEyeSocket} 
          material={CACHED_MATERIALS.socketDark} 
        />
        <mesh 
          position={[0, 0, 0.008]} 
          geometry={CACHED_GEOMETRIES.rightEyeSocket} 
          material={CACHED_MATERIALS.socketDark} 
        />

        {/* Nasal cavity */}
        <mesh 
          position={[0, 0, 0.008]} 
          geometry={CACHED_GEOMETRIES.nasalCavity} 
          material={CACHED_MATERIALS.socketDark} 
        />

        {/* Teeth */}
        <mesh 
          position={[0, 0, 0.012]} 
          geometry={CACHED_GEOMETRIES.teeth} 
          material={CACHED_MATERIALS.teeth} 
        />
        
        {/* Glowing eye orbs in sockets */}
        <mesh 
          position={[-0.08, 0.62, 0.025]} 
          geometry={CACHED_GEOMETRIES.eyeOrb} 
          material={eyeMaterial} 
        />
        <mesh 
          position={[0.08, 0.62, 0.025]} 
          geometry={CACHED_GEOMETRIES.eyeOrb} 
          material={eyeMaterial} 
        />

        {/* Skull cracks and battle damage */}
        {CRACK_DATA.map((crack, i) => (
          <mesh 
            key={`crack-${i}`} 
            position={crack.position}
            rotation={crack.rotation}
            scale={[1, crack.height / 0.08, 1]}
            geometry={CACHED_GEOMETRIES.crackBox}
            material={CACHED_MATERIALS.crack}
          />
        ))}

        {/* Bone studs around the edge */}
        {BONE_STUD_POSITIONS.map((stud, i) => (
          <mesh 
            key={`bone-stud-${i}`} 
            position={stud.position}
            geometry={CACHED_GEOMETRIES.boneStud}
            material={CACHED_MATERIALS.boneStud}
          />
        ))}

        {/* Point light for dark crimson glow */}
        <pointLight 
          color={lightColor}
          intensity={glowIntensity.current * (isShieldActive ? 1.2 : isRecharging ? 0.6 : 0.3)}
          distance={isShieldActive ? 2.0 : 1.5}
          decay={2}
        />
      </group>
    </group>
  );
}
