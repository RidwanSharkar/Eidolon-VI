import React from 'react';

interface TotemModelProps {
  isAttacking: boolean;
}

export default function TotemModel({ isAttacking }: TotemModelProps) {
  return (
    <group>
      {/* Base - Skull-like structure */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.4, 0.5, 1.2, 8]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* Spikes around base */}
      {[...Array(8)].map((_, i) => (
        <group key={i} rotation={[0, (Math.PI * 2 * i) / 8, 0]} position={[0, 0.5, 0]}>
          <mesh position={[0.45, 0, 0]} rotation={[0, 0, Math.PI * 0.15]}>
            <coneGeometry args={[0.1, 0.4, 4]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Glowing runes */}
      <group position={[0, 0.75, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, (Math.PI * 2 * i) / 3, 0]}>
            <ringGeometry args={[0.45, 0.5, 32]} />
            <meshStandardMaterial 
              color="#00ff88"
              emissive="#00ff88"
              emissiveIntensity={isAttacking ? 3 : 1}
              transparent
              opacity={0.9}
            />
          </mesh>
        ))}
      </group>

      {/* Top skull-like ornament */}
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial 
          color="#2a2a2a"
          roughness={0.7}
        />
      </mesh>

      {/* Glowing eyes */}
      <group position={[0, 1.4, 0.2]}>
        {[-0.15, 0.15].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial 
              color="#00ff88"
              emissive="#00ff88"
              emissiveIntensity={isAttacking ? 4 : 2}
            />
          </mesh>
        ))}
      </group>

      {/* Bone decorations */}
      {[...Array(4)].map((_, i) => (
        <group key={i} rotation={[0, (Math.PI * 2 * i) / 4, 0]} position={[0, 0.8, 0]}>
          <mesh position={[0.4, 0, 0]} rotation={[0, 0, Math.PI * 0.5]}>
            <cylinderGeometry args={[0.05, 0.05, 0.3, 4]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
          <mesh position={[0.55, 0, 0]}>
            <sphereGeometry args={[0.06, 4, 4]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
} 