import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Color } from 'three';

interface CriticalRuneProps {
  position: Vector3;
  onPickup: () => void;
  playerPosition: Vector3;
}

export function CriticalRune({ position, onPickup, playerPosition }: CriticalRuneProps) {
  const runeRef = useRef<Group>(null);
  const [isPickedUp, setIsPickedUp] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [glowIntensity, setGlowIntensity] = useState(0.5);
  
  // Debug logging
  useEffect(() => {
    console.log(`🔮 CriticalRune component mounted at position: (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`);
    return () => {
      console.log(`🔮 CriticalRune component unmounted`);
    };
  }, [position]);
  
  useFrame((state) => {
    if (isPickedUp) return;
    
    // Pickup detection
    const distance = position.distanceTo(playerPosition);
    if (distance < 2.5) { // Pickup radius
      setIsPickedUp(true);
      onPickup();
      return;
    }
    
    // Animation only if not picked up and ref exists
    if (!runeRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Floating animation
    runeRef.current.position.y = position.y + Math.sin(time * 2) * 0.3;
    
    // Rotation animation
    setRotation(time * 1.5);
    
    // Pulsing glow effect
    setGlowIntensity(0.5 + Math.sin(time * 3) * 0.3);
    
    // Scale pulsing
    setScale(1 + Math.sin(time * 2.5) * 0.1);
  });

  if (isPickedUp) return null;

  return (
    <group ref={runeRef} position={[position.x, position.y, position.z]}>
      {/* Main rune crystal */}
      <mesh scale={[scale, scale, scale]} rotation={[0, rotation, 0]}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial 
          color={new Color(0.9, 0.3, 0.1)} 
          emissive={new Color(0.9, 0.3, 0.1)}
          emissiveIntensity={glowIntensity}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Inner core */}
      <mesh scale={[scale * 0.6, scale * 0.6, scale * 0.6]} rotation={[0, -rotation * 1.5, 0]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial 
          color={new Color(1, 0.8, 0.2)} 
          emissive={new Color(1, 0.8, 0.2)}
          emissiveIntensity={glowIntensity * 1.5}
          transparent
          opacity={0.7}
        />
      </mesh>
      
      {/* Outer glow ring */}
      <mesh scale={[scale * 1.5, scale * 0.1, scale * 1.5]} rotation={[Math.PI / 2, 0, rotation * 0.5]}>
        <ringGeometry args={[0.8, 1.2, 16]} />
        <meshStandardMaterial 
          color={new Color(0.9, 0.3, 0.1)} 
          emissive={new Color(0.9, 0.3, 0.1)}
          emissiveIntensity={glowIntensity * 0.5}
          transparent
          opacity={0.4}
          side={2}
        />
      </mesh>
      
      {/* Floating text - temporarily disabled for debugging */}
      {/* <Text
        position={[0, 2, 0]}
        fontSize={0.5}
        color={new Color(1, 0.8, 0.2)}
        anchorX="center"
        anchorY="middle"
        font="/fonts/GeistVF.woff"
      >
        Critical Rune
      </Text> */}
      
      {/* Point light for glow effect */}
      <pointLight 
        position={[0, 0, 0]} 
        color={new Color(0.9, 0.3, 0.1)} 
        intensity={glowIntensity * 2} 
        distance={10} 
        decay={2}
      />
    </group>
  );
}
