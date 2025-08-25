// src/weapons/Sword.tsx

interface SwordProps {
  isSwinging: boolean;
  isSmiting: boolean;
  isOathstriking: boolean;
  isDivineStorming?: boolean;
  isColossusStriking?: boolean;
  onSwingComplete?: () => void;
  onSmiteComplete?: () => void;
  onOathstrikeComplete?: () => void;
  onDivineStormComplete?: () => void;
  onColossusStrikeComplete?: () => void;
  hasChainLightning?: boolean;
  comboStep?: 1 | 2 | 3;
  currentSubclass?: WeaponSubclass;
  enemyData?: Array<{
    id: string;
    position: Vector3;
    health: number;
  }>;
  onHit?: (targetId: string, damage: number) => void;
  setDamageNumbers?: (callback: (prev: Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isLightning?: boolean;
    isHealing?: boolean;
    isBlizzard?: boolean;
    isBoneclaw?: boolean;
    isSmite?: boolean;
    isOathstrike?: boolean;
    isFirebeam?: boolean;
    isOrbShield?: boolean;
    isChainLightning?: boolean;
    isFireball?: boolean;
    isSummon?: boolean;
    isStealthStrike?: boolean;
    isPyroclast?: boolean;
    isEagleEye?: boolean;
    isBreach?: boolean;
    isBarrage?: boolean;
    isGlacialShard?: boolean;
    isAegis?: boolean;
    isCrossentropyBolt?: boolean;
    isDivineStorm?: boolean;
    isHolyBurn?: boolean;
    isEviscerate?: boolean;
  }>) => Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isLightning?: boolean;
    isHealing?: boolean;
    isBlizzard?: boolean;
    isBoneclaw?: boolean;
    isSmite?: boolean;
    isOathstrike?: boolean;
    isFirebeam?: boolean;
    isOrbShield?: boolean;
    isChainLightning?: boolean;
    isFireball?: boolean;
    isSummon?: boolean;
    isStealthStrike?: boolean;
    isPyroclast?: boolean;
    isEagleEye?: boolean;
    isBreach?: boolean;
    isBarrage?: boolean;
    isGlacialShard?: boolean;
    isAegis?: boolean;
    isCrossentropyBolt?: boolean;
    isDivineStorm?: boolean;
    isHolyBurn?: boolean;
    isEviscerate?: boolean;
  }>) => void;
  nextDamageNumberId?: { current: number };
  setActiveEffects?: (callback: (prev: Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
    summonId?: number;
    targetId?: string;
  }>) => Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
    summonId?: number;
    targetId?: string;
  }>) => void;
  playerPosition?: Vector3;
}

import { useRef } from 'react';
import { Group, Shape, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WeaponSubclass } from './weapons';

