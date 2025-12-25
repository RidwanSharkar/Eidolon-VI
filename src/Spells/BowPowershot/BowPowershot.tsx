// src/Spells/BowPowershot/BowPowershot.tsx
import React, { useRef, useMemo, useEffect } from 'react';
import { Vector3, Group, AdditiveBlending, CylinderGeometry, TorusGeometry, SphereGeometry, MeshStandardMaterial, Color } from 'three';
import { useFrame } from '@react-three/fiber';
import { WeaponSubclass } from '@/Weapons/weapons';

// =============================================================================
// SHARED GEOMETRIES - Created ONCE at module load to prevent memory leaks
// =============================================================================
const BOW_POWERSHOT_GEOMETRIES = {
  coreBeam: new CylinderGeometry(0.025, 0.025, 20, 8),
  coreBeamPerfect: new CylinderGeometry(0.035, 0.035, 20, 8),
  innerGlow: new CylinderGeometry(0.0625, 0.0625, 20, 8),
  innerGlowPerfect: new CylinderGeometry(0.08, 0.08, 20, 8),
  outerGlow: new CylinderGeometry(0.075, 0.075, 20, 8),
  outerGlowPerfect: new CylinderGeometry(0.095, 0.095, 20, 8),
  ringTorus: new TorusGeometry(0.4, 0.08, 6, 12),
  ringTorusInner: new TorusGeometry(0.3, 0.06, 6, 12),
  perfectShotSpark: new SphereGeometry(0.02, 4, 4),
  perfectShotAura: new CylinderGeometry(0.12, 0.12, 20, 8)
};

interface BowPowershotProps {
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
  subclass: WeaponSubclass;
  isElementalShotsUnlocked: boolean;
  isPerfectShot?: boolean;
}

