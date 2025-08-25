import React, { useRef, useMemo } from 'react';
import { Group, Vector3, Shape } from 'three';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import HolyTrail from './HolyTrail';

interface AegisProjectileProps {
  position: Vector3;
  rotation?: Vector3;
  scale?: number;
  opacity?: number;
}

export default function AegisProjectile({ 
  position, 
  rotation = new Vector3(0, 0, 0),
  scale = 1,
  opacity = 1 
}: AegisProjectileProps) {
  const projectileRef = useRef<Group>(null);

  // Create shield shape similar to the actual shield but simplified for projectile
  const createShieldShape = useMemo(() => {
    const shape = new Shape();
    
    // Start at bottom center point
    shape.moveTo(0, 0);
    
    // Bottom left angular edge
    shape.lineTo(-0.06, 0.02);
    shape.lineTo(-0.14, 0.06);
    shape.lineTo(-0.18, 0.14);
    shape.lineTo(-0.20, 0.22);
    
    // Left side with angular segments
    shape.lineTo(-0.18, 0.32);
    shape.lineTo(-0.15, 0.42);
    shape.lineTo(-0.10, 0.50);
    shape.lineTo(-0.04, 0.56);
    
    // Top angular section
    shape.lineTo(0, 0.60);
    
    // Right side (mirrored)
    shape.lineTo(0.04, 0.56);
    shape.lineTo(0.10, 0.50);
    shape.lineTo(0.15, 0.42);
    shape.lineTo(0.18, 0.32);
    shape.lineTo(0.20, 0.22);
    shape.lineTo(0.18, 0.14);
    shape.lineTo(0.14, 0.06);
    shape.lineTo(0.06, 0.02);
    shape.lineTo(0, 0);
    
    return shape;
  }, []);

  // Create cross pattern for the center
  const createCrossPattern = useMemo(() => {
    const shape = new Shape();
    
    // Vertical bar
    shape.moveTo(-0.015, 0.18);
    shape.lineTo(0.015, 0.18);
    shape.lineTo(0.015, 0.42);
    shape.lineTo(-0.015, 0.42);
    shape.lineTo(-0.015, 0.18);
    
    return shape;
  }, []);

  // Create horizontal cross bar
  const createHorizontalCross = useMemo(() => {
    const shape = new Shape();
    
    // Horizontal bar
    shape.moveTo(-0.06, 0.28);
    shape.lineTo(0.06, 0.28);
    shape.lineTo(0.06, 0.32);
    shape.lineTo(-0.06, 0.32);
    shape.lineTo(-0.06, 0.28);
    
    return shape;
  }, []);

  // Cache geometries and materials
  const geometries = useMemo(() => ({
    shield: new THREE.ExtrudeGeometry(createShieldShape, {
      steps: 1,
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.008,
      bevelOffset: 0.001,
      bevelSegments: 3
    }),
    cross: new THREE.ExtrudeGeometry(createCrossPattern, {
      steps: 1,
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.004,
      bevelOffset: 0.001,
      bevelSegments: 2
    }),
    horizontalCross: new THREE.ExtrudeGeometry(createHorizontalCross, {
      steps: 1,
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.004,
      bevelOffset: 0.001,
      bevelSegments: 2
    }),
    gem: new THREE.SphereGeometry(0.025, 8, 8)
  }), [createShieldShape, createCrossPattern, createHorizontalCross]);

  const materials = useMemo(() => ({
    shield: new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xB8860B),
      metalness: 0.95,
      roughness: 0.05,
      emissive: new THREE.Color(0x4A4A00),
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: opacity
    }),
    cross: new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xFFD700),
      metalness: 0.85,
      roughness: 0.03,
      emissive: new THREE.Color(0xFFA500),
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: opacity
    }),
    gem: new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xFFD700),
      emissive: new THREE.Color(0xFFD700),
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: opacity * 0.9,
      metalness: 0.1,
      roughness: 0.05
    }),
    glow: new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xFFD700),
      emissive: new THREE.Color(0xFFD700),
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: opacity * 0.3,
      blending: THREE.AdditiveBlending
    })
  }), [opacity]);

  // Apply external rotation if provided (removed spinning animation)
  useFrame(() => {
    if (!projectileRef.current) return;
    
    // Apply external rotation if provided
    if (rotation) {
      projectileRef.current.rotation.x = rotation.x;
      projectileRef.current.rotation.y = rotation.y;
      // Removed z rotation to fix HolyTrail visual issues
    }
  });

  return (
    <>
      {/* Holy Trail - outside the moving group to avoid coordinate conflicts */}
      <HolyTrail
        color={new THREE.Color(0xFFD700)}
        size={0.45}
        meshRef={projectileRef}
        opacity={opacity}
      />
      
      <group
        ref={projectileRef}
        position={position.toArray()}
        scale={[scale, scale, scale]}
      >
        {/* Main shield body */}
        <mesh geometry={geometries.shield} material={materials.shield} />
        
        {/* Cross pattern vertical */}
        <mesh 
          position={[0, 0, 0.005]}
          geometry={geometries.cross} 
          material={materials.cross} 
        />

        {/* Cross pattern horizontal */}
        <mesh 
          position={[0, 0, 0.005]}
          geometry={geometries.horizontalCross} 
          material={materials.cross} 
        />
        
        {/* Central gem */}
        <mesh 
          position={[0, 0.30, 0.008]}
          geometry={geometries.gem} 
          material={materials.gem} 
        />

        {/* Holy glow effect */}
        <mesh 
          geometry={geometries.shield} 
          material={materials.glow}
          scale={[1.1, 1.1, 1.1]}
        />

        {/* Point light for divine glow */}
        <pointLight 
          color={new THREE.Color(0xFFD700)}
          intensity={1.5}
          distance={3.0}
          decay={2}
        />
      </group>
    </>
  );
}
