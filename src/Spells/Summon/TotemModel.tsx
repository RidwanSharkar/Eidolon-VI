import React, { useRef } from 'react';
import { Group } from 'three';
import BoneAuraTotem from './BoneAuraTotem';
import UnholyAura from './UnholyAura';




// ===========================================



interface TotemModelProps {
  isAttacking: boolean;
}

export default function TotemModel({ isAttacking }: TotemModelProps) {
  const totemRef = useRef<Group>(null);

  return (
    <group ref={totemRef} scale={0.475} position={[0, -0.75, 0]}>
      {/* Main tower structure */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.6, 0.8, 4, 8]} />
        <meshStandardMaterial 
          color="#D2B48C"
          roughness={1}
          metalness={0}
        />
      </mesh> 

      {/* Jagged spikes around the structure */}
      {[...Array(12)].map((_, i) => (
        <group key={i} rotation={[0, (-Math.PI * 2 * i) / 12, Math.PI * 0.25]} position={[0, 2.5, 0]}>
          <mesh position={[0.7, Math.sin(i * 3) * 0.5, 0]} rotation={[Math.PI/3, 0, -Math.PI * 0.25]}>
            <coneGeometry args={[0.2, 0.8 + Math.random() * 0.5, 4]} />
            <meshStandardMaterial color="#BC8F8F" roughness={1} metalness={0} />
          </mesh>
        </group>
      ))}

      {/* Glowing rune circles */}
      {[0.5, 1.5, 2.5, 3.5].map((height, i) => (
        <group key={i} position={[0, height, 0]}>
          <mesh>
            <torusGeometry args={[0.7, 0.05, 16, 32]} />
            <meshStandardMaterial 
              color="#00ff88"
              emissive="#00ff88"
              emissiveIntensity={isAttacking ? 3 : 1}
              transparent
              opacity={0.9}
            />
          </mesh>
          {/* Floating rune symbols */}
          {[...Array(4)].map((_, j) => (
            <mesh 
              key={j} 
              position={[
                Math.cos((Math.PI * 2 * j) / 4) * 0.7,
                Math.sin(Date.now() * 0.001 + j) * 0.1,
                Math.sin((Math.PI * 2 * j) / 4) * 0.7
              ]}
            >
              <planeGeometry args={[0.2, 0.2]} />
              <meshStandardMaterial 
                color="#00ff88"
                emissive="#00ff88"
                emissiveIntensity={isAttacking ? 4 : 2}
                transparent
                opacity={0.8}
                side={2} // THREE.DoubleSide
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Top crown structure */}
      <group position={[0, 4, 0]}>
        {[...Array(8)].map((_, i) => (
          <mesh 
            key={i} 
            position={[
              Math.cos((Math.PI * 2 * i) / 8) * 0.5,
              0.3,
              Math.sin((Math.PI * 2 * i) / 8) * 0.5
            ]}
            rotation={[
              Math.random() * 0.2,
              (Math.PI * 2 * i) / 8,
              Math.PI * 0.15
            ]}
          >
            <coneGeometry args={[0.15, 1.2, 4]} />
            <meshStandardMaterial color="#DEB887" roughness={1} metalness={0} />
          </mesh>
        ))}
        
        {/* Central eye */}
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial 
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={isAttacking ? 5 : 3}
          />
        </mesh>
      </group>

      {/* Base structure */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[1, 1.2, 0.6, 8]} />
        <meshStandardMaterial color="#D2B48C" roughness={1} metalness={0} />
      </mesh>

      {/* Lightning effects when attacking */}
      {isAttacking && [...Array(4)].map((_, i) => (
        <mesh 
          key={i}
          position={[
            Math.cos((Math.PI * 2 * i) / 4) * 1,
            2,
            Math.sin((Math.PI * 2 * i) / 4) * 1
          ]}
        >
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial 
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={5}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}

      <BoneAuraTotem parentRef={totemRef} />
      <UnholyAura parentRef={totemRef} />

    </group>
  );
} 