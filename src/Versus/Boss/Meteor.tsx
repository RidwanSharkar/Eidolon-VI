// src/versus/Boss/Meteor.tsx
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import MeteorTrail from './MeteorTrail';

interface MeteorProps {
  targetPosition: THREE.Vector3;
  onImpact: (damage: number) => void;
  onComplete: () => void;
  playerPosition: THREE.Vector3;
}

const DAMAGE_RADIUS = 2.95;  // Define damage and visual radius

const createMeteorImpactEffect = (position: THREE.Vector3, startTime: number, onComplete: () => void) => {
  const elapsed = (Date.now() - startTime) / 1000;
  const duration = 2; // Duration of impact effect
  const fade = Math.max(0, 1 - (elapsed / duration));
  
  // If effect is done, call onComplete
  if (fade <= 0) {
    onComplete();
    return null;
  }
  
  return (
    <group position={position}>
      {/* Core explosion sphere */}
      <mesh>
        <sphereGeometry args={[1.2 * (2 + elapsed), 32, 32]} />
        <meshStandardMaterial
          color="#ff2200"
          emissive="#ff4400"
          emissiveIntensity={2 * fade}
          transparent
          opacity={1.8 * fade}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Inner energy sphere */}
      <mesh>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color="#ff8800"
          emissive="#ffffff"
          emissiveIntensity={2 * fade}
          transparent
          opacity={1.9 * fade}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Multiple expanding rings */}
      {[2.0, 2.15, 2.3, 2.5, 2.7].map((size, i) => (
        <mesh key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}>
          <torusGeometry args={[size * (1.325 + elapsed * 2), 0.225, 4, 32]} />
          <meshStandardMaterial
            color="#ff2200"
            emissive="#ff4400"
            emissiveIntensity={0.7 * fade}
            transparent
            opacity={0.95 * fade * (1 - i * 0.1)}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}


      {/* Dynamic lights with fade */}
      <pointLight
        color="#ff2200"
        intensity={0.8 * fade}
        distance={8 * (1 + elapsed)}
        decay={2}
      />
      <pointLight
        color="#ff8800"
        intensity={0.8 * fade}
        distance={12}
        decay={1}
      />
    </group>
  );
};

export default function Meteor({ targetPosition, onImpact, onComplete, playerPosition }: MeteorProps) {
  const meteorGroupRef = useRef<THREE.Group>(null);
  const meteorMeshRef = useRef<THREE.Mesh>(null);
  const initialTargetPosition = useRef(new THREE.Vector3(targetPosition.x, -5, targetPosition.z));
  const startPosition = useRef(new THREE.Vector3(targetPosition.x, 60, targetPosition.z));
  const [impactOccurred, setImpactOccurred] = useState(false);
  const [showMeteor, setShowMeteor] = useState(false);
  const warningRingRef = useRef<THREE.Mesh>(null);
  const [impactStartTime, setImpactStartTime] = useState<number | null>(null);
  
  const trajectory = useRef(new THREE.Vector3()
    .subVectors(initialTargetPosition.current, startPosition.current)
    .normalize()
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMeteor(true);
    }, 1090);

    return () => clearTimeout(timer);
  }, []);

  useFrame((_, delta) => {
    if (!meteorGroupRef.current || !showMeteor || impactOccurred) {
      if (impactOccurred && !impactStartTime) {
        setImpactStartTime(Date.now());
      }
      return;
    }

    const currentPos = meteorGroupRef.current.position;
    const distanceToTarget = currentPos.distanceTo(initialTargetPosition.current);

    if (distanceToTarget < DAMAGE_RADIUS || currentPos.y <= 0.1) {
      setImpactOccurred(true);
      setImpactStartTime(Date.now());
      
      const playerDistance = new THREE.Vector3(
        playerPosition.x,
        0,
        playerPosition.z
      ).distanceTo(new THREE.Vector3(
        initialTargetPosition.current.x,
        0,
        initialTargetPosition.current.z
      ));

      if (playerDistance <= DAMAGE_RADIUS) {
        onImpact(72);
      }
    }

    const speed = 27.75 * delta;
    currentPos.addScaledVector(trajectory.current, speed);
  });

  return (
    <>
      {/* Warning Ring */}
      <group position={[initialTargetPosition.current.x, 0.1, initialTargetPosition.current.z]}>
        {/* Main warning ring */}
        <mesh
          ref={warningRingRef}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[DAMAGE_RADIUS - 0.2, DAMAGE_RADIUS, 64]} />
          <meshBasicMaterial 
            color="#ff2200"
            transparent 
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Pulsing inner ring */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[1 + Math.sin(Date.now() * 0.005) * 0.2, 1 + Math.sin(Date.now() * 0.005) * 0.2, 1]}
        >
          <ringGeometry args={[DAMAGE_RADIUS - 0.8, DAMAGE_RADIUS - 0.6, 64]} />
          <meshBasicMaterial 
            color="#ff4400"
            transparent 
            opacity={0.4 + Math.sin(Date.now() * 0.003) * 0.2}
            side={THREE.DoubleSide}
          />
        </mesh>


        {/* Rotating outer glow ring */}
        <mesh
          rotation={[-Math.PI / 2, Date.now() * 0.0035, 0]}
        >
          <ringGeometry args={[DAMAGE_RADIUS - 0.25, DAMAGE_RADIUS, 64]} />
          <meshBasicMaterial 
            color="#ff3300"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>


        {/* Rising fire particles */}
        {[...Array(15)].map((_, i) => (
          <mesh
            key={i}
            position={[
              Math.sin(Date.now() * 0.001 + i) * (DAMAGE_RADIUS - 0.5),
              Math.sin(Date.now() * 0.002 + i) * 0.5,
              Math.cos(Date.now() * 0.001 + i) * (DAMAGE_RADIUS - 0.5)
            ]}
          >
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial
              color="#ff3300"
              transparent
              opacity={0.3 + Math.sin(Date.now() * 0.004 + i) * 0.2}
            />
          </mesh>
        ))}
      </group>


      {/* Meteor with trail */}
      {showMeteor && (
        <group ref={meteorGroupRef} position={startPosition.current}>
          <mesh ref={meteorMeshRef}>
            <sphereGeometry args={[0.75, 16, 16]} />
            <meshBasicMaterial color="#ff4400" />
            <pointLight color="#ff4400" intensity={5} distance={8} />
            <MeteorTrail 
              meshRef={meteorMeshRef} 
              color={new THREE.Color("#ff4400")}
              size={0.09}
            />
          </mesh>
        </group>
      )}

      {/* Add impact effect */}
      {impactStartTime && createMeteorImpactEffect(
        meteorGroupRef.current?.position || initialTargetPosition.current,
        impactStartTime,
        onComplete
      )}
    </>
  );
}