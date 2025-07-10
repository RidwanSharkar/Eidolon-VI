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
import ReaperBloodVortex from './ReaperBloodPool';

interface ReaperUnitProps {
  id: string;  
  initialPosition: Vector3;
  position: Vector3;
  health: number;
  maxHealth: number;
  onTakeDamage: (id: string, damage: number) => void;
  onPositionUpdate: (id: string, position: Vector3) => void;
  playerPosition: Vector3;
  onAttackPlayer: (damage: number) => void;
  onEnrageSpawn?: () => void;
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
  onAttackPlayer,
  onEnrageSpawn,
}: ReaperUnitProps & Pick<Enemy, 'position'>) {
  const reaperRef = useRef<Group>(null);
  
  // Use refs for timing
  const lastAttackTime = useRef<number>(Date.now() + 2000);
  const lastReEmergeTime = useRef<number>(Date.now() + 3000); // Start with 3s delay for Re-emerge

  // Use refs for positions so we can always read the LATEST in setTimeouts
  const currentPosition = useRef<Vector3>(initialPosition.clone());
  const playerPosRef = useRef<Vector3>(playerPosition.clone());

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
  
  // Blood vortex state
  const [bloodPools, setBloodPools] = useState<{
    id: string;
    position: Vector3;
    duration: number;
  }[]>([]);

  // Reaper-specific constants (smaller and faster than boss)
  const ATTACK_RANGE = 3.0;
  const ATTACK_COOLDOWN_NORMAL = 2500;
  const ATTACK_COOLDOWN_ENRAGED = 1500;
  const RE_EMERGE_COOLDOWN = 8000; // 8 second cooldown for Re-emerge
  const POST_EMERGE_AGGRESSIVE_DURATION = 3000; // 3 seconds of aggressive behavior after re-emerging
  const MOVEMENT_SPEED = 0.0225;
  const ATTACK_DAMAGE = 36;
  const REAPER_HIT_HEIGHT = 1.5;       
  const REAPER_HIT_RADIUS = 3.0;
  const REAPER_HIT_HEIGHT_RANGE = 3.0;
  const POSITION_UPDATE_THRESHOLD = 0.1;
  const MINIMUM_UPDATE_INTERVAL = 25;

  // Separation constants (prevent stacking with other enemies)
  const SEPARATION_RADIUS = 2.25;
  const SEPARATION_FORCE = 0.25;
  // Current cooldown refs
  const currentAttackCooldown = useRef(ATTACK_COOLDOWN_NORMAL);

  // velocity state
  const velocity = useRef(new Vector3());

  // lastUpdateTime ref
  const lastUpdateTime = useRef(Date.now());

  // Keep the player's position ref updated
  useEffect(() => {
    playerPosRef.current.copy(playerPosition);
  }, [playerPosition]);

  // Sync reaper's position on mount + whenever `position` changes
  useEffect(() => {
    if (position) {
      currentPosition.current.copy(position);
      if (reaperRef.current) {
        reaperRef.current.position.copy(currentPosition.current);
      }
    }
  }, [position]);

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

        // 2) Attack hits ~240ms after the reaper transitions to animation (faster than boss)
        setTimeout(() => {
          // READ LATEST positions from refs at the moment of impact
          const reaperGroundPos = currentPosition.current.clone();
          reaperGroundPos.y = 0;

          const playerGroundPos = playerPosRef.current.clone();
          playerGroundPos.y = 0;

          const distanceToPlayer = reaperGroundPos.distanceTo(playerGroundPos);

          // Only deal damage if STILL within range at impact
          if (distanceToPlayer <= ATTACK_RANGE) {
            onAttackPlayer(ATTACK_DAMAGE);
          }
        }, 240);

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
    ATTACK_DAMAGE,
    ATTACK_RANGE
  ]);

  // Calculate position behind the player
  const getPositionBehindPlayer = useCallback(() => {
    const playerPos = playerPosRef.current.clone();
    
    // Calculate a position directly behind the player
    // We'll place the Reaper 2.5 units behind the player in world coordinates
    // This ensures the Reaper is within attack range immediately after emerging
    const behindDistance = 2.0;
    
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
  }, []);

  // Re-emerge ability logic
  const startReEmerge = useCallback(() => {
    if (isReEmerging || reEmergePhase !== 'idle') {
      return;
    }
    
    // Check cooldown
    const timeSinceLastReEmerge = Date.now() - lastReEmergeTime.current;
    if (timeSinceLastReEmerge < RE_EMERGE_COOLDOWN) {
      return;
    }

    console.log('🩸 Reaper re-emerging!');
    setIsReEmerging(true);
    setReEmergePhase('sinking');
    lastReEmergeTime.current = Date.now();

    // Add blood vortex at original position
    const originalPosition = currentPosition.current.clone();
    originalPosition.y = 0; // Ensure blood vortex is on ground level
    const sinkPoolId = `sink-${Date.now()}`;
    setBloodPools(prev => [...prev, {
      id: sinkPoolId,
      position: originalPosition,
      duration: 8000 // Much longer duration - 8 seconds
    }]);

    // Phase 1: Sink into ground (800ms)
    const startY = reaperRef.current?.position.y || 0;
    const sinkDuration = 400;
    const sinkStartTime = Date.now();
    const sinkDepth = 5; // Much deeper submersion
    
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
              
              // Add blood vortex at emergence position
              const emergePoolId = `emerge-${Date.now()}`;
              const emergePosition = behindPosition.clone();
              emergePosition.y = 0; // Ensure blood vortex is on ground level
              setBloodPools(prev => [...prev, {
                id: emergePoolId,
                position: emergePosition,
                duration: 10000 // Even longer for emergence - 10 seconds
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

                  // Immediate damage since we're positioned behind player
                  setTimeout(() => {
                    onAttackPlayer(ATTACK_DAMAGE);
                  }, 100); // Much faster backstab

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
  }, [isReEmerging, reEmergePhase, getPositionBehindPlayer, onPositionUpdate, id, onAttackPlayer, ATTACK_DAMAGE, currentAttackCooldown]);

  // Helper to remove completed blood vortexes
  const removeBloodPool = useCallback((poolId: string) => {
    setBloodPools(prev => prev.filter(pool => pool.id !== poolId));
  }, []);

  // Main AI loop: move towards player or attack if in range
  useFrame((_, delta) => {
    if (!reaperRef.current || health <= 0) return;

    // Don't do anything else if we're in the middle of Re-emerging
    if (isReEmerging) return;

    const distanceToPlayer = currentPosition.current.distanceTo(playerPosRef.current);

    // Check if we should use Re-emerge ability (priority over other actions)
    // Use Re-emerge every 8 seconds regardless of distance for tactical surprise
    if (Date.now() - lastReEmergeTime.current >= RE_EMERGE_COOLDOWN && !isAttacking && !isAttackOnCooldown) {
      startReEmerge();
      return;
    }

    // If out of melee range + 0.5 unit, move closer
    if (distanceToPlayer > ATTACK_RANGE - 0.5 && health > 0) {
      setIsAttacking(false);

      // Use increased speed if in post-emerge aggressive mode
      const currentMovementSpeed = isPostEmergeAggressive ? MOVEMENT_SPEED * 1.8 : MOVEMENT_SPEED;
      const normalizedSpeed = currentMovementSpeed * 60;
      const currentFrameSpeed = normalizedSpeed * delta;

      const direction = new Vector3()
        .subVectors(playerPosRef.current, currentPosition.current)
        .normalize();

      // Calculate separation force (reduced during aggressive mode)
      const separationForce = new Vector3();
      if (!isPostEmergeAggressive) {
        const otherEnemies = reaperRef.current.parent?.children
          .filter(child => 
            child !== reaperRef.current && 
            child.position && 
            child.position.distanceTo(currentPosition.current) < SEPARATION_RADIUS
          ) || [];

        otherEnemies.forEach(enemy => {
          const currentGroundPos = currentPosition.current.clone().setY(0);
          const enemyGroundPos = enemy.position.clone().setY(0);
          
          const diff = new Vector3()
            .subVectors(currentGroundPos, enemyGroundPos)
            .normalize()
            .multiplyScalar(SEPARATION_FORCE / Math.max(0.1, enemyGroundPos.distanceTo(currentGroundPos)));
          separationForce.add(diff);
        });
      }

      // Combine forces and normalize
      const finalDirection = direction.add(separationForce).normalize();
      finalDirection.y = 0;

      // Calculate target velocity
      const targetVelocity = finalDirection.multiplyScalar(currentFrameSpeed);
      
      // Smoothly interpolate current velocity towards target (faster during aggressive mode)
      const lerpSpeed = isPostEmergeAggressive ? 7.0 * delta : 4.5 * delta;
      velocity.current.lerp(targetVelocity, lerpSpeed);
      
      // Update position with smoothed velocity
      currentPosition.current.add(velocity.current);
      currentPosition.current.y = 0; // Keep on ground

      // Update reaper mesh
      reaperRef.current.position.copy(currentPosition.current);
      
      // Smooth rotation (faster than boss, even faster during aggressive mode)
      const lookTarget = playerPosRef.current.clone().setY(currentPosition.current.y);
      const directionToPlayer = new Vector3()
        .subVectors(lookTarget, currentPosition.current)
        .normalize();
      
      const targetRotation = Math.atan2(directionToPlayer.x, directionToPlayer.z);
      let rotationDiff = targetRotation - reaperRef.current.rotation.y;
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      const rotationSpeed = isPostEmergeAggressive ? 10.0 * delta : 7.0 * delta;
      reaperRef.current.rotation.y += rotationDiff * Math.min(1, rotationSpeed);

      // Update position if changed enough AND enough time has passed
      const now = Date.now();
      if (now - lastUpdateTime.current >= MINIMUM_UPDATE_INTERVAL) {
        if (currentPosition.current.distanceTo(position) > POSITION_UPDATE_THRESHOLD) {
          onPositionUpdate(id, currentPosition.current.clone());
          lastUpdateTime.current = now;
        }
      }
    } else {
      // Decelerate smoothly when stopping
      velocity.current.multiplyScalar(1 - 7.0 * delta);
      
      if (velocity.current.length() > 0.001) {
        currentPosition.current.add(velocity.current);
        reaperRef.current.position.copy(currentPosition.current);
      }
    }

    // Within range => attempt attack if cooldown is up
    // During aggressive mode, attack more frequently
    const effectiveAttackCooldown = isPostEmergeAggressive 
      ? currentAttackCooldown.current * 0.6 
      : currentAttackCooldown.current;
    
    if (Date.now() - lastAttackTime.current >= effectiveAttackCooldown && !isBackstabInProgress) {
      startAttack();
      lastAttackTime.current = Date.now();
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
                <planeGeometry args={[2.5, 0.3]} />  {/* Smaller health bar */}
                <meshBasicMaterial color="#333333" opacity={0.8} transparent />
              </mesh>
              <mesh position={[-1.6 + (currentHealth.current / maxHealth) * 1.6, 0, 0.001]}>
                <planeGeometry args={[(currentHealth.current / maxHealth) * 3.2, 0.3]} />
                <meshBasicMaterial color="#ff0000" opacity={0.9} transparent />
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
      
      {/* Blood vortexes for Re-emerge ability */}
      {bloodPools.map(pool => (
        <ReaperBloodVortex
          key={pool.id}
          position={pool.position}
          duration={pool.duration}
          onComplete={() => removeBloodPool(pool.id)}
        />
      ))}
    </>
  );
} 