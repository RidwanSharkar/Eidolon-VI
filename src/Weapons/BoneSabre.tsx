// src/Weapons/BoneSabre.tsx
import React from 'react';
import { Shape, ExtrudeGeometry, CylinderGeometry, TorusGeometry, MeshStandardMaterial } from 'three';

// MEMORY FIX: Create blade shapes at module level
const createBladeShape = (): Shape => {
  const shape = new Shape();

  // Start at center
  shape.moveTo(0, 0);

  // Ornate guard shape
  shape.lineTo(-0.15, 0.1);
  shape.lineTo(-0.2, 0);  // Deeper notch
  shape.lineTo(-0.2, -0.05);
  shape.lineTo(0, 0);

  // Mirror for right side of guard
  shape.lineTo(0.15, 0.1);
  shape.lineTo(0.2, 0);   // Deeper notch
  shape.lineTo(0.3, 0.0);
  shape.lineTo(0, 0);

  // Elegant curved blade shape
  shape.lineTo(0, 0.05);
  // Graceful curve up
  shape.quadraticCurveTo(0.3, 0.15, 0.5, 0.2);
  shape.quadraticCurveTo(0.7, 0.25, 0.9, 0.15);
  // Sharp elegant tip
  shape.quadraticCurveTo(1.0, 0.1, 1.1, 0);
  // Sweeping bottom curve with notch
  shape.quadraticCurveTo(1.0, -0.05, 0.8, -0.1);
  // Distinctive notch
  shape.lineTo(0.7, -0.15);
  shape.lineTo(0.65, -0.1);
  // Continue curve to handle
  shape.quadraticCurveTo(0.4, -0.08, 0.2, -0.05);
  shape.quadraticCurveTo(0.1, -0.02, 0, 0);

  return shape;
};

const createInnerBladeShape = (): Shape => {
  const shape = new Shape();

  // Start at center
  shape.moveTo(0, 0);

  // Ornate guard shape (slightly smaller)
  shape.lineTo(-0.13, 0.08);
  shape.lineTo(-0.18, 0);
  shape.lineTo(-0.08, -0.04);
  shape.lineTo(0, 0);

  // Mirror for right side
  shape.lineTo(0.13, 0.08);
  shape.lineTo(0.18, 0);
  shape.lineTo(0.08, -0.04);
  shape.lineTo(0, 0);

  // Elegant curved blade shape (slightly smaller)
  shape.lineTo(0, 0.04);
  // Graceful curve up
  shape.quadraticCurveTo(0.28, 0.13, 0.48, 0.18);
  shape.quadraticCurveTo(0.68, 0.23, 0.88, 0.13);
  // Sharp elegant tip
  shape.quadraticCurveTo(0.98, 0.08, 1.08, 0);
  // Sweeping bottom curve with notch
  shape.quadraticCurveTo(0.98, -0.04, 0.78, -0.08);
  // Distinctive notch
  shape.lineTo(0.68, -0.13);
  shape.lineTo(0.63, -0.08);
  // Continue curve to handle
  shape.quadraticCurveTo(0.38, -0.06, 0.18, -0.04);
  shape.quadraticCurveTo(0.08, -0.02, 0, 0);

  return shape;
};

// Pre-create shapes
const BLADE_SHAPE = createBladeShape();
const INNER_BLADE_SHAPE = createInnerBladeShape();

// Extrude settings
const bladeExtrudeSettings = {
  steps: 2,
  depth: 0.02,
  bevelEnabled: true,
  bevelThickness: 0.004,
  bevelSize: 0.008,
  bevelSegments: 3,
};

const innerBladeExtrudeSettings = {
  ...bladeExtrudeSettings,
  depth: 0.025,
  bevelThickness: 0.003,
  bevelSize: 0.004,
  bevelOffset: 0,
};

