// src/versus/Reaper/ReaperUnit.tsx
import React, {
  useRef,
  useEffect,
  useState,
  useCallback
} from 'react';
import { Group, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import ReaperModel from './ReaperModel';
import { Enemy } from '../enemy';
import ReaperAttackIndicator from './ReaperAttackIndicator';
import ReaperSubmergeEffect from './ReaperSubmergeEffect';
import ReaperMistEffect from './ReaperMistEffect';
import { globalAggroSystem, PlayerInfo, TargetInfo, isSummonedUnit } from '../AggroSystem';

interface ReaperUnitProps {
  id: string;  
  initialPosition: Vector3;
  position: Vector3;
  health: number;
  maxHealth: number;
  onTakeDamage: (id: string, damage: number) => void;
  onPositionUpdate: (id: string, position: Vector3, rotation?: number) => void;
  playerPosition: Vector3;
  allPlayers?: PlayerInfo[];
  summonedUnits?: import('../AggroSystem').SummonedUnitInfo[];
  onAttackPlayer: (damage: number) => void;
  onAttackSummonedUnit?: (summonId: string, damage: number) => void;
  onEnrageSpawn?: () => void;
  weaponType: import('@/Weapons/weapons').WeaponType;
  isFrozen?: boolean;
  isStunned?: boolean;
  isSlowed?: boolean;
  knockbackEffect?: { direction: Vector3; distance: number; progress: number; isActive: boolean } | null;
}

export default function ReaperUnit({
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
  onEnrageSpawn,
  weaponType, // eslint-disable-line @typescript-eslint/no-unused-vars
  isFrozen = false,
  isStunned = false,
  isSlowed = false,
  knockbackEffect = null,
}: ReaperUnitProps & Pick<Enemy, 'position'>) {
  const reaperRef = useRef<Group>(null);
  
  // Use refs for timing
  const lastAttackTime = useRef<number>(Date.now() + 2000);
  const lastReEmergeTime = useRef<number>(Date.now() + 3000); // Start with 3s delay for Re-emerge

  // Use refs for positions so we can always read the LATEST in setTimeouts
  const currentPosition = useRef<Vector3>(initialPosition.clone());
  const playerPosRef = useRef<Vector3>(playerPosition.clone());
  const targetPosition = useRef<Vector3>(initialPosition.clone()); // Smooth movement target
  const isReEmergeBlocked = useRef<boolean>(false); // Prevent re-emerge during movement

  // Keep track of current health in a ref as well
  const currentHealth = useRef<number>(health);

  // State
  const [isAttacking, setIsAttacking] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isSpawning, setIsSpawning] = useState(true);
  const [showAttackIndicator, setShowAttackIndicator] = useState(false);
  const [isAttackOnCooldown, setIsAttackOnCooldown] = useState(false);
  const [isBackstabInProgress, setIsBackstabInProgress] = useState(false);
  
  // Re-emerge ability state
  const [isReEmerging, setIsReEmerging] = useState(false);
  const [reEmergePhase, setReEmergePhase] = useState<'idle' | 'sinking' | 'teleporting' | 'rising'>('idle');
  const [isPostEmergeAggressive, setIsPostEmergeAggressive] = useState(false);
  
  // Submerge effect state
  const [submergeEffects, setSubmergeEffects] = useState<{
    id: string;
    position: Vector3;
    duration: number;
  }[]>([]);

  // Mist effect state (separate from submerge effects)
  const [mistEffects, setMistEffects] = useState<{
    id: string;
    position: Vector3;
    duration: number;
  }[]>([]);

  // Reaper-specific constants (smaller and faster than boss)
  const ATTACK_RANGE = 3.0;
  const ATTACK_COOLDOWN_NORMAL = 3000;
  const ATTACK_COOLDOWN_ENRAGED = 2250;
  const RE_EMERGE_COOLDOWN = 8000; // 8 second cooldown for Re-emerge
  const POST_EMERGE_AGGRESSIVE_DURATION = 3000; // 3 seconds of aggressive behavior after re-emerging
  const BASE_MOVEMENT_SPEED = 1.35; // Consistent base speed like other enemies
  const ATTACK_DAMAGE = 22;
  const REAPER_HIT_HEIGHT = 1.5;       
  const REAPER_HIT_RADIUS = 3.0;
  const REAPER_HIT_HEIGHT_RANGE = 3.0;
  const POSITION_UPDATE_THRESHOLD = 0.1;
  const MINIMUM_UPDATE_INTERVAL = 25;

  // Separation constants (prevent stacking with other enemies)
  const SEPARATION_RADIUS = 2.25;
  const SEPARATION_FORCE = 0.15; // Reduced for smoother movement
  const MOVEMENT_SMOOTHING = 0.8; // Smoothing factor for movement
  // Current cooldown refs
  const currentAttackCooldown = useRef(ATTACK_COOLDOWN_NORMAL);

  // lastUpdateTime ref
  const lastUpdateTime = useRef(Date.now());

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

  // Keep the player's position ref updated
  useEffect(() => {
    const targetPos = getTargetPlayerPosition();
    playerPosRef.current.copy(targetPos);
  }, [getTargetPlayerPosition]);

  // Improved position synchronization - prevent teleporting
  useEffect(() => {
    // Only sync position during initial spawn or when distance is reasonable
    if (position && !currentPosition.current.equals(position)) {
      const distance = currentPosition.current.distanceTo(position);
      
      // Only allow position sync if the distance is reasonable (prevents teleporting)
      // Allow larger distance for Reaper due to Re-emerge ability
      if (distance < 10.0 || !reaperRef.current) { // Allow corrections or initial position
        currentPosition.current.copy(position);
        targetPosition.current.copy(position); // Sync target as well
        if (reaperRef.current && !isReEmerging) {
          reaperRef.current.position.copy(currentPosition.current);
        }
      }
    }
  }, [position, isReEmerging]);

  // Sync health in the ref
  useEffect(() => {
    currentHealth.current = health;
  }, [health]);

  // ENRAGE LOGIC
  useEffect(() => {
    const isEnraged = health <= maxHealth / 4;
    const wasNotEnragedBefore = currentAttackCooldown.current === ATTACK_COOLDOWN_NORMAL;
    
    if (isEnraged && wasNotEnragedBefore) {
      // Reaper just became enraged
      onEnrageSpawn?.();  // Trigger spawn effect if needed
    }
    
    currentAttackCooldown.current = isEnraged ? ATTACK_COOLDOWN_ENRAGED : ATTACK_COOLDOWN_NORMAL;
  }, [health, maxHealth, onEnrageSpawn]);

  // Hide reaper for a short spawn animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSpawning(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Mark dead if health hits zero
  useEffect(() => {
    if (health === 0 && !isDead) {
      setIsDead(true);
      // Remove from aggro system when enemy dies
      globalAggroSystem.removeEnemy(id);
    }
  }, [health, id, isDead]);

  // Helper for your hitbox logic (updated to use current position)
  const isWithinHitBox = useCallback(
    (attackerPosition: Vector3, attackHeight: number = 1.0) => {
      // Use current position from ref for accurate hit detection
      const reaperPosition = currentPosition.current;
      const horizontalDist = new Vector3(
        reaperPosition.x - attackerPosition.x,
        0,
        reaperPosition.z - attackerPosition.z
      ).length();

      if (horizontalDist > REAPER_HIT_RADIUS) return false;

      const heightDiff = Math.abs(
        attackerPosition.y + attackHeight - (reaperPosition.y + REAPER_HIT_HEIGHT)
      );
      return heightDiff <= REAPER_HIT_HEIGHT_RANGE;
    },
    []
  );

  // Damage handler (updated to always use position check)
  const handleDamage = useCallback(
    (damage: number, attackerPosition?: Vector3) => {
      if (currentHealth.current <= 0) return;
      
      // Always require attacker position and check hit detection
      if (!attackerPosition || !isWithinHitBox(attackerPosition)) {
        return;
      }

      onTakeDamage(`enemy-${id}`, damage);
      const updatedHealth = Math.max(0, currentHealth.current - damage);
      if (updatedHealth === 0 && currentHealth.current > 0) {
        setIsDead(true);
      }
    },
    [id, onTakeDamage, isWithinHitBox]
  );

  // Attack wind-up logic, reading live positions in final check
  const startAttack = useCallback(() => {
    if (!isAttacking && !isAttackOnCooldown && !isBackstabInProgress) {
      // Make sure we respect cooldown
      if (Date.now() - lastAttackTime.current < currentAttackCooldown.current) {
        return;
      }

      setShowAttackIndicator(true);
      lastAttackTime.current = Date.now();
      setIsAttackOnCooldown(true);

      // 1) range indicator 
      setTimeout(() => {
        setShowAttackIndicator(false);
        setIsAttacking(true);

        // 2) Attack hits ~150ms after the reaper transitions to animation (more reactive timing)
        setTimeout(() => {
          // READ LATEST positions from refs at the precise moment of impact
          const reaperGroundPos = currentPosition.current.clone();
          reaperGroundPos.y = 0;

          const playerGroundPos = playerPosRef.current.clone();
          playerGroundPos.y = 0;

          const distanceToPlayer = reaperGroundPos.distanceTo(playerGroundPos);

          // More precise range check - slightly reduced range for more skill-based dodging
          const actualAttackRange = ATTACK_RANGE * 0.9; // 10% smaller hit range for more precise dodging
          
          // Only deal damage if STILL within range at the precise impact moment
          if (distanceToPlayer <= actualAttackRange) {
            const currentTarget = getTargetPlayer();
            if (currentTarget) {
              if (isSummonedUnit(currentTarget)) {
                globalAggroSystem.addDamageAggro(id, currentTarget.id, ATTACK_DAMAGE, 'summoned');
                if (onAttackSummonedUnit) {
                  onAttackSummonedUnit(currentTarget.id, ATTACK_DAMAGE);
                }
              } else {
                onAttackPlayer(ATTACK_DAMAGE);
                globalAggroSystem.addDamageAggro(id, currentTarget.id, ATTACK_DAMAGE, 'player');
              }
            }
          }
        }, 150);

        // 3) Attack animation ends ~480ms after it starts (faster than boss)
        setTimeout(() => {
          setIsAttacking(false);

          // 4) Re-enable attacks once cooldown is over
          setTimeout(() => {
            setIsAttackOnCooldown(false);
          }, currentAttackCooldown.current);
        }, 480);
      }, 1200); //  MOVEMENT + REACTION TIME (shorter than boss)
    }
  }, [
    isAttacking,
    isAttackOnCooldown,
    isBackstabInProgress,
    onAttackPlayer,
    onAttackSummonedUnit,
    getTargetPlayer,
    id,
    ATTACK_DAMAGE,
    ATTACK_RANGE
  ]);

  // Calculate position behind the player
  const getPositionBehindPlayer = useCallback(() => {
    const targetPos = getTargetPlayerPosition();
    const playerPos = targetPos.clone();
    
    // Calculate a position directly behind the player
    // This ensures the Reaper is within attack range immediately after emerging
    const behindDistance = 1.0;
    
    // Try to determine where "behind" the player is by looking at their recent movement
    // For simplicity, we'll use a fixed offset that places the Reaper directly behind
    // in the negative Z direction (which is typically "behind" in most orientations)
    const directlyBehind = new Vector3(0, 0, -behindDistance);
    
    // Add the offset to player position
    const behindPosition = playerPos.clone().add(directlyBehind);
    behindPosition.y = 0; // Keep on ground level
    
    // Ensure we're within attack range but not too close to avoid clipping
    const distanceToPlayer = behindPosition.distanceTo(playerPos);
    if (distanceToPlayer > ATTACK_RANGE) {
      // If somehow we're too far, move closer
      const direction = new Vector3().subVectors(playerPos, behindPosition).normalize();
      behindPosition.add(direction.multiplyScalar(distanceToPlayer - ATTACK_RANGE + 0.5));
    }
    
    return behindPosition;
  }, [getTargetPlayerPosition]);

  // Re-emerge ability logic
  const startReEmerge = useCallback(() => {
    if (isReEmerging || reEmergePhase !== 'idle' || isReEmergeBlocked.current) {
      return;
    }
    
    // Check cooldown
    const timeSinceLastReEmerge = Date.now() - lastReEmergeTime.current;
    if (timeSinceLastReEmerge < RE_EMERGE_COOLDOWN) {
      return;
    }

    // Block further re-emerge attempts during this sequence
    isReEmergeBlocked.current = true;
    setIsReEmerging(true);
    setReEmergePhase('sinking');
    lastReEmergeTime.current = Date.now();

    // Add mist effect at original position (sink location)
    const originalPosition = currentPosition.current.clone();
    originalPosition.y = 0; // Ground level for mist effect
    const sinkMistId = `sink-mist-${Date.now()}`;
    setMistEffects(prev => [...prev, {
      id: sinkMistId,
      position: originalPosition,
      duration: 1000 // 1 second mist effect
    }]);

    // Phase 1: Sink into ground (800ms)
    const startY = reaperRef.current?.position.y || 0;
    const sinkDuration = 500;
    const sinkStartTime = Date.now();
    const sinkDepth = 5; // y submersion
    
    const animateSink = () => {
      const elapsed = Date.now() - sinkStartTime;
      const progress = Math.min(elapsed / sinkDuration, 1);
      
      if (reaperRef.current) {
        reaperRef.current.position.y = startY - (progress * sinkDepth);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animateSink);
      } else {
        // Phase 2: Teleport behind player (after sink completes)
        setReEmergePhase('teleporting');
        
        setTimeout(() => {
          const behindPosition = getPositionBehindPlayer();
          currentPosition.current.copy(behindPosition);
          targetPosition.current.copy(behindPosition); // Sync target position
          
          if (reaperRef.current) {
            reaperRef.current.position.copy(behindPosition);
            reaperRef.current.position.y = -sinkDepth; // Start at same depth underground
            
            // CRITICAL: Set rotation to face player immediately for backstab
            const directionToPlayer = new Vector3()
              .subVectors(playerPosRef.current, behindPosition)
              .normalize();
            const targetRotation = Math.atan2(directionToPlayer.x, directionToPlayer.z);
            reaperRef.current.rotation.y = targetRotation;
          }
          
          // Notify position update
          onPositionUpdate(id, behindPosition);
          setReEmergePhase('rising');
          
          // Phase 3: Rise from ground (800ms)
          const riseStartTime = Date.now();
          const animateRise = () => {
            const elapsed = Date.now() - riseStartTime;
            const progress = Math.min(elapsed / sinkDuration, 1);
            
            if (reaperRef.current) {
              reaperRef.current.position.y = -sinkDepth + (progress * sinkDepth); // Rise to ground level (0)
            }
            
            if (progress < 1) {
              requestAnimationFrame(animateRise);
            } else {
              if (reaperRef.current) {
                reaperRef.current.position.y = 0; // Ensure exactly at ground level
              }
              setReEmergePhase('idle');
              setIsReEmerging(false);
              isReEmergeBlocked.current = false; // Unblock re-emerge after completion
              
              // Add mist effect at emergence position
              const emergeMistId = `emerge-mist-${Date.now()}`;
              const emergePosition = behindPosition.clone();
              emergePosition.y = 0; // Ground level for mist effect
              setMistEffects(prev => [...prev, {
                id: emergeMistId,
                position: emergePosition,
                duration: 1000 // 1 second mist effect
              }]);
              
              // Start aggressive behavior after re-emerging
              setIsPostEmergeAggressive(true);
              
              // IMMEDIATE BACKSTAB ATTACK after re-emerging
              setTimeout(() => {
                // Force an immediate attack since we're behind the player
                setShowAttackIndicator(true);
                lastAttackTime.current = Date.now();
                setIsAttackOnCooldown(true);
                setIsBackstabInProgress(true); // Set flag for backstab

                // Attack indicator shows for shorter time for backstab
                setTimeout(() => {
                  setShowAttackIndicator(false);
                  setIsAttacking(true);

                  // Check if player is still within range for backstab damage
                  setTimeout(() => {
                    const reaperGroundPos = currentPosition.current.clone();
                    reaperGroundPos.y = 0;
                    const playerGroundPos = playerPosRef.current.clone();
                    playerGroundPos.y = 0;
                    const distanceToPlayer = reaperGroundPos.distanceTo(playerGroundPos);
                    
                    // Backstab has slightly larger range but still requires range check
                    if (distanceToPlayer <= ATTACK_RANGE * 1.1) {
                      const currentTarget = getTargetPlayer();
                      if (currentTarget) {
                        if (isSummonedUnit(currentTarget)) {
                          globalAggroSystem.addDamageAggro(id, currentTarget.id, ATTACK_DAMAGE, 'summoned');
                          if (onAttackSummonedUnit) {
                            onAttackSummonedUnit(currentTarget.id, ATTACK_DAMAGE);
                          }
                        } else {
                          onAttackPlayer(ATTACK_DAMAGE);
                          globalAggroSystem.addDamageAggro(id, currentTarget.id, ATTACK_DAMAGE, 'player');
                        }
                      }
                    }
                  }, 80); // Very fast but still reactive backstab

                  // Attack animation ends
                  setTimeout(() => {
                    setIsAttacking(false);
                    setIsBackstabInProgress(false); // Reset flag
                    
                    // Shorter cooldown after backstab
                    setTimeout(() => {
                      setIsAttackOnCooldown(false);
                    }, currentAttackCooldown.current * 0.5); // 50% reduced cooldown after backstab
                  }, 300); // Faster attack animation
                }, 600); // Shorter wind-up for backstab
              }, 100); // Start attack almost immediately after rising
              
              setTimeout(() => {
                setIsPostEmergeAggressive(false);
              }, POST_EMERGE_AGGRESSIVE_DURATION);
            }
          };
          animateRise();
        }, 50); // Brief pause while underground
      }
    };
    animateSink();
  }, [isReEmerging, reEmergePhase, getPositionBehindPlayer, onPositionUpdate, id, onAttackPlayer, onAttackSummonedUnit, getTargetPlayer, ATTACK_DAMAGE, currentAttackCooldown]);

  // Helper to remove completed submerge effects
  const removeSubmergeEffect = useCallback((effectId: string) => {
    setSubmergeEffects(prev => prev.filter(effect => effect.id !== effectId));
  }, []);

  // Helper to remove completed mist effects
  const removeMistEffect = useCallback((effectId: string) => {
    setMistEffects(prev => prev.filter(effect => effect.id !== effectId));
  }, []);

  // Main AI loop: move towards player or attack if in range
  useFrame((_, delta) => {
    if (!reaperRef.current || health <= 0 || isFrozen || isStunned) return;

    // Don't do anything else if we're in the middle of Re-emerging
    if (isReEmerging) return;

    const targetPlayerPos = getTargetPlayerPosition();
    const distanceToPlayer = currentPosition.current.distanceTo(targetPlayerPos);

    // Check if we should use Re-emerge ability (priority over other actions)
    // Use Re-emerge every 8 seconds regardless of distance
    if (Date.now() - lastReEmergeTime.current >= RE_EMERGE_COOLDOWN && 
        !isAttacking && 
        !isAttackOnCooldown && 
        !isReEmergeBlocked.current) {
      startReEmerge();
      return;
    }

    // If out of melee range + 0.5 unit, move closer
    if (distanceToPlayer > ATTACK_RANGE - 0.5 && health > 0) {
      setIsAttacking(false);

      // Smooth target position towards target player
      targetPosition.current.lerp(targetPlayerPos, 0.02); // Very gradual target adjustment

      // Use consistent speed calculation like player movement
      const baseSpeed = isPostEmergeAggressive ? BASE_MOVEMENT_SPEED * 1.5 : BASE_MOVEMENT_SPEED;
      const currentMovementSpeed = isSlowed ? baseSpeed * 0.5 : baseSpeed;
      const frameSpeed = currentMovementSpeed * delta;

      const direction = new Vector3()
        .subVectors(targetPosition.current, currentPosition.current)
        .normalize();

      // Calculate separation force (simplified)
      const separationForce = new Vector3();
      if (!isPostEmergeAggressive) {
        const otherEnemies = reaperRef.current.parent?.children
          .filter(child => 
            child !== reaperRef.current && 
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
      currentPosition.current.y = 0; // Keep on ground

      // Update reaper mesh position smoothly
      if (reaperRef.current) {
        reaperRef.current.position.copy(currentPosition.current);
        reaperRef.current.position.y = 0; // Ensure Y stays at ground level
      }
      
      // Smooth rotation with consistent speed
      const lookTarget = targetPlayerPos.clone().setY(currentPosition.current.y);
      const directionToPlayer = new Vector3()
        .subVectors(lookTarget, currentPosition.current)
        .normalize();
      
      const targetRotation = Math.atan2(directionToPlayer.x, directionToPlayer.z);
      let rotationDiff = targetRotation - (reaperRef.current?.rotation.y || 0);
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      // Consistent rotation speed regardless of mode
      const rotationSpeed = 5.0 * delta;
      if (reaperRef.current) {
        reaperRef.current.rotation.y += rotationDiff * Math.min(1, rotationSpeed);
      }

      // Update position less frequently to reduce network noise
      const now = Date.now();
      if (now - lastUpdateTime.current >= MINIMUM_UPDATE_INTERVAL * 2) { // Double the interval
        if (currentPosition.current.distanceTo(position) > POSITION_UPDATE_THRESHOLD * 1.5) { // Increase threshold
          onPositionUpdate(id, currentPosition.current.clone());
          lastUpdateTime.current = now;
        }
      }
    } else {
      // Simple deceleration - enemies stop when in attack range
    }

    // Attack logic - only attempt attack if within range
    if (distanceToPlayer <= ATTACK_RANGE && health > 0 && !isFrozen && !isStunned) {
      // During aggressive mode, attack more frequently
      const effectiveAttackCooldown = isPostEmergeAggressive 
        ? currentAttackCooldown.current * 0.6 
        : currentAttackCooldown.current;
      
      if (Date.now() - lastAttackTime.current >= effectiveAttackCooldown && !isBackstabInProgress) {
        startAttack();
        lastAttackTime.current = Date.now();
      }
    }
  });

  // Render
  return (
    <>
      <group
        ref={reaperRef}
        visible={!isSpawning && health > 0}
        position={currentPosition.current}
        scale={[1.2, 1.25, 1.2]}  // Smaller than boss (was 1.595)
        onClick={(e) => e.stopPropagation()}
      >
        <ReaperModel
          isAttacking={isAttacking}
          isWalking={!isAttacking && health > 0}
          onHit={handleDamage}
          playerPosition={playerPosition}
        />

        {/* Health bar */}
        <Billboard
          position={[0, 3.2, 0]}  // Lower than boss health bar
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
                fontSize={0.25}
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

      {/* Attack telegraph */}
      {showAttackIndicator && (
        <ReaperAttackIndicator
          position={currentPosition.current}
          duration={1}
          range={ATTACK_RANGE}
        />
      )}
      
      {/* Submerge effects for Re-emerge ability */}
      {submergeEffects.map(effect => (
        <ReaperSubmergeEffect
          key={effect.id}
          position={effect.position}
          duration={effect.duration}
          onComplete={() => removeSubmergeEffect(effect.id)}
        />
      ))}
      
      {/* Mist effects for Re-emerge ability (rendered independently of Reaper group) */}
      {mistEffects.map(effect => {
        return (
          <ReaperMistEffect
            key={effect.id}
            position={effect.position}
            duration={effect.duration}
            onComplete={() => removeMistEffect(effect.id)}
          />
        );
      })}
    </>
  );
} 