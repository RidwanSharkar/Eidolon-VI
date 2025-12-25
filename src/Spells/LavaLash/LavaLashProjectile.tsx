import { useRef, useEffect, useState, useMemo } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, Group, Mesh, SphereGeometry, TorusGeometry, MeshStandardMaterial } from 'three';
import LavaLashTrail from './LavaLashTrail';
import {
  SHARED_SPHERE_GEOMETRY_SPELL_MEDIUM,
  SHARED_SPHERE_GEOMETRY_SPELL_XL,
  SHARED_SPHERE_GEOMETRY_SPELL_XXL,
  SHARED_SPHERE_GEOMETRY_LOW,
  SHARED_TORUS_GEOMETRY_RING_016,
  SHARED_TORUS_GEOMETRY_SPELL_LARGE
} from '../../SharedGeometries';

// Pre-allocated color for performance - avoids new Color() on every render
const LAVA_TRAIL_COLOR = new Color("#FF4500");

// SHARED MATERIAL POOLS - prevents memory leaks from per-instance material creation
const LAVA_LASH_SHARED_MATERIALS = {
  core: new MeshStandardMaterial({
    color: "#FF6600",
    emissive: "#FF6600",
    emissiveIntensity: 3.0,
    transparent: true,
    opacity: 0.9
  }),
  innerCore: new MeshStandardMaterial({
    color: "#FFAA00",
    emissive: "#FFAA00",
    emissiveIntensity: 4.0,
    transparent: true,
    opacity: 0.8,
    blending: AdditiveBlending,
    depthWrite: false
  }),
  outerAura: new MeshStandardMaterial({
    color: "#FF4500",
    emissive: "#FF4500",
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.4,
    blending: AdditiveBlending,
    depthWrite: false
  }),
  ring: new MeshStandardMaterial({
    color: "#FF6600",
    emissive: "#FF6600",
    emissiveIntensity: 2.5,
    transparent: true,
    opacity: 0.7,
    blending: AdditiveBlending
  })
};

// Shared materials for impact effect
const LAVA_LASH_IMPACT_SHARED_MATERIALS = {
  mainExplosion: new MeshStandardMaterial({
    color: "#FF4500",
    emissive: "#FF4500",
    emissiveIntensity: 3.0,
    transparent: true,
    opacity: 0.8,
    blending: AdditiveBlending,
    depthWrite: false
  }),
  secondaryExplosion: new MeshStandardMaterial({
    color: "#FFAA00",
    emissive: "#FFAA00",
    emissiveIntensity: 4.0,
    transparent: true,
    opacity: 0.9,
    blending: AdditiveBlending,
    depthWrite: false
  }),
  spark: new MeshStandardMaterial({
    color: "#FF6600",
    emissive: "#FF6600",
    emissiveIntensity: 3,
    transparent: true,
    opacity: 0.9
  }),
  ring: new MeshStandardMaterial({
    color: "#FF4500",
    emissive: "#FF4500",
    emissiveIntensity: 2.5,
    transparent: true,
    opacity: 0.7,
    blending: AdditiveBlending
  })
};

// Use shared geometries for lava lash projectile - prevents memory leaks
const lavaLashGeometries = {
  core: SHARED_SPHERE_GEOMETRY_SPELL_MEDIUM, // Approximation of (0.25, 16, 16)
  innerCore: SHARED_SPHERE_GEOMETRY_SPELL_MEDIUM, // Approximation of (0.2, 12, 12)
  outerAura: SHARED_SPHERE_GEOMETRY_SPELL_MEDIUM, // Approximation of (0.35, 12, 12)
  ring0: SHARED_TORUS_GEOMETRY_RING_016, // Approximation of (0.375, 0.04, 6, 12)
  ring1: SHARED_TORUS_GEOMETRY_RING_016, // Approximation of (0.475, 0.04, 6, 12)
  // Impact geometries
  impactCore: SHARED_SPHERE_GEOMETRY_SPELL_XXL, // Approximation of (1.8, 16, 16)
  impactInner: SHARED_SPHERE_GEOMETRY_SPELL_XL, // Approximation of (1.0, 12, 12)
  impactSpark: SHARED_SPHERE_GEOMETRY_LOW, // Approximation of (0.08, 8, 8)
  impactRing0: SHARED_TORUS_GEOMETRY_SPELL_LARGE, // Approximation of (1.2, 0.08, 6, 16)
  impactRing1: SHARED_TORUS_GEOMETRY_SPELL_LARGE, // Approximation of (1.5, 0.08, 6, 16)
  impactRing2: SHARED_TORUS_GEOMETRY_SPELL_LARGE // Approximation of (1.8, 0.08, 6, 16)
};

