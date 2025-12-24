import { useRef, useEffect, useState, useMemo } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, Group, Mesh, SphereGeometry, TorusGeometry, MeshStandardMaterial } from 'three';
import LavaLashTrail from './LavaLashTrail';

// Pre-allocated color for performance - avoids new Color() on every render
const LAVA_TRAIL_COLOR = new Color("#FF4500");

// Shared geometries for lava lash projectile - avoid per-render allocations
const lavaLashGeometries = {
  core: new SphereGeometry(0.25, 16, 16),
  innerCore: new SphereGeometry(0.2, 12, 12),
  outerAura: new SphereGeometry(0.35, 12, 12),
  ring0: new TorusGeometry(0.375, 0.04, 6, 12),
  ring1: new TorusGeometry(0.475, 0.04, 6, 12),
  // Impact geometries
  impactCore: new SphereGeometry(1.8, 16, 16),
  impactInner: new SphereGeometry(1.0, 12, 12),
  impactSpark: new SphereGeometry(0.08, 8, 8),
  impactRing0: new TorusGeometry(1.2, 0.08, 6, 16),
  impactRing1: new TorusGeometry(1.5, 0.08, 6, 16),
  impactRing2: new TorusGeometry(1.8, 0.08, 6, 16)
};

let lavaLashResourceUsers = 0;

const disposeLavaLashResources = () => {
  Object.values(lavaLashGeometries).forEach(geo => geo.dispose());
};

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

  // Resource management
  useEffect(() => {
    lavaLashResourceUsers += 1;
    return () => {
      lavaLashResourceUsers = Math.max(0, lavaLashResourceUsers - 1);
      if (lavaLashResourceUsers === 0) {
        disposeLavaLashResources();
      }
    };
  }, []);

  // Shared materials - memoized to avoid recreation
  const materials = useMemo(() => ({
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
  }), []);

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach(mat => mat.dispose());
    };
  }, [materials]);

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
              material={materials.core}
            />

            {/* Inner fire core */}
            <mesh
              geometry={lavaLashGeometries.innerCore}
              material={materials.innerCore}
            />

            {/* Outer fire aura */}
            <mesh
              geometry={lavaLashGeometries.outerAura}
              material={materials.outerAura}
            />

            {/* Rotating fire rings for dynamic effect */}
            {[0, 1].map((i) => (
              <mesh
                key={`fire-ring-${i}`}
                rotation={[Math.PI/2, 0, Date.now() * 0.003 + i * Math.PI]}
                geometry={i === 0 ? lavaLashGeometries.ring0 : lavaLashGeometries.ring1}
              >
                <meshStandardMaterial
                  color="#FF6600"
                  emissive="#FF6600"
                  emissiveIntensity={2.5 * opacity}
                  transparent
                  opacity={(0.7 - i * 0.2) * opacity}
                  blending={AdditiveBlending}
                />
              </mesh>
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

  // Shared materials for impact - memoized
  const impactMaterials = useMemo(() => ({
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
  }), []);

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(impactMaterials).forEach(mat => mat.dispose());
    };
  }, [impactMaterials]);

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

  // Update material opacities
  impactMaterials.mainExplosion.opacity = 0.8 * fade;
  impactMaterials.mainExplosion.emissiveIntensity = 3.0 * fade;
  impactMaterials.secondaryExplosion.opacity = 0.9 * fade;
  impactMaterials.secondaryExplosion.emissiveIntensity = 4.0 * fade;
  impactMaterials.spark.opacity = 0.9 * fade;
  impactMaterials.spark.emissiveIntensity = 3 * fade;
  impactMaterials.ring.emissiveIntensity = 2.5 * fade;

  const mainScale = 1 + elapsed * 2.5;
  const innerScale = 1 + elapsed * 3.5;
  const ringScale = 1 + elapsed * 2.5;

  return (
    <group position={position}>
      {/* Main fire explosion effect */}
      <mesh
        geometry={lavaLashGeometries.impactCore}
        material={impactMaterials.mainExplosion}
        scale={[mainScale, mainScale, mainScale]}
      />

      {/* Secondary explosion ring */}
      <mesh
        geometry={lavaLashGeometries.impactInner}
        material={impactMaterials.secondaryExplosion}
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
            material={impactMaterials.spark}
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
          >
            <meshStandardMaterial
              color="#FF4500"
              emissive="#FF4500"
              emissiveIntensity={2.5 * fade}
              transparent
              opacity={opacity}
              blending={AdditiveBlending}
            />
          </mesh>
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
