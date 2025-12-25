import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, SphereGeometry, TorusGeometry, MeshStandardMaterial, MeshBasicMaterial } from 'three';
import { AdditiveBlending, Material, Object3D } from 'three';

// Shared geometries - created once at module level for all instances
const SOUL_STEAL_GEOMETRIES = {
  core: new SphereGeometry(0.15, 8, 8),
  outerShell: new SphereGeometry(0.25, 6, 6),
  ringSmall: new TorusGeometry(0.18, 0.02, 4, 8),
  ringLarge: new TorusGeometry(0.23, 0.02, 4, 8),
  particle: new SphereGeometry(0.02, 4, 4),
};

interface SoulStealEffectProps {
  id: number;
  startPosition: Vector3;
  targetPosition: Vector3;
  startTime: number;
  duration: number;
  onComplete?: () => void;
  getCurrentPlayerPosition?: () => Vector3; // Optional dynamic player position
}

export default function SoulStealEffect({
  id: _id, // eslint-disable-line @typescript-eslint/no-unused-vars
  startPosition,
  targetPosition,
  startTime,
  duration,
  onComplete,
  getCurrentPlayerPosition
}: SoulStealEffectProps) {
  const groupRef = useRef<Group>(null);
  const trailsRef = useRef<Group[]>([]);
  const TRAIL_COUNT = 6;
  const trailPositions = useRef<Vector3[]>([]);

  // Memoized materials - created once per component instance
  const materials = useMemo(() => ({
    core: new MeshStandardMaterial({
      color: "#C084FC",
      emissive: "#A855C7",
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.9,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    outerShell: new MeshBasicMaterial({
      color: "#8B3F9B",
      transparent: true,
      opacity: 0.3,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    ring: new MeshBasicMaterial({
      color: "#C084FC",
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    ringSecond: new MeshBasicMaterial({
      color: "#C084FC",
      transparent: true,
      opacity: 0.4,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    particle: new MeshBasicMaterial({
      color: "#C084FC",
      transparent: true,
      opacity: 0.5,
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

    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    if (progress >= 1) {
      if (onComplete) onComplete();
      return;
    }

    // Get current target position (dynamic player position if available)
    const currentTarget = getCurrentPlayerPosition ? getCurrentPlayerPosition() : targetPosition;
    
    // Calculate current position along the path with smooth movement
    const currentPosition = new Vector3().lerpVectors(startPosition, currentTarget, progress);
    
    // Add subtle organic floating motion (much smaller amplitude)
    const floatX = Math.sin(elapsed * 0.008) * 0.05; // Reduced from 0.2 to 0.05
    const floatY = Math.sin(elapsed * 0.006 + Math.PI / 3) * 0.03 + 0.1; // Reduced and less upward bias
    const floatZ = Math.cos(elapsed * 0.007) * 0.05; // Reduced from 0.2 to 0.05
    
    currentPosition.add(new Vector3(floatX, floatY, floatZ));
    groupRef.current.position.copy(currentPosition);

    // Update trail positions
    trailPositions.current.unshift(currentPosition.clone());
    if (trailPositions.current.length > TRAIL_COUNT) {
      trailPositions.current.pop();
    }

    // Update trail visuals
    trailsRef.current.forEach((trail, index) => {
      if (trail && trailPositions.current[index]) {
        const trailPos = trailPositions.current[index];
        trail.position.copy(trailPos);
        
        // Scale and opacity based on trail position and overall progress
        const trailOpacity = (1 - index / TRAIL_COUNT) * (1 - progress * 0.5);
        const scale = 0.8 - (index / TRAIL_COUNT) * 0.4;
        
        trail.scale.setScalar(scale);
        
        // Update material opacity
        trail.children.forEach((child: Object3D) => {
          if ('material' in child && child.material) {
            (child.material as Material).opacity = Math.max(0, trailOpacity);
          }
        });
      }
    });

    // Gentle rotation for organic motion (reduced intensity)
    groupRef.current.rotation.y = elapsed * 0.005; // Slower rotation
    groupRef.current.rotation.x = Math.sin(elapsed * 0.006) * 0.1; // Much smaller amplitude
  });

  const fadeOpacity = 1; // Could add fade-in/out logic here if needed

  return (
    <group ref={groupRef}>
      {/* Main soul wisp core */}
      <mesh
        geometry={SOUL_STEAL_GEOMETRIES.core}
        material={materials.core}
      />

      {/* Outer glow shell */}
      <mesh
        geometry={SOUL_STEAL_GEOMETRIES.outerShell}
        material={materials.outerShell}
      />

      {/* Pulsing energy rings */}
      {[...Array(2)].map((_, i) => (
        <mesh
          key={`ring-${i}`}
          rotation={[
            Math.PI / 4 + i * Math.PI / 3,
            Date.now() * 0.004 + i * Math.PI / 2,
            0
          ]}
          geometry={i === 0 ? SOUL_STEAL_GEOMETRIES.ringSmall : SOUL_STEAL_GEOMETRIES.ringLarge}
          material={i === 0 ? materials.ring : materials.ringSecond}
        />
      ))}

      {/* Subtle floating particle effects around the wisp */}
      {[...Array(3)].map((_, i) => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const angle = (i / 3) * Math.PI * 2;
        const radius = 0.12; // Much smaller radius
        const x = Math.cos(angle + elapsed * 0.002) * radius; // Slower movement
        const z = Math.sin(angle + elapsed * 0.002) * radius;
        const y = Math.sin(elapsed * 0.003 + i) * 0.03; // Smaller vertical movement
        
        return (
          <mesh 
            key={`particle-${i}`} 
            position={[x, y, z]}
            geometry={SOUL_STEAL_GEOMETRIES.particle}
            material={materials.particle}
          />
        );
      })}


      {/* Point light for environmental glow */}
      <pointLight
        color="#A855C7"
        intensity={1.5 * fadeOpacity}
        distance={3}
        decay={2}
      />
    </group>
  );
}