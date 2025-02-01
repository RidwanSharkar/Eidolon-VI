import { useRef, useEffect, useMemo } from 'react';
import { Group, Vector3 } from 'three';
import * as THREE from 'three';
import { useOathstrikeAnimation } from '@/Spells/Oathstrike/useOathstrikeAnimation';


interface OathstrikeProps {
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
  parentRef: React.RefObject<Group>;
}

export default function Oathstrike({ position, direction, onComplete, parentRef }: OathstrikeProps) {
  const effectRef = useRef<Group>(null);
  
  // Cache geometries
  const geometries = useMemo(() => ({
    mainArc: new THREE.TorusGeometry(3, 0.8, 8, 32, Math.PI),
    innerGlow: new THREE.TorusGeometry(3, 0.4, 16, 32, Math.PI),
    outerGlow: new THREE.TorusGeometry(2, 0.9, 16, 32, Math.PI),
    particle: new THREE.SphereGeometry(0.15, 8, 8)
  }), []);

  // Cache materials
  const materials = useMemo(() => ({
    mainFlame: new THREE.MeshStandardMaterial({
      color: "#FF9748",
      emissive: "#FF6F00",
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.9
    }),
    innerGlow: new THREE.MeshStandardMaterial({
      color: "#FF9748",
      emissive: "#FF6F00",
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.7
    }),
    outerGlow: new THREE.MeshStandardMaterial({
      color: "#FF9748",
      emissive: "#FF6F00",
      emissiveIntensity: 1.3,
      transparent: true,
      opacity: 0.5
    }),
    particle: new THREE.MeshStandardMaterial({
      color: "#FF9748",
      emissive: "#FF6F00",
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.6
    })
  }), []);

  // Pre-calculate particle positions
  const particlePositions = useMemo(() => 
    Array(12).fill(0).map((_, i) => ({
      position: new THREE.Vector3(
        Math.cos((i * Math.PI) / 6) * 1.5,
        Math.sin((i * Math.PI) / 6) * 1.5,
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
      {/* Main flame arc */}
      <group position={[0, 0, 0]}>
        {/* Core flame */}
        <mesh geometry={geometries.mainArc} material={materials.mainFlame} />

        {/* Inner glow */}
        <mesh geometry={geometries.innerGlow} material={materials.innerGlow} />

        {/* Outer glow */}
        <mesh geometry={geometries.outerGlow} material={materials.outerGlow} />

        {/* Flame particles */}
        {particlePositions.map((props, i) => (
          <mesh
            key={i}
            position={props.position}
            geometry={geometries.particle}
            material={materials.particle}
          />
        ))}

        {/* Dynamic lighting */}
        <pointLight color="#FF9748" intensity={15} distance={8} />
        <pointLight color="#FF6F00" intensity={10} distance={12} />
      </group>
    </group>
  );
}
