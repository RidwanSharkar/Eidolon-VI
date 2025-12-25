import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, AdditiveBlending, CylinderGeometry, ConeGeometry, TorusGeometry, SphereGeometry, MeshStandardMaterial } from 'three';

// Shared geometries - created once at module level for all instances
const VIPER_STING_GEOMETRIES = {
  body: new CylinderGeometry(0.04, 0.15, 2.5, 8),
  arrowHead: new ConeGeometry(0.15, 0.6, 6),
  ringOuter: new TorusGeometry(0.15, 0.02, 6, 12),
  ringInner: new TorusGeometry(0.20, 0.02, 6, 12),
  core: new SphereGeometry(0.08, 8, 8),
  trailInner: new SphereGeometry(0.15, 8, 8),
  trailOuter: new SphereGeometry(0.2, 6, 6),
};

interface ViperStingProjectile {
  id: number;
  position: Vector3;
  direction: Vector3;
  startPosition: Vector3;
  maxDistance: number;
  active: boolean;
  startTime: number;
  hitEnemies: Set<string>;
  opacity: number;
  fadeStartTime: number | null;
  isReturning: boolean;
  returnHitEnemies: Set<string>;
}

interface ViperStingProps {
  projectilePool: React.MutableRefObject<ViperStingProjectile[]>;
}

const ViperStingProjectileVisual: React.FC<{ projectile: ViperStingProjectile }> = ({ projectile }) => {
  const groupRef = useRef<Group>(null);
  const TRAIL_COUNT = 8;

  // Memoized materials - created once per component instance
  const materials = useMemo(() => ({
    body: new MeshStandardMaterial({
      color: "#8B3F9B",
      emissive: "#5A2B5F",
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 1,
    }),
    arrowHead: new MeshStandardMaterial({
      color: "#A855C7",
      emissive: "#7E3A9F",
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 1,
    }),
    ring: new MeshStandardMaterial({
      color: "#A855C7",
      emissive: "#A855C7",
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.7,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    core: new MeshStandardMaterial({
      color: "#C084FC",
      emissive: "#A855C7",
      emissiveIntensity: 3,
      transparent: true,
      opacity: 1,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    trailInner: new MeshStandardMaterial({
      color: "#A855C7",
      emissive: "#A855C7",
      emissiveIntensity: 6,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    trailOuter: new MeshStandardMaterial({
      color: "#C084FC",
      emissive: "#C084FC",
      emissiveIntensity: 3,
      transparent: true,
      opacity: 0.3,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  }), []);

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach(mat => mat.dispose());
    };
  }, [materials]);

  useFrame(() => {
    if (!groupRef.current) return;

    // Update position
    groupRef.current.position.copy(projectile.position);

    // Calculate rotation based on direction (similar to ThrowSpear)
    const lookDirection = projectile.direction.clone().normalize();
    const rotationY = Math.atan2(lookDirection.x, lookDirection.z);
    const rotationX = Math.atan2(-lookDirection.y, Math.sqrt(lookDirection.x * lookDirection.x + lookDirection.z * lookDirection.z));
    
    // Apply rotation
    groupRef.current.rotation.set(rotationX, rotationY, 0);

    // Update material opacities based on projectile opacity
    materials.body.opacity = projectile.opacity;
    materials.arrowHead.opacity = projectile.opacity;
    materials.ring.opacity = projectile.opacity * 0.7;
    materials.core.opacity = projectile.opacity;
  });

  if (!projectile.active) return null;

  return (
    <group ref={groupRef}>
      {/* Main projectile body - sleek venomous arrow */}
      <mesh 
        rotation={[Math.PI / 2, 0, 0]}
        geometry={VIPER_STING_GEOMETRIES.body}
        material={materials.body}
      />

      {/* Arrowhead */}
      <mesh 
        position={[0, 0, 1.25]} 
        rotation={[Math.PI / 2, 0, 0]}
        geometry={VIPER_STING_GEOMETRIES.arrowHead}
        material={materials.arrowHead}
      />

      {/* Spinning venom energy rings around the projectile - ThrowSpear style */}
      {[...Array(2)].map((_, i) => (
        <group key={`ring-${i}`} position={[0, 0, 0.3 - i * 0.4] as [number, number, number]}>
          <mesh
            rotation={[0, 0, Date.now() * 0.01 + i * Math.PI / 3]}
            geometry={i === 0 ? VIPER_STING_GEOMETRIES.ringOuter : VIPER_STING_GEOMETRIES.ringInner}
            material={materials.ring}
          />
        </group>
      ))}

      {/* Venom energy core */}
      <mesh
        geometry={VIPER_STING_GEOMETRIES.core}
        material={materials.core}
      />

      {/* Venom trail effects - ThrowSpear style with purple colors */}
      {[...Array(TRAIL_COUNT)].map((_, index) => {
        const trailOpacity = projectile.opacity * (1 - index / TRAIL_COUNT) * 0.6;
        const trailScale = 1 - (index / TRAIL_COUNT) * 0.5;
        
        // Position trails behind the projectile tip in the projectile's local coordinate system
        // The projectile's forward direction is along the positive Z axis in its local space
        const trailOffset: [number, number, number] = [0, 0, -(index + 1) * 0.8]; // Behind the projectile along Z axis
        
        // Clone materials with adjusted opacity for each trail segment
        // Using inline material here with low geometry reuse is acceptable for trails
        return (
          <group
            key={`trail-${index}`}
            position={trailOffset}
          >
            {/* Venom energy trail */}
            <mesh 
              scale={[trailScale, trailScale, trailScale]}
              geometry={VIPER_STING_GEOMETRIES.trailInner}
            >
              <meshStandardMaterial
                color="#A855C7"
                emissive="#A855C7"
                emissiveIntensity={6}
                transparent
                opacity={trailOpacity}
                blending={AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
            
            {/* Outer venom glow */}
            <mesh 
              scale={[trailScale * 1.5, trailScale * 1.5, trailScale * 1.5]}
              geometry={VIPER_STING_GEOMETRIES.trailOuter}
            >
              <meshStandardMaterial
                color="#C084FC"
                emissive="#C084FC"
                emissiveIntensity={3}
                transparent
                opacity={trailOpacity * 0.5}
                blending={AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}

      {/* Point light for glow effect */}
      <pointLight
        color="#A855C7"
        intensity={2 * projectile.opacity}
        distance={4}
        decay={2}
      />
    </group>
  );
};

export default function ViperSting({ projectilePool }: ViperStingProps) {
  return (
    <>
      {projectilePool.current
        .filter(projectile => projectile.active)
        .map(projectile => (
          <ViperStingProjectileVisual
            key={`viper-sting-${projectile.id}`}
            projectile={projectile}
          />
        ))}
    </>
  );
}