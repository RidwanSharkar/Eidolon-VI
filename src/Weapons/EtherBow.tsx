// src/weapons/EtherBow.tsx

import { useRef, useEffect } from 'react';
import { Group, Vector3 } from 'three';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface EtherealBowProps {
  position: Vector3;
  direction: Vector3;
  chargeProgress: number;
  isCharging: boolean;
  onRelease: (finalProgress: number) => void;
}

export default function EtherealBow({ position, direction, chargeProgress, isCharging, onRelease }: EtherealBowProps) {
  const bowRef = useRef<Group>(null);
  const maxDrawDistance = 1.35;
  const prevIsCharging = useRef(isCharging);
  const chargeStartTime = useRef<number | null>(null);
  
  useEffect(() => {
    if (bowRef.current) {
      const angle = Math.atan2(direction.x, direction.z);
      bowRef.current.rotation.set(0, angle, 0);
    }
  }, [direction]);

  // Check for charge release with improved timing logic
  useFrame(() => {
    // Start charging
    if (!prevIsCharging.current && isCharging) {
      chargeStartTime.current = Date.now();
    }
    
    // Release charge
    if (prevIsCharging.current && !isCharging) {
      const chargeTime = chargeStartTime.current ? (Date.now() - chargeStartTime.current) / 1000 : 0;
      const finalChargeProgress = Math.min(chargeTime / 2, 1); // 2 seconds for full charge
      onRelease(finalChargeProgress);
      chargeStartTime.current = null;
    }
    
    prevIsCharging.current = isCharging;
  });

  // Create a V-shaped bow curve
  const createBowCurve = () => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.875, 0, 0),        // Left base point
      new THREE.Vector3(-0.85, 0.2, 0),     // Left inner curve
      new THREE.Vector3(-0.25, 0.5, 0),      // Left outer curve peak
      new THREE.Vector3(-0.4, 0.35, 0),     // Left transition point
      new THREE.Vector3(0.4, 0.35, 0),      // Right transition point
      new THREE.Vector3(0.25, 0.5, 0),       // Right outer curve peak
      new THREE.Vector3(0.85, 0.2, 0),      // Right inner curve
      new THREE.Vector3(0.875, 0, 0)          // Right base point
    ]);
  };

  // String curve remains the same to maintain functionality
  const createStringCurve = (drawAmount: number) => {
    const pullback = drawAmount * maxDrawDistance;
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.8, 0, 0),
      new THREE.Vector3(0, 0, -pullback),
      new THREE.Vector3(0, 0, -pullback),
      new THREE.Vector3(0.8, 0, 0)
    );
    return curve;
  };

  return ( // BOW SHAPE
    <group ref={bowRef} position={position.toArray()}>
      {/* Bow frame */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <tubeGeometry args={[createBowCurve(), 64, 0.035, 8, false]} />
        <meshStandardMaterial 
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Bow string */}
      <mesh>
        <tubeGeometry args={[createStringCurve(chargeProgress), 16, 0.02, 8, false]} />
        <meshStandardMaterial 
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Decorative wing elements */}
      <group>
        {/* Left wing */}
        <mesh position={[-0.4, 0, 0.475]} rotation={[Math.PI/2, 0, Math.PI/6]}>
          <boxGeometry args={[0.6, 0.02, 0.05]} />
          <meshStandardMaterial 
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={1}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Right wing */}
        <mesh position={[0.4, 0, 0.475]} rotation={[Math.PI/2, 0, -Math.PI/6]}>
          <boxGeometry args={[0.6, 0.02, 0.05]} />
          <meshStandardMaterial 
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={1}
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>

      {/* Arrow  */}
      {isCharging && (
        <group 
          position={[0, 0, 0.8 - chargeProgress * maxDrawDistance]}
          rotation={[Math.PI/2, 0, 0]}
        >
          {/* Arrow shaft - increased length from 0.5 to 0.7 */}
          <mesh>
            <cylinderGeometry args={[0.015, 0.02, 0.9, 8]} />
            <meshStandardMaterial 
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={3}
              transparent
              opacity={0.9}
            />
          </mesh>
          {/* Arrow head - adjusted position for longer shaft */}
          <mesh position={[0, 0.35, 0]}>  
            <coneGeometry args={[0.03, 0.175, 8]} />
            <meshStandardMaterial 
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={3}
              transparent
              opacity={0.9}
            />
          </mesh>
        </group>
      )}

    </group>
  );
} 