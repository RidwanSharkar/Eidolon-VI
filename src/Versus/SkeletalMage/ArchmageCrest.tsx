import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Shape, ExtrudeGeometry } from 'three';

interface ArchmageCrestProps {
  position?: [number, number, number];
  scale?: number;
}

export default function ArchmageCrest({ position = [0, 0, 0], scale = 1 }: ArchmageCrestProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);

  // Cached materials for performance - purple theme
  const materials = useMemo(() => ({
    blade: new THREE.MeshStandardMaterial({
      color: "#8A2BE2",
      emissive: "#8A2BE2",
      emissiveIntensity: 1.3,
      metalness: 0.8,
      roughness: 0.1,
      opacity: 1,
      transparent: true,
      side: THREE.DoubleSide
    }),
    bladeCore: new THREE.MeshStandardMaterial({
      color: "#9370DB",
      emissive: "#9370DB",
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.9
    }),
    bladeGlow: new THREE.MeshStandardMaterial({
      color: "#DA70D6",
      emissive: "#DA70D6",
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.6
    })
  }), []);

  // Blade shape matching Abomination's design
  const bladeShape = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.4, -0.130);
    shape.bezierCurveTo(
      0.8, 0.22,
      1.33, 0.5,
      1.6, 0.515
    );
    shape.lineTo(1.125, 0.75);
    shape.bezierCurveTo(
      0.5, 0.2,
      0.225, 0.0,
      0.1, 0.7
    );
    shape.lineTo(0, 0);
    return shape;
  }, []);

  const bladeExtrudeSettings = useMemo(() => ({
    steps: 1,
    depth: 0.00010,
    bevelEnabled: true,
    bevelThickness: 0.030,
    bevelSize: 0.035,
    bevelSegments: 1,
    curveSegments: 16
  }), []);

  // Cached geometries
  const geometries = useMemo(() => ({
    blade: new ExtrudeGeometry(bladeShape, bladeExtrudeSettings),
    centerCore: new THREE.SphereGeometry(0.12, 12, 12),
    energyWisp: new THREE.SphereGeometry(0.04, 6, 6)
  }), [bladeShape, bladeExtrudeSettings]);

  // Animation
  useFrame((state) => {
    if (!groupRef.current || !leftWingRef.current || !rightWingRef.current) return;

    const time = state.clock.getElapsedTime();
    
    // Gentle floating motion
    groupRef.current.position.y = position[1] + Math.sin(time * 1.2) * 0.05;
    
    // Subtle rotation
    groupRef.current.rotation.y = Math.sin(time * 0.8) * 0.1;
    
    // Wing pulsing animation
    const pulseScale = 1 + Math.sin(time * 2) * 0.08;
    leftWingRef.current.scale.setScalar(pulseScale);
    rightWingRef.current.scale.setScalar(pulseScale);
    
    // Wing slight oscillation
    leftWingRef.current.rotation.z = Math.sin(time * 1.5) * 0.05;
    rightWingRef.current.rotation.z = -Math.sin(time * 1.5) * 0.05;
  });

  const createWingHalf = (isLeft: boolean) => (
    <group 
      ref={isLeft ? leftWingRef : rightWingRef}
      position={[isLeft ? -0.4 : 0.4, 0.15, 0.15]}
      rotation={[Math.PI / 4, 0, isLeft ? Math.PI / 4 : -Math.PI / 4]}
    >
      {/* Main blade wing - large primary blade */}
      <group 
        position={[isLeft ? 1.225 : -1.225, -0.1, 0.15]} 
        rotation={[
          isLeft ? Math.PI : Math.PI, 
          isLeft ? Math.PI/2 + 0.375  : Math.PI/2 - 0.375, 
          isLeft ? -Math.PI / 8 + 0.25 : -Math.PI / 8 + 0.25
        ]} 
        scale={[1.0, 0.4, 0.4]}
      >
        <mesh geometry={geometries.blade} material={materials.bladeCore}>
          <pointLight
            color="#9370DB"
            intensity={0.8}
            distance={2}
            decay={2}
          />
        </mesh>
      </group>

      {/* Secondary blade - smaller and angled */}
      <group 
        position={[isLeft ? 0.075 : -0.075, -0.2, 0.1]} 
        rotation={[
          Math.PI/2, 
          isLeft ? Math.PI/2 - 0.225 : Math.PI/2 + 0.225, 
          isLeft ? -Math.PI / 8 : -Math.PI / 8
        ]} 
        scale={[0.9, 0.3, 0.8]}
      >
        <mesh geometry={geometries.blade} material={materials.bladeCore}>
          <pointLight
            color="#9370DB"
            intensity={0.8}
            distance={1.5}
            decay={2}
          />
        </mesh>
      </group>


    </group>
  );

  return (
    <group 
      ref={groupRef} 
      position={position} 
      scale={[scale, scale, scale]}
    >
      {/* Central core orb - matching blade theme */}
      <mesh geometry={geometries.centerCore} material={materials.bladeCore}>
        {/* Central light source */}
        <pointLight 
          color="#9370DB"
          intensity={2.0}
          distance={3}
          decay={2}
        />
      </mesh>
      
      {/* Floating energy wisps around center */}
      {[0, 1, 2, 3].map((index) => {
        const angle = (index * Math.PI * 2) / 4;
        return (
          <mesh
            key={`center-wisp-${index}`}
            geometry={geometries.energyWisp}
            material={materials.bladeGlow}
            position={[
              Math.cos(angle) * 0.2,
              Math.sin(angle) * 0.1,
              Math.sin(angle) * 0.2
            ]}
          />
        );
      })}
      
      {/* Left wing half */}
      {createWingHalf(true)}
      
      {/* Right wing half */}
      {createWingHalf(false)}
      
      {/* Additional ambient lighting */}
      <pointLight 
        color="#DA70D6"
        intensity={0.8}
        distance={2}
        decay={1.5}
        position={[0, 0.2, 0]}
      />
    </group>
  );
}
