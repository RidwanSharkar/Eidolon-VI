import React, { useImperativeHandle, forwardRef, useState, useCallback, useMemo, useEffect } from 'react';
import { Group, Vector3, TorusGeometry, SphereGeometry, MeshStandardMaterial } from 'three';
import { useReanimateManager } from '@/Spells/Reanimate/useReanimateManager';
import { useFrame, RootState } from '@react-three/fiber';

// Shared geometries for healing effect - avoid per-render allocations
const healingGeometries = {
  torus0: new TorusGeometry(0.8, 0.05, 16, 32),
  torus1: new TorusGeometry(0.6, 0.05, 16, 32),
  torus2: new TorusGeometry(0.4, 0.05, 16, 32),
  centralGlow: new SphereGeometry(0.5, 32, 32),
  particle: new SphereGeometry(0.095, 8, 8)
};

let healingResourceUsers = 0;

const disposeHealingResources = () => {
  Object.values(healingGeometries).forEach(geo => geo.dispose());
};

interface ReanimateProps {
  parentRef: React.RefObject<Group>;
  onHealthChange: (healAmount: number) => void;
  charges: Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>;
  setCharges: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>>>;
  setDamageNumbers: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isHealing?: boolean;
  }>>>;
  nextDamageNumberId: React.MutableRefObject<number>;
  currentHealth: number;
  maxHealth: number;
}

export interface ReanimateRef {
  castReanimate: () => boolean;
}

const HealingEffect: React.FC<{ position: Vector3; onComplete: () => void }> = React.memo(({ position, onComplete }) => {
  const [time, setTime] = useState(0);
  const duration = 1.5;

  // Resource management
  useEffect(() => {
    healingResourceUsers += 1;
    return () => {
      healingResourceUsers = Math.max(0, healingResourceUsers - 1);
      if (healingResourceUsers === 0) {
        disposeHealingResources();
      }
    };
  }, []);

  // Shared materials - memoized to avoid recreation
  const materials = useMemo(() => ({
    ring: new MeshStandardMaterial({
      color: "#60FF38",
      emissive: "#60FF38",
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 1
    }),
    centralGlow: new MeshStandardMaterial({
      color: "#60FF38",
      emissive: "#60FF38",
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.3
    }),
    particle: new MeshStandardMaterial({
      color: "#60FF38",
      emissive: "#60FF38",
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.8
    })
  }), []);

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach(mat => mat.dispose());
    };
  }, [materials]);
  
  // Use useCallback for frame updates
  const onFrame = useCallback((_: RootState, delta: number) => {
    setTime(prev => {
      const newTime = prev + delta;
      if (newTime >= duration) {
        onComplete();
      }
      return newTime;
    });
  }, [duration, onComplete]);

  useFrame(onFrame);

  // Memoize these calculations
  const progress = time / duration;
  const opacity = Math.sin(progress * Math.PI);
  const scale = 1 + progress * 2;

  // Update material opacities
  useFrame(() => {
    materials.ring.opacity = opacity;
    materials.centralGlow.opacity = opacity * 0.3;
    materials.particle.opacity = opacity * 0.8;
  });

  // Pre-generate arrays for iterations
  const rings = useMemo(() => [...Array(3)], []);
  const particles = useMemo(() => [...Array(12)], []);

  // Get the correct torus geometry based on index
  const getTorusGeometry = (i: number) => {
    if (i === 0) return healingGeometries.torus0;
    if (i === 1) return healingGeometries.torus1;
    return healingGeometries.torus2;
  };

  return (
    <group position={position.toArray()}>
      {/* Rising healing rings */}
      {rings.map((_, i) => (
        <mesh
          key={`ring-${i}`}
          position={[0, progress * 2 + i * 0.5, 0]}
          rotation={[Math.PI / 2, 0, time * 2]}
          geometry={getTorusGeometry(i)}
          material={materials.ring}
        />
      ))}

      {/* Central healing glow */}
      <mesh 
        scale={[scale, scale, scale]}
        geometry={healingGeometries.centralGlow}
        material={materials.centralGlow}
      />

      {/* Healing particles */}
      {particles.map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 0.75 + progress;
        const yOffset = progress * 2;
        
        return (
          <mesh
            key={`particle-${i}`}
            position={[
              Math.cos(angle + time * 2) * radius/1.1,
              yOffset + Math.sin(time * 3 + i) * 0.5,
              Math.sin(angle + time * 2) * radius/1.1
            ]}
            geometry={healingGeometries.particle}
            material={materials.particle}
          />
        );
      })}

      {/* Light source */}
      <pointLight
        color="#60FF38"
        intensity={2 * opacity}
        distance={5}
        decay={2}
      />
    </group>
  );
});

HealingEffect.displayName = 'HealingEffect';

const Reanimate = forwardRef<ReanimateRef, ReanimateProps>(({ 
  parentRef,
  onHealthChange,
  charges,
  setCharges,
  setDamageNumbers,
  nextDamageNumberId,
}, ref) => {
  const [showHealingEffect, setShowHealingEffect] = useState(false);
  
  // Memoize manager props
  const managerProps = useMemo(() => ({
    parentRef,
    charges,
    setCharges,
    onHealthChange,
    setDamageNumbers,
    nextDamageNumberId,
  }), [parentRef, charges, setCharges, onHealthChange, setDamageNumbers, nextDamageNumberId]);

  const { castReanimate } = useReanimateManager(managerProps);

  // Wrap the castReanimate function to handle the animation
  const handleCastRestore = useCallback(() => {
    const success = castReanimate();
    if (success) {
      setShowHealingEffect(true);
    }
    return success;
  }, [castReanimate]);

  useImperativeHandle(ref, () => ({
    castReanimate: handleCastRestore
  }));

  return showHealingEffect && parentRef.current ? (
    <HealingEffect
      position={parentRef.current.position.clone().add(new Vector3(0, 0, 0))}
      onComplete={() => setShowHealingEffect(false)}
    />
  ) : null;
});

Reanimate.displayName = 'Reanimate';

export default Reanimate; 