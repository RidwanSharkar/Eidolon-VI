// src/versus/Boss/BossUnit.tsx
import React, {
  useRef,
  useEffect,
  useState,
  useCallback
} from 'react';
import { Group, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import BossModel from './BossModel';
import { Enemy } from '../enemy';
import Meteor from '@/Versus/Boss/Meteor';
import BossAttackIndicator from './BossAttackIndicator';

interface BossUnitProps {
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

export default function BossUnit({
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
}: BossUnitProps & Pick<Enemy, 'position'>) {
  const bossRef = useRef<Group>(null);
  
  // Use refs for timing
  const lastAttackTime = useRef<number>(Date.now() + 2000);
  const lastMeteorTime = useRef<number>(Date.now());

  // Use refs for positions so we can always read the LATEST in setTimeouts
  const currentPosition = useRef<Vector3>(initialPosition.clone());
  const playerPosRef = useRef<Vector3>(playerPosition.clone());

  // Keep track of current health in a ref as well
  const currentHealth = useRef<number>(health);

  // State
  const [isAttacking, setIsAttacking] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isSpawning, setIsSpawning] = useState(true);
  const [isCastingMeteor, setIsCastingMeteor] = useState(false);
  const [showAttackIndicator, setShowAttackIndicator] = useState(false);
  const [isAttackOnCooldown, setIsAttackOnCooldown] = useState(false);

  // Boss-specific constants
  const ATTACK_RANGE = 5;
  const ATTACK_COOLDOWN_NORMAL = 3500;
  const ATTACK_COOLDOWN_ENRAGED =2500;
  const MOVEMENT_SPEED = 0.2;
  const SMOOTHING_FACTOR = 0.2;
  const ATTACK_DAMAGE = 0;
  const BOSS_HIT_HEIGHT = 2.0;       
  const BOSS_HIT_RADIUS = 4.0;
  const BOSS_HIT_HEIGHT_RANGE = 4.0;
  const METEOR_COOLDOWN_NORMAL = 7500;
  const METEOR_COOLDOWN_ENRAGED = 4750;

  // Current cooldown refs
  const currentAttackCooldown = useRef(ATTACK_COOLDOWN_NORMAL);
  const currentMeteorCooldown = useRef(METEOR_COOLDOWN_NORMAL);

  // Keep the player's position ref updated
  useEffect(() => {
    playerPosRef.current.copy(playerPosition);
  }, [playerPosition]);

  // Sync boss's position on mount + whenever `position` changes
  useEffect(() => {
    if (position) {
      currentPosition.current.copy(position);
      if (bossRef.current) {
        bossRef.current.position.copy(currentPosition.current);
      }
    }
  }, [position]);

  // Sync health in the ref
  useEffect(() => {
    currentHealth.current = health;
  }, [health]);

  // ENRAGE LOGIC
  useEffect(() => {
    const isEnraged = health <= maxHealth / 2;
    const wasNotEnragedBefore = currentAttackCooldown.current === ATTACK_COOLDOWN_NORMAL;
    
    if (isEnraged && wasNotEnragedBefore) {
      // Boss just became enraged
      onEnrageSpawn?.();  // Trigger abomination spawn
    }
    
    currentAttackCooldown.current = isEnraged ? ATTACK_COOLDOWN_ENRAGED : ATTACK_COOLDOWN_NORMAL;
    currentMeteorCooldown.current = isEnraged ? METEOR_COOLDOWN_ENRAGED : METEOR_COOLDOWN_NORMAL;
  }, [health, maxHealth, onEnrageSpawn]);

  // Hide boss for a short spawn animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSpawning(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Mark dead if health hits zero
  useEffect(() => {
    if (health === 0 && !isDead) {
      console.log(`Boss ${id} died`);
      setIsDead(true);
    }
  }, [health, id, isDead]);

  // Helper for your hitbox logic (updated to use current position)
  const isWithinHitBox = useCallback(
    (attackerPosition: Vector3, attackHeight: number = 1.0) => {
      // Use current position from ref for accurate hit detection
      const bossPosition = currentPosition.current;
      const horizontalDist = new Vector3(
        bossPosition.x - attackerPosition.x,
        0,
        bossPosition.z - attackerPosition.z
      ).length();

      if (horizontalDist > BOSS_HIT_RADIUS) return false;

      const heightDiff = Math.abs(
        attackerPosition.y + attackHeight - (bossPosition.y + BOSS_HIT_HEIGHT)
      );
      return heightDiff <= BOSS_HIT_HEIGHT_RANGE;
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
    if (!isAttacking && !isAttackOnCooldown) {
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

        // 2) Attack hits ~270ms after the boss transitions to animation
        setTimeout(() => {
          // READ LATEST positions from refs at the moment of impact
          const bossGroundPos = currentPosition.current.clone();
          bossGroundPos.y = 0;

          const playerGroundPos = playerPosRef.current.clone();
          playerGroundPos.y = 0;

          const distanceToPlayer = bossGroundPos.distanceTo(playerGroundPos);

          // Only deal damage if STILL within range at impact
          if (distanceToPlayer <= ATTACK_RANGE) {
            onAttackPlayer(ATTACK_DAMAGE);
          }
        }, 270);

        // 3) Attack animation ends ~540ms after it starts
        setTimeout(() => {
          setIsAttacking(false);

          // 4) Re-enable attacks once cooldown is over
          setTimeout(() => {
            setIsAttackOnCooldown(false);
          }, currentAttackCooldown.current);
        }, 540);
      }, 1500); //  MOVEMENT + REACTION TIME 
    }
  }, [
    isAttacking,
    isAttackOnCooldown,
    onAttackPlayer,
    ATTACK_DAMAGE,
    ATTACK_RANGE
  ]);

  // Meteor cast logic
  const castMeteor = useCallback(() => {
    // Check cooldown before casting
    if (!isCastingMeteor && Date.now() - lastMeteorTime.current >= currentMeteorCooldown.current) {
      setIsCastingMeteor(true);
      lastMeteorTime.current = Date.now();  // Update last cast time
      
      // METEOR CAST TIME
      setTimeout(() => {
        setIsCastingMeteor(false);
      }, 3500);
    }
  }, [isCastingMeteor]);

  // Main AI loop: move towards player or attack if in range
  useFrame(() => {
    if (!bossRef.current || health <= 0) return;

    const distanceToPlayer = currentPosition.current.distanceTo(playerPosRef.current);

    // Check if we should cast meteor (when not casting and cooldown is up)
    if (!isCastingMeteor && 
        Date.now() - lastMeteorTime.current >= currentMeteorCooldown.current) {
      castMeteor();
    }

    // If out of melee range + 1 unit, move closer
    if (distanceToPlayer > ATTACK_RANGE -0.375 && health > 0) {
      setIsAttacking(false);

      const direction = new Vector3()
        .subVectors(playerPosRef.current, currentPosition.current)
        .normalize();

      // Move boss
      const nextPos = currentPosition.current.clone().add(
        direction.multiplyScalar(MOVEMENT_SPEED)
      );
      // Lerp for smoother movement
      currentPosition.current.lerp(nextPos, SMOOTHING_FACTOR);

      // Update boss mesh & let parent know
      bossRef.current.position.copy(currentPosition.current);
      
      // UPDATED ROTATION LOGIC
      const lookAtPos = playerPosRef.current.clone();
      lookAtPos.y = currentPosition.current.y; // Keep same Y to avoid tilting
      
      // Calculate direction to player
      const directionToPlayer = new Vector3()
        .subVectors(lookAtPos, currentPosition.current)
        .normalize();
      
      // Calculate the angle to rotate
      const targetRotation = Math.atan2(directionToPlayer.x, directionToPlayer.z);
      
      // Smoothly interpolate the rotation
      bossRef.current.rotation.y = targetRotation;

      // If position changed enough, notify parent
      if (currentPosition.current.distanceTo(position) > 0.01) {
        onPositionUpdate(id, currentPosition.current.clone());
      }
    } else {
      // Within range => attempt attack if cooldown is up
      if (Date.now() - lastAttackTime.current >= currentAttackCooldown.current) {
        startAttack();
        lastAttackTime.current = Date.now();
      }
    }
  });

  // Render
  return (
    <>
      <group
        ref={bossRef}
        visible={!isSpawning && health > 0}
        position={currentPosition.current}
        scale={[1.55, 1.55, 1.55]}
        onClick={(e) => e.stopPropagation()}
      >
        <BossModel
          isAttacking={isAttacking}
          isWalking={!isAttacking && health > 0}
          onHit={handleDamage}
          playerPosition={playerPosition}
        />

        {/* Health bar */}
        <Billboard
          position={[0, 4, 0]}
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          {currentHealth.current > 0 && (
            <>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[4.0, 0.4]} />
                <meshBasicMaterial color="#333333" opacity={0.8} transparent />
              </mesh>
              <mesh position={[-2.0 + (currentHealth.current / maxHealth) * 2, 0, 0.001]}>
                <planeGeometry args={[(currentHealth.current / maxHealth) * 4.0, 0.35]} />
                <meshBasicMaterial color="#ff0000" opacity={0.9} transparent />
              </mesh>
              <Text
                position={[0, 0, 0.002]}
                fontSize={0.3}
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

      {/* Meteor effect */}
      {isCastingMeteor && (
        <Meteor
          targetPosition={playerPosRef.current}
          onImpact={(damage) => onAttackPlayer(damage)}
          onComplete={() => setIsCastingMeteor(false)}
          playerPosition={playerPosRef.current}
        />
      )}

      {/* Attack telegraph */}
      {showAttackIndicator && (
        <BossAttackIndicator
          position={currentPosition.current}
          duration={1}
          range={ATTACK_RANGE}
        />
      )}
    </>
  );
}
