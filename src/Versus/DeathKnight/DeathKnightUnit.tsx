// src/Versus/DeathKnight/DeathKnightUnit.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import DeathKnightModel from './DeathKnightModel';
import DeathGrasp from './DeathGrasp';
import FrostStrike from './FrostStrike';
import DeathKnightPull from './DeathKnightPull';
import DeathKnightChargingIndicator from './DeathKnightChargingIndicator';
import DeathKnightSlashEffect from './DeathKnightSlashEffect';
import BoneVortex2 from '@/color/SpawnAnimation';
import BoneVortex from '@/color/DeathAnimation';
import { WeaponType } from '@/Weapons/weapons';
import { FrostExplosion } from '@/Spells/Avalanche/FrostExplosion';
import { stealthManager } from '../../Spells/Stealth/StealthManager';
import { globalAggroSystem, PlayerInfo, TargetInfo, isSummonedUnit } from '../AggroSystem';


interface DeathKnightUnitProps {
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
  weaponType: WeaponType;
  isFrozen?: boolean;
  isStunned?: boolean;
  isSlowed?: boolean;
  knockbackEffect?: { direction: Vector3; distance: number; progress: number; isActive: boolean } | null;
  playerRef?: React.RefObject<Group>; // Add player reference for Death Grasp pull
}

// Define DamageSource interface
interface DamageSource {
  type: WeaponType;
  hasActiveAbility?: boolean;
}



