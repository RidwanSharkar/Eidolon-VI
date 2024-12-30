import { useRef, useImperativeHandle, forwardRef } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useCrusaderAura } from './useCrusaderAura';

interface CrusaderAuraProps {
  parentRef: React.RefObject<Group>;
  onHealthChange: (health: number) => void;
  currentHealth: number;
  maxHealth: number;
  setDamageNumbers: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isHealing?: boolean;
  }>>>;
  nextDamageNumberId: React.MutableRefObject<number>;
}

const CrusaderAura = forwardRef<{ processHealingChance: () => void }, CrusaderAuraProps>(({ 
  parentRef,
  onHealthChange,
  setDamageNumbers,
  nextDamageNumberId,
  currentHealth,
  maxHealth
}, ref) => {
  const auraRef = useRef<Group>(null);
  const rotationSpeed = 0.2;

  const { processHealingChance } = useCrusaderAura({
    onHealthChange,
    parentRef,
    setDamageNumbers,
    nextDamageNumberId,
    currentHealth,
    maxHealth
  });

  // Expose processHealingChance through the forwarded ref
  useImperativeHandle(ref, () => ({
    processHealingChance
  }));

  useFrame(() => {
    if (auraRef.current && parentRef.current) {
      const parentPosition = parentRef.current.position;
      auraRef.current.position.set(parentPosition.x, 0.015, parentPosition.z);
      auraRef.current.rotation.y += rotationSpeed * 0.012;
    }
  });

  return (
    <group ref={auraRef}>


      {/* Inner cross pattern */}
      <group rotation={[0, 0, 0]}>
        {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((rotation, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, rotation]}>
            <planeGeometry args={[1, 0.125]} />
            <meshStandardMaterial
              color="#ff9900"
              emissive="#ff7700"
              emissiveIntensity={2.5}
              transparent
              opacity={0.8}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>


      {/* Rotating inner elements */}
      <group rotation={[0, 0, 0]} position={[0, 0.002, 0]}>
        {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((rotation, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, rotation + Date.now() * 0.001]}>
            <ringGeometry args={[0.85, 1.0, 3]} />
            <meshStandardMaterial
              color="#ffaa00"
              emissive="#ff8800"
              emissiveIntensity={2}
              transparent
              opacity={0.6}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Circle */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.925, 0.5, -0.2, 32]} />
        <meshStandardMaterial
          color="#ff8800"
          emissive="#ff6600"
          emissiveIntensity={1}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
});

CrusaderAura.displayName = 'CrusaderAura';

export default CrusaderAura;