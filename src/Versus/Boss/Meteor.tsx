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

export default function Meteor({ targetPosition, onImpact, onComplete, playerPosition }: MeteorProps) {
  const meteorGroupRef = useRef<THREE.Group>(null);
  const meteorMeshRef = useRef<THREE.Mesh>(null);
  const initialTargetPosition = useRef(new THREE.Vector3(targetPosition.x, -5, targetPosition.z));
  const startPosition = useRef(new THREE.Vector3(targetPosition.x, 60, targetPosition.z));
  const [impactOccurred, setImpactOccurred] = useState(false);
  const [showMeteor, setShowMeteor] = useState(false);
  const warningRingRef = useRef<THREE.Mesh>(null);
  
  const trajectory = useRef(new THREE.Vector3()
    .subVectors(initialTargetPosition.current, startPosition.current)
    .normalize()
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMeteor(true);
    }, 1700);

    return () => clearTimeout(timer);
  }, []);

  useFrame((_, delta) => {
    if (!meteorGroupRef.current || !showMeteor || impactOccurred) return;

    const currentPos = meteorGroupRef.current.position;
    const distanceToTarget = currentPos.distanceTo(initialTargetPosition.current);

    if (distanceToTarget < DAMAGE_RADIUS || currentPos.y <= 0.1) {
      setImpactOccurred(true);
      
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
        onImpact(40);
      }
      
      setTimeout(() => onComplete(), 3000);
      return;
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
            opacity={0.6}
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
            opacity={0.3}
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
    </>
  );
}