const BowPowershot: React.FC<BowPowershotProps> = ({ 
  position, 
  direction, 
  onComplete, 
  subclass,
  isElementalShotsUnlocked,
  isPerfectShot = false
}) => {
  const groupRef = useRef<Group>(null);
  const startTimeRef = useRef(Date.now());
  const duration = isPerfectShot ? 200 : 166; // Perfect shots last slightly longer
  const fadeStartTime = useRef<number | null>(null);
  
  // Determine colors based on subclass and unlock status - memoized
  const colors = useMemo(() => {
    if (subclass === WeaponSubclass.VENOM) {
      return {
        core: new Color("#00ff40"),
        emissive: new Color("#00aa20"),
        outer: new Color("#00ff60")
      };
    } else if (subclass === WeaponSubclass.ELEMENTAL) {
      if (isElementalShotsUnlocked) {
        // Fire themed (red/orange)
        return {
          core: new Color("#ff4400"),
          emissive: new Color("#cc0000"), 
          outer: new Color("#ff6600")
        };
      } else {
        // Blue themed
        return {
          core: new Color("#0066ff"),
          emissive: new Color("#0044cc"),
          outer: new Color("#0088ff")
        };
      }
    }
    
    // Default fallback
    return {
      core: new Color("#ffffff"),
      emissive: new Color("#cccccc"),
      outer: new Color("#ffffff")
    };
  }, [subclass, isElementalShotsUnlocked]);

  // Memoize materials to prevent recreation on every render
  const materials = useMemo(() => ({
    coreBeam: new MeshStandardMaterial({
      color: colors.core,
      emissive: colors.emissive,
      emissiveIntensity: isPerfectShot ? 15 : 12,
      transparent: true,
      opacity: 0.95
    }),
    innerGlow: new MeshStandardMaterial({
      color: colors.core,
      emissive: colors.emissive,
      emissiveIntensity: isPerfectShot ? 10 : 8,
      transparent: true,
      opacity: 0.7
    }),
    outerGlow: new MeshStandardMaterial({
      color: colors.outer,
      emissive: colors.emissive,
      emissiveIntensity: isPerfectShot ? 6 : 4,
      transparent: true,
      opacity: 0.5
    }),
    ring: new MeshStandardMaterial({
      color: colors.outer,
      emissive: colors.emissive,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.4,
      blending: AdditiveBlending
    }),
    ringInner: new MeshStandardMaterial({
      color: colors.core,
      emissive: colors.emissive,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.3,
      blending: AdditiveBlending
    }),
    perfectSpark: new MeshStandardMaterial({
      color: new Color("#ffffff"),
      emissive: new Color("#ffffff"),
      emissiveIntensity: 8,
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending
    }),
    perfectAura: new MeshStandardMaterial({
      color: new Color("#ffffff"),
      emissive: new Color("#ffffff"),
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.3,
      blending: AdditiveBlending
    })
  }), [colors, isPerfectShot]);

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach(m => m.dispose());
    };
  }, [materials]);

  // Update material opacities in useFrame
  useFrame(() => {
    const elapsed = Date.now() - startTimeRef.current;
    
    if (elapsed >= duration && !fadeStartTime.current) {
      fadeStartTime.current = Date.now();
    }
    
    // Handle fade out
    if (fadeStartTime.current) {
      const fadeElapsed = Date.now() - fadeStartTime.current;
      const fadeDuration = 300; // 0.3 second fade
      
      if (fadeElapsed >= fadeDuration) {
        onComplete();
        return;
      }
      
      // Update material opacities during fade
      const currentFadeProgress = Math.max(0, 1 - fadeElapsed / fadeDuration);
      materials.coreBeam.opacity = 0.95 * currentFadeProgress;
      materials.innerGlow.opacity = 0.7 * currentFadeProgress;
      materials.outerGlow.opacity = 0.5 * currentFadeProgress;
      materials.coreBeam.emissiveIntensity = (isPerfectShot ? 15 : 12) * currentFadeProgress;
      materials.innerGlow.emissiveIntensity = (isPerfectShot ? 10 : 8) * currentFadeProgress;
      materials.outerGlow.emissiveIntensity = (isPerfectShot ? 6 : 4) * currentFadeProgress;
    }
  });

  const fadeProgress = fadeStartTime.current 
    ? Math.max(0, 1 - (Date.now() - fadeStartTime.current) / 300)
    : 1;

  // Pre-calculate ring count for render
  const ringCount = isPerfectShot ? 8 : 6;

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
        {/* Core beam - ultra thin, enhanced for perfect shots */}
        <mesh 
          rotation={[Math.PI / 2, 0, 0]} 
          position={[0, 0, 10]}
          geometry={isPerfectShot ? BOW_POWERSHOT_GEOMETRIES.coreBeamPerfect : BOW_POWERSHOT_GEOMETRIES.coreBeam}
          material={materials.coreBeam}
        />

        {/* Inner glow - enhanced for perfect shots */}
        <mesh 
          rotation={[Math.PI / 2, 0, 0]} 
          position={[0, 0, 10]}
          geometry={isPerfectShot ? BOW_POWERSHOT_GEOMETRIES.innerGlowPerfect : BOW_POWERSHOT_GEOMETRIES.innerGlow}
          material={materials.innerGlow}
        />

        {/* Outer glow - enhanced for perfect shots */}
        <mesh 
          rotation={[Math.PI / 2, 0, 0]} 
          position={[0, 0, 10]}
          geometry={isPerfectShot ? BOW_POWERSHOT_GEOMETRIES.outerGlowPerfect : BOW_POWERSHOT_GEOMETRIES.outerGlow}
          material={materials.outerGlow}
        />

        {/* Ring/swirl effects that last longer - more rings for perfect shots */}
        {[...Array(ringCount)].map((_, i) => {
          const ringProgress = Math.min(1, (Date.now() - startTimeRef.current) / 800);
          const ringFade = fadeStartTime.current 
            ? Math.max(0, 1 - (Date.now() - fadeStartTime.current) / 600)
            : 1;
          
          const offset = i * 3;
          const scale = 1 - (i * 0.1);
          
          // Update ring material opacity dynamically
          const ringOpacity = 0.4 * ringFade * (1 - ringProgress * 0.5);
          const innerRingOpacity = 0.3 * ringFade * (1 - ringProgress * 0.3);
          
          return (
            <group key={`ring-${i}`} position={[0, 0, offset]}>
              {/* Smoke ring effect */}
              <mesh
                rotation={[0, Date.now() * 0.002 + i, 0]}
                scale={[scale, scale, scale]}
                geometry={BOW_POWERSHOT_GEOMETRIES.ringTorus}
              >
                <meshStandardMaterial
                  color={colors.outer}
                  emissive={colors.emissive}
                  emissiveIntensity={2 * ringFade}
                  transparent
                  opacity={ringOpacity}
                  blending={AdditiveBlending}
                />
              </mesh>
              
              {/* Secondary swirl */}
              <mesh
                rotation={[Math.PI/2, Date.now() * -0.003 + i, 0]}
                scale={[scale * 0.7, scale * 0.7, scale * 0.7]}
                geometry={BOW_POWERSHOT_GEOMETRIES.ringTorusInner}
              >
                <meshStandardMaterial
                  color={colors.core}
                  emissive={colors.emissive}
                  emissiveIntensity={1.5 * ringFade}
                  transparent
                  opacity={innerRingOpacity}
                  blending={AdditiveBlending}
                />
              </mesh>
            </group>
          );
        })}

        {/* Point light for illumination - brighter for perfect shots */}
        <pointLight
          color={colors.core}
          intensity={(isPerfectShot ? 20 : 15) * fadeProgress}
          distance={isPerfectShot ? 10 : 8}
          decay={2}
          position={[0, 0, 10]}
        />

        {/* Additional perfect shot effects */}
        {isPerfectShot && (
          <>
            {/* Lightning-like crackling effect around perfect shots */}
            {[...Array(4)].map((_, i) => {
              const angle = (i / 4) * Math.PI * 2;
              const radius = 0.15;
              return (
                <group key={`lightning-${i}`} position={[
                  Math.sin(angle + Date.now() * 0.01) * radius,
                  Math.cos(angle + Date.now() * 0.01) * radius,
                  10 + Math.sin(Date.now() * 0.005 + i) * 2
                ]}>
                  <mesh
                    geometry={BOW_POWERSHOT_GEOMETRIES.perfectShotSpark}
                    material={materials.perfectSpark}
                  />
                </group>
              );
            })}
            
            {/* Perfect shot aura */}
            <mesh 
              rotation={[Math.PI / 2, 0, 0]} 
              position={[0, 0, 10]}
              geometry={BOW_POWERSHOT_GEOMETRIES.perfectShotAura}
              material={materials.perfectAura}
            />
          </>
        )}
      </group>
    </group>
  );
};

export default BowPowershot;
