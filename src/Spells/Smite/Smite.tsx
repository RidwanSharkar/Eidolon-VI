import { useRef, useMemo } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { WeaponType } from '../../Weapons/weapons';
import * as THREE from 'three';

interface SmiteProps {
  weaponType: WeaponType;
  position: Vector3;
  onComplete: () => void;
  onHit?: () => void;
}

export default function Smite({ position, onComplete }: SmiteProps) {
  const lightningRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const animationDuration = 0.9; // Fixed animation duration (in seconds)
  const delayTimer = useRef(0);
  const startDelay = 0.05; // Initial delay

  // useMemo for static geometries
  const cylinderGeometries = useMemo(() => ({
    core: new THREE.CylinderGeometry(0.105, 0.105, 20, 16),
    inner: new THREE.CylinderGeometry(0.25, 0.25, 20, 16),
    outer: new THREE.CylinderGeometry(0.42, 0.42, 20, 16),
    glow1: new THREE.CylinderGeometry(0.6, 0.6, 20, 16),
    glow2: new THREE.CylinderGeometry(0.75, 0.6, 20, 16),
    outerGlow: new THREE.CylinderGeometry(0.8, 0.9, 20, 16),
    torus: new THREE.TorusGeometry(1.175, 0.1, 8, 32),
    skyTorus: new THREE.TorusGeometry(1, 0.1, 32, 32),
    sphere: new THREE.SphereGeometry(0.15, 8, 8)
  }), []);

  // Use useMemo for static materials
  const materials = useMemo(() => ({
    core: new THREE.MeshStandardMaterial({
      color: "#FF7300",
      emissive: "#FFD500",
      emissiveIntensity: 50,
      transparent: true,
      opacity: 0.995
    }),
    inner: new THREE.MeshStandardMaterial({
      color: "#FF7300",
      emissive: "#FFD500",
      emissiveIntensity: 25,
      transparent: true,
      opacity: 0.675
    }),
    outer: new THREE.MeshStandardMaterial({
      color: "#FF7300",
      emissive: "#FFD500",
      emissiveIntensity: 5,
      transparent: true,
      opacity: 0.625
    }),
    glow1: new THREE.MeshStandardMaterial({
      color: "#FF7300",
      emissive: "#FFD500",
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.55
    }),
    glow2: new THREE.MeshStandardMaterial({
      color: "#FF7300",
      emissive: "#FF8812",
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.425
    }),
    outerGlow: new THREE.MeshStandardMaterial({
      color: "#FF7300",
      emissive: "#FF8812",
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.2
    }),
    spiral: new THREE.MeshStandardMaterial({
      color: "#FF0000",
      emissive: "#FF8812",
      emissiveIntensity: 10,
      transparent: true,
      opacity: 0.5
    }),
    skySpiral: new THREE.MeshStandardMaterial({
      color: "#FF0000",
      emissive: "#FF8812",
      emissiveIntensity: 10,
      transparent: true,
      opacity: 0.4
    }),
    particle: new THREE.MeshStandardMaterial({
      color: "#FF0000",
      emissive: "#FF8812",
      emissiveIntensity: 10,
      transparent: true,
      opacity: 0.665
    })
  }), []);

  // Pre-calculate spiral positions
  const spiralPositions = useMemo(() => (
    Array(3).fill(0).map((_, i) => ({
      rotation: new THREE.Euler(Math.PI / 4, (i * Math.PI) / 1.5, Math.PI)
    }))
  ), []);

  // Pre-calculate sky spiral positions
  const skySpiralPositions = useMemo(() => (
    Array(16).fill(0).map((_, i) => ({
      rotation: new THREE.Euler(0, (i * Math.PI) / 1.5, 0),
      position: new THREE.Vector3(0, 7.45, 0)
    }))
  ), []);

  // Pre-calculate particle positions
  const particlePositions = useMemo(() => (
    Array(8).fill(0).map((_, i) => ({
      position: new THREE.Vector3(
        Math.cos((i * Math.PI) / 4) * 1.0,
        (i - 4) * 2,
        Math.sin((i * Math.PI) / 4) * 1.0
      )
    }))
  ), []);

  useFrame((_, delta) => {
    if (!lightningRef.current) return;

    // Handle delay before starting the lightning effect
    if (delayTimer.current < startDelay) {
      delayTimer.current += delta;
      return;
    }

    progressRef.current += delta;
    const progress = Math.min(progressRef.current / animationDuration, 1);

    // Animate the lightning bolt
    if (progress < 1) {
      // Start from high up and strike down
      const startY = 40;
      const currentY = startY * (1 - progress);
      lightningRef.current.position.y = currentY;

      // Adjust scale effect
      const scale = progress < 0.9 ? 1 : 1 - (progress - 0.9) / 0.1;
      lightningRef.current.scale.set(scale, scale, scale);
    } else {
      onComplete();
    }
  });

  return (
    <group
      ref={lightningRef}
      position={[position.x, 25, position.z]}
      visible={delayTimer.current >= startDelay}
    >
      {/* Core lightning bolts using shared geometries and materials */}
      <mesh geometry={cylinderGeometries.core} material={materials.core} />
      <mesh geometry={cylinderGeometries.inner} material={materials.inner} />
      <mesh geometry={cylinderGeometries.outer} material={materials.outer} />
      <mesh geometry={cylinderGeometries.glow1} material={materials.glow1} />
      <mesh geometry={cylinderGeometries.glow2} material={materials.glow2} />
      <mesh geometry={cylinderGeometries.outerGlow} material={materials.outerGlow} />

      {/* Spiral effect using pre-calculated positions */}
      {spiralPositions.map((props, i) => (
        <mesh key={i} rotation={props.rotation} geometry={cylinderGeometries.torus} material={materials.spiral} />
      ))}

      {/* Sky spiral effect using pre-calculated positions */}
      {skySpiralPositions.map((props, i) => (
        <mesh key={i} rotation={props.rotation} position={props.position} geometry={cylinderGeometries.skyTorus} material={materials.skySpiral} />
      ))}

      {/* Floating particles using pre-calculated positions */}
      {particlePositions.map((props, i) => (
        <mesh key={i} position={props.position} geometry={cylinderGeometries.sphere} material={materials.particle} />
      ))}

      {/* Lights */}
      <pointLight position={[0, -10, 0]} color="#ff8800" intensity={35} distance={25} />
      <pointLight position={[0, 0, 0]} color="#ffaa00" intensity={10} distance={6} />
    </group>
  );
}