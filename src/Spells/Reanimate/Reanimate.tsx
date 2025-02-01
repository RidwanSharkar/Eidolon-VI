import React, { useImperativeHandle, forwardRef, useState, useCallback, useMemo } from 'react';
import { Group, Vector3 } from 'three';
import { useReanimateManager } from '@/Spells/Reanimate/useReanimateManager';
import { useFrame, RootState } from '@react-three/fiber';

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

  // Pre-calculate shared material properties
  const ringMaterial = useMemo(() => ({
    color: "#60FF38",
    emissive: "#60FF38",
    emissiveIntensity: 1.5,
    transparent: true
  }), []);

  const particleMaterial = useMemo(() => ({
    color: "#60FF38",
    emissive: "#60FF38",
    emissiveIntensity: 2.5,
    transparent: true
  }), []);

  // Pre-generate arrays for iterations
  const rings = useMemo(() => [...Array(3)], []);
  const particles = useMemo(() => [...Array(12)], []);

  return (
    <group position={position.toArray()}>
      {/* Rising healing rings */}
      {rings.map((_, i) => (
        <mesh
          key={`ring-${i}`}
          position={[0, progress * 2 + i * 0.5, 0]}
          rotation={[Math.PI / 2, 0, time * 2]}
        >
          <torusGeometry args={[0.8 - i * 0.2, 0.05, 16, 32]} />
          <meshStandardMaterial
            {...ringMaterial}
            opacity={opacity * (1 - i * 0.2)}
          />
        </mesh>
      ))}

      {/* Central healing glow */}
      <mesh scale={[scale, scale, scale]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#60FF38"
          emissive="#60FF38"
          emissiveIntensity={2}
          transparent
          opacity={opacity * 0.3}
        />
      </mesh>

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
          >
            <sphereGeometry args={[0.095, 8, 8]} />
            <meshStandardMaterial
              {...particleMaterial}
              opacity={opacity * 0.8}
            />
          </mesh>
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