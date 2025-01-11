import React from 'react';

interface TotemModelProps {
  isAttacking: boolean;
}

export default function TotemModel({ isAttacking }: TotemModelProps) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 1, 8]} />
        <meshStandardMaterial color="#4a4a4a" />
      </mesh>

      {/* Top */}
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial 
          color="#ff4400"
          emissive="#ff4400"
          emissiveIntensity={isAttacking ? 2 : 0.5}
        />
      </mesh>

      {/* Magical runes */}
      <group position={[0, 0.75, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, (Math.PI * 2 * i) / 3, 0]}>
            <ringGeometry args={[0.45, 0.5, 32]} />
            <meshStandardMaterial 
              color="#ff6600"
              emissive="#ff6600"
              emissiveIntensity={isAttacking ? 1.5 : 0.5}
              transparent
              opacity={0.7}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
} 