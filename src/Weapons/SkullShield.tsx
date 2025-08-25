// src/Weapons/SkullShield.tsx

import { useRef } from 'react';
import { Group, Shape } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SkullShieldProps {
  // No props needed for now, but can add customization later
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
  const basePosition = [0, 0, 0] as const; // Use relative positioning from parent

  // Floating animation and glow effects based on shield state
  useFrame(() => {
    if (!shieldRef.current) return;

    // Gentle up/down floating motion
    const time = Date.now() * 0.001;
    const floatOffset = Math.sin(time * 2) * 0.05;
    shieldRef.current.position.y = basePosition[1] + floatOffset;

    // Dynamic glow based on shield state
    if (isShieldActive) {
      // Active shield - bright, pulsing purple glow
      glowIntensity.current = 1.5 + Math.sin(time * 4) * 0.5;
    } else if (isRecharging) {
      // Recharging - dimmer, faster pulse with progress indicator
      const rechargePulse = Math.sin(time * 8) * 0.3;
      glowIntensity.current = 0.3 + (rechargeProgress * 0.8) + rechargePulse;
    } else {
      // Broken/inactive - very dim
      glowIntensity.current = 0.1 + Math.sin(time * 1) * 0.05;
    }
  });

  // Create skull-shaped shield main body
  const createSkullShieldShape = () => {
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

  // Create eye socket shapes
  const createEyeSocketShape = (isLeft = true) => {
    const shape = new Shape();
    const xOffset = isLeft ? -0.08 : 0.08;
    
    // Triangular eye socket
    shape.moveTo(xOffset - 0.05, 0.55);
    shape.lineTo(xOffset + 0.05, 0.55);
    shape.lineTo(xOffset, 0.70);
    shape.lineTo(xOffset - 0.05, 0.55);
    
    return shape;
  };

  // Create nasal cavity shape
  const createNasalShape = () => {
    const shape = new Shape();
    
    // Inverted triangle for nasal cavity
    shape.moveTo(0, 0.35);
    shape.lineTo(-0.03, 0.50);
    shape.lineTo(0.03, 0.50);
    shape.lineTo(0, 0.35);
    
    return shape;
  };

  // Create teeth pattern
  const createTeethPattern = () => {
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

  return (
    <group 
      ref={shieldRef} 
      position={[basePosition[0], basePosition[1], basePosition[2]]}
    >
        {/* Main skull shield body */}
        <group>
          <mesh>
            <extrudeGeometry args={[createSkullShieldShape(), shieldExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0x8B8B8B)}  // Dark gray bone color
              metalness={0.3}
              roughness={0.6}
              emissive={new THREE.Color(0x2A2A2A)}
              emissiveIntensity={0.1}
            />
          </mesh>
          
          {/* Eye sockets - dark recesses */}
          <mesh position={[0, 0, 0.008]}>
            <extrudeGeometry args={[createEyeSocketShape(true), socketExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0x1A1A1A)}  // Very dark
              metalness={0.1}
              roughness={0.9}
            />
          </mesh>

          <mesh position={[0, 0, 0.008]}>
            <extrudeGeometry args={[createEyeSocketShape(false), socketExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0x1A1A1A)}  // Very dark
              metalness={0.1}
              roughness={0.9}
            />
          </mesh>

          {/* Nasal cavity */}
          <mesh position={[0, 0, 0.008]}>
            <extrudeGeometry args={[createNasalShape(), socketExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0x1A1A1A)}  // Very dark
              metalness={0.1}
              roughness={0.9}
            />
          </mesh>

          {/* Teeth */}
          <mesh position={[0, 0, 0.012]}>
            <extrudeGeometry args={[createTeethPattern(), teethExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0xFFFFF0)}  // Ivory white
              metalness={0.1}
              roughness={0.3}
              emissive={new THREE.Color(0x8B0000)}  // Dark crimson glow
              emissiveIntensity={0.2}
            />
          </mesh>
          
          {/* Glowing eye orbs in sockets */}
          <mesh position={[-0.08, 0.62, 0.025]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial
              color={new THREE.Color(isShieldActive ? 0x8B0000 : isRecharging ? 0x6B0000 : 0x4B0000)}   // Dark crimson variations
              emissive={new THREE.Color(isShieldActive ? 0x8B0000 : isRecharging ? 0x6B0000 : 0x4B0000)} 
              emissiveIntensity={glowIntensity.current * (isShieldActive ? 2.0 : isRecharging ? 1.2 : 0.8)}
              transparent
              opacity={isShieldActive ? 0.95 : isRecharging ? 0.7 + (rechargeProgress * 0.25) : 0.5}
            />
          </mesh>

          <mesh position={[0.08, 0.62, 0.025]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial
              color={new THREE.Color(isShieldActive ? 0x8B0000 : isRecharging ? 0x6B0000 : 0x4B0000)}   // Dark crimson variations
              emissive={new THREE.Color(isShieldActive ? 0x8B0000 : isRecharging ? 0x6B0000 : 0x4B0000)} 
              emissiveIntensity={glowIntensity.current * (isShieldActive ? 2.0 : isRecharging ? 1.2 : 0.8)}
              transparent
              opacity={isShieldActive ? 0.95 : isRecharging ? 0.7 + (rechargeProgress * 0.25) : 0.5}
            />
          </mesh>

          {/* Skull cracks and battle damage */}
          {[...Array(6)].map((_, i) => (
            <mesh 
              key={`crack-${i}`} 
              position={[
                (Math.random() - 0.5) * 0.4,
                0.3 + Math.random() * 0.4,
                0.018
              ]}
              rotation={[0, 0, Math.random() * Math.PI]}
            >
              <boxGeometry args={[0.002, 0.08 + Math.random() * 0.06, 0.005]} />
              <meshStandardMaterial 
                color={new THREE.Color(0x2A2A2A)}  // Dark cracks
                metalness={0.1}
                roughness={0.9}
              />
            </mesh>
          ))}

          {/* Bone studs around the edge */}
          {[...Array(16)].map((_, i) => (
            <mesh 
              key={`bone-stud-${i}`} 
              position={[
                0.24 * Math.cos(i * Math.PI / 8),
                0.44 + 0.35 * Math.sin(i * Math.PI / 8),
                0.022
              ]}
            >
              <cylinderGeometry args={[0.006, 0.010, 0.012, 6]} />
              <meshStandardMaterial 
                color={new THREE.Color(0xD2B48C)}  // Tan bone color
                metalness={0.2}
                roughness={0.7}
              />
            </mesh>
          ))}

          {/* Point light for dark crimson glow */}
          <pointLight 
            color={new THREE.Color(isShieldActive ? 0x8B0000 : isRecharging ? 0x6B0000 : 0x4B0000)}
            intensity={glowIntensity.current * (isShieldActive ? 1.2 : isRecharging ? 0.6 : 0.3)}
            distance={isShieldActive ? 2.0 : 1.5}
            decay={2}
          />
        </group>
    </group>
  );
}
