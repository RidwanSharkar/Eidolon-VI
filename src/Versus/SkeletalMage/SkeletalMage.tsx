// src/versus/SkeletalMage/SkeletalMage.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import CustomSkeletonMage from '@/Versus/SkeletalMage/CustomSkeletonMage';
import BoneVortex2 from '@/color/SpawnAnimation';
import { Enemy } from '@/Versus/enemy';
import BoneVortex from '@/color/DeathAnimation';
import { WeaponType } from '@/Weapons/weapons';
import MageFireball from '@/Versus/SkeletalMage/MageFireball';
import { stealthManager } from '@/Spells/Stealth/StealthManager';
import StealthStrikeEffect from '@/Spells/Stealth/StealthStrikeEffect';
import { globalAggroSystem, PlayerInfo, TargetInfo } from '../AggroSystem';
import { SkeletalMageProps } from './SkeletalMageProps';
import MageLightningStrike from './MageLightningStrike';
import LightningWarningIndicator from './LightningWarningIndicator';

// Define DamageSource interface locally
interface DamageSource {
  type: WeaponType;
  hasActiveAbility?: boolean;
}



export default function SkeletalMage({
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
  weaponType,
  isFrozen = false,
  isStunned = false,
  isSlowed = false,
  level = 1,
  playerStunRef,
  getCurrentPlayerPosition,
}: SkeletalMageProps & Pick<Enemy, 'position'>) {
  const enemyRef = useRef<Group>(null);
  const [showDeathEffect, setShowDeathEffect] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isSpawning, setIsSpawning] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [isCastingFireball, setIsCastingFireball] = useState(false);
  const [isCastingLightning, setIsCastingLightning] = useState(false);
  const lastFireballTime = useRef<number>(Date.now() + 2000);
  const lastLightningTime = useRef<number>(Date.now() + 2000);
  const [activeFireballs, setActiveFireballs] = useState<Array<{
    id: number;
    position: Vector3;
    target: Vector3;
    playerPosition: Vector3;
    startTime: number;
  }>>([]);
  const [activeLightningWarnings, setActiveLightningWarnings] = useState<Array<{
    id: number;
    position: Vector3;
    startTime: number;
  }>>([]);
  const [activeLightningStrikes, setActiveLightningStrikes] = useState<Array<{
    id: number;
    position: Vector3;
    startTime: number;
    onDamageCheck?: () => void;
  }>>([]);
  
  // Add to existing state declarations
  const [activeEffects, setActiveEffects] = useState<Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration: number;
    startTime: number;
  }>>([]);
  
  // Use refs for position tracking
  const currentPosition = useRef(initialPosition.clone());
  const targetPosition = useRef(initialPosition.clone());
  const lastUpdateTime = useRef(Date.now());
  const currentHealth = useRef(health);
  
  // Store the latest player position in a ref for damage calculations
  const latestPlayerPosition = useRef(playerPosition?.clone() || currentPosition.current);
  const latestAllPlayers = useRef(allPlayers);

  // Get the target using aggro system (can be player or summoned unit)
  const getTargetPlayer = useCallback((): TargetInfo | null => {
    // Initialize enemy in aggro system
    globalAggroSystem.initializeEnemy(id);
    
    // Convert allPlayers to PlayerInfo format if needed
    const playersInfo: PlayerInfo[] = allPlayers || (playerPosition ? [{
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

  // Get the LATEST player position using refs (for damage calculations)
  const getLatestPlayerPosition = useCallback(() => {
    // For damage calculations, we want the most current position
    // First try to use the latest player position from props/refs
    if (latestPlayerPosition.current) {
      return latestPlayerPosition.current.clone();
    }
    
    // Fallback to aggro-based targeting if no direct player position
    const targetPlayer = getTargetPlayer();
    return targetPlayer?.position || currentPosition.current;
  }, [getTargetPlayer]);

  const ATTACK_RANGE = 20;
  const BASE_MOVEMENT_SPEED = 2.25; // Consistent base speed like other enemies
  const POSITION_UPDATE_THRESHOLD = 0.1;
  const MINIMUM_UPDATE_INTERVAL = 15;
  const SEPARATION_RADIUS = 1.25;
  const SEPARATION_FORCE = 0.1; // Reduced for smoother movement
  const FIREBALL_COOLDOWN = 8000;
  const FIREBALL_DAMAGE = 16;
  const LIGHTNING_COOLDOWN = 15000;
  const LIGHTNING_DAMAGE = 22;
  const LIGHTNING_WARNING_DURATION = 2.0; // 2 seconds warning
  const LIGHTNING_DAMAGE_RADIUS = 2.0;
  const MOVEMENT_SMOOTHING = 0.85; // Smoothing factor for movement
  const ROTATION_SPEED = 4.0;

  // Add these constants near the other ones (after line 89)
  const WANDER_DURATION = 4500;
  const WANDER_RADIUS = 5; // Slightly smaller for the mage
  const WANDER_ROTATION_SPEED = 4.0;

  // Add these refs near the other refs
  const wanderTarget = useRef<Vector3 | null>(null);
  const wanderStartTime = useRef<number>(Date.now());

  // Sync health changes
  useEffect(() => {
    currentHealth.current = health;
  }, [health]);

  // Sync player position changes to ref for fresh damage calculations
  useEffect(() => {
    if (playerPosition) {
      latestPlayerPosition.current = playerPosition.clone();
    }
  }, [playerPosition]);

  // Sync allPlayers changes to ref for fresh damage calculations in multiplayer
  useEffect(() => {
    latestAllPlayers.current = allPlayers;
  }, [allPlayers]);

  // Handle damage with proper synchronization
  const handleDamage = useCallback((damage: number, source: DamageSource) => {
    if (currentHealth.current <= 0) return;
    
    const newHealth = Math.max(0, currentHealth.current - damage);
    onTakeDamage(`enemy-${id}`, damage);
    
    // Add stealth strike effect
    if (source.type && stealthManager.hasShadowStrikeBuff()) {
      const targetPlayerPos = getTargetPlayerPosition();
      const effectDirection = new Vector3().subVectors(
        currentPosition.current,
        targetPlayerPos
      ).normalize();
      
      setActiveEffects(prev => [...prev, {
        id: Date.now(),
        type: 'stealthStrike',
        position: currentPosition.current.clone(),
        direction: effectDirection,
        duration: 0.2,
        startTime: Date.now()
      }]);
    }
    
    if (newHealth === 0 && currentHealth.current > 0) {
      setIsDead(true);
      setShowDeathEffect(true);
    }
  }, [id, onTakeDamage, getTargetPlayerPosition]);

  // Improved position synchronization - prevent teleporting
  useEffect(() => {
    // Only sync position during initial spawn or when distance is reasonable
    if (position && !currentPosition.current.equals(position)) {
      const distance = currentPosition.current.distanceTo(position);
      
      // Only allow position sync if the distance is reasonable (prevents teleporting)
      if (distance < 5.0) { // Allow small corrections only
        targetPosition.current.copy(position);
        targetPosition.current.y = 0;
        // For SkeletalMage, also update current position if it's far off
        if (distance > 2.0) {
          currentPosition.current.copy(position);
          currentPosition.current.y = 0;
        }
      }
    }
  }, [position]);

  // Cast fireball with telegraph
  const castFireball = useCallback(() => {
    if (!isCastingFireball && !isDead) {
      setIsCastingFireball(true);
      
      // Telegraph animation for 1 second before launching fireball
      setTimeout(() => {
        if (enemyRef.current) {
          const startPos = currentPosition.current.clone();
          startPos.y += 2.25; // Adjust height to match mage's casting position
          
          // Get the CURRENT player position at the exact moment of launch
          const currentTargetPos = getLatestPlayerPosition();
          // Set target height to match player's center mass
          const adjustedTargetPos = currentTargetPos.clone();
          adjustedTargetPos.y = 1.5; // Player's approximate center height
          
          
          setActiveFireballs(prev => [...prev, {
            id: Date.now(),
            position: startPos,
            target: adjustedTargetPos,
            playerPosition: currentTargetPos.clone(),
            startTime: Date.now(),
          }]);
        }
        
        // Reset casting state after fireball is launched
        setTimeout(() => {
          setIsCastingFireball(false);
        }, 500);
      }, 1000);
    }
  }, [isCastingFireball, isDead, getLatestPlayerPosition]);

  // Cast lightning strike with warning
  const castLightningStrike = useCallback(() => {
    if (!isCastingLightning && !isDead) {
      setIsCastingLightning(true);
      
      // Get target player position for the lightning strike
      const targetPlayerPos = getTargetPlayerPosition();
      const strikePosition = targetPlayerPos.clone();
      strikePosition.y = 0; // Strike the ground
      
      // Create warning indicator
      const warningId = Date.now();
      setActiveLightningWarnings(prev => [...prev, {
        id: warningId,
        position: strikePosition,
        startTime: Date.now()
      }]);
      
      // After warning duration, execute lightning strike
      setTimeout(() => {
        // Remove warning
        setActiveLightningWarnings(prev => prev.filter(w => w.id !== warningId));
        
        // Capture the player position at the moment the warning ends (for comparison)
        let warningEndPlayerPos: Vector3;
        if (getCurrentPlayerPosition) {
          // Use the real-time position function if available
          warningEndPlayerPos = getCurrentPlayerPosition().clone();
        } else if (allPlayers && allPlayers.length > 0) {
          warningEndPlayerPos = allPlayers[0].position.clone();
        } else if (playerPosition) {
          warningEndPlayerPos = playerPosition.clone();
        } else {
          warningEndPlayerPos = getLatestPlayerPosition();
        }
        warningEndPlayerPos.y = 0;
        
        
        // Create lightning strike effect with damage check callback
        const strikeId = Date.now();
        let damageProcessed = false; // Prevent multiple damage/stun applications from same strike
        
        setActiveLightningStrikes(prev => [...prev, {
          id: strikeId,
          position: strikePosition,
          startTime: Date.now(),
          onDamageCheck: () => {
            // Prevent multiple calls to damage check for the same strike
            if (damageProcessed) {
              console.log(`[Lightning Strike] Damage already processed for strike ${strikeId}, skipping`);
              return;
            }
            damageProcessed = true;
            // Get the player position at the exact moment of impact (50ms after strike starts)
            let impactPlayerPos: Vector3;
            
            // Try multiple sources for the most current position, prioritizing real-time function
            if (getCurrentPlayerPosition) {
              // Use the real-time position function if available (most accurate)
              impactPlayerPos = getCurrentPlayerPosition().clone();
            } else if (allPlayers && allPlayers.length > 0) {
              // Multiplayer: use the first player's position (should be most current)
              impactPlayerPos = allPlayers[0].position.clone();
            } else if (playerPosition) {
              // Single player: use the current playerPosition prop
              impactPlayerPos = playerPosition.clone();
            } else {
              // Fallback to the ref
              impactPlayerPos = getLatestPlayerPosition();
            }
            
            impactPlayerPos.y = 0; // Compare ground positions
            const distance = strikePosition.distanceTo(impactPlayerPos);
            
            if (distance <= LIGHTNING_DAMAGE_RADIUS) {

              onAttackPlayer(LIGHTNING_DAMAGE);
              globalAggroSystem.addDamageAggro(id, 'local-player', LIGHTNING_DAMAGE, 'player');
              
              // Trigger player stun effect (2 seconds) - only if still in range
              if (playerStunRef?.current) {
                playerStunRef.current.triggerStun(2000);
              }
            } 
          }
        }]);
        
        // Reset casting state
        setTimeout(() => {
          setIsCastingLightning(false);
        }, 500);
      }, LIGHTNING_WARNING_DURATION * 1000);
    }
  }, [playerStunRef, isCastingLightning, isDead, getTargetPlayerPosition, getLatestPlayerPosition, onAttackPlayer, id, allPlayers, playerPosition, getCurrentPlayerPosition]);

  // Add the getNewWanderTarget function after the constants
  const getNewWanderTarget = useCallback(() => {
    if (!enemyRef.current) return null;
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * WANDER_RADIUS;
    
    return new Vector3(
      currentPosition.current.x + Math.cos(angle) * distance,
      0,
      currentPosition.current.z + Math.sin(angle) * distance
    );
  }, []);

  // Update frame logic
  useFrame((_, delta) => {
    if (!enemyRef.current || currentHealth.current <= 0 || isFrozen || isStunned) {
      setIsMoving(false);
      setIsCastingFireball(false);
      return;
    }

    // Get the target player position
    const targetPlayerPosition = getTargetPlayerPosition();

    // Add stealth check
    if (stealthManager.isUnitStealthed()) {
      setIsMoving(false);
      setIsCastingFireball(false);
      
      const now = Date.now();
      if (!wanderTarget.current || now - wanderStartTime.current > WANDER_DURATION) {
        if (!wanderTarget.current) {
          wanderTarget.current = getNewWanderTarget();
        } else {
          // Smoothly transition to new target
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
        const baseWanderSpeed = BASE_MOVEMENT_SPEED * 0.3; // 30% of normal speed for wandering
        const normalizedSpeed = isSlowed ? baseWanderSpeed * 0.5 : baseWanderSpeed;
        const frameSpeed = normalizedSpeed * delta;
        
        // Calculate direction to wander target
        const direction = new Vector3()
          .subVectors(wanderTarget.current, currentPosition.current)
          .normalize();
        
        // Apply direct movement like player (no complex velocity smoothing)
        const movement = direction.multiplyScalar(frameSpeed);
        const newPosition = currentPosition.current.clone().add(movement);
        
        // Simple interpolation for smoothness
        currentPosition.current.lerp(newPosition, MOVEMENT_SMOOTHING);
        currentPosition.current.y = 0;
        enemyRef.current.position.copy(currentPosition.current);
        
        const targetRotation = Math.atan2(direction.x, direction.z);
        const currentRotationY = enemyRef.current.rotation.y;
        let rotationDiff = targetRotation - currentRotationY;
        
        while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
        
        enemyRef.current.rotation.y += rotationDiff * Math.min(1, WANDER_ROTATION_SPEED * delta);
      }
      
      return;
    }

    const distanceToPlayer = currentPosition.current.distanceTo(targetPlayerPosition);

    if (distanceToPlayer > ATTACK_RANGE && currentHealth.current > 0) {
      setIsMoving(true);

      // Use consistent speed calculation like player movement
      const baseSpeed = isSlowed ? BASE_MOVEMENT_SPEED * 0.5 : BASE_MOVEMENT_SPEED;
      const frameSpeed = baseSpeed * delta;

      // Calculate direction to player
      const direction = new Vector3()
        .subVectors(targetPlayerPosition, currentPosition.current)
        .normalize();

      // Calculate separation force (simplified)
      const separationForce = new Vector3();
      const otherEnemies = enemyRef.current.parent?.children
        .filter(child => 
          child !== enemyRef.current && 
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
      const newPosition = currentPosition.current.clone().add(movement);
      
      // Simple smoothing for natural movement
      currentPosition.current.lerp(newPosition, MOVEMENT_SMOOTHING);
      currentPosition.current.y = 0;

      // Apply position to mesh
      enemyRef.current.position.copy(currentPosition.current);

      // Smooth rotation
      const lookTarget = new Vector3()
        .copy(targetPlayerPosition)
        .setY(currentPosition.current.y);
      const targetRotation = Math.atan2(
        lookTarget.x - currentPosition.current.x,
        lookTarget.z - currentPosition.current.z
      );

      // Interpolate rotation
      const currentRotationY = enemyRef.current.rotation.y;
      let rotationDiff = targetRotation - currentRotationY;
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      enemyRef.current.rotation.y += rotationDiff * Math.min(1, ROTATION_SPEED * delta);

    } else {
      setIsMoving(false);
      // Simple deceleration - enemies stop when in attack range
      
      // Make sure mage is facing the player when within attack range
      const lookTarget = new Vector3()
        .copy(targetPlayerPosition)
        .setY(currentPosition.current.y);
      const targetRotation = Math.atan2(
        lookTarget.x - currentPosition.current.x,
        lookTarget.z - currentPosition.current.z
      );

      // Interpolate rotation smoothly
      const currentRotationY = enemyRef.current.rotation.y;
      let rotationDiff = targetRotation - currentRotationY;
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      enemyRef.current.rotation.y += rotationDiff * Math.min(1, ROTATION_SPEED * delta);
    }

    // Check if we should cast a spell (50% chance for each at level 2+)
    const currentTime = Date.now();
    const canCastFireball = currentTime - lastFireballTime.current >= FIREBALL_COOLDOWN;
    const canCastLightning = level >= 2 && currentTime - lastLightningTime.current >= LIGHTNING_COOLDOWN;
    
    if (distanceToPlayer <= ATTACK_RANGE && !isFrozen && !isStunned && !isCastingFireball && !isCastingLightning) {
      if (level >= 2) {
        // Level 2+: 50% chance for each spell
        if (canCastFireball && canCastLightning) {
          if (Math.random() < 0.5) {
            castFireball();
            lastFireballTime.current = currentTime;
          } else {
            castLightningStrike();
            lastLightningTime.current = currentTime;
          }
        } else if (canCastFireball) {
          castFireball();
          lastFireballTime.current = currentTime;
        } else if (canCastLightning) {
          castLightningStrike();
          lastLightningTime.current = currentTime;
        }
      } else {
        // Level 1: Only fireball
        if (canCastFireball) {
          castFireball();
          lastFireballTime.current = currentTime;
        }
      }
    }

    // Clean up old fireballs (older than 10 seconds)
    setActiveFireballs(prev => 
      prev.filter(fireball => Date.now() - fireball.startTime < 10000)
    );

    // Clean up old lightning strikes (older than 3 seconds)
    setActiveLightningStrikes(prev => 
      prev.filter(strike => Date.now() - strike.startTime < 3000)
    );

    // Update position with rate limiting
    const now = Date.now();
    if (now - lastUpdateTime.current >= MINIMUM_UPDATE_INTERVAL) {
      if (currentPosition.current.distanceTo(position) > POSITION_UPDATE_THRESHOLD) {
        onPositionUpdate(id, currentPosition.current.clone());
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
      if (enemyRef.current) {
        enemyRef.current.visible = true;
      }
    }
  }, [health, isDead, id]);

  useEffect(() => {
    if (isDead) {
      const cleanup = setTimeout(() => {
        setShowDeathEffect(false);
        if (enemyRef.current?.parent) {
          enemyRef.current.parent.remove(enemyRef.current);
        }
      }, 3000);
      return () => clearTimeout(cleanup);
    }
  }, [isDead]);

  // 1. Update position sync to only happen during spawning
  useEffect(() => {
    if (position && isSpawning) {
      currentPosition.current.copy(position);
      currentPosition.current.y = 0;
      targetPosition.current.copy(currentPosition.current);
      if (enemyRef.current) {
        enemyRef.current.position.copy(currentPosition.current);
      }
    }
  }, [position, isSpawning]);

  return (
    <>
      <group 
        ref={enemyRef} 
        visible={!isSpawning && currentHealth.current > 0}
        position={currentPosition.current}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <CustomSkeletonMage
          position={[0, 0.735, 0]}
          isAttacking={isCastingFireball || isCastingLightning}
          isWalking={isMoving && currentHealth.current > 0}
          onHit={(damage) => handleDamage(damage, { type: weaponType })}
        />

        {/* Visual telegraph when casting */}
        {isCastingFireball && (
          <group position={[0.4, 1.975, 0]}>
            <mesh>
              <sphereGeometry args={[0.125, 16, 16]} />
              <meshStandardMaterial
                color="#8A2BE2"
                emissive="#8A2BE2"
                emissiveIntensity={1.5}
                transparent
                opacity={0.8}
              />
            </mesh>
            <pointLight color="#ff3333" intensity={2} distance={3} />
          </group>
        )}

                {/* Visual telegraph when casting */}
                {isCastingFireball && (
          <group position={[-.4, 1.975, -0.05]}>
            <mesh>
              <sphereGeometry args={[0.125, 16, 16]} />
              <meshStandardMaterial
                color="#8A2BE2"
                emissive="#8A2BE2"
                emissiveIntensity={1.5} 
                transparent
                opacity={0.7}
              />
            </mesh>
            <pointLight color="#ff3333" intensity={2} distance={3} />
          </group>
        )}

        {/* Visual telegraph when casting lightning */}
        {isCastingLightning && (
          <group position={[0, 2.65, 0]}>
            <mesh>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial
                color="#00bbff"
                emissive="#0088ff"
                emissiveIntensity={2}
                transparent
                opacity={0.8}
              />
            </mesh>
            <pointLight color="#80D9FF" intensity={3} distance={4} />
            
            {/* Electric crackling around mage */}
            {[...Array(6)].map((_, i) => (
              <mesh
                key={i}
                position={[
                  Math.sin(Date.now() * 0.01 + i) * 0.5,
                  Math.sin(Date.now() * 0.008 + i) * 0.3,
                  Math.cos(Date.now() * 0.01 + i) * 0.5
                ]}
              >
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshBasicMaterial
                  color="#B6EAFF"
                  transparent
                  opacity={0.7 + Math.sin(Date.now() * 0.015 + i) * 0.3}
                />
              </mesh>
            ))}
          </group>
        )}

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

      {isSpawning && (
        <BoneVortex2 
          position={currentPosition.current}
          onComplete={() => {
            setIsSpawning(false);
          }}
          isSpawning={true}
        />
      )}

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

      {/* Render active fireballs */}
      {activeFireballs.map(fireball => (
        <MageFireball
          key={fireball.id}
          position={fireball.position}
          target={fireball.target}
          playerPosition={fireball.playerPosition}
          getCurrentPlayerPosition={getLatestPlayerPosition}
          onHit={(didHitPlayer) => {
            
            if (didHitPlayer) {
              onAttackPlayer(FIREBALL_DAMAGE);
              globalAggroSystem.addDamageAggro(id, 'local-player', FIREBALL_DAMAGE, 'player');
            }
            
            // Delay fireball removal to allow explosion animation to complete
            setTimeout(() => {
              setActiveFireballs(prev => 
                prev.filter(f => f.id !== fireball.id)
              );
            }, 50); // Minimal delay to ensure damage is processed
          }}
        />
      ))}

      {/* Add stealth strike effect */}
      {activeEffects.map(effect => {
        if (effect.type === 'stealthStrike') {
          return (
            <StealthStrikeEffect
              key={effect.id}
              position={effect.position}
              direction={effect.direction}
              onComplete={() => {
                setActiveEffects(prev => prev.filter(e => e.id !== effect.id));
              }}
              parentRef={enemyRef}
            />
          );
        }
        return null;
      })}

      {/* Render lightning warning indicators */}
      {activeLightningWarnings.map(warning => (
        <LightningWarningIndicator
          key={warning.id}
          position={warning.position}
          duration={LIGHTNING_WARNING_DURATION}
          onComplete={() => {
            setActiveLightningWarnings(prev => prev.filter(w => w.id !== warning.id));
          }}
        />
      ))}

      {/* Render lightning strikes */}
      {activeLightningStrikes.map(strike => (
        <MageLightningStrike
          key={strike.id}
          position={strike.position}
          onDamageCheck={strike.onDamageCheck}
          onComplete={() => {
            setActiveLightningStrikes(prev => prev.filter(s => s.id !== strike.id));
          }}
        />
      ))}
    </>
  );
} 