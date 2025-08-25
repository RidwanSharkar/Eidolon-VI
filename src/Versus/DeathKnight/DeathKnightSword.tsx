// src/Versus/DeathKnight/DeathKnightSword.tsx
import React from 'react';
import { Shape } from 'three';
import * as THREE from 'three';

export default function DeathKnightSword() {
  // Create custom sword blade shape - larger version
  const createBladeShape = () => {
    const shape = new Shape();
    
    // Start at center
    shape.moveTo(0, 0);
    
    // Left side guard
    shape.lineTo(-0.4, 0.4);  
    shape.lineTo(-0.24, -0.24); 
    shape.lineTo(0, 0);
    
    // Right side guard
    shape.lineTo(0.4, 0.4);
    shape.lineTo(0.24, -0.24);
    shape.lineTo(0, 0);
    
    // Blade shape - scaled up
    shape.lineTo(0, 0.12);
    shape.lineTo(0.32, 0.32);
    shape.quadraticCurveTo(1.28, 0.24, 2.4, 0.29);
    shape.quadraticCurveTo(3.2, 0.16, 3.52, 0);
    
    shape.quadraticCurveTo(3.2, -0.16, 2.4, -0.29);
    shape.quadraticCurveTo(1.28, -0.24, 0.32, -0.32);
    shape.lineTo(0, -0.12);
    shape.lineTo(0, 0);
    
    return shape;
  };

  // Inner blade shape - larger version
  const createInnerBladeShape = () => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    
    shape.lineTo(0, 0.096);   
    shape.lineTo(0.24, 0.24); 
    shape.quadraticCurveTo(1.92, 0.19, 2.4, 0.24); 
    shape.quadraticCurveTo(3.2, 0.13, 3.44, 0);    
    shape.quadraticCurveTo(3.2, -0.13, 2.4, -0.24); 
    shape.quadraticCurveTo(1.92, -0.19, 0.24, -0.24);
    shape.lineTo(0, -0.08);  
    shape.lineTo(0, 0);
    
    return shape;
  };

  const bladeExtrudeSettings = {
    steps: 2,
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.032,
    bevelOffset: 0.064,
    bevelSegments: 2
  };

  const innerBladeExtrudeSettings = {
    ...bladeExtrudeSettings,
    depth: 0.096,
    bevelThickness: 0.032,
    bevelSize: 0.032,
    bevelOffset: 0,
    bevelSegments: 6
  };

  return (
    <group rotation={[-0.575, 0, 0.2]} scale={[1.6, 1.6, 1.6]}>
      <group 
        position={[0, 0, 0]}
        rotation={[0, 0, Math.PI]}
        scale={[0.7, 0.7, 0.7]} 
      >
        {/* Handle - larger and darker */}
        <group position={[-0.04, -0.88, 0.56]} rotation={[0, 0, -Math.PI]}>
          <mesh>
            <cylinderGeometry args={[0.048, 0.064, 1.44, 12]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
          </mesh>
          
          {/* Handle wrappings - darker */}
          {[...Array(10)].map((_, i) => (
            <mesh key={i} position={[0, +0.56 - i * 0.176, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.072, 0.0256, 8, 16]} />
              <meshStandardMaterial color="#0a0a0a" metalness={0.4} roughness={0.6} />
            </mesh>
          ))}
        </group>
        
        {/* CIRCLE CONNECTION POINT - larger and darker */}
        <group position={[-0.04, 0.36, 0.56]} rotation={[Math.PI, 1.5, Math.PI]}>
          {/* Large torus */}
          <mesh>
            <torusGeometry args={[0.416, 0.112, 16, 32]} />
            <meshStandardMaterial 
              color="#2a2a2a" 
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          
          {/* Decorative spikes around torus - more menacing */}
          {[...Array(8)].map((_, i) => (
            <mesh 
              key={`spike-${i}`} 
              position={[
                0.4 * Math.cos(i * Math.PI / 4),
                0.4 * Math.sin(i * Math.PI / 4),
                0
              ]}
              rotation={[0, 0, i * Math.PI / 4 - Math.PI / 2]}
            >
              <coneGeometry args={[0.112, 0.88, 3]} />
              <meshStandardMaterial 
                color="#1a1a1a"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          ))}
          
          {/* CORE ORB - light purple */}
          <mesh>
            <sphereGeometry args={[0.248, 16, 16]} />
            <meshStandardMaterial
              color="#DDA0DD"         // Light purple (plum)
              emissive="#DDA0DD"      // Light purple emission
              emissiveIntensity={1.5}
              transparent
              opacity={1}
            />
          </mesh>
          
          {/* Multiple glow layers for depth - light purple theme */}
          <mesh>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial
              color="#DDA0DD"
              emissive="#DDA0DD"
              emissiveIntensity={25}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          <mesh>
            <sphereGeometry args={[0.232, 16, 16]} />
            <meshStandardMaterial
              color="#DDA0DD"
              emissive="#DA70D6"
              emissiveIntensity={20}
              transparent
              opacity={0.6}
            />
          </mesh>
          
          <mesh>
            <sphereGeometry args={[0.28, 16, 16]} />
            <meshStandardMaterial
              color="#DDA0DD"
              emissive="#DA70D6"
              emissiveIntensity={15}
              transparent
              opacity={0.4}
            />
          </mesh>

          {/* Light purple point light */}
          <pointLight 
            color="#DDA0DD"
            intensity={1.5}
            distance={1.2}
            decay={2}
          />
        </group>
        
        {/* Blade - light purple colors */}
        <group position={[0, 0.8, 0.56]} rotation={[0, -Math.PI / 2, Math.PI / 2]}>
          {/* Base blade */}
          <mesh>
            <extrudeGeometry args={[createBladeShape(), bladeExtrudeSettings]} />
            <meshStandardMaterial 
              color="#D8BFD8"  // Thistle (light purple)
              emissive="#DA70D6" // Orchid emission
              emissiveIntensity={1.8}
              metalness={0.6}
              roughness={0.2}
            />
          </mesh>
          
          {/* BLADE Glowing core - light purple */}
          <mesh>
            <extrudeGeometry args={[createInnerBladeShape(), innerBladeExtrudeSettings]} />
            <meshStandardMaterial 
              color="#DDA0DD"  // Plum
              emissive="#DA70D6" // Orchid emission
              emissiveIntensity={3}
              metalness={0.4}
              roughness={0.2}
              opacity={0.9}
              transparent
            />
          </mesh>
        </group>

        {/* Light purple energy aura around the weapon */}
        <group position={[0, 0.4, 0.56]}>
          <mesh>
            <sphereGeometry args={[1.2, 12, 12]} />
            <meshStandardMaterial
              color="#E6E6FA"  // Lavender
              emissive="#DA70D6"  // Orchid
              emissiveIntensity={0.8}
              transparent
              opacity={0.1}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}