// Note: lavaLashGeometries uses SHARED geometries from SharedGeometries.ts
// These should NOT be disposed as they are shared across the entire application

interface LavaLashProjectileProps {
  id: number;
  position: Vector3;
  direction: Vector3;
  startPosition?: Vector3;
  maxDistance?: number;
  opacity?: number;
  fadeStartTime?: number | null;
  hasCollided?: boolean;
  onImpact?: (position?: Vector3) => void;
  checkCollisions?: (projectileId: number, position: Vector3) => boolean;
}

export default function LavaLashProjectile({
  id, // eslint-disable-line @typescript-eslint/no-unused-vars
  position,
  direction,
  startPosition, // eslint-disable-line @typescript-eslint/no-unused-vars
  maxDistance = 15, // eslint-disable-line @typescript-eslint/no-unused-vars
  opacity: propOpacity = 1,
  fadeStartTime, // eslint-disable-line @typescript-eslint/no-unused-vars
  hasCollided: propHasCollided = false,
  onImpact,
  checkCollisions // eslint-disable-line @typescript-eslint/no-unused-vars
}: LavaLashProjectileProps) {
  const projectileRef = useRef<Group>(null);
  const projectileMeshRef = useRef<Mesh>(null);
  const hasCollided = useRef(propHasCollided);
  const [showImpact, ] = useState(false);
  const [impactPosition, ] = useState<Vector3 | null>(null);
  const [opacity, setOpacity] = useState(propOpacity); // Use prop opacity or default to 1.0

  // Note: Using shared geometries and materials - no resource management needed
  // Materials are now shared across all Lava Lash projectiles to prevent memory leaks

  // Initialize position on mount
  useEffect(() => {
    if (projectileRef.current) {
      projectileRef.current.position.copy(position);
    }
  }, [position]);

  // Update opacity from props when fading
  useEffect(() => {
    setOpacity(propOpacity);
  }, [propOpacity]);

  // Update position from props
  useFrame(() => {
    if (projectileRef.current) {
      projectileRef.current.position.copy(position);
    }
  });

  // Handle impact completion
  const handleImpactComplete = () => {
    setTimeout(() => {
      if (onImpact) {
        onImpact();
      }
    }, 300);
  };

  return (
    <group>
      {!hasCollided.current && (
        <>
          {/* Lava trail effect - completely outside the moving group to avoid coordinate conflicts */}
          <LavaLashTrail
            color={LAVA_TRAIL_COLOR} // Orange-red fire color
            size={0.205}
            meshRef={projectileRef}
            opacity={opacity * 0.9} // Apply dynamic opacity to trail
          />
          
          <group ref={projectileRef} position={position.toArray()}>
            <group
              rotation={[
                0,
                Math.atan2(direction.x, direction.z),
                0
              ]}
            >
            {/* Main fireball core */}
            <mesh
              ref={projectileMeshRef}
              geometry={lavaLashGeometries.core}
              material={LAVA_LASH_SHARED_MATERIALS.core}
            />

            {/* Inner fire core */}
            <mesh
              geometry={lavaLashGeometries.innerCore}
              material={LAVA_LASH_SHARED_MATERIALS.innerCore}
            />

            {/* Outer fire aura */}
            <mesh
              geometry={lavaLashGeometries.outerAura}
              material={LAVA_LASH_SHARED_MATERIALS.outerAura}
            />

            {/* Rotating fire rings for dynamic effect */}
            {[0, 1].map((i) => (
              <mesh
                key={`fire-ring-${i}`}
                rotation={[Math.PI/2, 0, Date.now() * 0.003 + i * Math.PI]}
                geometry={i === 0 ? lavaLashGeometries.ring0 : lavaLashGeometries.ring1}
                material={LAVA_LASH_SHARED_MATERIALS.ring}
              />
            ))}

            {/* Enhanced light source */}
            <pointLight
              color="#FF4500"
              intensity={5 * opacity}
              distance={8}
              decay={2}
            />
          </group>
        </group>
        </>
      )}

      {/* Impact effect */}
      {showImpact && impactPosition && (
        <LavaLashImpact 
          position={impactPosition}
          onComplete={handleImpactComplete}
        />
      )}
    </group>
  );
}

