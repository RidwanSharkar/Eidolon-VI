import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Shape, TorusGeometry, CylinderGeometry, ConeGeometry, SphereGeometry, ExtrudeGeometry } from 'three';
import { AdditiveBlending, Color, DoubleSide } from 'three';

// Pre-allocated colors for performance - avoids new Color() on every render
const COLORS = {
  // Going out colors (red)
  spearRed: new Color(0xFF544E),
  lightningRed: new Color(0xFF544E),
  // Returning colors (cyan/blue)
  spearBlue: new Color(0x0088FF),
  lightningCyan: new Color(0x00FFFF),
};

// MEMORY FIX: Static shared geometries for spinning rings - use scale for size variations
const SPEAR_RING_GEOMETRIES = [
  new TorusGeometry(0.15, 0.02, 6, 12),
  new TorusGeometry(0.20, 0.02, 6, 12),
  new TorusGeometry(0.25, 0.02, 6, 12),
  new TorusGeometry(0.30, 0.02, 6, 12),
];

// MEMORY FIX: Static shared geometries for spear components - prevents recreation every frame
const SPEAR_GEOMETRIES = {
  shaft: new CylinderGeometry(0.03, 0.04, 2.2, 12),
  shaftRing: new TorusGeometry(0.045, 0.016, 8, 16),
  guard: new TorusGeometry(0.26, 0.07, 16, 32),
  guardSpike: new ConeGeometry(0.070, 0.55, 3),
  energyCore: new SphereGeometry(0.155, 16, 16),
  energyCoreInner: new SphereGeometry(0.1, 16, 16),
  energyCoreMid: new SphereGeometry(0.145, 16, 16),
  energyCoreOuter: new SphereGeometry(0.175, 16, 16),
  trailSphere: new SphereGeometry(0.15, 8, 8),
  trailGlow: new SphereGeometry(0.2, 6, 6),
};

// MEMORY FIX: Create static blade shapes and extrude settings outside component
const SPEAR_BLADE_SHAPE_STATIC = (() => {
  const shape = new Shape();
  shape.moveTo(0, 0);

  shape.lineTo(0.15, -0.230);
  shape.bezierCurveTo(
    0.8, 0.22,
    1.13, 0.5,
    1.8, 1.6
  );

  shape.lineTo(1.125, 0.75);
  shape.bezierCurveTo(
    0.5, 0.2,
    0.225, 0.0,
    0.1, 0.7
  );
  shape.lineTo(0, 0);
  return shape;
})();

const SPEAR_INNER_BLADE_SHAPE_STATIC = (() => {
  const shape = new Shape();
  shape.moveTo(0, 0);

  shape.lineTo(0, 0.06);
  shape.lineTo(0.15, 0.15);
  shape.quadraticCurveTo(1.2, 0.12, 1.5, 0.15);
  shape.quadraticCurveTo(2.0, 0.08, 2.15, 0);
  shape.quadraticCurveTo(2.0, -0.08, 1.5, -0.15);
  shape.quadraticCurveTo(1.2, -0.12, 0.15, -0.15);
  shape.lineTo(0, -0.05);
  shape.lineTo(0, 0);

  return shape;
})();

const SPEAR_BLADE_EXTRUDE_SETTINGS_STATIC = {
  steps: 2,
  depth: 0.05,
  bevelEnabled: true,
  bevelThickness: 0.014,
  bevelSize: 0.02,
  bevelOffset: 0.04,
  bevelSegments: 2
};

const SPEAR_INNER_BLADE_EXTRUDE_SETTINGS_STATIC = {
  ...SPEAR_BLADE_EXTRUDE_SETTINGS_STATIC,
  depth: 0.06,
  bevelThickness: 0.02,
  bevelSize: 0.02,
  bevelOffset: 0,
  bevelSegments: 6
};