export default function Sword({ 
  isSwinging, 
  isSmiting, 
  isOathstriking, 
  isDivineStorming = false,
  isColossusStriking = false,
  onSwingComplete, 
  onSmiteComplete,
  onOathstrikeComplete,
  onDivineStormComplete,
  onColossusStrikeComplete,
  hasChainLightning = false,
  comboStep = 1,
  currentSubclass,
  enemyData = [],
  onHit,
  setDamageNumbers,
  nextDamageNumberId,
  setActiveEffects,
  playerPosition
}: SwordProps) {
  const swordRef = useRef<Group>(null);
  const swingProgress = useRef(0);
  const smiteProgress = useRef(0);
  const colossusStrikeProgress = useRef(0);
  const divineStormRotation = useRef(0);
  const lastDivineStormHitTime = useRef<Record<string, number>>({});
  const basePosition = [-1.18, 0.225, 0.3] as const; // POSITIONING
  
  // Chain Lightning Sparks
  const sparkParticles = useRef<Array<{
    position: Vector3;
    velocity: Vector3;
    life: number;
    scale: number;
  }>>([]);

  // Divine Storm DoT tracking
  const divineStormDoTEnemies = useRef<Record<string, {
    startTime: number;
    lastTickTime: number;
    duration: number;
  }>>({});



  useFrame((_, delta) => {
    if (!swordRef.current) return;

    // Handle Divine Storm DoT ticks
    const now = Date.now();
    Object.entries(divineStormDoTEnemies.current).forEach(([enemyId, dotData]) => {
      const timeElapsed = now - dotData.startTime;
      const timeSinceLastTick = now - dotData.lastTickTime;
      
      // Check if DoT has expired
      if (timeElapsed >= dotData.duration) {
        delete divineStormDoTEnemies.current[enemyId];
        return;
      }
      
      // Apply DoT damage every second (1000ms)
      if (timeSinceLastTick >= 1000) {
        const enemy = enemyData.find(e => e.id === enemyId);
        if (enemy && enemy.health > 0) {
          // Deal 29 holy burn damage
          onHit?.(enemyId, 29);
          
          // Add holy burn damage number
          if (setDamageNumbers && nextDamageNumberId) {
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage: 29,
              position: enemy.position.clone(),
              isCritical: false,
              isHolyBurn: true
            }]);
          }
          
          // Update last tick time
          dotData.lastTickTime = now;
        } else {
          // Enemy is dead, remove from DoT tracking
          delete divineStormDoTEnemies.current[enemyId];
        }
      }
    });

    if (isOathstriking) {
      swingProgress.current += delta * 15;
      const swingPhase = Math.min(swingProgress.current / Math.PI/1.6, 1);
      
      const pivotX = basePosition[0] + Math.sin(swingPhase * Math.PI) * 2.5;
      const pivotY = basePosition[1] + Math.sin(swingPhase * Math.PI) * -1.0;
      const pivotZ = basePosition[2] + Math.cos(swingPhase * Math.PI) * 1;
      
      swordRef.current.position.set(pivotX, pivotY, pivotZ);
      
      const rotationX = +1.275;
      const rotationY = Math.sin(swingPhase * Math.PI) * Math.PI;
      const rotationZ = Math.sin(swingPhase * Math.PI * 1.275) * (Math.PI / 2.5);
      swordRef.current.rotation.set(rotationX, rotationY, rotationZ);
      
      if (swingProgress.current >= Math.PI) {
        swingProgress.current = 0;
        swordRef.current.rotation.set(0, 0, 0);
        swordRef.current.position.set(...basePosition);
        onOathstrikeComplete?.();
      }
      return;
    }

    if (isDivineStorming) {
      const TARGET_ROTATIONS = 1; // 1 full rotation
      const MAX_ROTATION = TARGET_ROTATIONS * Math.PI * 4; // 2π radians
      
      // Use constant fast rotation speed
      const CONSTANT_ROTATION_SPEED = 20;
      
      // Update rotation based on constant speed
      divineStormRotation.current += delta * CONSTANT_ROTATION_SPEED;
      
      // Check if we've completed the target rotations
      if (divineStormRotation.current >= MAX_ROTATION) {
        // Reset everything immediately
        divineStormRotation.current = 0;
        lastDivineStormHitTime.current = {};
        
        // Reset position and rotation to base values
        swordRef.current.position.set(...basePosition);
        swordRef.current.rotation.set(0, 0, 0);
        
        // Call completion callback
        onDivineStormComplete?.();
        return;
      }
      
      // Orbit parameters
      const orbitRadius = 1.5; // Radius of orbit circle
      const angle = divineStormRotation.current;
      
      // Positional calculations
      const orbitalX = Math.cos(angle) * orbitRadius;
      const orbitalZ = Math.sin(angle) * orbitRadius;
      
      // Constant height above ground plane
      const fixedHeight = 0.65; 
      
      // Set rotation to make sword lay flat and point outward from center (like spear whirlwind)
      swordRef.current.rotation.set(
        Math.PI/2.25,      // X rotation: lay flat on ground (60 degrees)
        -angle + Math.PI,              // Y rotation: point outward
        1               // Z rotation: no roll
      );
      
      // Rotate around Y axis to make it follow the circle (like spear)
      swordRef.current.rotateY(-angle + Math.PI);
      
      // Apply position after rotation is set
      swordRef.current.position.set(orbitalX, fixedHeight, orbitalZ);
      
      // Damage detection - check distance from player center, not sword position
      const now = Date.now();
      enemyData.forEach(enemy => {
        if (!enemy.health || enemy.health <= 0) return;
        
        const lastHitTime = lastDivineStormHitTime.current[enemy.id] || 0;
        if (now - lastHitTime < 200) return; // 200ms cooldown between hits on same enemy
        
        // Calculate distance from actual player position
        // Use the passed playerPosition or fallback to origin
        const actualPlayerPosition = playerPosition || new Vector3(0, 0, 0);
        const distance = actualPlayerPosition.distanceTo(enemy.position);
        
        if (distance <= 5.0) { // Hit range from player center - 5 distance radius as specified
          lastDivineStormHitTime.current[enemy.id] = now;
          
          // Deal 120 holy damage
          onHit?.(enemy.id, 79);
          
          // Add damage number
          if (setDamageNumbers && nextDamageNumberId) {
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage: 79,
              position: enemy.position.clone(),
              isCritical: false,
              isDivineStorm: true
            }]);
          }
          
          // Apply DoT effect (29 damage per second for 3 seconds)
          divineStormDoTEnemies.current[enemy.id] = {
            startTime: now,
            lastTickTime: now,
            duration: 3000 // 3 seconds
          };
          
          // Add holy burn visual effect
          if (setActiveEffects) {
            setActiveEffects(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'holyBurn',
              position: enemy.position.clone(),
              direction: new Vector3(0, 1, 0),
              duration: 3.0, // 3 seconds
              startTime: now,
              targetId: enemy.id
            }]);
          }
        }
      });
      
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
        
        // Move towards center during windup
        positionX = basePosition[0] + (windupPhase * 1.5);
        positionY = basePosition[1] + windupPhase * 1.5;
        positionZ = basePosition[2] - windupPhase * 1.5;
      } else {
        // Strike phase: swing down towards center point
        const strikePhase = (smitePhase - 0.5) * 2;
        rotationX = -2*Math.PI/3 + (strikePhase * 3*Math.PI/2);
        rotationY = (Math.PI/4) * (1 - strikePhase);
      
        // Strike  towards center
        positionX = basePosition[0] + (1.5 * (1 - strikePhase));
        positionY = basePosition[1] + (1.5 - strikePhase * 2.0);
        positionZ = basePosition[2] - (1.5 - strikePhase * 3.0);
      }
      
      swordRef.current.position.set(
        positionX,
        positionY,
        positionZ
      );
      
      swordRef.current.rotation.set(rotationX, rotationY, 0);
      
      if (smiteProgress.current >= Math.PI) {
        smiteProgress.current = 0;
        swordRef.current.rotation.set(0, 0, 0);
        swordRef.current.position.set(...basePosition);
        onSmiteComplete?.();
      }
      return;
    }

    if (isColossusStriking) {
      colossusStrikeProgress.current += delta * (colossusStrikeProgress.current < Math.PI/2 ? 3 : 6);
      const colossusPhase = Math.min(colossusStrikeProgress.current / Math.PI, 1);
      
      let rotationX, rotationY, positionX, positionY, positionZ;
      
      if (colossusPhase < 0.5) {
        // Wind-up phase: pull back and up, with more movement towards center
        const windupPhase = colossusPhase * 0.45;
        rotationX = -Math.PI/3 - (windupPhase * Math.PI/3);
        rotationY = windupPhase * Math.PI/4;
        
        // Move towards center during windup
        positionX = basePosition[0] + (windupPhase * 1.5);
        positionY = basePosition[1] + windupPhase * 1.5;
        positionZ = basePosition[2] - windupPhase * 1.5;
      } else {
        // Strike phase: swing down towards center point
        const strikePhase = (colossusPhase - 0.5) * 2;
        rotationX = -2*Math.PI/3 + (strikePhase * 3*Math.PI/2);
        rotationY = (Math.PI/4) * (1 - strikePhase);
      
        // Strike  towards center
        positionX = basePosition[0] + (1.5 * (1 - strikePhase));
        positionY = basePosition[1] + (1.5 - strikePhase * 2.0);
        positionZ = basePosition[2] - (1.5 - strikePhase * 3.0);
      }
      
      swordRef.current.position.set(
        positionX,
        positionY,
        positionZ
      );
      
      swordRef.current.rotation.set(rotationX, rotationY, 0);
      
      if (colossusStrikeProgress.current >= Math.PI) {
        colossusStrikeProgress.current = 0;
        swordRef.current.rotation.set(0, 0, 0);
        swordRef.current.position.set(...basePosition);
        onColossusStrikeComplete?.();
      }
      return;
    }

    if (isSwinging) {
      swingProgress.current += delta * 7.5;
      const swingPhase = Math.min(swingProgress.current / Math.PI/1.5, 1);
      
      // Different swing animations based on combo step - only for VENGEANCE subclass
      // DIVINITY always uses the first combo animation (regular swing)
      const effectiveComboStep = currentSubclass === WeaponSubclass.VENGEANCE ? comboStep : 1;
      
      // Different completion timing for 3rd swing (takes longer to show full downstrike)
      const completionThreshold = effectiveComboStep === 3 ? Math.PI * 0.9 : Math.PI * 0.55;
      
      if (swingProgress.current >= completionThreshold) {
        swingProgress.current = 0;
        swordRef.current.rotation.set(0, 0, 0);
        swordRef.current.position.set(...basePosition);
        onSwingComplete?.();
        return;
      }
      
      if (effectiveComboStep === 1) {
        // 1st Hit: Original swing (top-right to bottom-left)
        const forwardPhase = swingPhase <= 0.275
          ? swingPhase * 2
          : (0.75 - (swingPhase - 0.115) * 1.2);
        
        const pivotX = basePosition[0] + Math.sin(forwardPhase * Math.PI) * 2.5;
        const pivotY = basePosition[1] + Math.sin(forwardPhase * Math.PI) * -2;
        const pivotZ = basePosition[2] + Math.cos(forwardPhase * Math.PI) * 1.1;
        
        swordRef.current.position.set(pivotX, pivotY, pivotZ);
        
        const rotationX = Math.sin(forwardPhase * Math.PI) * (-0.75) +1.5;
        const rotationY = Math.sin(forwardPhase * Math.PI) * Math.PI;
        const rotationZ = Math.sin(forwardPhase * Math.PI) * (Math.PI / 3);
        
        swordRef.current.rotation.set(rotationX, rotationY, rotationZ);
      } else if (effectiveComboStep === 2) {
        // 2nd Hit: Mirrored swing (top-left to bottom-right)
        const forwardPhase = swingPhase <= 0.275
          ? swingPhase * 2
          : (0.625 - (swingPhase - 0.075) * 1.20);
        
        // Shift origin point further to the left for better left-side swing appearance
        const leftOffset = 3.33; // Additional left offset
        const pivotX = basePosition[0] + leftOffset - Math.sin(forwardPhase * Math.PI) * 2.5; // Mirrored X with left shift
        const pivotY = basePosition[1] + Math.sin(forwardPhase * Math.PI) * -2;
        const pivotZ = basePosition[2] + Math.cos(forwardPhase * Math.PI) * 1.1;
        
        swordRef.current.position.set(pivotX, pivotY, pivotZ);
        
        const rotationX = Math.sin(forwardPhase * Math.PI) * (-0.75) +1.5;
        const rotationY = -Math.sin(forwardPhase * Math.PI) * Math.PI; // Mirrored Y rotation
        const rotationZ = -Math.sin(forwardPhase * Math.PI) * (Math.PI / 3); // Mirrored Z rotation
        
        swordRef.current.rotation.set(rotationX, rotationY, rotationZ);
      } else if (effectiveComboStep === 3) {
        // 3rd Hit: Smite-like animation (top to center down)
        let rotationX, rotationY, positionX, positionY, positionZ;
        
        if (swingPhase < 0.2) {
          // Quick wind-up phase: pull back and up
          const windupPhase = swingPhase * 5; // Multiply by 5 since we're using 0-0.2 range
          rotationX = -Math.PI/3 - (windupPhase * Math.PI/3);
          rotationY = windupPhase * Math.PI/4;
          
          // Move towards center during windup
          positionX = basePosition[0] + (windupPhase * 1.5);
          positionY = basePosition[1] + windupPhase * 1.5;
          positionZ = basePosition[2] - windupPhase * 1.5;
        } else {
          // Strike phase: powerful downward swing to ground
          const strikePhase = (swingPhase - 0.2) * 2; // Normalize from 0.2-1.0 range
          rotationX = -2*Math.PI/3 + (strikePhase * 3*Math.PI/2);
          rotationY = (Math.PI/4) * (1 - strikePhase);
        
          // Deep strike towards ground - much deeper Y movement
          positionX = basePosition[0] + (1.5 * (1 - strikePhase));
          positionY = basePosition[1] + (2 - strikePhase * 5); // Increased from 3.5 to 5.0 for full ground impact
          positionZ = basePosition[2] - (1.5 - strikePhase * 3.5); // Keep the forward reach
        }
        
        swordRef.current.position.set(positionX, positionY, positionZ);
        swordRef.current.rotation.set(rotationX, rotationY, 0);
      }
      
      if (swingProgress.current >= Math.PI) {
        swingProgress.current = 0;
        swordRef.current.rotation.set(0, 0, 0);
        swordRef.current.position.set(...basePosition);
        onSwingComplete?.();
      }
    } else if (!isSwinging && !isSmiting && !isColossusStriking) {
      swordRef.current.rotation.x *= 0.85;
      swordRef.current.rotation.y *= 0.85;
      swordRef.current.rotation.z *= 0.85;
      
      swordRef.current.position.x += (basePosition[0] - swordRef.current.position.x) * 0.14;
      swordRef.current.position.y += (basePosition[1] - swordRef.current.position.y) * 0.14;
      swordRef.current.position.z += (basePosition[2] - swordRef.current.position.z) * 0.14;
    }

    // Handle electrical effects when Chain Lightning is unlocked
    if (hasChainLightning && swordRef.current) {
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
            scale: Math.random() * 0.02 + 0.005  // Much smaller scale range
          });
        }
      }

      // Update existing sparks with dynamic movement
      sparkParticles.current.forEach(spark => {
        spark.velocity.x += Math.sin(Date.now() * 0.01) * delta * 0.5;
        spark.velocity.z += Math.cos(Date.now() * 0.01) * delta * 0.5;
        spark.position.add(spark.velocity.clone().multiplyScalar(delta));
        spark.life -= delta * 1.5;
        spark.velocity.y += delta * 0.5;
      });

      // Limit total particles
      if (sparkParticles.current.length > 120) { // Increased maximum particles
        sparkParticles.current = sparkParticles.current.slice(-120);
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
    
    // Blade shape with symmetry
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
            <group position={[0, 1, 0.35]} rotation={[0, -Math.PI / 2, Math.PI / 2]} scale={[0.95, 1.10, 0.95]}>
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


          </>
        )}
      </group>
    );
  };

  return (
    <group rotation={[-0.575, 0, 0.2]}>
      <group 
        ref={swordRef} 
        position={[basePosition[0], basePosition[1], basePosition[2]]}
        rotation={[0, 0, Math.PI]}
        scale={[0.75, 0.8, 0.65]}
      >
        {/* Handle */}
        <group position={[-0.025, -0.55, 0.35]} rotation={[0, 0, -Math.PI]}>
          <mesh>
            <cylinderGeometry args={[0.03, 0.04, 0.9, 12]} />
            <meshStandardMaterial color="#2a3b4c" roughness={0.7} />
          </mesh>
          
          {/* Handle wrappings */}
          {[...Array(8)].map((_, i) => (
            <mesh key={i} position={[0, +0.35 - i * 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.045, 0.016, 8, 16]} />
              <meshStandardMaterial color="#1a2b3c" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        </group>
        
        {/* CIRCLE CONNECTION POINT */}
        <group position={[-0.025, 0.225, 0.35]} rotation={[Math.PI, 1.5, Math.PI]}>
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
              emissiveIntensity={2}                    // Orange 
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
        <group position={[0, 0.5, 0.35]} rotation={[0, -Math.PI / 2, Math.PI / 2]}>
          {/* Base blade */}
          <mesh>
            <extrudeGeometry args={[createBladeShape(), bladeExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0xFF6F00)}  
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
              color={new THREE.Color(0xFFB700)}  
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

        {/* Divine Storm Holy Energy Effects */}
        {isDivineStorming && (
          <group>
            {/* Central holy orb */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[1.05, 16, 16]} />
              <meshStandardMaterial
                color={new THREE.Color(0xFFD700)}
                emissive={new THREE.Color(0xFFD700)}
                emissiveIntensity={2}
                transparent
                opacity={0.3}
                blending={THREE.AdditiveBlending}
              />
            </mesh>

            {/* Outer divine aura */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.95, 12, 12]} />
              <meshStandardMaterial
                color={new THREE.Color(0xFFF8DC)}
                emissive={new THREE.Color(0xFFD700)}
                emissiveIntensity={1}
                transparent
                opacity={0.15}
                blending={THREE.AdditiveBlending}
              />
            </mesh>



            {/* Divine light */}
            <pointLight 
              color={new THREE.Color(0xFFD700)}
              intensity={1}
              distance={8}
              decay={1}
            />
          </group>
        )}
      </group>
    </group>
  );
} 