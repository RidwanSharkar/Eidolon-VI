// src/Versus/Ascendant/AscendantUnit.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import AscendantModel from './AscendantModel';
import ArchonLightning from './ArchonLightning';
import AscendantForcePulse from './AscendantForcePulse';
import AscendantBlink from './AscendantBlink';
import AscendantChargingIndicator from './AscendantChargingIndicator';

import BoneVortex2 from '@/color/SpawnAnimation';
import BoneVortex from '@/color/DeathAnimation';
import { WeaponType } from '@/Weapons/weapons';
import { FrostExplosion } from '@/Spells/Avalanche/FrostExplosion';
import { stealthManager } from '../../Spells/Stealth/StealthManager';
import { globalAggroSystem, PlayerInfo, TargetInfo, isSummonedUnit } from '../AggroSystem';


interface AscendantUnitProps {
  id: string;
  initialPosition: Vector3;
  position: Vector3;
  health: number;
  maxHealth: number;
  onTakeDamage: (id: string, damage: number) => void;
  onPositionUpdate: (id: string, position: Vector3, rotation: number) => void;
  playerPosition?: Vector3;
  allPlayers?: Array<{
    position: Vector3;
  }>;
  summonedUnits?: import('../AggroSystem').SummonedUnitInfo[];
  onAttackPlayer: (damage: number) => void;
  onAttackSummonedUnit?: (summonId: string, damage: number) => void;
  onApplyKnockbackEffect?: (targetId: string, direction: Vector3, distance: number) => void;
  weaponType: WeaponType;
  isFrozen?: boolean;
  isStunned?: boolean;
  isSlowed?: boolean;
  knockbackEffect?: { direction: Vector3; distance: number; progress: number; isActive: boolean } | null;
}

// Define DamageSource interface
interface DamageSource {
  type: WeaponType;
  hasActiveAbility?: boolean;
}



