// src/Versus/Abomination/AbominationUnit.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import CustomAbomination from './CustomAbomination';
import { AbominationProps } from './AbominationProps';
import { Enemy } from '../enemy';
import BoneVortex2 from '../../color/SpawnAnimation';
import BoneVortex from '../../color/DeathAnimation';
import { stealthManager } from '../../Spells/Stealth/StealthManager';
import { globalAggroSystem, PlayerInfo, TargetInfo, isSummonedUnit } from '../AggroSystem';
import AbominationLeapIndicator from './AbominationLeapIndicator';
import AbominationShockwaveEffect from './AbominationShockwaveEffect';
import AbominationTrailEffect from './AbominationTrailEffect';



export default function AbominationUnit({
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
}: AbominationProps & Pick<Enemy, 'position'>) {
  const enemyRef = useRef<Group>(null);
  const lastAttackTime = useRef<number>(Date.now() + 2000);
  const [isAttacking, setIsAttacking] = useState(false);
  const [showDeathEffect, setShowDeathEffect] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isSpawning, setIsSpawning] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  
  // Leap ability state
  const [isLeaping, setIsLeaping] = useState(false);
  const [leapPhase, setLeapPhase] = useState<'idle' | 'charging' | 'airborne' | 'landing'>('idle');
  const [showLeapIndicator, setShowLeapIndicator] = useState(false);
  const [showShockwave, setShowShockwave] = useState(false);
  const [leapHeight, setLeapHeight] = useState(0); // For visual jump animation
  const lastLeapTime = useRef<number>(Date.now());
  const isLeapBlocked = useRef<boolean>(false);
  const leapStartPosition = useRef<Vector3>(new Vector3()); // Store leap start position
  
  // Use refs for position tracking
  const currentPosition = useRef(initialPosition.clone());
  const targetPosition = useRef(initialPosition.clone());
  const currentHealth = useRef(health);
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

  const ATTACK_RANGE = 3.0;
  const ATTACK_COOLDOWN = 3000;
  const BASE_MOVEMENT_SPEED = 2.25; // Consistent base speed like other enemies
  const POSITION_UPDATE_THRESHOLD = 0.125;
  const MINIMUM_UPDATE_INTERVAL = 20;
  const ATTACK_DAMAGE = 9;
  const SEPARATION_RADIUS = 3;
  const SEPARATION_FORCE = 0.15; // Reduced for smoother movement
  const ARM_DELAY = 300;
  const TOTAL_ARMS = 6;
  const MOVEMENT_SMOOTHING = 0.85; // Smoothing factor for movement
  const ROTATION_SPEED = 6.0;
  
  // Leap ability constants
  const LEAP_COOLDOWN = 12000; // 12 second cooldown for leap
  const LEAP_CHARGE_DURATION = 1250; // 1.25 seconds charge-up
  const LEAP_AIRBORNE_DURATION = 2000; // 2 seconds in the air
  const LEAP_BEHIND_DISTANCE = 1.0; // Land 1.0 units behind target

  const wanderTarget = useRef<Vector3 | null>(null);
  const wanderStartTime = useRef<number>(Date.now());

  const WANDER_DURATION = 1000;
  const WANDER_RADIUS = 6;
  const WANDER_ROTATION_SPEED = 1.5;

  // Sync health changes
  useEffect(() => {
    currentHealth.current = health;
  }, [health]);

  // Handle damage with proper synchronization
  const handleDamage = useCallback((damage: number) => {
    if (currentHealth.current <= 0) return;
    
    const newHealth = Math.max(0, currentHealth.current - damage);
    onTakeDamage(`enemy-${id}`, damage);
    
    if (newHealth === 0 && currentHealth.current > 0) {
      setIsDead(true);
      setShowDeathEffect(true);
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
        currentPosition.current.y = 0;
        targetPosition.current.copy(currentPosition.current);
        if (enemyRef.current) {
          enemyRef.current.position.copy(currentPosition.current);
        }
      }
    }
  }, [position, isSpawning]);

  const getNewWanderTarget = useCallback(() => {
    if (!enemyRef.current) return null;
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * WANDER_RADIUS;
    
    const newTarget = new Vector3(
      currentPosition.current.x + Math.cos(angle) * distance,
      0,
      currentPosition.current.z + Math.sin(angle) * distance
    );
    
    return newTarget;
  }, []);



  // Leap ability logic
  const startLeap = useCallback(() => {
    if (isLeaping || leapPhase !== 'idle' || isLeapBlocked.current) {
      return;
    }
    
    // Check cooldown
    const timeSinceLastLeap = Date.now() - lastLeapTime.current;
    if (timeSinceLastLeap < LEAP_COOLDOWN) {
      return;
    }

    // Only leap at 25% health or below
    const healthPercentage = currentHealth.current / maxHealth;
    if (healthPercentage > 0.25) {
      return;
    }

    // Block further leap attempts during this sequence
    isLeapBlocked.current = true;
    setIsLeaping(true);
    setLeapPhase('charging');
    setShowLeapIndicator(true);
    lastLeapTime.current = Date.now();
    
    // Store the starting position for the leap animation
    leapStartPosition.current.copy(currentPosition.current);
    console.log(`[Abomination] Starting leap from position: (${leapStartPosition.current.x.toFixed(2)}, ${leapStartPosition.current.z.toFixed(2)})`);

    // Phase 1: Charge up (1.25 seconds)
    setTimeout(() => {
      setShowLeapIndicator(false);
      setLeapPhase('airborne');
      
      // Start the jump animation - animate height over time
      const jumpStartTime = Date.now();
      const maxJumpHeight = 10.0; // Maximum height of the jump
      
      const animateJump = () => {
        const elapsed = Date.now() - jumpStartTime;
        const progress = Math.min(elapsed / LEAP_AIRBORNE_DURATION, 1);
        
        // Create an arc: goes up first half, then down second half
        const heightProgress = Math.sin(progress * Math.PI); // Creates arc from 0 to 1 to 0
        const currentJumpHeight = heightProgress * maxJumpHeight;
        setLeapHeight(currentJumpHeight);
        
        if (progress < 1) {
          requestAnimationFrame(animateJump);
        } else {
          // Phase 2 complete: Landing
          setLeapHeight(0); // Ensure we're back at ground level
          
          // Get FRESH target position at the moment of landing (like Reaper does)
          const freshTargetPos = getTargetPlayerPosition();
          console.log(`[Abomination] Getting fresh target position at landing: (${freshTargetPos.x.toFixed(2)}, ${freshTargetPos.z.toFixed(2)})`);
          
          // Calculate landing position behind the CURRENT target position
          const directionToTarget = new Vector3()
            .subVectors(currentPosition.current, freshTargetPos)
            .normalize();
          const landingPosition = freshTargetPos.clone()
            .add(directionToTarget.multiplyScalar(LEAP_BEHIND_DISTANCE));
          landingPosition.y = 0; // Ensure ground level
          
          console.log(`[Abomination] Landing at position: (${landingPosition.x.toFixed(2)}, ${landingPosition.z.toFixed(2)})`);
          
          // Update positions
          currentPosition.current.copy(landingPosition);
          targetPosition.current.copy(landingPosition);
          
          if (enemyRef.current) {
            enemyRef.current.position.copy(landingPosition);
            enemyRef.current.position.y = 0; // Ensure exactly at ground level
            
            // Face the target immediately after landing (using fresh position)
            const directionToTarget = new Vector3()
              .subVectors(freshTargetPos, landingPosition)
              .normalize();
            const targetRotation = Math.atan2(directionToTarget.x, directionToTarget.z);
            enemyRef.current.rotation.y = targetRotation;
          }
          
          // Notify position update
          onPositionUpdate(id, landingPosition);
          setLeapPhase('landing');
          
          // Show shockwave effect
          setShowShockwave(true);
          
          // Phase 3: Landing and shockwave
          setTimeout(() => {
            setLeapPhase('idle');
            setIsLeaping(false);
            isLeapBlocked.current = false; // Unblock leap after completion
            console.log(`[Abomination] Leap sequence completed`);
          }, 500); // Brief landing phase
        }
      };
      
      // Start the jump animation
      animateJump();
      
    }, LEAP_CHARGE_DURATION);
  }, [isLeaping, leapPhase, onPositionUpdate, id, getTargetPlayerPosition, maxHealth]);

  // Helper to remove completed shockwave effect
  const removeShockwaveEffect = useCallback(() => {
    setShowShockwave(false);
  }, []);

  useFrame((_, delta) => {
    if (!enemyRef.current || currentHealth.current <= 0 || isFrozen || isStunned) {
      setIsMoving(false);
      setIsAttacking(false);
      return;
    }

    // Don't do anything else if we're in the middle of leaping
    if (isLeaping) return;

    // Get the target player position
    const targetPlayerPosition = getTargetPlayerPosition();
    if (!targetPlayerPosition) {
      setIsMoving(false);
      return;
    }

    // Check if we should use Leap ability (priority over other actions)
    // Only at 25% health or below
    const healthPercentage = currentHealth.current / maxHealth;
    if (healthPercentage <= 0.25 && 
        Date.now() - lastLeapTime.current >= LEAP_COOLDOWN && 
        !isAttacking && 
        !isLeapBlocked.current) {
      startLeap();
      return;
    }

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
        
        const now = Date.now();
        if (now - lastUpdateTime.current >= MINIMUM_UPDATE_INTERVAL) {
          if (currentPosition.current.distanceTo(position) > POSITION_UPDATE_THRESHOLD) {
            onPositionUpdate(id, currentPosition.current.clone());
            lastUpdateTime.current = now;
          }
        }
        
        return;
      }
    }

    const distanceToPlayer = currentPosition.current.distanceTo(targetPlayerPosition);

    if (distanceToPlayer > ATTACK_RANGE && currentHealth.current > 0) {
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
      const directionToPlayer = new Vector3()
        .subVectors(lookTarget, currentPosition.current)
        .normalize();
      
      const targetRotation = Math.atan2(directionToPlayer.x, directionToPlayer.z);
      let rotationDiff = targetRotation - enemyRef.current.rotation.y;
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      enemyRef.current.rotation.y += rotationDiff * Math.min(1, ROTATION_SPEED * delta);

      const now = Date.now();
      if (now - lastUpdateTime.current >= MINIMUM_UPDATE_INTERVAL) {
        if (currentPosition.current.distanceTo(position) > POSITION_UPDATE_THRESHOLD) {
          onPositionUpdate(id, currentPosition.current.clone());
          lastUpdateTime.current = now;
        }
      }
    } else {
      setIsMoving(false);
      // Simple deceleration - enemies stop when in attack range
    }

    // Attack logic
    if (distanceToPlayer <= ATTACK_RANGE && currentHealth.current > 0 && !isFrozen && !isStunned) {
      const currentTime = Date.now();
      if (currentTime - lastAttackTime.current >= ATTACK_COOLDOWN) {
        setIsAttacking(true);
        
        const attackStartPosition = currentPosition.current.clone();
        
        // Stage the attacks with arm delay
        for (let i = 0; i < TOTAL_ARMS; i++) {
          setTimeout(() => {
            const finalTargetPlayerPosition = getTargetPlayerPosition();
            const finalDistanceToPlayer = currentPosition.current.distanceTo(finalTargetPlayerPosition);
            
            if (currentHealth.current > 0 && 
                finalDistanceToPlayer <= ATTACK_RANGE && 
                attackStartPosition.distanceTo(currentPosition.current) < 0.85) {
              
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
          }, 800 + (i * ARM_DELAY));
        }
        
        lastAttackTime.current = currentTime;

        setTimeout(() => {
          setIsAttacking(false);
        }, 800 + (TOTAL_ARMS * ARM_DELAY) + 300);
      }
    }

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

  // Add stealth break event listener in a useEffect
  useEffect(() => {
    const handleStealthBreak = () => {
      // Immediately re-enable targeting when stealth breaks
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
        ref={enemyRef} 
        visible={!isSpawning && currentHealth.current > 0}
        position={[currentPosition.current.x, currentPosition.current.y + leapHeight, currentPosition.current.z]}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <CustomAbomination
          position={[0, 0.765, 0]}
          isAttacking={isAttacking}
          isWalking={isMoving && currentHealth.current > 0}
          onHit={handleDamage}
        />

        <Billboard
          position={[0, 5.5, 0]}
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
          scale={1.5}
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
          scale={1.5}
        />
      )}

      {/* Leap charge indicator */}
      {showLeapIndicator && (
        <AbominationLeapIndicator
          position={currentPosition.current}
          duration={LEAP_CHARGE_DURATION}
          onComplete={() => setShowLeapIndicator(false)}
        />
      )}

      {/* Leap landing shockwave effect */}
      {showShockwave && (
        <AbominationShockwaveEffect
          position={currentPosition.current}
          duration={2000}
          onComplete={removeShockwaveEffect}
        />
      )}

      {/* Trail effect during leap */}
      {leapPhase === 'airborne' && (
        <AbominationTrailEffect parentRef={enemyRef} />
      )}

      {/* Ground shadow during leap to show landing position */}
      {leapPhase === 'airborne' && (
        <mesh position={[currentPosition.current.x, 0.01, currentPosition.current.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.0, 32]} />
          <meshBasicMaterial 
            color="#000000" 
            opacity={0.3} 
            transparent 
            depthWrite={false}
          />
        </mesh>
      )}
    </>
  );
} 