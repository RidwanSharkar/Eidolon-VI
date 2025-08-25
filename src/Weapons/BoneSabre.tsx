// src/Weapons/BoneSabre.tsx
import React from 'react';
import { Shape } from 'three';

export default function BoneSabre() {
  // Create custom sabre blade shape (curved ornate style)
  const createBladeShape = () => {
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

  // Make inner blade shape match outer blade
  const createInnerBladeShape = () => {
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

  // Update blade extrude settings for an even thinner blade
  const bladeExtrudeSettings = {
    steps: 2,
    depth: 0.02, // Even thinner blade
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

  return (
    <group 
      position={[0, 0, 0]} 
      rotation={[0, 0, 0]}
      scale={[0.8, 0.8, 0.8]}
    >
      {/* Handle */}
      <group position={[0, -0.2, 0]} rotation={[0, 0, -Math.PI]}>
        <mesh>
          <cylinderGeometry args={[0.015, 0.02, 0.45, 12]} />
          <meshStandardMaterial color="#2a3b4c" roughness={0.7} />
        </mesh>
        
        {/* Handle wrappings */}
        {[...Array(4)].map((_, i) => (
          <mesh key={i} position={[0, 0.175 - i * 0.065, 0]}>
            <torusGeometry args={[0.0225, 0.004, 8, 16]} />
            <meshStandardMaterial color="#1a2b3c" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>
      
              {/* Blade */}
      <group position={[0, 0.3, 0.0]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
        {/* Base blade */}
        <mesh>
          <extrudeGeometry args={[createBladeShape(), bladeExtrudeSettings]} />
          <meshStandardMaterial 
            color="#8B0000"  // Dark crimson base
            emissive="#8B0000"  // Dark crimson emission
            emissiveIntensity={1}
            metalness={0.9}
            roughness={0.2}
            opacity={0.9}
            transparent
          />
        </mesh>
        
        {/* Inner glow - dark crimson core */}
        <mesh>
          <extrudeGeometry args={[createInnerBladeShape(), innerBladeExtrudeSettings]} />
          <meshStandardMaterial 
            color="#A00000"
            emissive="#A00000"
            emissiveIntensity={1}
            metalness={0.9}
            roughness={0.1}
            opacity={0.95}
            transparent
          />
        </mesh>
        
        {/* Middle ethereal layer */}
        <mesh>
          <extrudeGeometry args={[createInnerBladeShape(), {
            ...innerBladeExtrudeSettings,
            depth: 0.04
          }]} />
          <meshStandardMaterial 
            color="#B00000"
            emissive="#B00000"
            emissiveIntensity={1}
            metalness={0.8}
            roughness={0.1}
            opacity={0.7}
            transparent
          />
        </mesh>
        
        {/* Outer ethereal glow */}
        <mesh>
          <extrudeGeometry args={[createInnerBladeShape(), {
            ...innerBladeExtrudeSettings,
            depth: 0.06
          }]} />
          <meshStandardMaterial 
            color="#C00000"
            emissive="#C00000"
            emissiveIntensity={1}
            metalness={0.7}
            roughness={0.1}
            opacity={0.4}
            transparent
          />
        </mesh>
        
        {/* Additional outer glow */}
        <mesh>
          <extrudeGeometry args={[createInnerBladeShape(), {
            ...innerBladeExtrudeSettings,
            depth: 0.08
          }]} />
          <meshStandardMaterial 
            color="#D00000"
            emissive="#D00000"
            emissiveIntensity={1}
            metalness={0.6}
            roughness={0.1}
            opacity={0.2}
            transparent
          />
        </mesh>
        
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
