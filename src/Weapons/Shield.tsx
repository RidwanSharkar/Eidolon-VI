// src/Weapons/Shield.tsx

import { useRef } from 'react';
import { Group, Shape, Color, AdditiveBlending, ExtrudeGeometry, CylinderGeometry, ConeGeometry, SphereGeometry, BoxGeometry, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';

// Pre-allocated colors for performance - avoids new THREE.Color() on every render
const SHIELD_COLORS = {
  // Base shield colors
  darkGoldenrod: new Color(0xB8860B),
  darkGoldEmissive: new Color(0x4A4A00),
  darkerGold: new Color(0xDAA520),
  darkerGoldEmissive: new Color(0x8B6914),
  brightGold: new Color(0xFFD700),
  brightOrange: new Color(0xFFA500),
  bronze: new Color(0x8B4513),
  darkBronzeEmissive: new Color(0xB8860B),
  // State-based colors
  activeGold: new Color(0xFFD700),
  rechargingYellow: new Color(0xFFFF88),
  brokenGray: new Color(0x666666),
  brokenDarkGray: new Color(0x333333),
  rechargingBright: new Color(0xFFFF00),
  brokenRed: new Color(0xFF4500),
  brokenDarkRed: new Color(0x8B0000),
  rechargingDarkYellow: new Color(0x8B8B00),
  cornsilk: new Color(0xFFF8DC),
  progressBarGray: new Color(0x444444),
} as const;

// =============================================================================
// SHARED SHAPES - Created ONCE at module load to prevent memory leaks
// =============================================================================

// Main shield shape
const createShieldShapeOnce = (): Shape => {
  const shape = new Shape();
  
  // Start at bottom center point
  shape.moveTo(0, 0);
  
  // Bottom left angular edge
  shape.lineTo(-0.08, 0.02);
  shape.lineTo(-0.18, 0.08);
  shape.lineTo(-0.25, 0.18);
  shape.lineTo(-0.28, 0.3);
  
  // Left side with angular segments
  shape.lineTo(-0.25, 0.45);
  shape.lineTo(-0.2, 0.6);
  shape.lineTo(-0.12, 0.72);
  shape.lineTo(-0.05, 0.8);
  
  // Top angular section
  shape.lineTo(0, 0.9);
  
  // Right side (mirrored)
  shape.lineTo(0.05, 0.8);
  shape.lineTo(0.12, 0.72);
  shape.lineTo(0.2, 0.6);
  shape.lineTo(0.25, 0.45);
  shape.lineTo(0.28, 0.3);
  shape.lineTo(0.25, 0.18);
  shape.lineTo(0.18, 0.08);
  shape.lineTo(0.08, 0.02);
  shape.lineTo(0, 0);
  
  return shape;
};

// Ornate inner pattern shape
const createInnerShieldShapeOnce = (): Shape => {
  const shape = new Shape();
  
  // Start at bottom center
  shape.moveTo(0, 0.08);
  
  // Angular inner pattern
  shape.lineTo(-0.05, 0.1);
  shape.lineTo(-0.12, 0.15);
  shape.lineTo(-0.16, 0.22);
  shape.lineTo(-0.18, 0.32);
  shape.lineTo(-0.15, 0.42);
  shape.lineTo(-0.1, 0.52);
  shape.lineTo(-0.06, 0.6);
  shape.lineTo(-0.02, 0.68);
  shape.lineTo(0, 0.75);
  
  // Right side (mirrored)
  shape.lineTo(0.02, 0.68);
  shape.lineTo(0.06, 0.6);
  shape.lineTo(0.1, 0.52);
  shape.lineTo(0.15, 0.42);
  shape.lineTo(0.18, 0.32);
  shape.lineTo(0.16, 0.22);
  shape.lineTo(0.12, 0.15);
  shape.lineTo(0.05, 0.1);
  shape.lineTo(0, 0.08);
  
  return shape;
};

// Cross pattern for the center
const createCrossPatternOnce = (): Shape => {
  const shape = new Shape();
  
  // Vertical bar
  shape.moveTo(-0.02, 0.25);
  shape.lineTo(0.02, 0.25);
  shape.lineTo(0.02, 0.65);
  shape.lineTo(-0.02, 0.65);
  shape.lineTo(-0.02, 0.25);
  
  return shape;
};

// Horizontal cross bar
const createHorizontalCrossOnce = (): Shape => {
  const shape = new Shape();
  
  // Horizontal bar
  shape.moveTo(-0.08, 0.43);
  shape.lineTo(0.08, 0.43);
  shape.lineTo(0.08, 0.47);
  shape.lineTo(-0.08, 0.47);
  shape.lineTo(-0.08, 0.43);
  
  return shape;
};

// Central gem shape
const createGemShapeOnce = (): Shape => {
  const shape = new Shape();
  
  // Octagonal gem shape
  shape.moveTo(0, 0.35);
  shape.lineTo(-0.03, 0.37);
  shape.lineTo(-0.05, 0.42);
  shape.lineTo(-0.05, 0.48);
  shape.lineTo(-0.03, 0.53);
  shape.lineTo(0, 0.55);
  shape.lineTo(0.03, 0.53);
  shape.lineTo(0.05, 0.48);
  shape.lineTo(0.05, 0.42);
  shape.lineTo(0.03, 0.37);
  shape.lineTo(0, 0.35);
  
  return shape;
};

// Create shapes once
const SHIELD_SHAPE = createShieldShapeOnce();
const INNER_SHIELD_SHAPE = createInnerShieldShapeOnce();
const CROSS_PATTERN_SHAPE = createCrossPatternOnce();
const HORIZONTAL_CROSS_SHAPE = createHorizontalCrossOnce();
const GEM_SHAPE = createGemShapeOnce();

// Extrude settings (static, never change)
const SHIELD_EXTRUDE_SETTINGS = {
  steps: 1,
  depth: 0.04,
  bevelEnabled: true,
  bevelThickness: 0.008,
  bevelSize: 0.015,
  bevelOffset: 0.002,
  bevelSegments: 4
};

const INNER_EXTRUDE_SETTINGS = {
  ...SHIELD_EXTRUDE_SETTINGS,
  depth: 0.045,
  bevelThickness: 0.006,
  bevelSize: 0.01,
  bevelOffset: 0.001,
  bevelSegments: 3
};

const GEM_EXTRUDE_SETTINGS = {
  steps: 2,
  depth: 0.05,
  bevelEnabled: true,
  bevelThickness: 0.005,
  bevelSize: 0.008,
  bevelOffset: 0.002,
  bevelSegments: 6
};

const CROSS_EXTRUDE_SETTINGS = {
  steps: 1,
  depth: 0.048,
  bevelEnabled: true,
  bevelThickness: 0.004,
  bevelSize: 0.006,
  bevelOffset: 0.001,
  bevelSegments: 2
};

const EDGE_GLOW_EXTRUDE_SETTINGS = {
  ...SHIELD_EXTRUDE_SETTINGS,
  depth: 0.006
};

// =============================================================================
// SHARED GEOMETRIES - Created ONCE at module load to prevent memory leaks
// =============================================================================

const SHIELD_SHARED_GEOMETRIES = {
  // Main shield shapes
  shield: new ExtrudeGeometry(SHIELD_SHAPE, SHIELD_EXTRUDE_SETTINGS),
  innerShield: new ExtrudeGeometry(INNER_SHIELD_SHAPE, INNER_EXTRUDE_SETTINGS),
  crossPattern: new ExtrudeGeometry(CROSS_PATTERN_SHAPE, CROSS_EXTRUDE_SETTINGS),
  horizontalCross: new ExtrudeGeometry(HORIZONTAL_CROSS_SHAPE, CROSS_EXTRUDE_SETTINGS),
  gem: new ExtrudeGeometry(GEM_SHAPE, GEM_EXTRUDE_SETTINGS),
  edgeGlow: new ExtrudeGeometry(SHIELD_SHAPE, EDGE_GLOW_EXTRUDE_SETTINGS),
  
  // Decorative elements
  stud: new CylinderGeometry(0.008, 0.012, 0.015, 6),
  cornerCone: new ConeGeometry(0.012, 0.04, 4),
  
  // Effects
  aura: new SphereGeometry(0.125, 12, 12),
  holyParticle: new SphereGeometry(0.012, 6, 6),
  
  // Progress bar
  progressBarBg: new BoxGeometry(0.3, 0.02, 0.01),
  progressBarFill: new BoxGeometry(1, 0.015, 0.005) // Will be scaled dynamically
};

// =============================================================================
// SHARED MATERIALS - Created ONCE at module load to prevent memory leaks
// =============================================================================

const SHIELD_SHARED_MATERIALS = {
  shieldBody: new MeshStandardMaterial({
    color: SHIELD_COLORS.darkGoldenrod,
    metalness: 0.95,
    roughness: 0.05,
    emissive: SHIELD_COLORS.darkGoldEmissive,
    emissiveIntensity: 0.1
  }),
  innerPattern: new MeshStandardMaterial({
    color: SHIELD_COLORS.darkerGold,
    metalness: 0.9,
    roughness: 0.02,
    emissive: SHIELD_COLORS.darkerGoldEmissive,
    emissiveIntensity: 0.15
  }),
  crossPattern: new MeshStandardMaterial({
    color: SHIELD_COLORS.brightGold,
    metalness: 0.85,
    roughness: 0.03,
    emissive: SHIELD_COLORS.brightOrange,
    emissiveIntensity: 0.2
  }),
  stud: new MeshStandardMaterial({
    color: SHIELD_COLORS.bronze,
    metalness: 0.8,
    roughness: 0.2
  }),
  cornerDecoration: new MeshStandardMaterial({
    color: SHIELD_COLORS.brightGold,
    metalness: 0.9,
    roughness: 0.05,
    emissive: SHIELD_COLORS.darkBronzeEmissive,
    emissiveIntensity: 0.15
  }),
  aura: new MeshStandardMaterial({
    color: SHIELD_COLORS.cornsilk,
    emissive: SHIELD_COLORS.activeGold,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.06,
    blending: AdditiveBlending
  }),
  holyParticle: new MeshStandardMaterial({
    color: SHIELD_COLORS.activeGold,
    emissive: SHIELD_COLORS.activeGold,
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0.5,
    blending: AdditiveBlending
  }),
  progressBarBg: new MeshStandardMaterial({
    color: SHIELD_COLORS.progressBarGray,
    transparent: true,
    opacity: 0.7
  }),
  progressBarFill: new MeshStandardMaterial({
    color: SHIELD_COLORS.brightGold,
    emissive: SHIELD_COLORS.brightGold,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.9
  })
};

interface ShieldProps {
  className?: string;
  isShieldActive?: boolean;
  isRecharging?: boolean;
  rechargeProgress?: number;
}

export default function Shield({ 
  isShieldActive = false, 
  isRecharging = false, 
  rechargeProgress = 0 
}: ShieldProps) {
  const shieldRef = useRef<Group>(null);
  const glowIntensity = useRef(1);
  const basePosition = [0.55, 1, 0.65] as const;

  // Floating animation and glow effects based on shield state
  useFrame(() => {
    if (!shieldRef.current) return;

    // Gentle up/down floating motion
    const time = Date.now() * 0.001;
    const floatOffset = Math.sin(time * 2) * 0.05;
    shieldRef.current.position.y = basePosition[1] + floatOffset;

    // Dynamic glow based on shield state
    if (isShieldActive) {
      glowIntensity.current = 0.8 + Math.sin(time * 4) * 0.2;
    } else if (isRecharging) {
      const rechargePulse = Math.sin(time * 8) * 0.15;
      glowIntensity.current = 0.2 + (rechargeProgress * 0.4) + rechargePulse;
    } else {
      glowIntensity.current = 0.05 + Math.sin(time * 1) * 0.025;
    }
  });

  return (
    <group rotation={[-0.25, 1, 0.1]}>
      <group 
        ref={shieldRef} 
        position={[basePosition[0], basePosition[1], basePosition[2]]}
        rotation={[0, Math.PI/8, 0]}
        scale={[1.2, -1.4, 0.8]}
      >
        {/* Main shield body */}
        <group>
          <mesh geometry={SHIELD_SHARED_GEOMETRIES.shield} material={SHIELD_SHARED_MATERIALS.shieldBody} />
          
          {/* Inner ornate pattern */}
          <mesh 
            position={[0, 0, 0.008]}
            geometry={SHIELD_SHARED_GEOMETRIES.innerShield}
            material={SHIELD_SHARED_MATERIALS.innerPattern}
          />

          {/* Cross pattern vertical */}
          <mesh 
            position={[0, 0, 0.012]}
            geometry={SHIELD_SHARED_GEOMETRIES.crossPattern}
            material={SHIELD_SHARED_MATERIALS.crossPattern}
          />

          {/* Cross pattern horizontal */}
          <mesh 
            position={[0, 0, 0.012]}
            geometry={SHIELD_SHARED_GEOMETRIES.horizontalCross}
            material={SHIELD_SHARED_MATERIALS.crossPattern}
          />
          
          {/* Central gem - dynamic material based on state */}
          <mesh position={[0, 0, 0.015]} geometry={SHIELD_SHARED_GEOMETRIES.gem}>
            <meshStandardMaterial
              color={isShieldActive ? SHIELD_COLORS.activeGold : isRecharging ? SHIELD_COLORS.rechargingDarkYellow : SHIELD_COLORS.brokenDarkRed}
              emissive={isShieldActive ? SHIELD_COLORS.activeGold : isRecharging ? SHIELD_COLORS.rechargingBright : SHIELD_COLORS.brokenRed}
              emissiveIntensity={glowIntensity.current * (isShieldActive ? 1.0 : isRecharging ? 0.6 : 0.4)}
              transparent
              opacity={isShieldActive ? 0.85 : isRecharging ? 0.6 + (rechargeProgress * 0.2) : 0.4}
              metalness={0.1}
              roughness={0.05}
            />
          </mesh>

          {/* Edge reinforcement studs */}
          {[...Array(12)].map((_, i) => (
            <mesh 
              key={`stud-${i}`} 
              position={[
                0.24 * Math.cos(i * Math.PI / 6),
                0.45 + 0.35 * Math.sin(i * Math.PI / 6),
                0.018
              ]}
              geometry={SHIELD_SHARED_GEOMETRIES.stud}
              material={SHIELD_SHARED_MATERIALS.stud}
            />
          ))}

          {/* Corner decorative elements */}
          {[...Array(6)].map((_, i) => (
            <mesh 
              key={`corner-${i}`} 
              position={[
                0.22 * Math.cos(i * Math.PI / 3 + Math.PI/6),
                0.45 + 0.32 * Math.sin(i * Math.PI / 3 + Math.PI/6),
                0.022
              ]}
              rotation={[0, 0, i * Math.PI / 3]}
              geometry={SHIELD_SHARED_GEOMETRIES.cornerCone}
              material={SHIELD_SHARED_MATERIALS.cornerDecoration}
            />
          ))}

          {/* Dynamic edge glow based on shield state */}
          <mesh geometry={SHIELD_SHARED_GEOMETRIES.edgeGlow}>
            <meshStandardMaterial
              color={isShieldActive ? SHIELD_COLORS.activeGold : isRecharging ? SHIELD_COLORS.rechargingYellow : SHIELD_COLORS.brokenGray}
              emissive={isShieldActive ? SHIELD_COLORS.activeGold : isRecharging ? SHIELD_COLORS.rechargingBright : SHIELD_COLORS.brokenDarkGray}
              emissiveIntensity={glowIntensity.current * (isShieldActive ? 0.25 : isRecharging ? 0.15 : 0.05)}
              transparent
              opacity={isShieldActive ? 0.2 : isRecharging ? 0.1 + (rechargeProgress * 0.1) : 0.03}
              blending={AdditiveBlending}
            />
          </mesh>

          {/* Divine radiance effects - only when shield is active */}
          {isShieldActive && (
            <>
              {/* Outer divine aura */}
              <mesh geometry={SHIELD_SHARED_GEOMETRIES.aura} material={SHIELD_SHARED_MATERIALS.aura} />

              {/* Holy particles effect */}
              {[...Array(6)].map((_, i) => (
                <mesh 
                  key={`holy-particle-${i}`}
                  position={[
                    0.4 * Math.cos(i * Math.PI / 3 + Date.now() * 0.001),
                    0.45 + 0.1 * Math.sin(Date.now() * 0.002 + i),
                    0.4 * Math.sin(i * Math.PI / 3 + Date.now() * 0.001)
                  ]}
                  geometry={SHIELD_SHARED_GEOMETRIES.holyParticle}
                  material={SHIELD_SHARED_MATERIALS.holyParticle}
                />
              ))}
            </>
          )}

          {/* Recharge progress indicator */}
          {isRecharging && (
            <mesh position={[0, 0.95, 0.02]} geometry={SHIELD_SHARED_GEOMETRIES.progressBarBg} material={SHIELD_SHARED_MATERIALS.progressBarBg}>
              {/* Progress bar fill */}
              <mesh 
                position={[-0.15 + (rechargeProgress * 0.15), 0, 0.005]}
                scale={[rechargeProgress * 0.3, 1, 1]}
                geometry={SHIELD_SHARED_GEOMETRIES.progressBarFill}
                material={SHIELD_SHARED_MATERIALS.progressBarFill}
              />
            </mesh>
          )}

          {/* Point light for divine glow */}
          <pointLight 
            color={isShieldActive ? SHIELD_COLORS.activeGold : isRecharging ? SHIELD_COLORS.rechargingYellow : SHIELD_COLORS.brokenRed}
            intensity={glowIntensity.current * (isShieldActive ? 0.35 : isRecharging ? 0.2 : 0.1)}
            distance={isShieldActive ? 1.5 : 1.0}
            decay={2}
          />
        </group>
      </group>
    </group>
  );
}
