// src/versus/Boss/Meteor.tsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import MeteorTrail from './MeteorTrail';

interface MeteorProps {
  targetPosition: THREE.Vector3;
  onImpact: (damage: number) => void;
  onComplete: () => void;
  playerPosition: THREE.Vector3;
}

const DAMAGE_RADIUS = 2.99;
const IMPACT_DURATION = 1.25;
const METEOR_SPEED = 27.75;
const METEOR_DAMAGE = 84;
const WARNING_RING_SEGMENTS = 32; // Reduced from 64
const FIRE_PARTICLES_COUNT = 12;  // Reduced from 15

// Reusable geometries and materials
const meteorGeometry = new THREE.SphereGeometry(0.75, 16, 16);
const meteorMaterial = new THREE.MeshBasicMaterial({ color: "#ff4400" });
const warningRingGeometry = new THREE.RingGeometry(DAMAGE_RADIUS - 0.2, DAMAGE_RADIUS, WARNING_RING_SEGMENTS);
const pulsingRingGeometry = new THREE.RingGeometry(DAMAGE_RADIUS - 0.8, DAMAGE_RADIUS - 0.6, WARNING_RING_SEGMENTS);
const outerGlowGeometry = new THREE.RingGeometry(DAMAGE_RADIUS - 0.25, DAMAGE_RADIUS, WARNING_RING_SEGMENTS);
const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);

// Reusable vectors to avoid allocations
const tempPlayerGroundPos = new THREE.Vector3();
const tempTargetGroundPos = new THREE.Vector3();

const createMeteorImpactEffect = (position: THREE.Vector3, startTime: number, onComplete: () => void) => {
  const elapsed = (Date.now() - startTime) / 1000;
  const fade = Math.max(0, 1 - (elapsed / IMPACT_DURATION));
  
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
          <torusGeometry args={[size * (1.125 + elapsed * 2), 0.225, 4, 32]} />
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

  // useMemo for initial calculations
  const [initialTargetPos, startPos, trajectory] = React.useMemo(() => {
    const initTarget = new THREE.Vector3(targetPosition.x, -5, targetPosition.z);
    const start = new THREE.Vector3(targetPosition.x, 60, targetPosition.z);
    const traj = new THREE.Vector3().subVectors(initTarget, start).normalize();
    return [initTarget, start, traj];
  }, [targetPosition]);

  // state management
  const [state, setState] = useState({
    impactOccurred: false,
    showMeteor: false,
    impactStartTime: null as number | null
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setState(prev => ({ ...prev, showMeteor: true }));
    }, 1090);

    return () => clearTimeout(timer);
  }, []);

  useFrame((_, delta) => {
    if (!meteorGroupRef.current || !state.showMeteor || state.impactOccurred) {
      if (state.impactOccurred && !state.impactStartTime) {
        setState(prev => ({ ...prev, impactStartTime: Date.now() }));
      }
      return;
    }

    const currentPos = meteorGroupRef.current.position;
    const distanceToTarget = currentPos.distanceTo(initialTargetPos);

    if (distanceToTarget < DAMAGE_RADIUS || currentPos.y <= 0.1) {
      setState(prev => ({ ...prev, impactOccurred: true, impactStartTime: Date.now() }));
      
      // distance calculation
      tempPlayerGroundPos.set(playerPosition.x, 0, playerPosition.z);
      tempTargetGroundPos.set(initialTargetPos.x, 0, initialTargetPos.z);
      
      if (tempPlayerGroundPos.distanceTo(tempTargetGroundPos) <= DAMAGE_RADIUS) {
        onImpact(METEOR_DAMAGE);
      }
    }

    const speed = METEOR_SPEED * delta;
    currentPos.addScaledVector(trajectory, speed);
  });

  const getPulsingScale = useCallback((): [number, number, number] => {
    const scale = 1 + Math.sin(Date.now() * 0.005) * 0.2;
    return [scale, scale, 1] as [number, number, number];
  }, []);

  return (
     <>
      <group position={[initialTargetPos.x, 0.1, initialTargetPos.z]}>
        {/* Warning rings using shared geometries */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <primitive object={warningRingGeometry} />
          <meshBasicMaterial color="#ff2200" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        
        {/* Pulsing inner ring */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          scale={getPulsingScale()}
        >
          <primitive object={pulsingRingGeometry} />
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
          <primitive object={outerGlowGeometry} />
          <meshBasicMaterial 
            color="#ff3300"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>


        {/* Rising fire particles */}
        {[...Array(FIRE_PARTICLES_COUNT)].map((_, i) => (
          <mesh
            key={i}
            position={[
              Math.sin(Date.now() * 0.001 + i) * (DAMAGE_RADIUS - 0.5),
              Math.sin(Date.now() * 0.002 + i) * 0.5,
              Math.cos(Date.now() * 0.001 + i) * (DAMAGE_RADIUS - 0.5)
            ]}
          >
            <primitive object={particleGeometry} />
            <meshBasicMaterial
              color="#ff3300"
              transparent
              opacity={0.3 + Math.sin(Date.now() * 0.004 + i) * 0.2}
            />
          </mesh>
        ))}
      </group>


      {/* Meteor with trail */}
      {state.showMeteor && (
        <group ref={meteorGroupRef} position={startPos}>
          <mesh ref={meteorMeshRef}>
            <primitive object={meteorGeometry} />
            <primitive object={meteorMaterial} />
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
      {state.impactStartTime && createMeteorImpactEffect(
        meteorGroupRef.current?.position || initialTargetPos,
        state.impactStartTime,
        onComplete
      )}
    </>
  );
}