import { useRef, useEffect, useMemo } from 'react';
import { Group, Vector3 } from 'three';
import * as THREE from 'three';
import { useOathstrikeAnimation } from '@/Spells/Oathstrike/useOathstrikeAnimation';

interface StealthStrikeEffectProps {
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
  parentRef: React.RefObject<Group>;
}

export default function StealthStrikeEffect({ position, direction, onComplete, parentRef }: StealthStrikeEffectProps) {
  const effectRef = useRef<Group>(null);
  
  // Cache geometries - same as Oathstrike
  const geometries = useMemo(() => ({
    mainArc: new THREE.TorusGeometry(1.5, 0.4, 8, 32, Math.PI),
    innerGlow: new THREE.TorusGeometry(1.5, 0.2, 16, 32, Math.PI),
    outerGlow: new THREE.TorusGeometry(1, 0.45, 16, 32, Math.PI),
    particle: new THREE.SphereGeometry(0.08, 8, 8)
  }), []);

  // Cache materials with stealth colors
  const materials = useMemo(() => ({
    mainFlame: new THREE.MeshStandardMaterial({
      color: "#9b4dff", // Purple
      emissive: "#4d2bff", // Deep purple
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.9
    }),
    innerGlow: new THREE.MeshStandardMaterial({
      color: "#4d8eff", // Blue
      emissive: "#2b4dff", // Deep blue
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.7
    }),
    outerGlow: new THREE.MeshStandardMaterial({
      color: "#9b4dff", // Purple
      emissive: "#4d2bff", // Deep purple
      emissiveIntensity: 1.3,
      transparent: true,
      opacity: 0.5
    }),
    particle: new THREE.MeshStandardMaterial({
      color: "#4d8eff", // Blue
      emissive: "#2b4dff", // Deep blue
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.6
    })
  }), []);

  const particlePositions = useMemo(() => 
    Array(12).fill(0).map((_, i) => ({
      position: new THREE.Vector3(
        Math.cos((i * Math.PI) / 6) * 0.75,
        Math.sin((i * Math.PI) / 6) * 0.75,
        0
      )
    })), 
  []);

  const { reset } = useOathstrikeAnimation({
    effectRef,
    position,
    direction,
    parentRef
  });

  useEffect(() => {
    return () => {
      reset();
      onComplete();
    };
  }, [reset, onComplete]);

  return (
    <group
      ref={effectRef}
      position={position.toArray()}
      rotation={[Math.PI/2, Math.atan2(direction.x, direction.z), 0]}
    >
      <group position={[0, 0, 0]}>
        <mesh geometry={geometries.mainArc} material={materials.mainFlame} />
        <mesh geometry={geometries.innerGlow} material={materials.innerGlow} />
        <mesh geometry={geometries.outerGlow} material={materials.outerGlow} />
        
        {particlePositions.map((props, i) => (
          <mesh
            key={i}
            position={props.position}
            geometry={geometries.particle}
            material={materials.particle}
          />
        ))}

        <pointLight color="#9b4dff" intensity={8} distance={4} />
        <pointLight color="#4d8eff" intensity={5} distance={6} />
      </group>
    </group>
  );
} 