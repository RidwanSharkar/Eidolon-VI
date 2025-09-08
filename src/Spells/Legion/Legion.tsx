import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import LegionMeteorTrail from './LegionMeteorTrail';

interface LegionProps {
  targetPosition: THREE.Vector3;
  onImpact: (damage: number) => void;
  onComplete: () => void;
  playerPosition: THREE.Vector3;
  enemyData?: Array<{ id: string; position: THREE.Vector3; health: number; isDying?: boolean }>;
  onHit?: (targetId: string, damage: number) => void;
  setDamageNumbers?: (callback: (prev: Array<{
    id: number;
    damage: number;
    position: THREE.Vector3;
    isCritical: boolean;
    isLegion?: boolean;
  }>) => Array<{
    id: number;
    damage: number;
    position: THREE.Vector3;
    isCritical: boolean;
    isLegion?: boolean;
  }>) => void;
  nextDamageNumberId?: React.MutableRefObject<number>;
  onPlayerEmpowerment?: () => void; // Callback to trigger player empowerment
}

const DAMAGE_RADIUS = 3.1;
const IMPACT_DURATION = 0.5;
const METEOR_SPEED = 27.75;
const METEOR_DAMAGE = 650;
const WARNING_RING_SEGMENTS = 32;
const FIRE_PARTICLES_COUNT = 12;

// Reusable geometries and materials (green themed)
const meteorGeometry = new THREE.SphereGeometry(0.75, 16, 16);
const meteorMaterial = new THREE.MeshBasicMaterial({ color: "#00ff44" });
const warningRingGeometry = new THREE.RingGeometry(DAMAGE_RADIUS - 0.2, DAMAGE_RADIUS, WARNING_RING_SEGMENTS);
const pulsingRingGeometry = new THREE.RingGeometry(DAMAGE_RADIUS - 0.8, DAMAGE_RADIUS - 0.6, WARNING_RING_SEGMENTS);
const outerGlowGeometry = new THREE.RingGeometry(DAMAGE_RADIUS - 0.25, DAMAGE_RADIUS, WARNING_RING_SEGMENTS);
const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);

// Reusable vectors to avoid allocations
const tempPlayerGroundPos = new THREE.Vector3();
const tempTargetGroundPos = new THREE.Vector3();

const createLegionImpactEffect = (position: THREE.Vector3, startTime: number, onComplete: () => void) => {
  const elapsed = (Date.now() - startTime) / 1000;
  const fade = Math.max(0, 1 - (elapsed / IMPACT_DURATION));
  
  if (fade <= 0) {
    onComplete();
    return null;
  }

  return (
    <group position={position}>
      {/* Core explosion sphere - green themed */}
      <mesh>
        <sphereGeometry args={[0.4 * (2 + elapsed), 32, 32]} />
        <meshStandardMaterial
          color="#00ff22"
          emissive="#00ff44"
          emissiveIntensity={2 * fade}
          transparent
          opacity={1.8 * fade}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Inner energy sphere - green themed */}
      <mesh>
        <sphereGeometry args={[0.75, 24, 24]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#ffffff"
          emissiveIntensity={2 * fade}
          transparent
          opacity={1.9 * fade}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Multiple expanding rings - green themed */}
      {[1.0, 1.15, 1.3, 1.45, 1.6].map((size, i) => (
        <mesh key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}>
          <torusGeometry args={[size * (1.125 + elapsed * 2), 0.225, 4, 32]} />
          <meshStandardMaterial  
            color="#00ff22"
            emissive="#00ff44"
            emissiveIntensity={0.7 * fade}
            transparent
            opacity={0.95 * fade * (1 - i * 0.1)}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Dynamic lights with fade - green themed */}
      <pointLight
        color="#00ff22"
        intensity={0.8 * fade}
        distance={8 * (1 + elapsed)}
        decay={2}
      />
      <pointLight
        color="#00ff88"
        intensity={0.8 * fade}
        distance={12}
        decay={1}
      />
    </group>
  );
};

export default function Legion({ 
  targetPosition, 
  onImpact, 
  onComplete, 
  playerPosition, 
  enemyData = [],
  onHit,
  setDamageNumbers,
  nextDamageNumberId,
  onPlayerEmpowerment
}: LegionProps) {
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
    }, 1500); // Show meteor after 2 seconds as requested

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
      
      // Check for player damage and empowerment
      if (tempPlayerGroundPos.distanceTo(tempTargetGroundPos) <= DAMAGE_RADIUS) {
        onImpact(METEOR_DAMAGE);
        
        // Trigger player empowerment if callback is provided
        if (onPlayerEmpowerment) {
          onPlayerEmpowerment();
        }
      }

      // Check for enemy damage in impact area
      if (enemyData && onHit && setDamageNumbers && nextDamageNumberId) {
        enemyData.forEach(enemy => {
          if (enemy.health <= 0 || enemy.isDying) return;
          
          const enemyGroundPos = new THREE.Vector3(enemy.position.x, 0, enemy.position.z);
          const distance = enemyGroundPos.distanceTo(tempTargetGroundPos);
          
          if (distance <= DAMAGE_RADIUS) {
            onHit(enemy.id, METEOR_DAMAGE);
            
            // Add damage number with green color (isLegion: true)
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage: METEOR_DAMAGE,
              position: enemy.position.clone().add(new THREE.Vector3(0, 2, 0)),
              isCritical: false,
              isLegion: true
            }]);
          }
        });
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
        {/* Warning rings using shared geometries - green themed */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <primitive object={warningRingGeometry} />
          <meshBasicMaterial color="#00ff22" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        
        {/* Pulsing inner ring - green themed */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          scale={getPulsingScale()}
        >
          <primitive object={pulsingRingGeometry} />
          <meshBasicMaterial 
            color="#00ff44"
            transparent 
            opacity={0.4 + Math.sin(Date.now() * 0.003) * 0.2}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Rotating outer glow ring - green themed */}
        <mesh
          rotation={[-Math.PI / 2, Date.now() * 0.0035, 0]}
        >
          <primitive object={outerGlowGeometry} />
          <meshBasicMaterial 
            color="#00ff33"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Rising fire particles - green themed */}
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
              color="#00ff33"
              transparent
              opacity={0.3 + Math.sin(Date.now() * 0.004 + i) * 0.2}
            />
          </mesh>
        ))}
      </group>

      {/* Meteor with trail - green themed */}
      {state.showMeteor && (
        <group ref={meteorGroupRef} position={startPos}>
          <mesh ref={meteorMeshRef}>
            <primitive object={meteorGeometry} />
            <primitive object={meteorMaterial} />
            <pointLight color="#00ff44" intensity={5} distance={8} />
            <LegionMeteorTrail 
              meshRef={meteorMeshRef} 
              color={new THREE.Color("#00ff44")}
              size={0.09}
            />
          </mesh>
        </group>
      )}

      {/* Add impact effect */}
      {state.impactStartTime && createLegionImpactEffect(
        meteorGroupRef.current?.position || initialTargetPos,
        state.impactStartTime,
        onComplete
      )}
    </>
  );
}