// MEMORY FIX: Cached geometries - created once at module load
const CACHED_GEOMETRIES = {
  blade: new ExtrudeGeometry(BLADE_SHAPE, bladeExtrudeSettings),
  innerBlade1: new ExtrudeGeometry(INNER_BLADE_SHAPE, innerBladeExtrudeSettings),
  innerBlade2: new ExtrudeGeometry(INNER_BLADE_SHAPE, { ...innerBladeExtrudeSettings, depth: 0.04 }),
  innerBlade3: new ExtrudeGeometry(INNER_BLADE_SHAPE, { ...innerBladeExtrudeSettings, depth: 0.06 }),
  innerBlade4: new ExtrudeGeometry(INNER_BLADE_SHAPE, { ...innerBladeExtrudeSettings, depth: 0.08 }),
  handleCylinder: new CylinderGeometry(0.015, 0.02, 0.45, 12),
  handleWrapping: new TorusGeometry(0.0225, 0.004, 8, 16)
};

// MEMORY FIX: Cached materials - created once at module load
const CACHED_MATERIALS = {
  handle: new MeshStandardMaterial({ color: "#2a3b4c", roughness: 0.7 }),
  handleWrapping: new MeshStandardMaterial({ color: "#1a2b3c", metalness: 0.6, roughness: 0.4 }),
  blade0: new MeshStandardMaterial({
    color: "#8B0000",
    emissive: "#8B0000",
    emissiveIntensity: 1,
    metalness: 0.9,
    roughness: 0.2,
    opacity: 0.9,
    transparent: true
  }),
  blade1: new MeshStandardMaterial({
    color: "#A00000",
    emissive: "#A00000",
    emissiveIntensity: 1,
    metalness: 0.9,
    roughness: 0.1,
    opacity: 0.95,
    transparent: true
  }),
  blade2: new MeshStandardMaterial({
    color: "#B00000",
    emissive: "#B00000",
    emissiveIntensity: 1,
    metalness: 0.8,
    roughness: 0.1,
    opacity: 0.7,
    transparent: true
  }),
  blade3: new MeshStandardMaterial({
    color: "#C00000",
    emissive: "#C00000",
    emissiveIntensity: 1,
    metalness: 0.7,
    roughness: 0.1,
    opacity: 0.4,
    transparent: true
  }),
  blade4: new MeshStandardMaterial({
    color: "#D00000",
    emissive: "#D00000",
    emissiveIntensity: 1,
    metalness: 0.6,
    roughness: 0.1,
    opacity: 0.2,
    transparent: true
  })
};

// Pre-computed wrapping positions
const WRAPPING_POSITIONS = [0.175, 0.11, 0.045, -0.02];

export default function BoneSabre() {
  return (
    <group 
      position={[0, 0, 0]} 
      rotation={[0, 0, 0]}
      scale={[0.8, 0.8, 0.8]}
    >
      {/* Handle */}
      <group position={[0, -0.2, 0]} rotation={[0, 0, -Math.PI]}>
        <mesh geometry={CACHED_GEOMETRIES.handleCylinder} material={CACHED_MATERIALS.handle} />
        
        {/* Handle wrappings */}
        {WRAPPING_POSITIONS.map((yPos, i) => (
          <mesh 
            key={i} 
            position={[0, yPos, 0]}
            geometry={CACHED_GEOMETRIES.handleWrapping}
            material={CACHED_MATERIALS.handleWrapping}
          />
        ))}
      </group>
      
      {/* Blade */}
      <group position={[0, 0.3, 0.0]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
        {/* Base blade */}
        <mesh geometry={CACHED_GEOMETRIES.blade} material={CACHED_MATERIALS.blade0} />
        
        {/* Inner glow - dark crimson core */}
        <mesh geometry={CACHED_GEOMETRIES.innerBlade1} material={CACHED_MATERIALS.blade1} />
        
        {/* Middle ethereal layer */}
        <mesh geometry={CACHED_GEOMETRIES.innerBlade2} material={CACHED_MATERIALS.blade2} />
        
        {/* Outer ethereal glow */}
        <mesh geometry={CACHED_GEOMETRIES.innerBlade3} material={CACHED_MATERIALS.blade3} />
        
        {/* Additional outer glow */}
        <mesh geometry={CACHED_GEOMETRIES.innerBlade4} material={CACHED_MATERIALS.blade4} />
        
        {/* Point light for local illumination */}
        <pointLight
          color="#8B0000"
          intensity={1}
          distance={2}
          decay={2}
        />
      </group>
    </group>
  );
}
