import { useRef, useMemo, useEffect } from 'react';
import { Group, Vector3, Object3D, Material } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AbyssalSlashEffectProps {
  startPosition: Vector3;
  direction: Vector3;
  onComplete: () => void;
  onDamage?: (damage: number) => void;
  damage: number;
  parentRef: React.RefObject<Group>;
}

export default function AbyssalSlashEffect({ 
  onComplete,
  onDamage,
  damage,
  parentRef
}: AbyssalSlashEffectProps) {
  const effectRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const animationDuration = 0.2; // Match OathStrike timing
  const hasDamaged = useRef(false);
  const isActive = useRef(true);

  // Cache geometries - using OathStrike structure with green theme
  const geometries = useMemo(() => ({
    mainArc: new THREE.TorusGeometry(3, 0.8, 8, 32, Math.PI),
    innerGlow: new THREE.TorusGeometry(3, 0.4, 16, 32, Math.PI),
    outerGlow: new THREE.TorusGeometry(2, 0.9, 16, 32, Math.PI),
    particle: new THREE.SphereGeometry(0.15, 8, 8)
  }), []);

  // Green materials matching Scythe theme
  const materials = useMemo(() => ({
    mainFlame: new THREE.MeshStandardMaterial({
      color: "#17CE54", // Scythe green
      emissive: "#00ff44", // Bright green
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.9
    }),
    innerGlow: new THREE.MeshStandardMaterial({
      color: "#17CE54",
      emissive: "#00ff44",
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.7
    }),
    outerGlow: new THREE.MeshStandardMaterial({
      color: "#17CE54",
      emissive: "#00ff44",
      emissiveIntensity: 1.3,
      transparent: true,
      opacity: 0.5
    }),
    particle: new THREE.MeshStandardMaterial({
      color: "#17CE54",
      emissive: "#00ff44",
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.6
    })
  }), []);

  // Pre-calculate particle positions (same as OathStrike)
  const particlePositions = useMemo(() => 
    Array(12).fill(0).map((_, i) => ({
      position: new THREE.Vector3(
        Math.cos((i * Math.PI) / 6) * 1.5,
        Math.sin((i * Math.PI) / 6) * 1.5,
        0
      )
    })), 
  []);

  useEffect(() => {
    const currentEffect = effectRef.current;
    
    return () => {
      isActive.current = false;
      if (currentEffect) {
        currentEffect.scale.set(0, 0, 0);
      }
    };
  }, []);

  useFrame((_, delta) => {
    if (!effectRef.current || !isActive.current || !parentRef.current) return;

    progressRef.current += delta;
    const progress = progressRef.current / animationDuration;

    // Trigger damage at peak of animation (around 50% progress)
    if (progress >= 0.5 && !hasDamaged.current && onDamage) {
      onDamage(damage);
      hasDamaged.current = true;
    }

    if (progress <= 1) {
      // Position and rotation logic from OathStrike
      const parentQuaternion = parentRef.current.quaternion;
      
      // Create the forward vector and apply parent's rotation
      const forward = new THREE.Vector3(0, 0, 2);
      forward.applyQuaternion(parentQuaternion);
      
      // Position the effect
      effectRef.current.position.copy(parentRef.current.position)
        .add(forward)
        .setY(0.1);
      
      // Quaternion for laying flat (-90 degrees around X axis)
      const flatRotation = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(-1, 0, 0),
        -Math.PI/2
      );
      
      // Combine the flat rotation with the parent's rotation
      effectRef.current.quaternion.copy(parentQuaternion)
        .multiply(flatRotation);

      // Scale and fade effects (33% smaller than OathStrike)
      const scale = Math.sin(progress * Math.PI) * 1.0; // Reduced from 1.5 to 1.0 (33% smaller)
      effectRef.current.scale.set(scale, scale, scale * 0.5);

      effectRef.current.traverse((child: Object3D) => {
        const material = (child as THREE.Mesh).material as Material & { opacity?: number };
        if (material?.opacity !== undefined) {
          material.opacity = Math.sin(progress * Math.PI);
        }
      });
    } else {
      isActive.current = false;
      if (effectRef.current) {
        effectRef.current.scale.set(0, 0, 0);
      }
      onComplete();
    }
  });

  return (
    <group ref={effectRef}>
      {/* Main flame arc - green theme */}
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

        {/* Dynamic lighting - green theme */}
        <pointLight color="#17CE54" intensity={15} distance={8} />
        <pointLight color="#00ff44" intensity={10} distance={12} />
      </group>
    </group>
  );
}
