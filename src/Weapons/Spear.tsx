// src/weapons/Spear.tsx

import { handleSpearHit } from './SpearDamage';

interface SpearProps {
  isSwinging: boolean;
  isSmiting: boolean;
  isOathstriking: boolean;
  onSwingComplete?: () => void;
  onSmiteComplete?: () => void;
  onOathstrikeComplete?: () => void;
  hasChainLightning?: boolean;
  enemyData?: Array<{
    id: string;
    position: Vector3;
    health: number;
  }>;
  onHit?: (targetId: string, damage: number) => void;
  setDamageNumbers?: (callback: (prev: DamageNumber[]) => DamageNumber[]) => void;
  nextDamageNumberId?: { current: number };
}

import { useRef } from 'react';
import { Group, Shape, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DamageNumber } from '@/Unit/useDamageNumbers';

export default function Spear({ 
  isSwinging, 
  isSmiting, 
  isOathstriking, 
  onSwingComplete, 
  onSmiteComplete,
  onOathstrikeComplete,
  hasChainLightning = false,
  enemyData,
  onHit,
  setDamageNumbers,
  nextDamageNumberId
}: SpearProps) {
  const spearRef = useRef<Group>(null);
  const swingProgress = useRef(0);
  const smiteProgress = useRef(0);
  const basePosition = [-1.18, 0.225, 0.3] as const; // POSITIONING
  
  // Add electrical particle system with enhanced parameters
  const sparkParticles = useRef<Array<{
    position: Vector3;
    velocity: Vector3;
    life: number;
    scale: number;
  }>>([]);

  const hitCountThisSwing = useRef<Record<string, number>>({});
  const lastHitDetectionTime = useRef<Record<string, number>>({});

  useFrame((_, delta) => {
    if (!spearRef.current) return;

    if (isOathstriking) {
      swingProgress.current += delta * 8.2;
      const swingPhase = Math.min(swingProgress.current / Math.PI/1.6, 1);
      
      const pivotX = basePosition[0] + Math.sin(swingPhase * Math.PI) * 2.5;
      const pivotY = basePosition[1] + Math.sin(swingPhase * Math.PI) * -1.0;
      const pivotZ = basePosition[2] + Math.cos(swingPhase * Math.PI) * 1;
      
      spearRef.current.position.set(pivotX, pivotY, pivotZ);
      
      const rotationX = +1.275;
      const rotationY = Math.sin(swingPhase * Math.PI) * Math.PI;
      const rotationZ = Math.sin(swingPhase * Math.PI * 1.275) * (Math.PI / 2.5);
      spearRef.current.rotation.set(rotationX, rotationY, rotationZ);
      
      if (swingProgress.current >= Math.PI) {
        swingProgress.current = 0;
        spearRef.current.rotation.set(0, 0, 0);
        spearRef.current.position.set(...basePosition);
        onOathstrikeComplete?.();
      }
      return;
    }

    if (isSmiting) {
      smiteProgress.current += delta * (smiteProgress.current < Math.PI/2 ? 3 : 6);
      const smitePhase = Math.min(smiteProgress.current / Math.PI, 1);
      
      let rotationX, rotationY, positionX, positionY, positionZ;
      
      if (smitePhase < 0.5) {
        // Wind-up phase: pull back and up, with more movement towards center
        const windupPhase = smitePhase * 0.45;
        rotationX = -Math.PI/3 - (windupPhase * Math.PI/3);
        rotationY = windupPhase * Math.PI/4;
        
        // Move even more towards center during windup
        positionX = basePosition[0] + (windupPhase * 1.5);
        positionY = basePosition[1] + windupPhase * 1.5;
        positionZ = basePosition[2] - windupPhase * 1.5;
      } else {
        // Strike phase: swing down towards center point
        const strikePhase = (smitePhase - 0.5) * 2;
        rotationX = -2*Math.PI/3 + (strikePhase * 3*Math.PI/2);
        rotationY = (Math.PI/4) * (1 - strikePhase);
        
        // Strike further towards center
        positionX = basePosition[0] + (1.5 * (1 - strikePhase));
        positionY = basePosition[1] + (1.5 - strikePhase * 2.0);
        positionZ = basePosition[2] - (1.5 - strikePhase * 3.0);
      }
      
      spearRef.current.position.set(
        positionX,
        positionY,
        positionZ
      );
      
      spearRef.current.rotation.set(rotationX, rotationY, 0);
      
      if (smiteProgress.current >= Math.PI) {
        smiteProgress.current = 0;
        spearRef.current.rotation.set(0, 0, 0);
        spearRef.current.position.set(...basePosition);
        onSmiteComplete?.();
      }
      return;
    }

    if (isSwinging) {
      // Reset hit counts at the start of each swing
      if (swingProgress.current === 0) {
        hitCountThisSwing.current = {};
      }
      
      swingProgress.current += delta * 5.5;
      const swingPhase = Math.min(swingProgress.current / Math.PI/1.5, 1);
      
      if (swingProgress.current >= Math.PI * 0.55) {
        swingProgress.current = 0;
        spearRef.current.rotation.set(0, 0, 0);
        spearRef.current.position.set(...basePosition);
        onSwingComplete?.();
        return;
      }
      
      // THRUST ANIMATION
      const thrustPhase = swingPhase <= 0.3
        ? swingPhase * 2 // Wind up and rotate to horizontal
        : (1 - (swingPhase - 0.3) * 1.4); // Quick thrust and return
      
      // Forward thrust motion with extended range
      const pivotX = basePosition[0] + Math.sin(thrustPhase * Math.PI * 0.2) * 0.5;
      const pivotY = basePosition[1];
      const pivotZ = basePosition[2] + Math.sin(thrustPhase * Math.PI) * 4.5; // Increased from 2.5 to 4.5
      
      spearRef.current.position.set(pivotX, pivotY, pivotZ);
      
      // Start vertical, rotate to horizontal during windup, then thrust
      let rotationX, rotationY, rotationZ;
      
      if (swingPhase <= 0.3) {
        // Windup phase: rotate from vertical to horizontal (reversed direction)
        const windupProgress = swingPhase / 0.3;
        rotationX = windupProgress * -Math.PI/2; // Changed from PI/2 to -PI/2
        rotationY = 0;
        rotationZ = Math.PI;
      } else {
        // Thrust phase: maintain horizontal with slight variations
        rotationX = -Math.PI/2 + Math.sin(thrustPhase * Math.PI) * 0.2; // Changed from PI/2 to -PI/2
        rotationY = Math.sin(thrustPhase * Math.PI * 0.5) * 0.1;
        rotationZ = Math.PI + Math.sin(thrustPhase * Math.PI) * 0.1;
      }
      
      spearRef.current.rotation.set(rotationX, rotationY, rotationZ);

      if (swingPhase > 0.3 && swingPhase < 0.7 && onHit && setDamageNumbers && nextDamageNumberId) {
        enemyData?.forEach(enemy => {
          handleSpearHit(
            {
              targetId: enemy.id,
              position: enemy.position,
              health: enemy.health,
              isEnemy: true
            },
            {
              groupRef: spearRef,
              isSwinging,
              hitCountThisSwing: hitCountThisSwing.current,
              setHitCountThisSwing: (callback) => {
                hitCountThisSwing.current = callback(hitCountThisSwing.current);
              },
              onHit,
              setDamageNumbers,
              nextDamageNumberId,
              lastHitDetectionTime
            }
          );
        });
      }
    } else if (!isSwinging && !isSmiting) {
      // Return to vertical rest position
      const targetRotation = [0, 0, 0];
      spearRef.current.rotation.x += (targetRotation[0] - spearRef.current.rotation.x) * 0.20;
      spearRef.current.rotation.y += (targetRotation[1] - spearRef.current.rotation.y) * 0.20;
      spearRef.current.rotation.z += (targetRotation[2] - spearRef.current.rotation.z) * 0.20;
      
      spearRef.current.position.x += (basePosition[0] - spearRef.current.position.x) * 0.20;
      spearRef.current.position.y += (basePosition[1] - spearRef.current.position.y) * 0.20;
      spearRef.current.position.z += (basePosition[2] - spearRef.current.position.z) * 0.20;
    }

    // Handle electrical effects when Chain Lightning is unlocked
    if (hasChainLightning && spearRef.current) {
      // Spawn new sparks more frequently and along the blade
      if (Math.random() < 0.8) { // Increased spawn rate even more
        // Spawn multiple particles per frame
        for (let i = 0; i < 3; i++) { // Spawn 3 particles at once
          const randomLength = Math.random() * 2.2;
          const randomOffset = new Vector3(
            (Math.random() - 0.5) * 0.4,
            randomLength,
            (Math.random() - 0.5) * 0.4
          );
          
          sparkParticles.current.push({
            position: randomOffset,
            velocity: new Vector3(
              (Math.random() - 0.5) * 4,
              (Math.random() - 0.2) * 4,
              (Math.random() - 0.5) * 4
            ).multiplyScalar(0.8),
            life: 1.0,
            scale: Math.random() * 0.015 + 0.005  // Much smaller scale range
          });
        }
      }

      // Update existing sparks with more dynamic movement
      sparkParticles.current.forEach(spark => {
        spark.velocity.x += Math.sin(Date.now() * 0.01) * delta * 0.5;
        spark.velocity.z += Math.cos(Date.now() * 0.01) * delta * 0.5;
        spark.position.add(spark.velocity.clone().multiplyScalar(delta));
        spark.life -= delta * 1.5;
        spark.velocity.y += delta * 0.5;
      });

      // Limit total particles for performance (optional)
      if (sparkParticles.current.length > 150) { // Increased maximum particles
        sparkParticles.current = sparkParticles.current.slice(-150);
      }

      // Remove dead sparks
      sparkParticles.current = sparkParticles.current.filter(spark => spark.life > 0);
    }
  });

  // Create custom sword blade shape
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
    
    // Blade shape with improved symmetry - reduced width values
    shape.lineTo(0, 0.08);    // Reduced from 0.12
    shape.lineTo(0.2, 0.2);   // Reduced from 0.25
    shape.quadraticCurveTo(0.8, 0.15, 1.5, 0.18); // Reduced y values
    shape.quadraticCurveTo(2.0, 0.1, 2.2, 0);     // Reduced y value
    
    shape.quadraticCurveTo(2.0, -0.1, 1.5, -0.18); // Mirror of upper curve
    shape.quadraticCurveTo(0.8, -0.15, 0.2, -0.2);
    shape.lineTo(0, -0.08);   // Reduced from -0.12
    shape.lineTo(0, 0);
    
    return shape;
  };

  // inner blade shape 
  const createInnerBladeShape = () => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    
    // Blade shape with  symmetry
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

  // Consolidated electrical effects
  const createElectricalEffects = () => {
    return (
      <group>
        {hasChainLightning && (
          <>
            {/* Electrical aura around blade */}
            <group position={[0, 1, 0.35]} rotation={[0, -Math.PI / 2, Math.PI / 2]} scale={[1.0625, 1.25, 1.05]}>
              <mesh>
                <extrudeGeometry args={[createBladeShape(), { ...bladeExtrudeSettings, depth: 0.07 }]} />
                <meshStandardMaterial
                  color={new THREE.Color(0xFFD700)}
                  emissive={new THREE.Color(0xFFA500)}
                  emissiveIntensity={1.5}
                  transparent
                  opacity={0.3}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            </group>

            {/* Enhanced spark particles */}
            {sparkParticles.current.map((spark, index) => (
              <mesh 
                key={index} 
                position={spark.position.toArray()}
                scale={[spark.scale, spark.scale, spark.scale]}
              >
                <sphereGeometry args={[1.25, 6, 6]} />
                <meshStandardMaterial
                  color={new THREE.Color(0xFFD700)}
                  emissive={new THREE.Color(0xFFA500)}
                  emissiveIntensity={3 * spark.life}
                  transparent
                  opacity={spark.life * 0.6}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            ))}

            {/* Lightning trail during swing 
            {isSwinging && (
              <mesh>
                <tubeGeometry args={[
                  new THREE.CatmullRomCurve3([
                    new Vector3(0, 0, 0),
                    new Vector3(0.5, 0.5, 0),
                    new Vector3(1, 0, 0)
                  ]),
                  20,
                  0.05,
                  8,
                  false
                ]} />
                <meshStandardMaterial
                  color="#FFD700"
                  emissive="#FFA500"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.6}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            )}*/}
          </>
        )}
      </group>
    );
  };

  return (
    <group rotation={[-0.575, 0, 0.2]}>
      <group 
        ref={spearRef} 
        position={[basePosition[0], basePosition[1], basePosition[2]]}
        rotation={[0, 0, Math.PI]}
        scale={[0.8, 0.8, 0.7]}
      >
        {/* Handle */}
        <group position={[-0.025, -0.05, 0.35]} rotation={[0, 0, -Math.PI]}>
          <mesh>
            <cylinderGeometry args={[0.03, 0.04, 0.9, 12]} />
            <meshStandardMaterial color="#2a3b4c" roughness={0.7} />
          </mesh>
          
          {/* Handle wrappings */}
          {[...Array(8)].map((_, i) => (
            <mesh key={i} position={[0, 0.35 - i * 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.045, 0.016, 8, 16]} />
              <meshStandardMaterial color="#1a2b3c" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        </group>
        
        {/* CIRCLE CONNECTION POINT */}
        <group position={[-0.025, 0.70, 0.35]} rotation={[Math.PI, 1.5, Math.PI]}>
          {/* Large torus */}
          <mesh>
            <torusGeometry args={[0.26, 0.07, 16, 32]} />
            <meshStandardMaterial 
              color="#4a5b6c" 
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
                color="#4a5b6c"
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
          ))}
          
          {/* REAL Core orb -   yellow */}
          <mesh>
            <sphereGeometry args={[0.155, 16, 16]} />
            <meshStandardMaterial
              color={new THREE.Color(0xFFFF00)}         // Pure yellow
              emissive={new THREE.Color(0xFF6F00)}      // Yellow emission
              emissiveIntensity={2}                    // for orange 
              transparent
              opacity={1}
            />
          </mesh>
          
          {/* Multiple glow layers for depth */}
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial
              color={new THREE.Color(0xFFFF00)}
              emissive={new THREE.Color(0xFFFF00)}
              emissiveIntensity={40}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          <mesh>
            <sphereGeometry args={[0.145, 16, 16]} />
            <meshStandardMaterial
              color={new THREE.Color(0xFFFF00)}
              emissive={new THREE.Color(0xFF6F00)}
              emissiveIntensity={35}
              transparent
              opacity={0.6}
            />
          </mesh>
          
          <mesh>
            <sphereGeometry args={[.175, 16, 16]} />
            <meshStandardMaterial
              color={new THREE.Color(0xFFFF00)}
              emissive={new THREE.Color(0xFF6F00)}
              emissiveIntensity={30}
              transparent
              opacity={0.4}
            />
          </mesh>

          {/* Enhanced point light */}
          <pointLight 
            color={new THREE.Color(0xFF6F00)}
            intensity={2}
            distance={0.5}
            decay={2}
          />
        </group>
        
        {/* Blade*/}
        <group position={[0, 1, 0.35]} rotation={[0, -Math.PI / 2, Math.PI / 2]}>
          {/* Base blade */}
          <mesh>
            <extrudeGeometry args={[createBladeShape(), bladeExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0xFF6F00)}  // Brighter purple
              emissive={new THREE.Color(0xFF6F00)}
              emissiveIntensity={2.5}
              metalness={0.3}
              roughness={0.1}
            />
          </mesh>
          
          {/* BLADE Glowing core */}
          <mesh>
            <extrudeGeometry args={[createInnerBladeShape(), innerBladeExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0xFFB700)}  // Deep purple
              emissive={new THREE.Color(0xFF6F00)}
              emissiveIntensity={5}
              metalness={0.2}
              roughness={0.1}
              opacity={0.8}
              transparent
            />
          </mesh>

        </group>

        {createElectricalEffects()}
      </group>
    </group>
  );
} 