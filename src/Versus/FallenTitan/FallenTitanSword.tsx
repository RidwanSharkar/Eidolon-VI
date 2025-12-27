// src/Versus/FallenTitan/FallenTitanSword.tsx
import React from 'react';
import { Shape, CylinderGeometry, TorusGeometry, ConeGeometry, SphereGeometry, ExtrudeGeometry } from 'three';
import { AdditiveBlending, Color } from 'three';

// MEMORY FIX: Create static geometries once
const FALLEN_TITAN_SWORD_GEOMETRIES = {
  handle: new CylinderGeometry(0.048, 0.064, 1.44, 12),
  handleWrapping: new TorusGeometry(0.072, 0.0256, 8, 16),
  guardTorus: new TorusGeometry(0.416, 0.112, 16, 32),
  guardSpike: new ConeGeometry(0.112, 0.88, 3),
  coreOrb: new SphereGeometry(0.248, 16, 16),
  glowInner: new SphereGeometry(0.16, 16, 16),
  glowMid: new SphereGeometry(0.232, 16, 16),
  glowOuter: new SphereGeometry(0.28, 16, 16),
  energyAura: new SphereGeometry(1.2, 12, 12)
};

// MEMORY FIX: Create static blade shapes and extrude settings outside component
const FALLEN_TITAN_BLADE_SHAPE_STATIC = (() => {
  const shape = new Shape();

  // Start at center
  shape.moveTo(0, 0);

  // Left side guard
  shape.lineTo(-0.4, 0.4);
  shape.lineTo(-0.24, -0.24);
  shape.lineTo(0, 0);

  // Right side guard
  shape.lineTo(0.4, 0.4);
  shape.lineTo(0.24, -0.24);
  shape.lineTo(0, 0);

  // Blade shape - scaled up
  shape.lineTo(0, 0.12);
  shape.lineTo(0.32, 0.32);
  shape.quadraticCurveTo(1.28, 0.24, 2.4, 0.29);
  shape.quadraticCurveTo(3.2, 0.16, 3.52, 0);

  shape.quadraticCurveTo(3.2, -0.16, 2.4, -0.29);
  shape.quadraticCurveTo(1.28, -0.24, 0.32, -0.32);
  shape.lineTo(0, -0.12);
  shape.lineTo(0, 0);

  return shape;
})();

const FALLEN_TITAN_INNER_BLADE_SHAPE_STATIC = (() => {
  const shape = new Shape();
  shape.moveTo(0, 0);

  shape.lineTo(0, 0.096);
  shape.lineTo(0.24, 0.24);
  shape.quadraticCurveTo(1.92, 0.19, 2.4, 0.24);
  shape.quadraticCurveTo(3.2, 0.13, 3.44, 0);
  shape.quadraticCurveTo(3.2, -0.13, 2.4, -0.24);
  shape.quadraticCurveTo(1.92, -0.19, 0.24, -0.24);
  shape.lineTo(0, -0.08);
  shape.lineTo(0, 0);

  return shape;
})();

const FALLEN_TITAN_BLADE_EXTRUDE_SETTINGS_STATIC = {
  steps: 2,
  depth: 0.08,
  bevelEnabled: true,
  bevelThickness: 0.022,
  bevelSize: 0.032,
  bevelOffset: 0.064,
  bevelSegments: 2
};

const FALLEN_TITAN_INNER_BLADE_EXTRUDE_SETTINGS_STATIC = {
  ...FALLEN_TITAN_BLADE_EXTRUDE_SETTINGS_STATIC,
  depth: 0.096,
  bevelThickness: 0.032,
  bevelSize: 0.032,
  bevelOffset: 0,
  bevelSegments: 6
};

// MEMORY FIX: Pre-create extrude geometries
const FALLEN_TITAN_BLADE_GEOMETRIES = {
  blade: new ExtrudeGeometry(FALLEN_TITAN_BLADE_SHAPE_STATIC, FALLEN_TITAN_BLADE_EXTRUDE_SETTINGS_STATIC),
  innerBlade: new ExtrudeGeometry(FALLEN_TITAN_INNER_BLADE_SHAPE_STATIC, FALLEN_TITAN_INNER_BLADE_EXTRUDE_SETTINGS_STATIC)
};