// Impact effect component
interface LavaLashImpactProps {
  position: Vector3;
  onComplete?: () => void;
}

function LavaLashImpact({ position, onComplete }: LavaLashImpactProps) {
  const startTime = useRef(Date.now());
  const [, forceUpdate] = useState({});
  const IMPACT_DURATION = 0.3; // Shorter duration for fire explosion

  // Note: Using shared materials for impact effects - no resource management needed

  // Pre-generate spark positions
  const sparkPositions = useMemo(() => {
    return Array(10).fill(null).map((_, i) => ({
      angle: (i / 10) * Math.PI * 2,
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
      yOffset: Math.random() * 0.5
    }));
  }, []);

  // Get frost ring geometry by index
  const getImpactRingGeometry = (i: number) => {
    switch (i) {
      case 0: return lavaLashGeometries.impactRing0;
      case 1: return lavaLashGeometries.impactRing1;
      case 2: return lavaLashGeometries.impactRing2;
      default: return lavaLashGeometries.impactRing0;
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});

      const elapsed = (Date.now() - startTime.current) / 1000;
      if (elapsed > IMPACT_DURATION) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 16);

    const timer = setTimeout(() => {
      clearInterval(interval);
      if (onComplete) onComplete();
    }, IMPACT_DURATION * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  const elapsed = (Date.now() - startTime.current) / 1000;
  const fade = Math.max(0, 1 - (elapsed / IMPACT_DURATION));

  if (fade <= 0) return null;

  // Update material opacities using shared materials
  LAVA_LASH_IMPACT_SHARED_MATERIALS.mainExplosion.opacity = 0.8 * fade;
  LAVA_LASH_IMPACT_SHARED_MATERIALS.mainExplosion.emissiveIntensity = 3.0 * fade;
  LAVA_LASH_IMPACT_SHARED_MATERIALS.secondaryExplosion.opacity = 0.9 * fade;
  LAVA_LASH_IMPACT_SHARED_MATERIALS.secondaryExplosion.emissiveIntensity = 4.0 * fade;
  LAVA_LASH_IMPACT_SHARED_MATERIALS.spark.opacity = 0.9 * fade;
  LAVA_LASH_IMPACT_SHARED_MATERIALS.spark.emissiveIntensity = 3 * fade;
  LAVA_LASH_IMPACT_SHARED_MATERIALS.ring.emissiveIntensity = 2.5 * fade;

  const mainScale = 1 + elapsed * 2.5;
  const innerScale = 1 + elapsed * 3.5;
  const ringScale = 1 + elapsed * 2.5;

  return (
    <group position={position}>
      {/* Main fire explosion effect */}
      <mesh
        geometry={lavaLashGeometries.impactCore}
        material={LAVA_LASH_IMPACT_SHARED_MATERIALS.mainExplosion}
        scale={[mainScale, mainScale, mainScale]}
      />

      {/* Secondary explosion ring */}
      <mesh
        geometry={lavaLashGeometries.impactInner}
        material={LAVA_LASH_IMPACT_SHARED_MATERIALS.secondaryExplosion}
        scale={[innerScale, innerScale, innerScale]}
      />

      {/* Fire sparks burst - using pre-generated positions */}
      {sparkPositions.map((spark, i) => {
        const radius = 1.5 * (1 + elapsed * 2.0);

        return (
          <mesh
            key={i}
            position={[
              Math.sin(spark.angle) * radius,
              Math.cos(spark.angle) * radius * 0.2 + spark.yOffset,
              Math.cos(spark.angle + Math.PI/3) * radius * 0.4
            ]}
            rotation={spark.rotation}
            geometry={lavaLashGeometries.impactSpark}
            material={LAVA_LASH_IMPACT_SHARED_MATERIALS.spark}
          />
        );
      })}

      {/* Expanding fire rings */}
      {[0, 1, 2].map((i) => {
        const opacity = 0.7 * fade * (1 - i * 0.2);
        return (
          <mesh
            key={`fire-explosion-ring-${i}`}
            rotation={[-Math.PI/2, 0, i * Math.PI/3]}
            geometry={getImpactRingGeometry(i)}
            scale={[ringScale, ringScale, ringScale]}
          material={LAVA_LASH_IMPACT_SHARED_MATERIALS.ring}
          />
        );
      })}

      {/* Enhanced bright flash */}
      <pointLight
        color="#FF4500"
        intensity={15 * fade}
        distance={10}
        decay={2}
      />
    </group>
  );
}
