import { useRef, useEffect, useState, useMemo } from 'react';
import { Group, Vector3, CylinderGeometry, OctahedronGeometry, TorusGeometry, SphereGeometry, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';

// Shared geometries for FrozenEffect - prevents memory leaks
const FROZEN_EFFECT_GEOMETRIES = {
  base: new CylinderGeometry(0.8, 0.9, 0.5, 8),
  mainCrystal: new OctahedronGeometry(0.9, 0),
  shard: new OctahedronGeometry(0.25, 0),
  particle: new OctahedronGeometry(0.08, 0), // Average size for particles
  ring0: new TorusGeometry(0.6, 0.05, 8, 32),
  ring1: new TorusGeometry(0.85, 0.05, 8, 32),
  ring2: new TorusGeometry(1.1, 0.05, 8, 32),
  glow: new SphereGeometry(1.0, 16, 16)
};

interface FrozenEffectProps {
  position: Vector3;
  duration?: number;
  startTime?: number;
  enemyId?: string;
  onComplete?: () => void;
  enemyData?: Array<{
    id: string;
    position: Vector3;
    health: number;
    isDying?: boolean;
    deathStartTime?: number;
  }>;
}

export default function FrozenEffect({ 
  position, 
  duration = 4000, 
  startTime = Date.now(),
  enemyId,
  enemyData = [],
  onComplete 
}: FrozenEffectProps) {
  const effectRef = useRef<Group>(null);
  const [intensity, setIntensity] = useState(1);
  const [fadeProgress, setFadeProgress] = useState(1);
  const rotationSpeed = useRef(Math.random() * 0.02 + 0.01);

  // Pre-generate particle positions once to avoid memory allocation on render
  const particlePositions = useMemo(() => 
    [...Array(12)].map(() => ({
      pos: [
        (Math.random() - 0.5) * 2,
        Math.random() * 2.5 - 0.2,
        (Math.random() - 0.5) * 2
      ] as [number, number, number],
      rot: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ] as [number, number, number]
    })), []);

  // Memoized materials to prevent recreation on every render
  const materials = useMemo(() => ({
    base: new MeshStandardMaterial({
      color: "#B3E5FC",
      emissive: "#81D4FA",
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.2
    }),
    mainCrystal: new MeshStandardMaterial({
      color: "#E1F5FE",
      emissive: "#4FC3F7",
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
      roughness: 0.05,
      metalness: 0.1
    }),
    shard: new MeshStandardMaterial({
      color: "#B3E5FC",
      emissive: "#29B6F6",
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.15
    }),
    particle: new MeshStandardMaterial({
      color: "#E1F5FE",
      emissive: "#4FC3F7",
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.4
    }),
    ring: new MeshStandardMaterial({
      color: "#B3E5FC",
      emissive: "#29B6F6",
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1,
      metalness: 0.2
    }),
    glow: new MeshStandardMaterial({
      color: "#E1F5FE",
      emissive: "#4FC3F7",
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.4
    })
  }), []);

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach(mat => mat.dispose());
    };
  }, [materials]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timeout);
  }, [duration, onComplete]);

  useFrame(() => {
    if (!effectRef.current) return;

    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Update position to follow enemy if enemyId is provided
    if (enemyId && enemyData.length > 0) {
      const target = enemyData.find(enemy => enemy.id === enemyId);
      
      if (target && target.health > 0 && !target.isDying && !target.deathStartTime) {
        // Update the group position to follow the enemy
        const targetPosition = target.position.clone();
        targetPosition.y += 1; // Keep the same Y offset as originally set
        effectRef.current.position.copy(targetPosition);
      }
    }

    // Fade out in the last 500ms
    if (progress > 0.875) {
      const fadeStart = 0.875;
      const fadeProgress = (progress - fadeStart) / (1 - fadeStart);
      setFadeProgress(1 - fadeProgress);
    } else {
      setFadeProgress(1);
    }

    // Pulsing intensity effect
    const pulseIntensity = 0.8 + 0.2 * Math.sin(elapsed * 0.005);
    setIntensity(pulseIntensity * fadeProgress);

    // Update material properties based on intensity and fade
    materials.base.emissiveIntensity = 0.3 * intensity;
    materials.base.opacity = 0.7 * fadeProgress;
    materials.mainCrystal.emissiveIntensity = 0.5 * intensity;
    materials.mainCrystal.opacity = 0.8 * fadeProgress;
    materials.shard.emissiveIntensity = 0.4 * intensity;
    materials.shard.opacity = 0.6 * fadeProgress;
    materials.particle.emissiveIntensity = 0.8 * intensity;
    materials.particle.opacity = 0.4 * fadeProgress;
    materials.ring.emissiveIntensity = 0.6 * intensity;
    materials.ring.opacity = 0.5 * fadeProgress;
    materials.glow.emissiveIntensity = 0.2 * intensity;
    materials.glow.opacity = 0.4 * fadeProgress;

    // Rotate the ice crystal
    effectRef.current.rotation.y += rotationSpeed.current;
    effectRef.current.rotation.x = Math.sin(elapsed * 0.003) * 0.1;
  });

  return (
    <group ref={effectRef} position={position}>
      {/* Ice prison base */}
      <mesh position={[0, -0.6, 0]} geometry={FROZEN_EFFECT_GEOMETRIES.base} material={materials.base} />

      {/* Main ice crystal */}
      <mesh position={[0, 0.95, 0]} geometry={FROZEN_EFFECT_GEOMETRIES.mainCrystal} material={materials.mainCrystal} />

      {/* Ice shards around the crystal */}
      {[...Array(6)].map((_, i) => (
        <group
          key={i}
          rotation={[0, (i * Math.PI) / 3, 0]}
          position={[
            Math.cos((i * Math.PI) / 3) * 0.7,
            -0.2 + Math.sin(i) * 0.3,
            Math.sin((i * Math.PI) / 3) * 0.7
          ]}
        >
          <mesh 
            rotation={[Math.PI / 6, 0, Math.PI / 4]} 
            geometry={FROZEN_EFFECT_GEOMETRIES.shard} 
            material={materials.shard} 
          />
        </group>
      ))}

      {/* Ice particles - using pre-generated positions */}
      {particlePositions.map((particle, i) => (
        <mesh
          key={`particle-${i}`}
          position={particle.pos}
          rotation={particle.rot}
          geometry={FROZEN_EFFECT_GEOMETRIES.particle}
          material={materials.particle}
        />
      ))}

      {/* Frost rings - using shared geometries */}
      <mesh 
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={FROZEN_EFFECT_GEOMETRIES.ring0}
        material={materials.ring}
      />
      <mesh 
        position={[0, 0.2, 0]}
        rotation={[Math.PI / 2, 0, Math.PI / 4]}
        geometry={FROZEN_EFFECT_GEOMETRIES.ring1}
        material={materials.ring}
      />
      <mesh 
        position={[0, 0.4, 0]}
        rotation={[Math.PI / 2, 0, Math.PI / 2]}
        geometry={FROZEN_EFFECT_GEOMETRIES.ring2}
        material={materials.ring}
      />

      {/* Ice glow effect */}
      <mesh geometry={FROZEN_EFFECT_GEOMETRIES.glow} material={materials.glow} />

      {/* Point light for ice glow */}
      <pointLight 
        color="#4FC3F7" 
        intensity={3 * intensity * fadeProgress} 
        distance={6} 
        position={[0, 1, 0]}
      />
    </group>
  );
}