export default function FallenTitanSword() {

  return (
    <group rotation={[-0.575, 0, 0.2]} scale={[1.6, 1.6, 1.6]}>
      <group 
        position={[0, 0, 0]}
        rotation={[0, 0, Math.PI]}
        scale={[0.7, 0.7, 0.7]} 
      >
        {/* Handle - larger and darker - MEMORY FIX: Use shared geometry */}
        <group position={[-0.04, -0.88, 0.56]} rotation={[0, 0, -Math.PI]}>
          <mesh geometry={FALLEN_TITAN_SWORD_GEOMETRIES.handle}>
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
          </mesh>
          
          {/* Handle wrappings - darker - MEMORY FIX: Use shared geometry */}
          {[...Array(10)].map((_, i) => (
            <mesh key={i} position={[0, +0.56 - i * 0.176, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={FALLEN_TITAN_SWORD_GEOMETRIES.handleWrapping}>
              <meshStandardMaterial color="#0a0a0a" metalness={0.4} roughness={0.6} />
            </mesh>
          ))}
        </group>
        
        {/* CIRCLE CONNECTION POINT - larger and darker - MEMORY FIX: Use shared geometries */}
        <group position={[-0.04, 0.36, 0.56]} rotation={[Math.PI, 1.5, Math.PI]}>
          {/* Large torus */}
          <mesh geometry={FALLEN_TITAN_SWORD_GEOMETRIES.guardTorus}>
            <meshStandardMaterial 
              color="#2a2a2a" 
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          
          {/* Decorative spikes around torus - more menacing - MEMORY FIX: Use shared geometry */}
          {[...Array(8)].map((_, i) => (
            <mesh 
              key={`spike-${i}`} 
              position={[
                0.4 * Math.cos(i * Math.PI / 4),
                0.4 * Math.sin(i * Math.PI / 4),
                0
              ]}
              rotation={[0, 0, i * Math.PI / 4 - Math.PI / 2]}
              geometry={FALLEN_TITAN_SWORD_GEOMETRIES.guardSpike}
            >
              <meshStandardMaterial 
                color="#1a1a1a"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          ))}
          
          {/* CORE ORB - dark crimson instead of yellow - MEMORY FIX: Use shared geometry */}
          <mesh geometry={FALLEN_TITAN_SWORD_GEOMETRIES.coreOrb}>
            <meshStandardMaterial
              color={new Color(0x8B0000)}         // Dark red
              emissive={new Color(0x4B0000)}      // Dark red emission
              emissiveIntensity={1.5}
              transparent
              opacity={1}
            />
          </mesh>
          
          {/* Multiple glow layers for depth - dark theme - MEMORY FIX: Use shared geometries */}
          <mesh geometry={FALLEN_TITAN_SWORD_GEOMETRIES.glowInner}>
            <meshStandardMaterial
              color={new Color(0x8B0000)}
              emissive={new Color(0x8B0000)}
              emissiveIntensity={25}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          <mesh geometry={FALLEN_TITAN_SWORD_GEOMETRIES.glowMid}>
            <meshStandardMaterial
              color={new Color(0x8B0000)}
              emissive={new Color(0x4B0000)}
              emissiveIntensity={20}
              transparent
              opacity={0.6}
            />
          </mesh>
          
          <mesh geometry={FALLEN_TITAN_SWORD_GEOMETRIES.glowOuter}>
            <meshStandardMaterial
              color={new Color(0x8B0000)}
              emissive={new Color(0x4B0000)}
              emissiveIntensity={15}
              transparent
              opacity={0.4}
            />
          </mesh>

          {/* Dark red point light */}
          <pointLight 
            color={new Color(0x8B0000)}
            intensity={1.5}
            distance={1.2}
            decay={2}
          />
        </group>
        
        {/* Blade - darker colors */}
        <group position={[0, 0.8, 0.56]} rotation={[0, -Math.PI / 2, Math.PI / 2]}>
          {/* Base blade */}
          <mesh>
            <primitive object={FALLEN_TITAN_BLADE_GEOMETRIES.blade} attach="geometry" />
            <meshStandardMaterial 
              color={new Color(0x2B0000)}  // Very dark red
              emissive={new Color(0x4B0000)} // Dark red emission
              emissiveIntensity={1.8}
              metalness={0.6}
              roughness={0.2}
            />
          </mesh>
          
          {/* BLADE Glowing core - darker */}
          <mesh>
            <primitive object={FALLEN_TITAN_BLADE_GEOMETRIES.innerBlade} attach="geometry" />
            <meshStandardMaterial 
              color={new Color(0x6B0000)}  // Dark red
              emissive={new Color(0x4B0000)} // Dark red emission
              emissiveIntensity={3}
              metalness={0.4}
              roughness={0.2}
              opacity={0.9}
              transparent
            />
          </mesh>
        </group>

        {/* Dark energy aura around the weapon - MEMORY FIX: Use shared geometry */}
        <group position={[0, 0.4, 0.56]}>
          <mesh geometry={FALLEN_TITAN_SWORD_GEOMETRIES.energyAura}>
            <meshStandardMaterial
              color={new Color(0x1a0000)}
              emissive={new Color(0x4B0000)}
              emissiveIntensity={0.8}
              transparent
              opacity={0.1}
              blending={AdditiveBlending}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}