import { useRef, useImperativeHandle, forwardRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useFrenzyAuraEmpoweredAttack } from './useFrenzyAuraEmpoweredAttack';

interface FrenzyAuraProps {
  parentRef: React.RefObject<Group>;
  skeletonCount: number;
  level?: number;
}

export interface FrenzyAuraRef {
  isEmpowered: boolean;
  consumeEmpoweredAttack: () => boolean;
  getEmpoweredDamage: (level: number) => number;
  cooldownRemaining: number;
  isOnCooldown: boolean;
}

const FrenzyAura = forwardRef<FrenzyAuraRef, FrenzyAuraProps>(({ 
  parentRef,
  skeletonCount,
  level = 1
}, ref) => {
  const auraRef = useRef<Group>(null);
  const rotationSpeed = 0.15;

  // Use the empowered attack hook
  const {
    isEmpowered,
    cooldownRemaining,
    isOnCooldown,
    consumeEmpoweredAttack,
    getEmpoweredDamage
  } = useFrenzyAuraEmpoweredAttack();

  // Expose functions through the forwarded ref
  useImperativeHandle(ref, () => ({
    isEmpowered,
    consumeEmpoweredAttack,
    getEmpoweredDamage,
    cooldownRemaining,
    isOnCooldown
  }));

  useFrame(() => {
    if (auraRef.current && parentRef.current) {
      const parentPosition = parentRef.current.position;
      auraRef.current.position.set(parentPosition.x, 0.015, parentPosition.z);
      auraRef.current.rotation.y += rotationSpeed * 0.008;
    }
  });

  // Calculate intensity based on empowered state and level (no skeleton count scaling)
  const baseIntensity = 1.5;
  const levelBonus = (level - 1) * 0.2; // +0.2 intensity per level above 1
  const empoweredBonus = isEmpowered ? 1.0 : 0;
  const finalIntensity = baseIntensity + levelBonus + empoweredBonus;
  
  const baseOpacity = 0.6; // Fixed opacity since no skeleton scaling
  const levelOpacityBonus = (level - 1) * 0.05; // +0.05 opacity per level above 1
  const normalOpacity = Math.min(0.9, baseOpacity + levelOpacityBonus);
  
  // Pulsing fade effect when empowered - fades from full opacity to 0 and back
  const pulseIntensity = isEmpowered ? Math.sin(Date.now() * 0.008) * 0.5 + 1 : 1;
  const pulseFade = isEmpowered ? Math.abs(Math.sin(Date.now() * 0.004)) : 1; // Slower fade cycle
  const finalOpacity = normalOpacity * pulseFade;

  return (
    <group ref={auraRef}>
      {/* Rotating inner elements - green theme */}
      <group rotation={[0, 0, 0]} position={[0, 0.005, 0]}>
        {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((rotation, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, rotation + Date.now() * 0.0008]}>
            <ringGeometry args={[0.85, 1.0, 3]} />
            <meshStandardMaterial
              color="#0BDA51"
              emissive="#0BDA51"
              emissiveIntensity={finalIntensity * pulseIntensity}
              transparent
              opacity={finalOpacity}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

   

      {/* Additional inner ring - fixed appearance */}
      {skeletonCount > 0 && (
        <group rotation={[0, 0, 0]} position={[0, 0.02, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, Date.now() * 0.001]}>
            <ringGeometry args={[0.5, 0.6, 6]} />
            <meshStandardMaterial
              color="#0BDA51"
              emissive="#0BDA51"
              emissiveIntensity={2}
              transparent
              opacity={0.2 * pulseFade}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      {/* Pulsing outer glow - fixed appearance */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.5 + (level * 0.05), 0.8, -0.1, 32]} />
        <meshStandardMaterial
          color="#0BDA51"
          emissive="#0BDA51"
          emissiveIntensity={1.5 + (level * 0.1)}
          transparent
          opacity={(0.3 + (level * 0.02)) * pulseFade}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
});

FrenzyAura.displayName = 'FrenzyAura';

export default FrenzyAura;
