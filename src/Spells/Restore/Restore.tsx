import React, { useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import { Group, Vector3 } from 'three';
import { useReanimateManager } from './useRestoreManager';
import { useFrame } from '@react-three/fiber';

interface ReanimateProps {
  parentRef: React.RefObject<Group>;
  onHealthChange: (health: number) => void;
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
}

export interface ReanimateRef {
  castReanimate: () => boolean;
}

const HealingEffect: React.FC<{ position: Vector3; onComplete: () => void }> = ({ position, onComplete }) => {
  const [time, setTime] = useState(0);
  const duration = 1.5; // Duration in seconds

  useFrame((_, delta) => {
    setTime(prev => {
      const newTime = prev + delta;
      if (newTime >= duration) {
        onComplete();
      }
      return newTime;
    });
  });

  const progress = time / duration;
  const opacity = Math.sin(progress * Math.PI);
  const scale = 1 + progress * 2;

  return (
    <group position={position.toArray()}>
      {/* Rising healing rings */}
      {[...Array(3)].map((_, i) => (
        <mesh
          key={`ring-${i}`}
          position={[0, progress * 2 + i * 0.5, 0]}
          rotation={[Math.PI / 2, 0, time * 2]}
        >
          <torusGeometry args={[0.8 - i * 0.2, 0.05, 16, 32]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={2}
            transparent
            opacity={opacity * (1 - i * 0.2)}
          />
        </mesh>
      ))}

      {/* Central healing glow */}
      <mesh scale={[scale, scale, scale]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={3}
          transparent
          opacity={opacity * 0.3}
        />
      </mesh>

      {/* Healing particles */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 1 + progress;
        const yOffset = progress * 2;
        
        return (
          <mesh
            key={`particle-${i}`}
            position={[
              Math.cos(angle + time * 2) * radius,
              yOffset + Math.sin(time * 3 + i) * 0.5,
              Math.sin(angle + time * 2) * radius
            ]}
          >
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial
              color="#00ff88"
              emissive="#00ff88"
              emissiveIntensity={2}
              transparent
              opacity={opacity * 0.8}
            />
          </mesh>
        );
      })}

      {/* Light source */}
      <pointLight
        color="#00ff88"
        intensity={4 * opacity}
        distance={5}
        decay={2}
      />
    </group>
  );
};

const Reanimate = forwardRef<ReanimateRef, ReanimateProps>(({ 
  parentRef,
  onHealthChange,
  charges,
  setCharges,
  setDamageNumbers,
  nextDamageNumberId
}, ref) => {
  const [showHealingEffect, setShowHealingEffect] = useState(false);

  const { castReanimate } = useReanimateManager({
    parentRef,
    charges,
    setCharges,
    onHealthChange,
    setDamageNumbers,
    nextDamageNumberId
  });

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
      position={parentRef.current.position.clone().add(new Vector3(0, 1, 0))}
      onComplete={() => setShowHealingEffect(false)}
    />
  ) : null;
});

Reanimate.displayName = 'Reanimate';

export default Reanimate; 