// src/Spells/ViperSting/ViperStingBeam.tsx
import React, { useRef, useMemo, useEffect } from 'react';
import { Vector3, Group, AdditiveBlending, CylinderGeometry, TorusGeometry, SphereGeometry, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';

// Shared geometries - created once at module level for all instances
const VIPER_BEAM_GEOMETRIES = {
  coreBeam: new CylinderGeometry(0.03, 0.03, 20, 8),
  innerGlow: new CylinderGeometry(0.07, 0.07, 20, 8),
  outerGlow: new CylinderGeometry(0.09, 0.09, 20, 8),
  ringOuter: new TorusGeometry(0.35, 0.07, 6, 12),
  ringInner: new TorusGeometry(0.28, 0.05, 6, 12),
  particle: new SphereGeometry(0.025, 4, 4),
  soulParticle: new SphereGeometry(0.03, 4, 4),
  soulAura: new CylinderGeometry(0.15, 0.15, 20, 8),
};

interface ViperStingBeamProps {
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
  isReturning?: boolean;
}

const ViperStingBeam: React.FC<ViperStingBeamProps> = ({ 
  position, 
  direction, 
  onComplete,
  isReturning = false
}) => {
  const groupRef = useRef<Group>(null);
  const startTimeRef = useRef(Date.now());
  const duration = 200; // Slightly longer than bow powershot
  const fadeStartTime = useRef<number | null>(null);
  
  // Purple venom theme colors
  const colors = {
    core: "#8B3F9B",      // Dark purple
    emissive: "#A855C7",   // Medium purple
    outer: "#C084FC"       // Light purple
  };

  // Memoized materials - created once per component instance
  const materials = useMemo(() => ({
    coreBeam: new MeshStandardMaterial({
      color: colors.core,
      emissive: colors.emissive,
      emissiveIntensity: 14,
      transparent: true,
      opacity: 0.95,
    }),
    innerGlow: new MeshStandardMaterial({
      color: colors.emissive,
      emissive: colors.emissive,
      emissiveIntensity: 9,
      transparent: true,
      opacity: 0.7,
    }),
    outerGlow: new MeshStandardMaterial({
      color: colors.outer,
      emissive: colors.core,
      emissiveIntensity: 5,
      transparent: true,
      opacity: 0.5,
    }),
    soulAura: new MeshStandardMaterial({
      color: "#E879F9",
      emissive: "#E879F9",
      emissiveIntensity: 3,
      transparent: true,
      opacity: 0.4,
      blending: AdditiveBlending,
    }),
  }), [colors.core, colors.emissive, colors.outer]);

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach(mat => mat.dispose());
    };
  }, [materials]);
  
  useFrame(() => {
    const elapsed = Date.now() - startTimeRef.current;
    
    if (elapsed >= duration && !fadeStartTime.current) {
      fadeStartTime.current = Date.now();
    }
    
    // Handle fade out
    if (fadeStartTime.current) {
      const fadeElapsed = Date.now() - fadeStartTime.current;
      const fadeDuration = 250; // Slightly longer fade for venom effect
      
      if (fadeElapsed >= fadeDuration) {
        onComplete();
        return;
      }

      // Update material opacities during fade
      const currentFadeProgress = Math.max(0, 1 - fadeElapsed / 350);
      materials.coreBeam.opacity = 0.95 * currentFadeProgress;
      materials.coreBeam.emissiveIntensity = 14 * currentFadeProgress;
      materials.innerGlow.opacity = 0.7 * currentFadeProgress;
      materials.innerGlow.emissiveIntensity = 9 * currentFadeProgress;
      materials.outerGlow.opacity = 0.5 * currentFadeProgress;
      materials.outerGlow.emissiveIntensity = 5 * currentFadeProgress;
      materials.soulAura.opacity = 0.4 * currentFadeProgress;
      materials.soulAura.emissiveIntensity = 3 * currentFadeProgress;
    }
  });

  const fadeProgress = fadeStartTime.current 
    ? Math.max(0, 1 - (Date.now() - fadeStartTime.current) / 350)
    : 1;

  return (
    <group ref={groupRef} position={position.toArray()}>
      {/* Main beam trail - very thin like firebeam but 1/4 diameter */}
      <group
        rotation={[
          0,
          Math.atan2(direction.x, direction.z),
          0
        ]}
      >
        {/* Core beam - ultra thin with venom glow */}
        <mesh 
          rotation={[Math.PI / 2, 0, 0]} 
          position={[0, 0, 10]}
          geometry={VIPER_BEAM_GEOMETRIES.coreBeam}
          material={materials.coreBeam}
        />

        {/* Inner glow - venomous aura */}
        <mesh 
          rotation={[Math.PI / 2, 0, 0]} 
          position={[0, 0, 10]}
          geometry={VIPER_BEAM_GEOMETRIES.innerGlow}
          material={materials.innerGlow}
        />

        {/* Outer glow - toxic mist */}
        <mesh 
          rotation={[Math.PI / 2, 0, 0]} 
          position={[0, 0, 10]}
          geometry={VIPER_BEAM_GEOMETRIES.outerGlow}
          material={materials.outerGlow}
        />

        {/* Venom ring/swirl effects that last longer */}
        {[...Array(7)].map((_, i) => {
          const ringProgress = Math.min(1, (Date.now() - startTimeRef.current) / 900); // Slower fade for venom rings
          const ringFade = fadeStartTime.current 
            ? Math.max(0, 1 - (Date.now() - fadeStartTime.current) / 700) // Longer fade for rings
            : 1;
          
          const offset = i * 2.8;
          const scale = 1 - (i * 0.08);
          const outerRingOpacity = 0.45 * ringFade * (1 - ringProgress * 0.4);
          const innerRingOpacity = 0.35 * ringFade * (1 - ringProgress * 0.25);
          
          return (
            <group key={`ring-${i}`} position={[0, 0, offset]}>
              {/* Venom smoke ring effect */}
              <mesh
                rotation={[0, Date.now() * 0.0025 + i, 0]}
                scale={[scale, scale, scale]}
                geometry={VIPER_BEAM_GEOMETRIES.ringOuter}
              >
                <meshStandardMaterial
                  color={colors.outer}
                  emissive={colors.emissive}
                  emissiveIntensity={2.5 * ringFade}
                  transparent
                  opacity={outerRingOpacity}
                  blending={AdditiveBlending}
                />
              </mesh>
              
              {/* Secondary venom swirl */}
              <mesh
                rotation={[Math.PI/2, Date.now() * -0.0035 + i, 0]}
                scale={[scale * 0.75, scale * 0.75, scale * 0.75]}
                geometry={VIPER_BEAM_GEOMETRIES.ringInner}
              >
                <meshStandardMaterial
                  color={colors.core}
                  emissive={colors.emissive}
                  emissiveIntensity={1.8 * ringFade}
                  transparent
                  opacity={innerRingOpacity}
                  blending={AdditiveBlending}
                />
              </mesh>
            </group>
          );
        })}

        {/* Venom particles floating around the beam */}
        {[...Array(6)].map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const radius = 0.12;
          const floatOffset = Math.sin(Date.now() * 0.003 + i) * 0.05;
          return (
            <group key={`venom-particle-${i}`} position={[
              Math.sin(angle + Date.now() * 0.002) * radius,
              Math.cos(angle + Date.now() * 0.002) * radius + floatOffset,
              8 + Math.sin(Date.now() * 0.004 + i) * 3
            ]}>
              <mesh geometry={VIPER_BEAM_GEOMETRIES.particle}>
                <meshStandardMaterial
                  color={colors.outer}
                  emissive={colors.outer}
                  emissiveIntensity={6 * fadeProgress}
                  transparent
                  opacity={0.7 * fadeProgress}
                  blending={AdditiveBlending}
                />
              </mesh>
            </group>
          );
        })}

        {/* Point light for illumination - purple venom glow */}
        <pointLight
          color={colors.emissive}
          intensity={18 * fadeProgress}
          distance={9}
          decay={2}
          position={[0, 0, 10]}
        />

        {/* Additional returning shot effects */}
        {isReturning && (
          <>
            {/* Soul energy crackling effect for returning shots */}
            {[...Array(5)].map((_, i) => {
              const angle = (i / 5) * Math.PI * 2;
              const radius = 0.18;
              return (
                <group key={`soul-energy-${i}`} position={[
                  Math.sin(angle + Date.now() * 0.012) * radius,
                  Math.cos(angle + Date.now() * 0.012) * radius,
                  10 + Math.sin(Date.now() * 0.006 + i) * 2.5
                ]}>
                  <mesh geometry={VIPER_BEAM_GEOMETRIES.soulParticle}>
                    <meshStandardMaterial
                      color="#E879F9"
                      emissive="#E879F9"
                      emissiveIntensity={10 * fadeProgress}
                      transparent
                      opacity={0.9 * fadeProgress}
                      blending={AdditiveBlending}
                    />
                  </mesh>
                </group>
              );
            })}
            
            {/* Soul steal aura for returning shots */}
            <mesh 
              rotation={[Math.PI / 2, 0, 0]} 
              position={[0, 0, 10]}
              geometry={VIPER_BEAM_GEOMETRIES.soulAura}
              material={materials.soulAura}
            />
          </>
        )}
      </group>
    </group>
  );
};

export default ViperStingBeam;