export default function DeathKnightUnit({
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
  weaponType,
  isFrozen = false,
  isStunned = false,
  isSlowed = false,
  knockbackEffect = null,
  playerRef
}: DeathKnightUnitProps) {
  const titanRef = useRef<Group>(null);
  const lastAttackTime = useRef<number>(Date.now() + 3000); // Longer initial delay
  const lastDeathGraspTime = useRef<number>(Date.now() + 5000); // Initial delay for Death Grasp
  const lastFrostStrikeTime = useRef<number>(Date.now() + 2000); // Initial delay for Frost Strike
  const attackDamageRef = useRef<boolean>(false); // Flag to prevent multiple damage calls
  const frostStrikeDamageRef = useRef<boolean>(false); // Flag to prevent multiple frost strike damage calls
  const [isAttacking, setIsAttacking] = useState(false);
  const [showDeathEffect, setShowDeathEffect] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isSpawning, setIsSpawning] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [showFrostEffect, setShowFrostEffect] = useState(false);
  const [isUsingDeathGrasp, setIsUsingDeathGrasp] = useState(false);
  const [isUsingFrostStrike, setIsUsingFrostStrike] = useState(false);
  const [activeDeathGrasp, setActiveDeathGrasp] = useState<{
    id: string;
    startPosition: Vector3;
    targetPosition: Vector3;
  } | null>(null);
  const [activeFrostStrike, setActiveFrostStrike] = useState<{
    id: string;
    position: Vector3;
    direction: Vector3;
  } | null>(null);
  const [activePlayerPull, setActivePlayerPull] = useState(false);
  
  // Charging state
  const [isCharging, setIsCharging] = useState(false);
  const [chargingIndicator, setChargingIndicator] = useState<{
    id: string;
    position: Vector3;
    direction: Vector3;
  } | null>(null);
  const [activeSlashEffect, setActiveSlashEffect] = useState<{
    id: string;
    position: Vector3;
    direction: Vector3;
  } | null>(null);
  const chargeStartTime = useRef<number>(0);
  const chargeTargetPosition = useRef<Vector3 | null>(null);
  
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

  // Death Knight specific constants
  const ATTACK_RANGE = 3; // Melee attack range
  const ATTACK_COOLDOWN = 2200; // Basic attack cooldown
  const CHARGE_DURATION = 1000; // 1 second charge time
  const DEATH_GRASP_RANGE = 10.0; // Death Grasp range
  const DEATH_GRASP_COOLDOWN = 10000; // 10 second cooldown for Death Grasp
  const FROST_STRIKE_RANGE = 3.25; // Frost Strike range (same as melee)
  const FROST_STRIKE_COOLDOWN = 10000; // 8 second cooldown for Frost Strike
  const BASE_MOVEMENT_SPEED = 2.5; // Consistent base speed like other enemies
  const POSITION_UPDATE_THRESHOLD = 0.3;
  const MINIMUM_UPDATE_INTERVAL = 30;
  const ATTACK_DAMAGE = 12; // Basic attack damage (higher than skeleton)
  const FROST_STRIKE_DAMAGE = 15; // Frost Strike damage
  const SEPARATION_RADIUS = 2.5; // Separation distance
  const SEPARATION_FORCE = 0.75; // Reduced for smoother movement
  const MOVEMENT_SMOOTHING = 0.85; // Smoothing factor for movement
  const ROTATION_SPEED = 2.5; // Rotation speed

  // Wandering behavior (slower and more lumbering)
  const wanderTarget = useRef<Vector3 | null>(null);
  const wanderStartTime = useRef<number>(Date.now());
  const WANDER_DURATION = 8000; // Longer wander duration
  const WANDER_RADIUS = 4; // Smaller wander radius (less agile)
  const WANDER_ROTATION_SPEED = 1.0; // Much slower rotation
  
  const getNewWanderTarget = useCallback(() => {
    if (!titanRef.current) return null;
    
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
    onTakeDamage(`death-knight-${id}`, damage);
    
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
        if (titanRef.current) {
          titanRef.current.position.copy(currentPosition.current);
        }
      }
    }
  }, [position, isSpawning]);

  const handleTitanPositionUpdate = useCallback((id: string, newPosition: Vector3) => {
    if (titanRef.current) {
      onPositionUpdate(id, newPosition.clone(), titanRef.current.rotation.y);
    }
  }, [onPositionUpdate]);

  // Death Grasp ability handlers
  const handleDeathGraspStart = useCallback(() => {
    const targetPlayerPosition = getTargetPlayerPosition();
    if (!targetPlayerPosition || !titanRef.current) return;

    // Calculate hand position for Death Grasp origin
    const handPosition = new Vector3(
      currentPosition.current.x + 0.8, // Right hand offset
      currentPosition.current.y + 2.5, // Height of raised hand
      currentPosition.current.z + 0.3
    );

    setActiveDeathGrasp({
      id: `death-grasp-${Date.now()}`,
      startPosition: handPosition,
      targetPosition: targetPlayerPosition.clone()
    });
  }, [getTargetPlayerPosition]);

  const handleDeathGraspPullStart = useCallback(() => {
    // Start the player pull effect
    setActivePlayerPull(true);
  }, []);

  const handleDeathGraspComplete = useCallback(() => {
    setActiveDeathGrasp(null);
    setIsUsingDeathGrasp(false);
    setActivePlayerPull(false);
  }, []);

  // Frost Strike ability handlers
  const handleFrostStrikeStart = useCallback(() => {
    const targetPlayerPosition = getTargetPlayerPosition();
    if (!targetPlayerPosition || !titanRef.current) return;

    // Reset damage flag for new frost strike
    frostStrikeDamageRef.current = false;

    // Calculate direction to player for frost strike
    const direction = targetPlayerPosition.clone()
      .sub(currentPosition.current)
      .normalize();

    const spellPosition = currentPosition.current.clone();
    spellPosition.y += 1; // Slightly elevated

    setActiveFrostStrike({
      id: `frost-strike-${Date.now()}`,
      position: spellPosition,
      direction: direction
    });

    // Deal damage after a short delay (spell travel time) - only once per frost strike
    setTimeout(() => {
      if (!frostStrikeDamageRef.current && currentHealth.current > 0) {
        frostStrikeDamageRef.current = true;
        onAttackPlayer(FROST_STRIKE_DAMAGE);
      }
    }, 300);
  }, [getTargetPlayerPosition, onAttackPlayer]);

  const handleFrostStrikeComplete = useCallback(() => {
    setActiveFrostStrike(null);
    setIsUsingFrostStrike(false);
  }, []);

  useFrame((_, delta) => {
    if (!titanRef.current || currentHealth.current <= 0 || isFrozen || isStunned) {
      setIsMoving(false);
      setIsAttacking(false);
      return;
    }

    const targetPlayerPosition = getTargetPlayerPosition();
    if (!targetPlayerPosition) {
      setIsMoving(false);
      return;
    }

    const distanceToPlayer = currentPosition.current.distanceTo(targetPlayerPosition);

    // Check if player is stealthed - lumbering wandering behavior
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
        setIsMoving(true);
        
        // Use consistent speed calculation like player movement  
        const baseWanderSpeed = BASE_MOVEMENT_SPEED * 0.2; // 20% of normal speed for slow wandering
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
        titanRef.current.position.copy(currentPosition.current);
        
        // Very slow rotation for lumbering effect
        const targetRotation = Math.atan2(direction.x, direction.z);
        const currentRotationY = titanRef.current.rotation.y;
        let rotationDiff = targetRotation - currentRotationY;
        
        while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
        
        titanRef.current.rotation.y += rotationDiff * Math.min(1, WANDER_ROTATION_SPEED * delta);
      }
      
      return;
    }

    // Normal movement and attack behavior - stop moving when charging
    if (distanceToPlayer > ATTACK_RANGE && currentHealth.current > 0 && !isCharging) {
      setIsAttacking(false);
      setIsMoving(true);

      // Use consistent speed calculation like player movement
      const baseSpeed = isSlowed ? BASE_MOVEMENT_SPEED * 0.5 : BASE_MOVEMENT_SPEED;
      const frameSpeed = baseSpeed * delta;

      // Calculate direction to target player
      const direction = new Vector3()
        .subVectors(targetPlayerPosition, currentPosition.current)
        .normalize();

      // Calculate separation force (simplified)
      const separationForce = new Vector3();
      const otherEnemies = titanRef.current.parent?.children
        .filter(child => 
          child !== titanRef.current && 
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
      titanRef.current.position.copy(currentPosition.current);

      // Slow, deliberate rotation
      const lookTarget = new Vector3()
        .copy(targetPlayerPosition)
        .setY(currentPosition.current.y);
      targetRotation.current = Math.atan2(
        lookTarget.x - currentPosition.current.x,
        lookTarget.z - currentPosition.current.z
      );

      const currentRotationY = titanRef.current.rotation.y;
      let rotationDiff = targetRotation.current - currentRotationY;
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      titanRef.current.rotation.y += rotationDiff * Math.min(1, ROTATION_SPEED * delta);

    } else {
      // Stop moving when in attack range or when charging
      setIsMoving(false);
    }

    // Attack logic with charging - more powerful and slower
    if (distanceToPlayer <= ATTACK_RANGE && 
        currentHealth.current > 0 && 
        !isFrozen && 
        !isStunned && 
        !isUsingDeathGrasp && 
        !isUsingFrostStrike) {
      const currentTime = Date.now();
      
      if (!isCharging && !isAttacking && currentTime - lastAttackTime.current >= ATTACK_COOLDOWN) {
        // Start charging - stop moving during charge
        setIsCharging(true);
        setIsMoving(false);
        chargeStartTime.current = currentTime;
        chargeTargetPosition.current = targetPlayerPosition.clone();
        lastAttackTime.current = currentTime;
        
        // Calculate attack direction
        const attackDirection = new Vector3()
          .subVectors(targetPlayerPosition, currentPosition.current)
          .normalize();
        
        // Show charging indicator
        setChargingIndicator({
          id: `charging-${currentTime}`,
          position: currentPosition.current.clone(),
          direction: attackDirection
        });
      }
    }
    
    // Handle charging completion
    if (isCharging && !isAttacking) {
      const chargeElapsed = Date.now() - chargeStartTime.current;
      if (chargeElapsed >= CHARGE_DURATION) {
        // Charging complete, start attack animation
        setIsCharging(false);
        setChargingIndicator(null);
        setIsAttacking(true);
        
        // Reset damage flag for new attack
        attackDamageRef.current = false;
        
        // Store the initial attack position and target
        const attackStartPosition = currentPosition.current.clone();
        const chargedTargetPos = chargeTargetPosition.current;
        
        // Show slash effect
        if (chargedTargetPos) {
          const slashDirection = new Vector3()
            .subVectors(chargedTargetPos, attackStartPosition)
            .normalize();
          
          setActiveSlashEffect({
            id: `slash-${Date.now()}`,
            position: attackStartPosition.clone().add(new Vector3(0, 1, 0)), // Slightly elevated
            direction: slashDirection
          });
        }
        
        // Deal damage after attack animation starts
        setTimeout(() => {
          if (!attackDamageRef.current && currentHealth.current > 0 && chargedTargetPos) {
            attackDamageRef.current = true;
            
            // Check if targets are in the attack area (cone in front of Death Knight)
            const attackDirection = new Vector3()
              .subVectors(chargedTargetPos, attackStartPosition)
              .normalize();
            
            // Check all potential targets for area damage
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
            const attackAngle = Math.PI * 0.7; // 70 degree cone (wider than skeleton)
            
            allTargets.forEach(target => {
              const targetDirection = new Vector3()
                .subVectors(target.position, currentPosition.current)
                .normalize();
              
              const distanceToTarget = currentPosition.current.distanceTo(target.position);
              const angleToTarget = attackDirection.angleTo(targetDirection);
              
              // Check if target is within attack cone and range
              if (distanceToTarget <= ATTACK_RANGE && angleToTarget <= attackAngle / 2) {
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
          }
        }, 800); // Damage timing
        
        // Reset attack state and resume movement
        setTimeout(() => {
          setIsAttacking(false);
          chargeTargetPosition.current = null;
          // Resume movement after attack completes
          if (currentHealth.current > 0) {
            const currentTarget = getTargetPlayer();
            if (currentTarget) {
              const distanceToTarget = currentPosition.current.distanceTo(currentTarget.position);
              if (distanceToTarget > ATTACK_RANGE) {
                setIsMoving(true);
              }
            }
          }
        }, 2000); // Full attack animation duration
      }
    }

    // Death Grasp ability logic - long range pull
    if (distanceToPlayer <= DEATH_GRASP_RANGE && 
        distanceToPlayer > FROST_STRIKE_RANGE && 
        currentHealth.current > 0 && 
        !isFrozen && 
        !isStunned && 
        !isUsingDeathGrasp && 
        !isUsingFrostStrike && 
        !isAttacking) {
      const currentTime = Date.now();
      if (currentTime - lastDeathGraspTime.current >= DEATH_GRASP_COOLDOWN) {
        setIsUsingDeathGrasp(true);
        lastDeathGraspTime.current = currentTime;

        // Reset ability state after duration
        setTimeout(() => {
          if (!activeDeathGrasp) {
            setIsUsingDeathGrasp(false);
          }
        }, 2000);
      }
    }

    // Frost Strike ability logic - prioritize when in close range
    if (distanceToPlayer <= FROST_STRIKE_RANGE && 
        currentHealth.current > 0 && 
        !isFrozen && 
        !isStunned && 
        !isUsingDeathGrasp && 
        !isUsingFrostStrike && 
        !isAttacking) {
      const currentTime = Date.now();
      if (currentTime - lastFrostStrikeTime.current >= FROST_STRIKE_COOLDOWN) {
        setIsUsingFrostStrike(true);
        lastFrostStrikeTime.current = currentTime;

        // Reset ability state after duration
        setTimeout(() => {
          if (!activeFrostStrike) {
            setIsUsingFrostStrike(false);
          }
        }, 1500);
      }
    }

    // Update position with rate limiting
    const now = Date.now();
    if (now - lastUpdateTime.current >= MINIMUM_UPDATE_INTERVAL) {
      if (currentPosition.current.distanceTo(position) > POSITION_UPDATE_THRESHOLD) {
        handleTitanPositionUpdate(id, currentPosition.current.clone());
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
      if (titanRef.current) {
        titanRef.current.visible = true;
      }
    }
  }, [health, isDead, id]);

  useEffect(() => {
    if (isDead) {
      const cleanup = setTimeout(() => {
        setShowDeathEffect(false);
        if (titanRef.current?.parent) {
          titanRef.current.parent.remove(titanRef.current);
        }
      }, 4000); // Longer death effect
      return () => clearTimeout(cleanup);
    }
  }, [isDead]);

  useEffect(() => {
    const handleStealthBreak = () => {
      setIsMoving(true);
    };

    window.addEventListener('stealthBreak', handleStealthBreak);
    return () => {
      window.removeEventListener('stealthBreak', handleStealthBreak);
    };
  }, []);

  return (
    <>
      <group 
        ref={titanRef} 
        visible={!isSpawning && currentHealth.current > 0}
        position={currentPosition.current}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <DeathKnightModel
          position={[0, -0.1, 0]}
          isAttacking={isAttacking || isCharging}
          isWalking={isMoving && currentHealth.current > 0}
          onHit={(damage) => handleDamage(damage, { type: weaponType })}
          isUsingDeathGrasp={isUsingDeathGrasp}
          isUsingFrostStrike={isUsingFrostStrike}
          onDeathGraspStart={handleDeathGraspStart}
          onFrostStrikeStart={handleFrostStrikeStart}
        />

        {/* Health bar - larger and higher positioned */}
        <Billboard
          position={[0, 3.5, 0]}
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          {currentHealth.current > 0 && (
            <>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[2.0, 0.25]} />
                <meshBasicMaterial color="#333333" opacity={0.8} transparent />
              </mesh>
              <mesh position={[-1.0 + (currentHealth.current / maxHealth), 0, 0.001]}>
                <planeGeometry args={[(currentHealth.current / maxHealth) * 2.0, 0.23]} />
                <meshBasicMaterial color="#ff3333" opacity={0.9} transparent />
              </mesh>
              <Text
                position={[0, 0, 0.002]}
                fontSize={0.2}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
              >
                {`${Math.ceil(currentHealth.current)}/${maxHealth}`}
              </Text>
            </>
          )}
        </Billboard>
      </group>

      {/* Larger spawn effect */}
      {isSpawning && (
        <BoneVortex2 
          position={currentPosition.current}
          onComplete={() => {
            setIsSpawning(false);
          }}
          isSpawning={true}
        />
      )}

      {/* Larger death effect */}
      {showDeathEffect && (
        <BoneVortex 
          position={currentPosition.current}
          onComplete={() => {
            setShowDeathEffect(false);
          }}
          isSpawning={false}
          weaponType={weaponType}
          weaponSubclass={undefined}
        />
      )}

      {showFrostEffect && (
        <FrostExplosion 
          position={position}
          onComplete={() => setShowFrostEffect(false)}
        />
      )}

      {/* Active Death Grasp chain effect */}
      {activeDeathGrasp && (
        <DeathGrasp
          startPosition={activeDeathGrasp.startPosition}
          targetPosition={activeDeathGrasp.targetPosition}
          onComplete={handleDeathGraspComplete}
          onPullStart={handleDeathGraspPullStart}
        />
      )}

      {/* Active Frost Strike effect */}
      {activeFrostStrike && (
        <FrostStrike
          position={activeFrostStrike.position}
          direction={activeFrostStrike.direction}
          onComplete={handleFrostStrikeComplete}
          parentRef={titanRef}
        />
      )}

      {/* Charging indicator */}
      {chargingIndicator && (
        <DeathKnightChargingIndicator
          position={chargingIndicator.position}
          direction={chargingIndicator.direction}
          attackRange={ATTACK_RANGE}
          chargeDuration={CHARGE_DURATION}
          onComplete={() => setChargingIndicator(null)}
        />
      )}

      {/* Slash effect */}
      {activeSlashEffect && (
        <DeathKnightSlashEffect
          startPosition={activeSlashEffect.position}
          direction={activeSlashEffect.direction}
          onComplete={() => setActiveSlashEffect(null)}
        />
      )}

      {/* Player pull effect */}
      {activePlayerPull && playerRef && (
        <DeathKnightPull
          playerRef={playerRef}
          deathKnightPosition={currentPosition.current}
          isActive={activePlayerPull}
          onComplete={() => setActivePlayerPull(false)}
        />
      )}
    </>
  );
}