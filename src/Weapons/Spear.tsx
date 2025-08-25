// src/weapons/Spear.tsx

import { useRef, useEffect } from 'react';
import { Group, Shape, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DamageNumber } from '@/Unit/useDamageNumbers';
import { WeaponSubclass, getWeaponDamage, WeaponType } from '@/Weapons/weapons';
import { calculateDamage } from '@/Weapons/damage';


interface SpearProps {
  isSwinging: boolean;
  onSwingComplete?: () => void;
  enemyData?: Array<{
    id: string;
    position: Vector3;
    health: number;
  }>;
  onHit?: (targetId: string, damage: number, isCritical?: boolean) => void;
  setDamageNumbers?: (callback: (prev: DamageNumber[]) => DamageNumber[]) => void;
  nextDamageNumberId?: { current: number };
  isWhirlwinding?: boolean;
  fireballCharges?: Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>;
  currentSubclass?: WeaponSubclass;
  isThrowSpearCharging?: boolean;
  throwSpearChargeProgress?: number;
  isSpearThrown?: boolean;
}

export default function Spear({ 
  isSwinging, 
  onSwingComplete, 
  enemyData,
  onHit,
  setDamageNumbers,
  nextDamageNumberId,
  isWhirlwinding = false,
  fireballCharges = [],
  currentSubclass,
  isThrowSpearCharging = false,
  throwSpearChargeProgress = 0,
  isSpearThrown = false
}: SpearProps) {
  const spearRef = useRef<Group>(null);
  const swingProgress = useRef(0);
  const basePosition = [-1.18, 0.225, -0.3] as const; // POSITIONING
  const hitCountThisSwing = useRef<Record<string, number>>({});
  const lastHitDetectionTime = useRef<Record<string, number>>({});
  const whirlwindRotation = useRef(0);
  const whirlwindSpeed = useRef(0);
  const prevWhirlwindState = useRef(false);



  // Burst attack state for Storm subclass
  const burstCount = useRef(0); // Track which attack we're on (0, 1) - 2 attacks total
  const isBurstAttack = currentSubclass === WeaponSubclass.STORM;

  // Check if whirlwind should be active based on charges
  const hasAvailableCharges = fireballCharges.some(charge => charge.available);
  const shouldWhirlwind = isWhirlwinding && hasAvailableCharges;

  // Track whirlwind state changes
  useEffect(() => {
    // If whirlwind is active but there are no charges, force deceleration
    if (isWhirlwinding && !hasAvailableCharges && whirlwindSpeed.current > 0) {
      whirlwindSpeed.current = Math.max(whirlwindSpeed.current - 5, 0);
    }
    
    prevWhirlwindState.current = shouldWhirlwind;
  }, [isWhirlwinding, hasAvailableCharges, shouldWhirlwind]);

  useFrame((_, delta) => {
    if (!spearRef.current) return;

    // Handle whirlwind spinning animation
    if (shouldWhirlwind) {
      // Accelerate rotation speed when whirlwind is active
      whirlwindSpeed.current = Math.min(whirlwindSpeed.current + delta * 15, 35);
      
      // Update rotation based on speed
      whirlwindRotation.current += delta * whirlwindSpeed.current;
      
      // Orbit parameters
      const orbitRadius = 2.5; // Radius of orbit circle
      const angle = whirlwindRotation.current;
      
      // Positional calculations
      const orbitalX = Math.cos(angle) * orbitRadius;
      const orbitalZ = Math.sin(angle) * orbitRadius;
      
      // Constant height above ground plane
      const fixedHeight = 0.4; // Keep this constant to ensure level movement
      
      // Set absolute rotation each frame - don't accumulate
      // This is the key to keeping it perfectly level
      // We'll use a fixed rotation sequence applied fresh each frame
      
      // The spear needs to:
      // 1. Lay flat on the XZ plane (parallel to ground)
      // 2. Point outward from center (tip away from center)
      
      spearRef.current.rotation.set(
        Math.PI/3,      // X rotation: 90 degrees to lay flat on ground
        -angle + Math.PI,              // Y rotation: will be applied separately
        1               // Z rotation: no roll
      );
      
      // Rotate around Y axis to make it follow the circle
      // Make the handle point toward center, blade outward
      spearRef.current.rotateY(-angle + Math.PI);
      
      // Apply position after rotation is set
      spearRef.current.position.set(orbitalX, fixedHeight, orbitalZ);
      
      return;
    } else if (whirlwindSpeed.current > 0) {
      // Deceleration when whirlwind ends or no charges available
      whirlwindSpeed.current = Math.max(0, whirlwindSpeed.current - delta * 30);
      
      // Continue rotation but slowing down
      whirlwindRotation.current += delta * whirlwindSpeed.current;
      
      // If we're almost stopped, return to normal position
      if (whirlwindSpeed.current < 0.5) {
        whirlwindSpeed.current = 0;
        
        // Reset position smoothly
        spearRef.current.position.x += (basePosition[0] - spearRef.current.position.x) * 0.75;
        spearRef.current.position.y += (basePosition[1] - spearRef.current.position.y) * 0.75;
        spearRef.current.position.z += (basePosition[2] - spearRef.current.position.z) * 0.75;
        
        // Reset rotation smoothly
        spearRef.current.rotation.x += (-Math.PI/2 - spearRef.current.rotation.x) * 0.75;
        spearRef.current.rotation.y += (0 - spearRef.current.rotation.y) * 0.75;
        spearRef.current.rotation.z += (Math.PI - spearRef.current.rotation.z) * 0.75;
      } else {
        // Continue orbital movement while slowing down
        const orbitRadius = 2.5; // Radius of orbit circle
        const angle = whirlwindRotation.current;
        
        const orbitalX = Math.cos(angle) * orbitRadius;
        const orbitalZ = Math.sin(angle) * orbitRadius;
        const fixedHeight = 0.4;
        
        spearRef.current.rotation.set(
          Math.PI/3,
          -angle + Math.PI,
          1
        );
        
        spearRef.current.rotateY(-angle + Math.PI);
        spearRef.current.position.set(orbitalX, fixedHeight, orbitalZ);
      }
      
      return;
    }

    // Handle ThrowSpear charging animation
    if (isThrowSpearCharging) {
      // Charging windup animation - spear pulls back and glows
      const windupAmount = -0.75 * throwSpearChargeProgress; // Pull back based on charge
      const heightOffset = 0.5 * throwSpearChargeProgress; // Lift up slightly
      const tiltAmount = -0.5 * throwSpearChargeProgress; // Tilt back for throwing stance
      
      // Smoothly animate to charging position
      spearRef.current.position.x += (basePosition[0] - spearRef.current.position.x) * 0.1;
      spearRef.current.position.y += (basePosition[1] + heightOffset - spearRef.current.position.y) * 0.1;
      spearRef.current.position.z += (basePosition[2] + windupAmount - spearRef.current.position.z) * 0.1;
      
      // Tilt the spear back for throwing stance
      const targetRotationX = -Math.PI/2 + tiltAmount;
      spearRef.current.rotation.x += (targetRotationX - spearRef.current.rotation.x) * 0.1;
      spearRef.current.rotation.y += (0 - spearRef.current.rotation.y) * 0.1;
      spearRef.current.rotation.z += (Math.PI - spearRef.current.rotation.z) * 0.1;
      
      // Add slight trembling effect when fully charged
      if (throwSpearChargeProgress > 0.8) {
        const trembleAmount = 0.02 * (throwSpearChargeProgress - 0.8) * 5;
        spearRef.current.position.x += (Math.random() - 0.5) * trembleAmount;
        spearRef.current.position.y += (Math.random() - 0.5) * trembleAmount;
        spearRef.current.position.z += (Math.random() - 0.5) * trembleAmount;
      }
      
      return;
    }

    // Handle spear being thrown (hide the weapon)
    if (isSpearThrown) {
      // Move spear off-screen or make it invisible
      spearRef.current.position.set(1000, 1000, 1000); // Move far away
      return;
    }

    if (isSwinging) {
      if (swingProgress.current === 0) {
        if (isBurstAttack) {
          // For burst attacks, only reset hit tracking if we're starting a fresh burst sequence
          if (burstCount.current === 0) {
            hitCountThisSwing.current = {};
            lastHitDetectionTime.current = {};
          }
        } else {
          // For non-burst attacks, always reset hit tracking
          hitCountThisSwing.current = {};
          lastHitDetectionTime.current = {};
        }
        

      }
      
              // Faster swing speed for burst attacks
        const swingSpeed = isBurstAttack ? 22.5 : 15; // Double speed for Storm burst
      swingProgress.current += delta * swingSpeed;
      const swingPhase = Math.min(swingProgress.current / Math.PI / 1.5, 1);
      
      if (swingPhase > 0.4 && swingPhase < 0.8 && onHit && setDamageNumbers && nextDamageNumberId) {
        enemyData?.forEach(enemy => {
          const now = Date.now();
          
          // For burst attacks, track hits per burst attack, not per swing
          const hitKey = isBurstAttack ? `${enemy.id}_burst_${burstCount.current}` : enemy.id;
          const lastHitTime = lastHitDetectionTime.current[hitKey] || 0;
          
          // Shorter hit detection window for burst attacks
          const hitCooldown = isBurstAttack ? 75 : 200; // Even shorter for burst attacks
          if (now - lastHitTime < hitCooldown) return;
          
          if (hitCountThisSwing.current[hitKey]) return;
          
          const spearTip = spearRef.current!.localToWorld(new Vector3(0, 1, 0.35));
          
          // Use player's quaternion instead of spear's for forward direction
          const parentQuaternion = spearRef.current!.parent?.quaternion || spearRef.current!.quaternion;
          const forward = new Vector3(0, 0, 1)
            .applyQuaternion(parentQuaternion)
            .normalize();
          
          const toEnemy = new Vector3()
            .subVectors(enemy.position, spearTip);
          
          const projection = toEnemy.dot(forward);
          
          if (projection > 0 && projection <= 8) {
            const closestPoint = new Vector3()
              .copy(spearTip)
              .add(forward.clone().multiplyScalar(projection));
            
            const distanceFromLine = new Vector3()
              .subVectors(enemy.position, closestPoint)
              .length();
            
            if (distanceFromLine <= 1.75) {
              const baseDamage = getWeaponDamage(WeaponType.SPEAR, currentSubclass, undefined);
              const spearRange = 5.65; // Maximum spear range
              
              // Check if this is a tip hit (80-100% of max range) for guaranteed critical
              const isTipHit = projection >= spearRange * 0.725;
              
              let damage, isCritical;
              
              if (isTipHit) {
                // Guaranteed critical for tip hits
                damage = baseDamage * 2;
                isCritical = true;
                
                // Critical hit effects are now handled in Unit.tsx
              } else {
                // Use standard critical chance calculation for non-tip hits
                const damageResult = calculateDamage(baseDamage);
                damage = damageResult.damage;
                isCritical = damageResult.isCritical;
                // Critical hit effects are now handled in Unit.tsx
              }
              
              onHit(enemy.id, damage, isCritical);
              
              setDamageNumbers(prev => [...prev, {
                id: nextDamageNumberId.current++,
                damage,
                position: enemy.position.clone(),
                isCritical
              }]);
              
              // Use the same hitKey system for recording hits
              hitCountThisSwing.current[hitKey] = 1;
              lastHitDetectionTime.current[hitKey] = now;
            }
          }
        });
      }
      
      if (swingProgress.current >= Math.PI * 0.75) {
        swingProgress.current = 0;
        
        // Handle burst attack completion
        if (isBurstAttack) {
          burstCount.current++;
          
          // Complete after 2 attacks (0 and 1, so when count reaches 2)
          if (burstCount.current >= 2) {
            burstCount.current = 0;
            // Reset position and rotation only when burst sequence is complete
            spearRef.current.rotation.set(-Math.PI/2, 0, Math.PI);
            spearRef.current.position.set(...basePosition);
            // Reset hit tracking when the entire burst sequence is complete
            hitCountThisSwing.current = {};
            lastHitDetectionTime.current = {};
            onSwingComplete?.();
          }
          // Continue burst - don't reset position/rotation between burst attacks
        } else {
          // Normal single attack completion - reset position, rotation, and hit tracking
          spearRef.current.rotation.set(-Math.PI/2, 0, Math.PI);
          spearRef.current.position.set(...basePosition);
          hitCountThisSwing.current = {};
          lastHitDetectionTime.current = {};
          onSwingComplete?.();
        }
        return;
      }
      
      const thrustPhase = swingPhase;
      
      const windUpAmount = -0.75;
      const forwardThrustAmount = 2.850;
      
      let thrustZ;
      if (thrustPhase < 0.25) {
        thrustZ = basePosition[2] + (windUpAmount * (thrustPhase / 0.2));
      } else if (thrustPhase < 0.5) {
        const forwardPhase = (thrustPhase - 0.2) / 0.3;
        thrustZ = basePosition[2] + windUpAmount + (forwardThrustAmount + Math.abs(windUpAmount)) * Math.sin(forwardPhase * Math.PI/2);
      } else {
        const returnPhase = (thrustPhase - 0.5) / 0.5;
        thrustZ = basePosition[2] + forwardThrustAmount * (1 - returnPhase);
      }
      
      spearRef.current.position.set(basePosition[0], basePosition[1], thrustZ);
      
      let rotationX = -Math.PI/2;
      if (thrustPhase < 0.2) {
        rotationX += (thrustPhase / 0.2) * 0.1;
      } else if (thrustPhase < 0.5) {
        rotationX += 0.1 - (((thrustPhase - 0.2) / 0.3) * 0.1);
      }
      
      spearRef.current.rotation.set(rotationX, 0, Math.PI);

    } else {
      // Normal idle state - only apply if not transitioning from whirlwind
      if (whirlwindSpeed.current === 0) {
        spearRef.current.rotation.x = -Math.PI/2;
        spearRef.current.rotation.y = 0;
        spearRef.current.rotation.z = Math.PI;
        
        spearRef.current.position.x += (basePosition[0] - spearRef.current.position.x) * 0.2;
        spearRef.current.position.y += (basePosition[1] - spearRef.current.position.y) * 0.2;
        spearRef.current.position.z += (basePosition[2] - spearRef.current.position.z) * 0.2;
      }
    }

  });

  const createBladeShape = () => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    
    shape.lineTo(0.15, -0.230);
    shape.bezierCurveTo(
      0.8, 0.22,
      1.13, 0.5,
      1.8, 1.6
    );
    
    shape.lineTo(1.125, 0.75);
    shape.bezierCurveTo(
      0.5, 0.2,
      0.225, 0.0,
      0.1, 0.7
    );
    shape.lineTo(0, 0);
    return shape;
  };

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

  return (
    <>
      <group 
        position={[0, -0.4, 0.6]}
        rotation={[-0.55, 0.15, 0]}
        scale={[0.825, 0.75, 0.75]}
      >
      <group 
        ref={spearRef} 
        position={[basePosition[0], basePosition[1], basePosition[2]]}
        rotation={[Math.PI/2, 0, 0]}
        scale={[0.8, 0.8, 0.7]}
      >
        <group position={[-0.025, -0.55, 0.35]} rotation={[0, 0, -Math.PI]}>
          <mesh>
            <cylinderGeometry args={[0.03, 0.04, 2.2, 12]} />
            <meshStandardMaterial color="#2a3b4c" roughness={0.7} />
          </mesh>
          
          {[...Array(12)].map((_, i) => (
            <mesh key={i} position={[0, 1.0 - i * 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.045, 0.016, 8, 16]} />
              <meshStandardMaterial color="#1a2b3c" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        </group>
        
        <group position={[-0.025, .45, 0.35]} rotation={[Math.PI, 1.5, Math.PI]}>
          <mesh>
            <torusGeometry args={[0.26, 0.07, 16, 32]} />
            <meshStandardMaterial 
              color="#4a5b6c" 
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          
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
          
          <mesh>
            <sphereGeometry args={[0.155, 16, 16]} />
            <meshStandardMaterial
              color={new THREE.Color(0xFF544E)}         // Spear red to match GhostTrail
              emissive={new THREE.Color(0xFF544E)}      // Spear red emission
              emissiveIntensity={2}                    // for orange 
              transparent
              opacity={1}
            />
          </mesh>
          
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial
              color={new THREE.Color(0xFF544E)}
              emissive={new THREE.Color(0xFF544E)}
              emissiveIntensity={40}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          <mesh>
            <sphereGeometry args={[0.145, 16, 16]} />
            <meshStandardMaterial
              color={new THREE.Color(0xFF544E)}
              emissive={new THREE.Color(0xFF544E)}
              emissiveIntensity={35}
              transparent
              opacity={0.6}
            />
          </mesh>
          
          <mesh>
            <sphereGeometry args={[.175, 16, 16]} />
            <meshStandardMaterial
              color={new THREE.Color(0xFF544E)}
              emissive={new THREE.Color(0xFF544E)}
              emissiveIntensity={30}
              transparent
              opacity={0.4}
            />
          </mesh>

          <pointLight 
            color={new THREE.Color(0xFF544E)}
            intensity={2}
            distance={0.5}
            decay={2}
          />
        </group>
        
        <group position={[0, 0.75, 0.35]}>
          <group rotation={[0, 0, 0]}>
            <group rotation={[0, 0, 0.7]} scale={[0.4, 0.4, -0.4]}>
              <mesh>
                <extrudeGeometry args={[createBladeShape(), bladeExtrudeSettings]} />
                <meshStandardMaterial 
                  color={new THREE.Color(0xFF544E)}
                  emissive={new THREE.Color(0xFF544E)}
                  emissiveIntensity={1.55}
                  metalness={0.8}
                  roughness={0.1}
                  opacity={0.8}
                  transparent
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </group>

          <group rotation={[0, (2 * Math.PI) / 3, Math.PI/2]}>
            <group rotation={[0, 0., 5.33]} scale={[0.4, 0.4, -0.4]}>
              <mesh>
                <extrudeGeometry args={[createBladeShape(), bladeExtrudeSettings]} />
                <meshStandardMaterial 
                  color={new THREE.Color(0xFF544E)}
                  emissive={new THREE.Color(0xFF544E)}
                  emissiveIntensity={1.55}
                  metalness={0.8}
                  roughness={0.1}
                  opacity={0.8}
                  transparent
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </group>

          <group rotation={[0, (4 * Math.PI) / 3, Math.PI/2]}>
            <group rotation={[0, 0, 5.33]} scale={[0.4, 0.4, -0.4]}>
              <mesh>
                <extrudeGeometry args={[createBladeShape(), bladeExtrudeSettings]} />
                <meshStandardMaterial 
                  color={new THREE.Color(0xFF544E)}
                  emissive={new THREE.Color(0xFF544E)}
                  emissiveIntensity={1.55}
                  metalness={0.8}
                  roughness={0.1}
                  opacity={0.8}
                  transparent
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </group>
        </group>

        <group position={[0, 0.65, 0.35]} rotation={[0, -Math.PI / 2, Math.PI / 2]} scale={[0.8, 0.8, 0.5]}>
          <mesh>
            <extrudeGeometry args={[createInnerBladeShape(), bladeExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0xFF544E)}
              emissive={new THREE.Color(0xFF544E)}
              emissiveIntensity={1.5}
              metalness={0.3}
              roughness={0.1}
            />
          </mesh>
          
          <mesh>
            <extrudeGeometry args={[createInnerBladeShape(), innerBladeExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0xFF544E)}
              emissive={new THREE.Color(0xFF544E)}
              emissiveIntensity={1}
              metalness={0.2}
              roughness={0.1}
              opacity={0.8}
              transparent
            />
          </mesh>

        </group>

      </group>
    </group>
    </>
  );
}