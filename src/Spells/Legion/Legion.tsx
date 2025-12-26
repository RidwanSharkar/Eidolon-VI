import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector3
} from 'three';
import LegionMeteorTrail from './LegionMeteorTrail';
import {
  SHARED_SPHERE_GEOMETRY_SPELL_MEDIUM,
  SHARED_SPHERE_GEOMETRY_SPELL_XL,
  SHARED_SPHERE_GEOMETRY_SPELL_SMALL,
  SHARED_RING_GEOMETRY_WARNING,
  SHARED_TORUS_GEOMETRY_SPELL_LARGE
} from '../../SharedGeometries';
import { calculateDamage } from '@/Weapons/damage';

interface LegionProps {
  targetPosition: Vector3;
  onImpact: (damage: number) => void;
  onComplete: () => void;
  playerPosition: Vector3;
  enemyData?: Array<{ id: string; position: Vector3; health: number; isDying?: boolean }>;
  onHit?: (targetId: string, damage: number) => void;
  setDamageNumbers?: (callback: (prev: Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isLegion?: boolean;
  }>) => Array<{
    id: number;
    damage: number;
    position: Vector3;
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


// Reusable vectors to avoid allocations
const tempPlayerGroundPos = new Vector3();
const tempTargetGroundPos = new Vector3();
const tempEnemyGroundPos = new Vector3();
const tempDamageNumberOffset = new Vector3(0, 2, 0);
const LEGION_GREEN_COLOR = new Color("#00ff44");


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
  const meteorGroupRef = useRef<Group>(null);
  const meteorMeshRef = useRef<Mesh>(null);

  // Use shared geometries - prevents memory leaks when multiple Legion spells are cast
  const geometries = useMemo(() => ({
    meteorGeometry: SHARED_SPHERE_GEOMETRY_SPELL_MEDIUM, // Approximation of (0.75, 16, 16)
    warningRingGeometry: SHARED_RING_GEOMETRY_WARNING, // Will be scaled dynamically
    pulsingRingGeometry: SHARED_RING_GEOMETRY_WARNING, // Will be scaled dynamically
    outerGlowGeometry: SHARED_RING_GEOMETRY_WARNING, // Will be scaled dynamically
    particleGeometry: SHARED_SPHERE_GEOMETRY_SPELL_SMALL, // Approximation of (0.1, 8, 8)
    impactSphereGeometry: SHARED_SPHERE_GEOMETRY_SPELL_XL, // Approximation of (1, 32, 32)
    // Use shared torus geometries for impact effect
    impactTorus1: SHARED_TORUS_GEOMETRY_SPELL_LARGE, // Approximation of (1.0, 0.225, 4, 32)
    impactTorus2: SHARED_TORUS_GEOMETRY_SPELL_LARGE, // Approximation of (1.15, 0.225, 4, 32)
    impactTorus3: SHARED_TORUS_GEOMETRY_SPELL_LARGE, // Approximation of (1.3, 0.225, 4, 32)
    impactTorus4: SHARED_TORUS_GEOMETRY_SPELL_LARGE, // Approximation of (1.45, 0.225, 4, 32)
    impactTorus5: SHARED_TORUS_GEOMETRY_SPELL_LARGE // Approximation of (1.6, 0.225, 4, 32)
  }), []);

  const materials = useMemo(() => ({
    meteorMaterial: new MeshBasicMaterial({ color: "#00ff44" })
  }), []);

  // Get the appropriate torus geometry by index
  const getImpactTorusGeometry = useCallback((i: number) => {
    switch (i) {
      case 0: return geometries.impactTorus1;
      case 1: return geometries.impactTorus2;
      case 2: return geometries.impactTorus3;
      case 3: return geometries.impactTorus4;
      case 4: return geometries.impactTorus5;
      default: return geometries.impactTorus1;
    }
  }, [geometries]);

  // Impact effect component
  const createLegionImpactEffect = (position: Vector3, startTime: number, onComplete: () => void) => {
    const elapsed = (Date.now() - startTime) / 1000;
    const fade = Math.max(0, 1 - (elapsed / IMPACT_DURATION));

    if (fade <= 0) {
      onComplete();
      return null;
    }

    const ringScale = 1.125 + elapsed * 2;

    return (
      <group position={position}>
        {/* Core explosion sphere - green themed */}
        <mesh scale={0.4 * (2 + elapsed)}>
          <primitive object={geometries.impactSphereGeometry} />
          <meshStandardMaterial
            color="#00ff22"
            emissive="#00ff44"
            emissiveIntensity={2 * fade}
            transparent
            opacity={1.8 * fade}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>

        {/* Inner energy sphere - green themed */}
        <mesh scale={0.75}>
          <primitive object={geometries.impactSphereGeometry} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#ffffff"
            emissiveIntensity={2 * fade}
            transparent
            opacity={1.9 * fade}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>

        {/* Multiple expanding rings - green themed - using shared geometries */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh 
            key={i} 
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
            scale={[ringScale, ringScale, ringScale]}
          >
            <primitive object={getImpactTorusGeometry(i)} />
            <meshStandardMaterial
              color="#00ff22"
              emissive="#00ff44"
              emissiveIntensity={0.7 * fade}
              transparent
              opacity={0.95 * fade * (1 - i * 0.1)}
              depthWrite={false}
              blending={AdditiveBlending}
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

  // MEMORY FIX: Only dispose materials, NOT shared geometries
  // Shared geometries are managed globally and disposed on scene cleanup
  useEffect(() => {
    return () => {
      // Only dispose materials - geometries are shared singletons
      Object.values(materials).forEach(mat => mat.dispose());
    };
  }, [materials]);

  // useMemo for initial calculations
  const [initialTargetPos, startPos, trajectory] = React.useMemo(() => {
    const initTarget = new Vector3(targetPosition.x, -5, targetPosition.z);
    const start = new Vector3(targetPosition.x, 60, targetPosition.z);
    const traj = new Vector3().subVectors(initTarget, start).normalize();
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
        const { damage: meteorDamage, isCritical: meteorCrit } = calculateDamage(METEOR_DAMAGE);
        onImpact(meteorDamage);
        
        // Trigger player empowerment if callback is provided
        if (onPlayerEmpowerment) {
          onPlayerEmpowerment();
        }
      }

      // Calculate damage once for all enemies hit by this meteor
      const { damage: meteorDamage, isCritical: meteorCrit } = calculateDamage(METEOR_DAMAGE);

      // Check for enemy damage in impact area
      if (enemyData && onHit && setDamageNumbers && nextDamageNumberId) {
        enemyData.forEach(enemy => {
          if (enemy.health <= 0 || enemy.isDying) return;

          // Reuse temp vector to avoid allocations
          tempEnemyGroundPos.set(enemy.position.x, 0, enemy.position.z);
          const distance = tempEnemyGroundPos.distanceTo(tempTargetGroundPos);

          if (distance <= DAMAGE_RADIUS) {
            onHit(enemy.id, meteorDamage);

            // Add damage number with green color (isLegion: true)
            // Use clone() + add with temp offset to minimize allocations
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage: meteorDamage,
              position: enemy.position.clone().add(tempDamageNumberOffset),
              isCritical: meteorCrit,
              isLegion: true,
              createdAt: Date.now() // MEMORY FIX: Required for cleanup
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
          <primitive object={geometries.warningRingGeometry} />
          <meshBasicMaterial color="#00ff22" transparent opacity={0.4} side={DoubleSide} />
        </mesh>
        
        {/* Pulsing inner ring - green themed */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          scale={getPulsingScale()}
        >
          <primitive object={geometries.pulsingRingGeometry} />
          <meshBasicMaterial 
            color="#00ff44"
            transparent 
            opacity={0.4 + Math.sin(Date.now() * 0.003) * 0.2}
            side={DoubleSide}
          />
        </mesh>

        {/* Rotating outer glow ring - green themed */}
        <mesh
          rotation={[-Math.PI / 2, Date.now() * 0.0035, 0]}
        >
          <primitive object={geometries.outerGlowGeometry} />
          <meshBasicMaterial 
            color="#00ff33"
            transparent
            opacity={0.25}
            side={DoubleSide}
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
            <primitive object={geometries.particleGeometry} />
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
            <primitive object={geometries.meteorGeometry} />
            <primitive object={materials.meteorMaterial} />
            <pointLight color="#00ff44" intensity={5} distance={8} />
            <LegionMeteorTrail 
              meshRef={meteorMeshRef} 
              color={LEGION_GREEN_COLOR}
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
