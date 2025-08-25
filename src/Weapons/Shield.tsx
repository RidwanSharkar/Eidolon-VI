// src/Weapons/Shield.tsx

import { useRef } from 'react';
import { Group, Shape } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ShieldProps {
  // No props needed for now, but can add customization later
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
  const basePosition = [0.55, 1, 0.65] as const; // Position on left side of unit

  // Floating animation and glow effects based on shield state
  useFrame(() => {
    if (!shieldRef.current) return;

    // Gentle up/down floating motion
    const time = Date.now() * 0.001;
    const floatOffset = Math.sin(time * 2) * 0.05;
    shieldRef.current.position.y = basePosition[1] + floatOffset;

    // Dynamic glow based on shield state - reduced intensity for better GhostTrail visibility
    if (isShieldActive) {
      // Active shield - moderate pulsing divine glow (reduced from 1.5 + 0.5 to 0.8 + 0.2)
      glowIntensity.current = 0.8 + Math.sin(time * 4) * 0.2;
    } else if (isRecharging) {
      // Recharging - dimmer, faster pulse with progress indicator (reduced intensity)
      const rechargePulse = Math.sin(time * 8) * 0.15;
      glowIntensity.current = 0.2 + (rechargeProgress * 0.4) + rechargePulse;
    } else {
      // Broken/inactive - very dim
      glowIntensity.current = 0.05 + Math.sin(time * 1) * 0.025;
    }
  });

  // Create main shield shape - more angular and detailed
  const createShieldShape = () => {
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

  // Create ornate inner pattern - angular geometric design
  const createInnerShieldShape = () => {
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

  // Create cross pattern for the center
  const createCrossPattern = () => {
    const shape = new Shape();
    
    // Vertical bar
    shape.moveTo(-0.02, 0.25);
    shape.lineTo(0.02, 0.25);
    shape.lineTo(0.02, 0.65);
    shape.lineTo(-0.02, 0.65);
    shape.lineTo(-0.02, 0.25);
    
    return shape;
  };

  // Create horizontal cross bar
  const createHorizontalCross = () => {
    const shape = new Shape();
    
    // Horizontal bar
    shape.moveTo(-0.08, 0.43);
    shape.lineTo(0.08, 0.43);
    shape.lineTo(0.08, 0.47);
    shape.lineTo(-0.08, 0.47);
    shape.lineTo(-0.08, 0.43);
    
    return shape;
  };

  // Create central gem shape - larger and more ornate
  const createGemShape = () => {
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

  const shieldExtrudeSettings = {
    steps: 1,
    depth: 0.04, // Much thinner to avoid "fat" look
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.015,
    bevelOffset: 0.002,
    bevelSegments: 4
  };

  const innerExtrudeSettings = {
    ...shieldExtrudeSettings,
    depth: 0.045,
    bevelThickness: 0.006,
    bevelSize: 0.01,
    bevelOffset: 0.001,
    bevelSegments: 3
  };

  const gemExtrudeSettings = {
    steps: 2,
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.008,
    bevelOffset: 0.002,
    bevelSegments: 6
  };

  const crossExtrudeSettings = {
    steps: 1,
    depth: 0.048,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.006,
    bevelOffset: 0.001,
    bevelSegments: 2
  };

  return (
    <group rotation={[-0.25, 1, 0.1]}>
      <group 
        ref={shieldRef} 
        position={[basePosition[0], basePosition[1], basePosition[2]]}
        rotation={[0, Math.PI/8, 0]}
        scale={[1.2, -1.4, 0.8]} // Taller, less wide, thinner
      >
        {/* Main shield body */}
        <group>
          <mesh>
            <extrudeGeometry args={[createShieldShape(), shieldExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0xB8860B)}  // Dark goldenrod
              metalness={0.95}
              roughness={0.05}
              emissive={new THREE.Color(0x4A4A00)}
              emissiveIntensity={0.1}
            />
          </mesh>
          
          {/* Inner ornate pattern */}
          <mesh position={[0, 0, 0.008]}>
            <extrudeGeometry args={[createInnerShieldShape(), innerExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0xDAA520)}  // Darker gold
              metalness={0.9}
              roughness={0.02}
              emissive={new THREE.Color(0x8B6914)}
              emissiveIntensity={0.15}
            />
          </mesh>

          {/* Cross pattern vertical */}
          <mesh position={[0, 0, 0.012]}>
            <extrudeGeometry args={[createCrossPattern(), crossExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0xFFD700)}  // Bright gold
              metalness={0.85}
              roughness={0.03}
              emissive={new THREE.Color(0xFFA500)}
              emissiveIntensity={0.2}
            />
          </mesh>

          {/* Cross pattern horizontal */}
          <mesh position={[0, 0, 0.012]}>
            <extrudeGeometry args={[createHorizontalCross(), crossExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0xFFD700)}  // Bright gold
              metalness={0.85}
              roughness={0.03}
              emissive={new THREE.Color(0xFFA500)}
              emissiveIntensity={0.2}
            />
          </mesh>
          
          {/* Central gem */}
          <mesh position={[0, 0, 0.015]}>
            <extrudeGeometry args={[createGemShape(), gemExtrudeSettings]} />
            <meshStandardMaterial
              color={new THREE.Color(isShieldActive ? 0xFFD700 : isRecharging ? 0x8B8B00 : 0x8B0000)}   // Gold when active, yellow-brown when recharging, dark red when broken
              emissive={new THREE.Color(isShieldActive ? 0xFFD700 : isRecharging ? 0xFFFF00 : 0xFF4500)} // Divine gold when active, yellow when recharging, orange-red when broken
              emissiveIntensity={glowIntensity.current * (isShieldActive ? 1.0 : isRecharging ? 0.6 : 0.4)} // Reduced from 2.0/1.2/0.8
              transparent
              opacity={isShieldActive ? 0.85 : isRecharging ? 0.6 + (rechargeProgress * 0.2) : 0.4} // Reduced opacity
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
            >
              <cylinderGeometry args={[0.008, 0.012, 0.015, 6]} />
              <meshStandardMaterial 
                color={new THREE.Color(0x8B4513)}  // Bronze
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
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
            >
              <coneGeometry args={[0.012, 0.04, 4]} />
              <meshStandardMaterial 
                color={new THREE.Color(0xFFD700)}
                metalness={0.9}
                roughness={0.05}
                emissive={new THREE.Color(0xB8860B)}
                emissiveIntensity={0.15}
              />
            </mesh>
          ))}

          {/* Dynamic edge glow based on shield state */}
          <mesh>
            <extrudeGeometry args={[createShieldShape(), { ...shieldExtrudeSettings, depth: 0.006 }]} />
            <meshStandardMaterial
              color={new THREE.Color(isShieldActive ? 0xFFD700 : isRecharging ? 0xFFFF88 : 0x666666)}
              emissive={new THREE.Color(isShieldActive ? 0xFFD700 : isRecharging ? 0xFFFF00 : 0x333333)}
              emissiveIntensity={glowIntensity.current * (isShieldActive ? 0.25 : isRecharging ? 0.15 : 0.05)} // Reduced from 0.5/0.3/0.1
              transparent
              opacity={isShieldActive ? 0.2 : isRecharging ? 0.1 + (rechargeProgress * 0.1) : 0.03} // Reduced opacity
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Divine radiance effects - only when shield is active */}
          {isShieldActive && (
            <>
              {/* Outer divine aura */}
              <mesh>
                <sphereGeometry args={[0.125, 12, 12]} />
                <meshStandardMaterial
                  color={new THREE.Color(0xFFF8DC)}
                  emissive={new THREE.Color(0xFFD700)}
                  emissiveIntensity={glowIntensity.current * 0.2} // Reduced from 0.4
                  transparent
                  opacity={0.06} // Reduced from 0.1
                  blending={THREE.AdditiveBlending}
                />
              </mesh>

              {/* Holy particles effect */}
              {[...Array(6)].map((_, i) => ( // Reduced from 8 to 6 particles
                <mesh 
                  key={`holy-particle-${i}`}
                  position={[
                    0.4 * Math.cos(i * Math.PI / 3 + Date.now() * 0.001), // Adjusted for 6 particles
                    0.45 + 0.1 * Math.sin(Date.now() * 0.002 + i),
                    0.4 * Math.sin(i * Math.PI / 3 + Date.now() * 0.001)
                  ]}
                >
                  <sphereGeometry args={[0.012, 6, 6]} /> {/* Smaller particles */}
                  <meshStandardMaterial
                    color={new THREE.Color(0xFFD700)}
                    emissive={new THREE.Color(0xFFD700)}
                    emissiveIntensity={glowIntensity.current * 1.0} // Reduced from 2.0
                    transparent
                    opacity={0.5} // Reduced from 0.8
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
              ))}
            </>
          )}

          {/* Recharge progress indicator */}
          {isRecharging && (
            <mesh position={[0, 0.95, 0.02]}>
              <boxGeometry args={[0.3, 0.02, 0.01]} />
              <meshStandardMaterial
                color={new THREE.Color(0x444444)}
                transparent
                opacity={0.7}
              />
              {/* Progress bar fill */}
              <mesh position={[-0.15 + (rechargeProgress * 0.15), 0, 0.005]}>
                <boxGeometry args={[rechargeProgress * 0.3, 0.015, 0.005]} />
                <meshStandardMaterial
                  color={new THREE.Color(0xFFD700)}
                  emissive={new THREE.Color(0xFFD700)}
                  emissiveIntensity={0.5}
                  transparent
                  opacity={0.9}
                />
              </mesh>
            </mesh>
          )}

          {/* Point light for divine glow */}
          <pointLight 
            color={new THREE.Color(isShieldActive ? 0xFFD700 : isRecharging ? 0xFFFF88 : 0xFF4500)}
            intensity={glowIntensity.current * (isShieldActive ? 0.35 : isRecharging ? 0.2 : 0.1)} // Reduced from 0.75/0.45/0.225
            distance={isShieldActive ? 1.5 : 1.0} // Reduced distance
            decay={2}
          />
        </group>
      </group>
    </group>
  );
}