// MEMORY FIX: Pre-create extrude geometries
const SPEAR_BLADE_GEOMETRIES = {
  blade: new ExtrudeGeometry(SPEAR_BLADE_SHAPE_STATIC, SPEAR_BLADE_EXTRUDE_SETTINGS_STATIC),
  innerBlade: new ExtrudeGeometry(SPEAR_INNER_BLADE_SHAPE_STATIC, SPEAR_INNER_BLADE_EXTRUDE_SETTINGS_STATIC)
};

interface ThrowSpearProjectileProps {
  position: Vector3;
  direction: Vector3;
  opacity: number;
  isReturning: boolean;
  chargeTime: number; // 0-2 seconds, affects visual intensity
}

export default function ThrowSpearProjectile({ 
  position, 
  direction, 
  opacity, 
  isReturning,
  chargeTime 
}: ThrowSpearProjectileProps) {
  const groupRef = useRef<Group>(null);
  const TRAIL_COUNT = 10;

  // Calculate visual intensity based on charge time (0-1)
  const chargeIntensity = Math.min(chargeTime / 2, 1);
  
  // Memoize colors based on isReturning state
  const { spearColor, lightningColor } = useMemo(() => ({
    spearColor: isReturning ? COLORS.spearBlue : COLORS.spearRed,
    lightningColor: isReturning ? COLORS.lightningCyan : COLORS.lightningRed,
  }), [isReturning]);
  
  useFrame(() => {
    if (!groupRef.current) return;

    // Update position
    groupRef.current.position.copy(position);
    
    // Calculate rotation based on direction (similar to ViperSting)
    const lookDirection = direction.clone().normalize();
    const rotationY = Math.atan2(lookDirection.x, lookDirection.z);
    const rotationX = Math.atan2(-lookDirection.y, Math.sqrt(lookDirection.x * lookDirection.x + lookDirection.z * lookDirection.z));
    
    // Apply rotation - this will make the spear flip when returning
    groupRef.current.rotation.set(rotationX, rotationY, 0);
  });


  // Colors get more intense with higher charge
  const baseEmissiveIntensity = 1.5 + (chargeIntensity * 2); // 1.5 to 3.5
  const coreEmissiveIntensity = 2 + (chargeIntensity * 3); // 2 to 5

  return (
    <group ref={groupRef}>
      {/* Main spear container with proper scaling and positioning to match original */}
      <group 
        position={[0, -0.4, 0.6]}
        rotation={[-0.55, 0.15, 0]}
        scale={[0.825, 0.75, 0.75]}
      >
        <group 
          position={[-1.18, 0.225, -0.3]}
          rotation={[Math.PI/2, 0, 0]}
          scale={[0.8, 0.8, 0.7]}
        >
          {/* Spear shaft - FIXED: Use shared geometry */}
          <group position={[-0.025, -0.55, 0.35]} rotation={[0, 0, -Math.PI]}>
            <mesh>
              <primitive object={SPEAR_GEOMETRIES.shaft} />
              <meshStandardMaterial 
                color="#2a3b4c" 
                roughness={0.7}
                transparent
                opacity={opacity}
              />
            </mesh>
            
            {/* Spear rings along shaft - FIXED: Use shared geometry */}
            {[...Array(12)].map((_, i) => (
              <mesh key={i} position={[0, 1.0 - i * 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <primitive object={SPEAR_GEOMETRIES.shaftRing} />
                <meshStandardMaterial 
                  color="#1a2b3c" 
                  metalness={0.6} 
                  roughness={0.4}
                  transparent
                  opacity={opacity}
                />
              </mesh>
            ))}
          </group>
          
          {/* Spear guard/crossguard - FIXED: Use shared geometry */}
          <group position={[-0.025, .45, 0.35]} rotation={[Math.PI, 1.5, Math.PI]}>
            <mesh>
              <primitive object={SPEAR_GEOMETRIES.guard} />
              <meshStandardMaterial 
                color="#4a5b6c" 
                metalness={0.9}
                roughness={0.1}
                transparent
                opacity={opacity}
              />
            </mesh>
            
            {/* Spikes on guard - FIXED: Use shared geometry */}
            {[...Array(8)].map((_, i) => (
              <mesh 
                key={`spike-${i}`} 
                position={[
                  0.25 * Math.cos(i * Math.PI / 4),
                  0.25 * Math.sin(i * Math.PI / 4),
                  0
                ]}
                rotation={[0, 0, i * Math.PI / 4 - Math.PI / 2]}
              >
                <primitive object={SPEAR_GEOMETRIES.guardSpike} />
                <meshStandardMaterial 
                  color="#4a5b6c"
                  metalness={0.9}
                  roughness={0.1}
                  transparent
                  opacity={opacity}
                />
              </mesh>
            ))}
            
            {/* Energy core - gets brighter with charge - FIXED: Use shared geometries */}
            <mesh>
              <primitive object={SPEAR_GEOMETRIES.energyCore} />
              <meshStandardMaterial
                color={spearColor}
                emissive={spearColor}
                emissiveIntensity={baseEmissiveIntensity}
                transparent
                opacity={opacity}
              />
            </mesh>
            
            <mesh>
              <primitive object={SPEAR_GEOMETRIES.energyCoreInner} />
              <meshStandardMaterial
                color={spearColor}
                emissive={spearColor}
                emissiveIntensity={coreEmissiveIntensity}
                transparent
                opacity={opacity * 0.8}
              />
            </mesh>
            
            <mesh>
              <primitive object={SPEAR_GEOMETRIES.energyCoreMid} />
              <meshStandardMaterial
                color={spearColor}
                emissive={spearColor}
                emissiveIntensity={baseEmissiveIntensity + 1}
                transparent
                opacity={opacity * 0.6}
              />
            </mesh>
            
            <mesh>
              <primitive object={SPEAR_GEOMETRIES.energyCoreOuter} />
              <meshStandardMaterial
                color={spearColor}
                emissive={spearColor}
                emissiveIntensity={baseEmissiveIntensity}
                transparent
                opacity={opacity * 0.4}
              />
            </mesh>

            {/* Point light for illumination */}
            <pointLight 
              color={lightningColor}
              intensity={chargeIntensity * 2 + 2}
              distance={0.5}
              decay={2}
            />
          </group>
          
          {/* Spear blades - three-pronged design */}
          <group position={[0, 0.75, 0.35]}>
            {/* Main blade */}
            <group rotation={[0, 0, 0]}>
              <group rotation={[0, 0, 0.7]} scale={[0.4, 0.4, -0.4]}>
                <mesh>
                  <primitive object={SPEAR_BLADE_GEOMETRIES.blade} attach="geometry" />
                  <meshStandardMaterial 
                    color={spearColor}
                    emissive={spearColor}
                    emissiveIntensity={baseEmissiveIntensity}
                    metalness={0.8}
                    roughness={0.1}
                    opacity={opacity * 0.8}
                    transparent
                    side={DoubleSide}
                  />
                </mesh>
              </group>
            </group>

            {/* Side blades */}
            <group rotation={[0, (2 * Math.PI) / 3, Math.PI/2]}>
              <group rotation={[0, 0., 5.33]} scale={[0.4, 0.4, -0.4]}>
                <mesh>
                  <primitive object={SPEAR_BLADE_GEOMETRIES.blade} attach="geometry" />
                  <meshStandardMaterial 
                    color={spearColor}
                    emissive={spearColor}
                    emissiveIntensity={baseEmissiveIntensity}
                    metalness={0.8}
                    roughness={0.1}
                    opacity={opacity * 0.8}
                    transparent
                    side={DoubleSide}
                  />
                </mesh>
              </group>
            </group>

            <group rotation={[0, (4 * Math.PI) / 3, Math.PI/2]}>
              <group rotation={[0, 0, 5.33]} scale={[0.4, 0.4, -0.4]}>
                <mesh>
                  <primitive object={SPEAR_BLADE_GEOMETRIES.blade} attach="geometry" />
                  <meshStandardMaterial 
                    color={spearColor}
                    emissive={spearColor}
                    emissiveIntensity={baseEmissiveIntensity}
                    metalness={0.8}
                    roughness={0.1}
                    opacity={opacity * 0.8}
                    transparent
                    side={DoubleSide}
                  />
                </mesh>
              </group>
            </group>
          </group>

          {/* Inner blade component */}
          <group position={[0, 0.65, 0.35]} rotation={[0, -Math.PI / 2, Math.PI / 2]} scale={[0.8, 0.8, 0.5]}>
            <mesh>
              <primitive object={SPEAR_BLADE_GEOMETRIES.innerBlade} attach="geometry" />
              <meshStandardMaterial 
                color={spearColor}
                emissive={spearColor}
                emissiveIntensity={baseEmissiveIntensity}
                metalness={0.3}
                roughness={0.1}
                transparent
                opacity={opacity}
              />
            </mesh>
            
            <mesh>
              <primitive object={SPEAR_BLADE_GEOMETRIES.innerBlade} attach="geometry" />
              <meshStandardMaterial 
                color={spearColor}
                emissive={spearColor}
                emissiveIntensity={baseEmissiveIntensity * 0.7}
                metalness={0.2}
                roughness={0.1}
                opacity={opacity * 0.8}
                transparent
              />
            </mesh>
          </group>
        </group>
      </group>

      {/* Lightning trail effects - more intense with higher charge - FIXED: Use shared geometries */}
      {[...Array(TRAIL_COUNT)].map((_, index) => {
        const trailOpacity = opacity * (1 - index / TRAIL_COUNT) * 0.6;
        const trailScale = 1.25 - (index / TRAIL_COUNT) * 0.5;
        
        // Calculate trail offset in world space (behind the spear along its trajectory)
        // Use the direction vector to position trails behind the spear
        const trailOffset: [number, number, number] = [0, 0, -(index + 1) * 0.8 + 1]; // Behind the spear along Z axis
                
        return (
          <group
            key={`trail-${index}`}
            position={trailOffset} // Position behind the spear along its movement direction
          >
            {/* Lightning energy trail - FIXED: Use shared geometry */}
            <mesh scale={[trailScale, trailScale, trailScale]}>
              <primitive object={SPEAR_GEOMETRIES.trailSphere} />
              <meshStandardMaterial
                color={lightningColor}
                emissive={lightningColor}
                emissiveIntensity={chargeIntensity * 4 + 2}
                transparent
                opacity={trailOpacity}
                blending={AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
            
            {/* Outer energy glow - FIXED: Use shared geometry */}
            <mesh scale={[trailScale * 1.5, trailScale * 1.5, trailScale * 1.5]}>
              <primitive object={SPEAR_GEOMETRIES.trailGlow} />
              <meshStandardMaterial
                color={lightningColor}
                emissive={lightningColor}
                emissiveIntensity={chargeIntensity * 2 + 1}
                transparent
                opacity={trailOpacity * 0.5}
                blending={AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
      
      {/* Spinning energy rings around the spear - FIXED: Use shared geometries */}
      {[...Array(Math.floor(2 + chargeIntensity * 2))].map((_, i) => (
        <group key={`ring-${i}`} position={direction.clone().multiplyScalar(0.3 - i * 0.4)}>
          <mesh
            rotation={[0, 0, Date.now() * 0.01 + i * Math.PI / 3]}
          >
            <primitive object={SPEAR_RING_GEOMETRIES[Math.min(i, SPEAR_RING_GEOMETRIES.length - 1)]} />
            <meshStandardMaterial
              color={lightningColor}
              emissive={lightningColor}
              emissiveIntensity={baseEmissiveIntensity + chargeIntensity}
              transparent
              opacity={opacity * 0.7}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