export default function AscendantUnit({
  id,
  initialPosition,
  position,
  health,
  maxHealth,
  onTakeDamage,
  onPositionUpdate,
  playerPosition,
  allPlayers,
  summonedUnits = [],
  onAttackPlayer,
  onAttackSummonedUnit,
  onApplyKnockbackEffect,
  weaponType,
  isFrozen = false,
  isStunned = false,
  isSlowed = false,
  knockbackEffect = null,
}: AscendantUnitProps) {
  const ascendantRef = useRef<Group>(null);
  const lastAttackTime = useRef<number>(Date.now() + 3000); // Initial delay
  const [isAttacking, setIsAttacking] = useState(false);
  const [showDeathEffect, setShowDeathEffect] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isSpawning, setIsSpawning] = useState(true);
  const [showFrostEffect, setShowFrostEffect] = useState(false);
  const [attackingHand, setAttackingHand] = useState<'left' | 'right' | null>(null);
  const [activeLightning, setActiveLightning] = useState<{
    id: string;
    startPosition: Vector3;
    targetPosition: Vector3;
  } | null>(null);
  
  // Charging state
  const [isCharging, setIsCharging] = useState(false);
  const [chargingIndicator, setChargingIndicator] = useState<{
    id: string;
    startPosition: Vector3;
    targetPosition: Vector3;
  } | null>(null);
  const chargeStartTime = useRef<number>(0);
  
  // Force Pulse ability state
  const [activeForcePulse, setActiveForcePulse] = useState<{
    id: string;
    position: Vector3;
  } | null>(null);
  const lastForcePulseTime = useRef<number>(Date.now());
  
  // Blink ability state
  const [activeBlink, setActiveBlink] = useState<{
    id: string;
    startPosition: Vector3;
    endPosition: Vector3;
  } | null>(null);
  const lastBlinkTime = useRef<number>(Date.now());
  const [isBlinking, setIsBlinking] = useState(false);
  
  // Use refs for position tracking
  const currentPosition = useRef(initialPosition.clone().setY(0));
  const targetPosition = useRef(initialPosition.clone().setY(0));
  const lastUpdateTime = useRef(Date.now());
  const currentHealth = useRef(health);
  
  const targetRotation = useRef(0);

  // Get the target using aggro system (can be player or summoned unit)
  const getTargetPlayer = useCallback((): TargetInfo | null => {
    // Initialize enemy in aggro system
    globalAggroSystem.initializeEnemy(id);
    
    // Convert allPlayers to PlayerInfo format if needed
    const playersInfo: PlayerInfo[] = allPlayers ? 
      allPlayers.map((player, index) => ({
        id: `player-${index}`,
        position: player.position,
        name: `Player ${index + 1}`
      })) : 
      (playerPosition ? [{
        id: 'local-player',
        position: playerPosition,
        name: 'Player'
      }] : []);
    
    if (playersInfo.length === 0 && summonedUnits.length === 0) return null;
    
    // Get highest aggro target (including summoned units)
    return globalAggroSystem.getHighestAggroTarget(id, currentPosition.current, playersInfo, summonedUnits);
  }, [allPlayers, playerPosition, summonedUnits, id]);

  // Get the target player position (using aggro system)
  const getTargetPlayerPosition = useCallback(() => {
    const targetPlayer = getTargetPlayer();
    return targetPlayer?.position || currentPosition.current;
  }, [getTargetPlayer]);

  // Ascendant specific constants
  const ATTACK_RANGE = 7.5; // Long range for lightning attacks
  const ATTACK_COOLDOWN = 2000; // 2 second cooldown
  const CHARGE_DURATION = 1250; // 1.25 second charge time
  const BASE_MOVEMENT_SPEED = 2.4; // Consistent base speed like other enemies
  const POSITION_UPDATE_THRESHOLD = 0.25;
  const MINIMUM_UPDATE_INTERVAL = 25;
  const ATTACK_DAMAGE = 19; // Lightning damage
  const SEPARATION_RADIUS = 2.0;
  const SEPARATION_FORCE = 0.12; // Reduced for smoother movement
  const MOVEMENT_SMOOTHING = 0.85; // Smoothing factor for movement
  const ROTATION_SPEED = 4.0;
  
  // Force Pulse ability constants
  const FORCE_PULSE_RANGE = 5.0; // Trigger when enemies get within 6 units
  const FORCE_PULSE_COOLDOWN = 15000; // 8 second cooldown
  const FORCE_PULSE_DAMAGE = 10; // 10 damage
  const FORCE_PULSE_KNOCKBACK_DISTANCE = 12; // Knock back 12 units
  
  // Blink ability constants
  const BLINK_COOLDOWN = 10000; // 10 second cooldown
  const BLINK_MAX_DISTANCE = 15; // Up to 10 units teleport distance
  const BLINK_PREFERRED_RANGE = 7.5; // Try to stay at 7 units from target

  // Wandering behavior
  const wanderTarget = useRef<Vector3 | null>(null);
  const wanderStartTime = useRef<number>(Date.now());
  const WANDER_DURATION = 6000;
  const WANDER_RADIUS = 5;
  const WANDER_ROTATION_SPEED = 1.8;
  
  const getNewWanderTarget = useCallback(() => {
    if (!ascendantRef.current) return null;
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * WANDER_RADIUS;
    
    const newTarget = new Vector3(
      currentPosition.current.x + Math.cos(angle) * distance,
      0,
      currentPosition.current.z + Math.sin(angle) * distance
    );
    
    return newTarget;
  }, []);

  // Sync health changes
  useEffect(() => {
    currentHealth.current = health;
  }, [health]);

  // Handle damage with proper synchronization
  const handleDamage = useCallback((damage: number, source: DamageSource) => {
    if (currentHealth.current <= 0) return;
    
    const newHealth = Math.max(0, currentHealth.current - damage);
    onTakeDamage(`ascendant-${id}`, damage);
    
    if (newHealth === 0 && currentHealth.current > 0) {
      setIsDead(true);
      setShowDeathEffect(true);
    }

    if (source.type === WeaponType.SABRES && source.hasActiveAbility) {
      setShowFrostEffect(true);
    }
  }, [id, onTakeDamage]);

  // Improved position synchronization - prevent teleporting
  useEffect(() => {
    // Only sync position during initial spawn, not during gameplay
    if (position && isSpawning && !currentPosition.current.equals(position)) {
      const distance = currentPosition.current.distanceTo(position);
      
      // Only allow position sync if the distance is reasonable (prevents teleporting)
      if (distance < 5.0) { // Allow small corrections only
        currentPosition.current.copy(position);
        currentPosition.current.y = 0; // Force ground level
        targetPosition.current.copy(currentPosition.current);
        if (ascendantRef.current) {
          ascendantRef.current.position.copy(currentPosition.current);
        }
      }
    }
  }, [position, isSpawning]);

  const handleAscendantPositionUpdate = useCallback((id: string, newPosition: Vector3) => {
    if (ascendantRef.current) {
      onPositionUpdate(id, newPosition.clone(), ascendantRef.current.rotation.y);
    }
  }, [onPositionUpdate]);

  // Start charging attack
  const startCharging = useCallback(() => {
    const targetPlayerPosition = getTargetPlayerPosition();
    if (!targetPlayerPosition || !ascendantRef.current) return;

    setIsCharging(true);
    chargeStartTime.current = Date.now();
    
    // Show charging indicator
    setChargingIndicator({
      id: `charging-${Date.now()}`,
      startPosition: currentPosition.current.clone(),
      targetPosition: targetPlayerPosition.clone()
    });
  }, [getTargetPlayerPosition]);

  // Handle lightning attack start (after charging completes)
  const handleLightningStart = useCallback((hand: 'left' | 'right', targetPos: Vector3) => {
    if (!ascendantRef.current) return;

    // Calculate palm position based on which hand
    const handOffset = hand === 'left' ? -0.55 : 0.55;
    const palmPosition = new Vector3(
      currentPosition.current.x + handOffset,
      currentPosition.current.y + 2.5, // Height of raised hand
      currentPosition.current.z + 0.2
    );

    setActiveLightning({
      id: `lightning-${Date.now()}`,
      startPosition: palmPosition,
      targetPosition: targetPos.clone()
    });

    // Deal damage in the target area (1.5 unit radius)
    setTimeout(() => {
      const damageRadius = 1.5;
      
      // Check all potential targets for damage
      const playersInfo: PlayerInfo[] = allPlayers ? 
        allPlayers.map((player, index) => ({
          id: `player-${index}`,
          position: player.position,
          name: `Player ${index + 1}`
        })) : 
        (playerPosition ? [{
          id: 'local-player',
          position: playerPosition,
          name: 'Player'
        }] : []);

      const allTargets = [...playersInfo, ...summonedUnits];
      
      allTargets.forEach(target => {
        const distanceToTarget = targetPos.distanceTo(target.position);
        if (distanceToTarget <= damageRadius) {
          if (isSummonedUnit(target)) {
            globalAggroSystem.addDamageAggro(id, target.id, ATTACK_DAMAGE, 'summoned');
            if (onAttackSummonedUnit) {
              onAttackSummonedUnit(target.id, ATTACK_DAMAGE);
            }
          } else {
            onAttackPlayer(ATTACK_DAMAGE);
            globalAggroSystem.addDamageAggro(id, target.id, ATTACK_DAMAGE, 'player');
          }
        }
      });
    }, 200);
  }, [allPlayers, playerPosition, summonedUnits, onAttackPlayer, onAttackSummonedUnit, id]);

  // Force Pulse ability - knocks back enemies within 6 units
  const triggerForcePulse = useCallback(() => {
    const currentTime = Date.now();
    if (currentTime - lastForcePulseTime.current < FORCE_PULSE_COOLDOWN) {
      return false;
    }

    // Check if any targets are within Force Pulse range
    const playersInfo: PlayerInfo[] = allPlayers ? 
      allPlayers.map((player, index) => ({
        id: `player-${index}`,
        position: player.position,
        name: `Player ${index + 1}`
      })) : 
      (playerPosition ? [{
        id: 'local-player',
        position: playerPosition,
        name: 'Player'
      }] : []);

    const allTargets = [...playersInfo, ...summonedUnits];
    const nearbyTargets = allTargets.filter(target => {
      const distance = currentPosition.current.distanceTo(target.position);
      return distance <= FORCE_PULSE_RANGE;
    });

    if (nearbyTargets.length === 0) {
      return false;
    }

    // Trigger Force Pulse
    lastForcePulseTime.current = currentTime;
    setActiveForcePulse({
      id: `force-pulse-${currentTime}`,
      position: currentPosition.current.clone()
    });

    // Apply damage and knockback to all nearby targets
    nearbyTargets.forEach(target => {
      // Calculate knockback direction (away from Ascendant)
      const knockbackDirection = new Vector3()
        .subVectors(target.position, currentPosition.current)
        .normalize();

      if (isSummonedUnit(target)) {
        globalAggroSystem.addDamageAggro(id, target.id, FORCE_PULSE_DAMAGE, 'summoned');
        if (onAttackSummonedUnit) {
          onAttackSummonedUnit(target.id, FORCE_PULSE_DAMAGE);
        }
      } else {
        onAttackPlayer(FORCE_PULSE_DAMAGE);
        globalAggroSystem.addDamageAggro(id, target.id, FORCE_PULSE_DAMAGE, 'player');
      }

      // Apply knockback effect
      if (onApplyKnockbackEffect) {
        onApplyKnockbackEffect(target.id, knockbackDirection, FORCE_PULSE_KNOCKBACK_DISTANCE);
      }
    });

    return true;
  }, [allPlayers, playerPosition, summonedUnits, onAttackPlayer, onAttackSummonedUnit, onApplyKnockbackEffect, id]);

  // Blink ability - teleport towards or away from target to maintain optimal range
  const triggerBlink = useCallback(() => {
    const currentTime = Date.now();
    if (currentTime - lastBlinkTime.current < BLINK_COOLDOWN || isBlinking) {
      return false;
    }

    const targetPlayerPosition = getTargetPlayerPosition();
    if (!targetPlayerPosition) {
      return false;
    }

    const distanceToTarget = currentPosition.current.distanceTo(targetPlayerPosition);
    
    // Only blink if we're too far from target (outside attack range)
    if (distanceToTarget <= ATTACK_RANGE) {
      return false;
    }

    // Calculate blink destination - try to get to preferred range (7 units)
    const directionToTarget = new Vector3()
      .subVectors(targetPlayerPosition, currentPosition.current)
      .normalize();

    // Calculate desired position at preferred range
    const desiredPosition = targetPlayerPosition.clone()
      .sub(directionToTarget.multiplyScalar(BLINK_PREFERRED_RANGE));
    desiredPosition.y = 0; // Keep on ground

    // Ensure we don't blink too far (max 10 units)
    const blinkDistance = currentPosition.current.distanceTo(desiredPosition);
    let finalBlinkPosition = desiredPosition;

    if (blinkDistance > BLINK_MAX_DISTANCE) {
      // Limit blink to max distance towards target
      const limitedDirection = new Vector3()
        .subVectors(desiredPosition, currentPosition.current)
        .normalize();
      finalBlinkPosition = currentPosition.current.clone()
        .add(limitedDirection.multiplyScalar(BLINK_MAX_DISTANCE));
      finalBlinkPosition.y = 0;
    }

    // Trigger Blink
    lastBlinkTime.current = currentTime;
    setIsBlinking(true);
    setActiveBlink({
      id: `blink-${currentTime}`,
      startPosition: currentPosition.current.clone(),
      endPosition: finalBlinkPosition
    });

    // Update position after blink animation starts
    setTimeout(() => {
      currentPosition.current.copy(finalBlinkPosition);
      targetPosition.current.copy(finalBlinkPosition);
      if (ascendantRef.current) {
        ascendantRef.current.position.copy(finalBlinkPosition);
      }
      onPositionUpdate(id, finalBlinkPosition, ascendantRef.current?.rotation.y || 0);
    }, 400); // Halfway through blink animation

    return true;
  }, [getTargetPlayerPosition, onPositionUpdate, id, isBlinking]);

  useFrame((_, delta) => {
    if (!ascendantRef.current || currentHealth.current <= 0 || isFrozen || isStunned) {
      setIsAttacking(false);
      return;
    }

    const targetPlayerPosition = getTargetPlayerPosition();
    if (!targetPlayerPosition) {
      return;
    }

    const distanceToPlayer = currentPosition.current.distanceTo(targetPlayerPosition);

    // Don't do anything else if we're in the middle of blinking
    if (isBlinking) return;

    // Check for Force Pulse ability first (highest priority)
    if (distanceToPlayer <= FORCE_PULSE_RANGE && !isFrozen && !isStunned) {
      if (triggerForcePulse()) {
        return; // Force Pulse triggered, skip other actions this frame
      }
    }

    // Check for Blink ability if target is too far away
    if (distanceToPlayer > ATTACK_RANGE && !isFrozen && !isStunned) {
      if (triggerBlink()) {
        return; // Blink triggered, skip other actions this frame
      }
    }

    // Check if player is stealthed - wandering behavior
    if (stealthManager.isUnitStealthed()) {
      setIsAttacking(false);
      
      const now = Date.now();
      if (!wanderTarget.current || now - wanderStartTime.current > WANDER_DURATION) {
        if (!wanderTarget.current) {
          wanderTarget.current = getNewWanderTarget();
        } else {
          const currentDir = new Vector3()
            .subVectors(wanderTarget.current, currentPosition.current)
            .normalize();
          
          const newTarget = new Vector3()
            .copy(currentPosition.current)
            .add(currentDir.multiplyScalar(WANDER_RADIUS));
          
          wanderTarget.current = newTarget;
        }
        wanderStartTime.current = now;
      }
      
      if (wanderTarget.current) {
        // Use consistent speed calculation like player movement
        const baseWanderSpeed = BASE_MOVEMENT_SPEED * 0.3; // 30% of normal speed for wandering
        const normalizedSpeed = isSlowed ? baseWanderSpeed * 0.5 : baseWanderSpeed;
        const frameSpeed = normalizedSpeed * delta;
        
        // Calculate direction to wander target
        const direction = new Vector3()
          .subVectors(wanderTarget.current, currentPosition.current)
          .normalize();
        
        // Apply direct movement like player (no complex velocity smoothing)
        const movement = direction.multiplyScalar(frameSpeed);
        let newPosition = currentPosition.current.clone().add(movement);
        
        // Apply knockback effect if active
        if (knockbackEffect && knockbackEffect.isActive) {
          const knockbackDistance = knockbackEffect.distance * (1 - knockbackEffect.progress);
          const knockbackMovement = knockbackEffect.direction.clone().multiplyScalar(knockbackDistance * delta * 10);
          newPosition = newPosition.add(knockbackMovement);
        }
        
        // Simple interpolation for smoothness
        currentPosition.current.lerp(newPosition, MOVEMENT_SMOOTHING);
        currentPosition.current.y = 0;
        ascendantRef.current.position.copy(currentPosition.current);
        
        const targetRotation = Math.atan2(direction.x, direction.z);
        const currentRotationY = ascendantRef.current.rotation.y;
        let rotationDiff = targetRotation - currentRotationY;
        
        while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
        
        ascendantRef.current.rotation.y += rotationDiff * Math.min(1, WANDER_ROTATION_SPEED * delta);
      }
      
      return;
    }

    // Normal movement and attack behavior
    if (distanceToPlayer > ATTACK_RANGE && currentHealth.current > 0) {
      setIsAttacking(false);
      setAttackingHand(null);

      // Use consistent speed calculation like player movement
      const baseSpeed = isSlowed ? BASE_MOVEMENT_SPEED * 0.5 : BASE_MOVEMENT_SPEED;
      const frameSpeed = baseSpeed * delta;

      // Calculate direction to target player
      const direction = new Vector3()
        .subVectors(targetPlayerPosition, currentPosition.current)
        .normalize();

      // Calculate separation force (simplified)
      const separationForce = new Vector3();
      const otherEnemies = ascendantRef.current.parent?.children
        .filter(child => 
          child !== ascendantRef.current && 
          child.position && 
          child.position.distanceTo(currentPosition.current) < SEPARATION_RADIUS
        ) || [];

      if (otherEnemies.length > 0) {
        otherEnemies.forEach(enemy => {
          const diff = new Vector3()
            .subVectors(currentPosition.current, enemy.position)
            .normalize()
            .multiplyScalar(SEPARATION_FORCE);
          separationForce.add(diff);
        });
        separationForce.normalize().multiplyScalar(0.3); // Limit separation influence
      }

      // Combine direction and separation (like player movement)
      const finalDirection = direction.add(separationForce).normalize();
      finalDirection.y = 0;

      // Apply direct movement calculation (like player)
      const movement = finalDirection.multiplyScalar(frameSpeed);
      let newPosition = currentPosition.current.clone().add(movement);
      
      // Apply knockback effect if active
      if (knockbackEffect && knockbackEffect.isActive) {
        const knockbackDistance = knockbackEffect.distance * (1 - knockbackEffect.progress);
        const knockbackMovement = knockbackEffect.direction.clone().multiplyScalar(knockbackDistance * delta * 10);
        newPosition = newPosition.add(knockbackMovement);
      }
      
      // Simple smoothing for natural movement
      currentPosition.current.lerp(newPosition, MOVEMENT_SMOOTHING);
      currentPosition.current.y = 0;

      // Apply position to mesh
      ascendantRef.current.position.copy(currentPosition.current);

      // Smooth rotation
      const lookTarget = new Vector3()
        .copy(targetPlayerPosition)
        .setY(currentPosition.current.y);
      targetRotation.current = Math.atan2(
        lookTarget.x - currentPosition.current.x,
        lookTarget.z - currentPosition.current.z
      );

      const currentRotationY = ascendantRef.current.rotation.y;
      let rotationDiff = targetRotation.current - currentRotationY;
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      ascendantRef.current.rotation.y += rotationDiff * Math.min(1, ROTATION_SPEED * delta);

    } else {
      // Simple deceleration - enemies stop when in attack range
    }

    // Lightning attack logic with charging
    if (distanceToPlayer <= ATTACK_RANGE && currentHealth.current > 0 && !isFrozen && !isStunned) {
      const currentTime = Date.now();
      
      if (!isCharging && !isAttacking && currentTime - lastAttackTime.current >= ATTACK_COOLDOWN) {
        // Start charging
        startCharging();
        lastAttackTime.current = currentTime;
      }
    }
    
    // Handle charging completion
    if (isCharging && !isAttacking) {
      const chargeElapsed = Date.now() - chargeStartTime.current;
      if (chargeElapsed >= CHARGE_DURATION) {
        // Charging complete, fire lightning
        setIsCharging(false);
        setChargingIndicator(null);
        setIsAttacking(true);
        
        // Get the target position from when we started charging
        const targetPos = chargingIndicator?.targetPosition || getTargetPlayerPosition();
        if (targetPos) {
          // Randomly choose left or right hand
          const chosenHand: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';
          setAttackingHand(chosenHand);
          
          // Fire the lightning at the charged target position
          handleLightningStart(chosenHand, targetPos);
        }

        // Reset attack state after animation
        setTimeout(() => {
          setIsAttacking(false);
          setAttackingHand(null);
        }, 1500); // Longer than lightning duration for hand animation
      }
    }

    // Update position with rate limiting
    const now = Date.now();
    if (now - lastUpdateTime.current >= MINIMUM_UPDATE_INTERVAL) {
      if (currentPosition.current.distanceTo(position) > POSITION_UPDATE_THRESHOLD) {
        handleAscendantPositionUpdate(id, currentPosition.current.clone());
        lastUpdateTime.current = now;
      }
    }
  });

  useEffect(() => {
    if (health === 0 && !isDead) {
      setIsDead(true);
      setShowDeathEffect(true);
      // Remove from aggro system when enemy dies
      globalAggroSystem.removeEnemy(id);
      if (ascendantRef.current) {
        ascendantRef.current.visible = true;
      }
    }
  }, [health, isDead, id]);

  useEffect(() => {
    if (isDead) {
      const cleanup = setTimeout(() => {
        setShowDeathEffect(false);
        if (ascendantRef.current?.parent) {
          ascendantRef.current.parent.remove(ascendantRef.current);
        }
      }, 3500);
      return () => clearTimeout(cleanup);
    }
  }, [isDead]);

      useEffect(() => {
      const handleStealthBreak = () => {
        // Movement will resume automatically in useFrame
      };

    window.addEventListener('stealthBreak', handleStealthBreak);
    return () => {
      window.removeEventListener('stealthBreak', handleStealthBreak);
    };
  }, []);

  return (
    <>
      <group 
        ref={ascendantRef} 
        visible={!isSpawning && currentHealth.current > 0}
        position={currentPosition.current}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <AscendantModel
          isAttacking={isAttacking || isCharging}
          onHit={(damage) => handleDamage(damage, { type: weaponType })}
          attackingHand={attackingHand}
          onLightningStart={() => {}} // No longer used, handled in charging logic
        />

        {/* Health bar - positioned higher for larger model */}
        <Billboard
          position={[0, 4.2, 0]}
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          {currentHealth.current > 0 && (
            <>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[2.5, 0.3]} />
                <meshBasicMaterial color="#333333" opacity={0.8} transparent />
              </mesh>
              <mesh position={[-1.25 + (currentHealth.current / maxHealth) * 1.25, 0, 0.001]}>
                <planeGeometry args={[(currentHealth.current / maxHealth) * 2.5, 0.28]} />
                <meshBasicMaterial color="#cc4444" opacity={0.9} transparent />
              </mesh>
              <Text
                position={[0, 0, 0.002]}
                fontSize={0.18}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
              >
                {`${Math.ceil(currentHealth.current)}/${maxHealth}`}
              </Text>
              {/* Ascendant label */}
              <Text
                position={[0, 0.4, 0.002]}
                fontSize={0.2}
                color="#ff6666"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
              >
                ASCENDANT
              </Text>
            </>
          )}
        </Billboard>
      </group>

      {/* Spawn effect */}
      {isSpawning && (
        <BoneVortex2 
          position={currentPosition.current}
          onComplete={() => {
            setIsSpawning(false);
          }}
          isSpawning={true}
          scale={1.15}
        />
      )}

      {/* Death effect */}
      {showDeathEffect && (
        <BoneVortex 
          position={currentPosition.current}
          onComplete={() => {
            setShowDeathEffect(false);
          }}
          isSpawning={false}
          weaponType={weaponType}
          weaponSubclass={undefined}
          scale={1.15}
        />
      )}

      {/* Charging indicator */}
      {chargingIndicator && (
        <AscendantChargingIndicator
          startPosition={chargingIndicator.startPosition}
          targetPosition={chargingIndicator.targetPosition}
          chargeDuration={CHARGE_DURATION}
          onComplete={() => setChargingIndicator(null)}
        />
      )}

      {/* Active lightning attack */}
      {activeLightning && (
        <ArchonLightning
          startPosition={activeLightning.startPosition}
          targetPosition={activeLightning.targetPosition}
          onComplete={() => setActiveLightning(null)}
        />
      )}

      {showFrostEffect && (
        <FrostExplosion 
          position={position}
          onComplete={() => setShowFrostEffect(false)}
        />
      )}

      {/* Force Pulse effect */}
      {activeForcePulse && (
        <AscendantForcePulse
          position={activeForcePulse.position}
          duration={1000}
          onComplete={() => setActiveForcePulse(null)}
        />
      )}

      {/* Blink effect */}
      {activeBlink && (
        <AscendantBlink
          startPosition={activeBlink.startPosition}
          endPosition={activeBlink.endPosition}
          duration={800}
          onComplete={() => {
            setActiveBlink(null);
            setIsBlinking(false);
          }}
        />
      )}
    </>
  );
}