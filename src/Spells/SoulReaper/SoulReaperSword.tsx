import React, { useRef, useState, useEffect } from 'react';
import { Group, Vector3, Shape } from 'three';
import { useFrame } from '@react-three/fiber';
import { Enemy } from '@/Versus/enemy';
import * as THREE from 'three';

interface SoulReaperSwordProps {
  targetId: string;
  enemyData: Enemy[];
  fallbackPosition: Vector3;
  onImpact: () => void;
  shouldDrop?: boolean; // Controls whether sword should drop or stay positioned above enemy
}



export default function SoulReaperSword({ targetId, enemyData, fallbackPosition, onImpact, shouldDrop = false }: SoulReaperSwordProps) {
  const groupRef = useRef<Group>(null);
  const swordRef = useRef<Group>(null);
  const [hasImpacted, setHasImpacted] = useState(false);
  const [showImpactEffect, setShowImpactEffect] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [fallTime, setFallTime] = useState(0);


  const startHeight = 8; // Higher starting height for more visible fall
  const fallDuration = 0.5; // 0.5 seconds to fall and sync with damage
  const fallSpeed = (startHeight - 0.5) / fallDuration; // Calculate speed to fall in exactly 0.5 seconds

  useEffect(() => {
    if (groupRef.current) {
      // Position sword above initial target position
      groupRef.current.position.copy(fallbackPosition);
      groupRef.current.position.y = startHeight;
    }
    
    // Ensure sword is visible when component mounts
    setIsVisible(true);
    setHasImpacted(false);
    setShowImpactEffect(false);
  }, [fallbackPosition]);

  useFrame((_, delta) => {
    if (!groupRef.current || hasImpacted) return;

    // Update fall time for gentle rotation
    setFallTime(prev => prev + delta);

    // Find the current enemy position
    const target = enemyData.find(enemy => enemy.id === targetId);
    let targetPosition = fallbackPosition;
    
    if (target && target.health > 0 && !target.isDying && !target.deathStartTime) {
      targetPosition = target.position;
    }

    // Update sword's horizontal position to follow the target
    groupRef.current.position.x = targetPosition.x;
    groupRef.current.position.z = targetPosition.z;

    // Only move sword downward if shouldDrop is true
    if (shouldDrop) {
      // Move sword downward
      groupRef.current.position.y -= fallSpeed * delta;

      // Check if reached target height (ground level or slightly above)
      if (groupRef.current.position.y <= Math.max(targetPosition.y + 0.5, 0.5)) {
        setHasImpacted(true);
        setShowImpactEffect(true);
        
        // Blastwave effect removed for better visibility

        
        onImpact();

        // Hide the sword and show impact effect
        setIsVisible(false);
        
        // Remove impact effect after duration (longer visibility for calmer effect)
        setTimeout(() => {
          setShowImpactEffect(false);
        }, 3000); // Longer impact effect visibility
        

      }
    } else {
      // Keep sword positioned above the enemy
      groupRef.current.position.y = targetPosition.y + startHeight;
    }

    // Add rotation effects
    if (swordRef.current) {
      if (shouldDrop) {
        // When falling, add spinning rotation in X-Y plane
        const spinSpeed = 10; // Rotations per second
        swordRef.current.rotation.x = 0; // Fast X rotation for spinning effect
        swordRef.current.rotation.y = fallTime * spinSpeed; // Slightly different Y rotation for more dynamic spin
        swordRef.current.rotation.z = 0; // No Z rotation
      } else {
        // When hovering, just gentle Y rotation
        swordRef.current.rotation.y = fallTime * 10; // Slow rotation
        swordRef.current.rotation.x = 0;
        swordRef.current.rotation.z = 0;
      }
    }
  });

  // Create custom sword blade shape (similar to main Sword component)
  const createBladeShape = () => {
    const shape = new Shape();
    
    // Start at center
    shape.moveTo(0, 0);
    
    // Left side guard (fixed symmetry)
    shape.lineTo(-0.25, 0.25);  
    shape.lineTo(-0.15, -0.15); 
    shape.lineTo(0, 0);
    
    // Right side guard (matches left exactly)
    shape.lineTo(0.25, 0.25);
    shape.lineTo(0.15, -0.15);
    shape.lineTo(0, 0);
    
    // Blade shape with symmetry
    shape.lineTo(0, 0.08);    
    shape.lineTo(0.2, 0.2);   
    shape.quadraticCurveTo(0.8, 0.15, 1.5, 0.18);
    shape.quadraticCurveTo(2.0, 0.1, 2.2, 0);     
    
    shape.quadraticCurveTo(2.0, -0.1, 1.5, -0.18);
    shape.quadraticCurveTo(0.8, -0.15, 0.2, -0.2);
    shape.lineTo(0, -0.08);   
    shape.lineTo(0, 0);
    
    return shape;
  };

  // inner blade shape 
  const createInnerBladeShape = () => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    
    shape.lineTo(0, 0.06);   
    shape.lineTo(0.15, 0.15); 
    shape.quadraticCurveTo(1.2, 0.12, 1.5, 0.15); 
    shape.quadraticCurveTo(2.0, 0.08, 2.15, 0);    
    shape.quadraticCurveTo(2.0, -0.08, 1.5, -0.15); 
    shape.quadraticCurveTo(1.2, -0.12, 0.15, -0.15);
    shape.lineTo(0, -0.05);  
    shape.lineTo(0, 0);
    
    return shape;
  };

  const bladeExtrudeSettings = {
    steps: 2,
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.02,
    bevelOffset: 0.04,
    bevelSegments: 2
  };

  const innerBladeExtrudeSettings = {
    ...bladeExtrudeSettings,
    depth: 0.06,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 6
  };

  // Don't render anything if impact effect is done
  if (hasImpacted && !showImpactEffect) return null;

  return (
    <group ref={groupRef}>
      {/* Soul Reaper Sword - pointing downward */}
      {isVisible && !hasImpacted && (
        <group ref={swordRef} rotation={[Math.PI, 0, Math.PI]} scale={[1.2, 1.2, 1.0]}>
          {/* Handle */}
          <group position={[-0.025, 0.55, 0.35]} rotation={[0, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.03, 0.04, 0.9, 12]} />
                          <meshStandardMaterial 
              color="#8A2BE2" 
              emissive="#9370DB"
              emissiveIntensity={0.3}
              roughness={0.7} 
            />
            </mesh>
            
            {/* Handle wrappings */}
            {[...Array(8)].map((_, i) => (
              <mesh key={i} position={[0, +0.35 - i * 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.045, 0.016, 8, 16]} />
                <meshStandardMaterial 
                  color="#8A2BE2" 
                  emissive="#9370DB"
                  emissiveIntensity={0.4}
                  metalness={0.6} 
                  roughness={0.4} 
                />
              </mesh>
            ))}
          </group>
          
          {/* CIRCLE CONNECTION POINT */}
          <group position={[-0.025, -0.225, 0.35]} rotation={[0, 1.5, 0]}>
            {/* Large torus */}
            <mesh>
              <torusGeometry args={[0.26, 0.07, 16, 32]} />
              <meshStandardMaterial 
                color="#8A2BE2" 
                emissive="#9370DB"
                emissiveIntensity={0.5}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            
            {/* Decorative spikes around torus */}
            {[...Array(8)].map((_, i) => (
              <mesh 
                key={`spike-${i}`} 
                position={[
                  0.25 * Math.cos(i * Math.PI / 4),
                  0.25 * Math.sin(i * Math.PI / 4),
                  0
                ]}
                rotation={[0, 0, i * Math.PI / 4 - Math.PI / 2]}
              >
                <coneGeometry args={[0.070, 0.55, 3]} />
                <meshStandardMaterial 
                  color="#8A2BE2"
                  emissive="#9370DB"
                  emissiveIntensity={0.6}
                  metalness={0.9}
                  roughness={0.1}
                />
              </mesh>
            ))}
            
            {/* Core orb - purple */}
            <mesh>
              <sphereGeometry args={[0.155, 16, 16]} />
              <meshStandardMaterial
                color={new THREE.Color(0x8A2BE2)}         
                emissive={new THREE.Color(0x9370DB)}      
                emissiveIntensity={1.5}                    
                transparent
                opacity={1}
              />
            </mesh>
            
            {/* Multiple glow layers for depth */}
            <mesh>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial
                color={new THREE.Color(0x8A2BE2)}
                emissive={new THREE.Color(0x9370DB)}
                emissiveIntensity={2}
                transparent
                opacity={0.8}
              />
            </mesh>
            
            <mesh>
              <sphereGeometry args={[0.145, 16, 16]} />
              <meshStandardMaterial
                color={new THREE.Color(0x8A2BE2)}
                emissive={new THREE.Color(0x9370DB)}
                emissiveIntensity={1.8}
                transparent
                opacity={0.6}
              />
            </mesh>

            {/* Enhanced point light */}
            <pointLight 
              color={new THREE.Color(0x8A2BE2)}
              intensity={1.5}
              distance={6}
              decay={2}
            />
          </group>
          
          {/* Blade pointing downward */}
          <group position={[0, -0.5, 0.35]} rotation={[0, -Math.PI / 2, -Math.PI / 2]}>
            {/* Base blade */}
            <mesh>
              <extrudeGeometry args={[createBladeShape(), bladeExtrudeSettings]} />
              <meshStandardMaterial 
                color={new THREE.Color(0x8A2BE2)}  
                emissive={new THREE.Color(0x8A2BE2)}
                emissiveIntensity={1.8}
                metalness={0.3}
                roughness={0.1}
              />
            </mesh>
            
            {/* BLADE Glowing core */}
            <mesh>
              <extrudeGeometry args={[createInnerBladeShape(), innerBladeExtrudeSettings]} />
              <meshStandardMaterial 
                color={new THREE.Color(0x9370DB)}  
                emissive={new THREE.Color(0x9370DB)}
                emissiveIntensity={3}
                metalness={0.2}
                roughness={0.1}
                opacity={0.8}
                transparent
              />
            </mesh>
          </group>

          {/* Falling trail effect - aligned with sword center */}
          <mesh position={[0, 3, 0.35]} scale={[0.8, 8, 0.8]}>
            <cylinderGeometry args={[0.15, 0.4, 4, 8]} />
            <meshStandardMaterial 
              color="#8A2BE2"
              emissive="#9370DB"
              emissiveIntensity={1.2}
              transparent
              opacity={0.5}
              roughness={0.1}
              metalness={0.1}
            />
          </mesh>
        </group>
      )}

      {/* Impact Effect */}
      {showImpactEffect && (
        <group position={[0, 0.1, 0]}>
          {/* Main explosion */}
          <mesh>
            <sphereGeometry args={[2, 12, 12]} />
            <meshStandardMaterial 
              color="#8A2BE2"
              emissive="#9370DB"
              emissiveIntensity={2}
              transparent
              opacity={0.6}
            />
          </mesh>

          {/* Energy ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.5, 0.3, 8, 16]} />
            <meshStandardMaterial 
              color="#8A2BE2"
              emissive="#9370DB"
              emissiveIntensity={1.5}
              transparent
              opacity={0.7}
            />
          </mesh>

          {/* Energy spikes */}
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const angle = (index * Math.PI * 2) / 6;
            const x = Math.cos(angle) * 2;
            const z = Math.sin(angle) * 2;
            return (
              <mesh key={index} position={[x, 0, z]} rotation={[0, angle, 0]}>
                <coneGeometry args={[0.2, 1.5, 6]} />
                <meshStandardMaterial 
                  color="#8A2BE2"
                  emissive="#9370DB"
                  emissiveIntensity={1.8}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            );
          })}

          {/* Impact light */}
          <pointLight 
            color="#8A2BE2"
            intensity={3}
            distance={8}
            decay={1}
          />
        </group>
      )}


    </group>
  );
}