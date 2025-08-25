import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { Enemy } from '@/Versus/enemy';
import AbyssalSkeletonModel from './AbyssalSkeletonModel';
import { globalAggroSystem } from '@/Versus/AggroSystem';

interface AbysalSkeletonSummonProps {
  id: string;
  position: Vector3;
  health: number;
  maxHealth: number;
  damage: number;
  enemyData: Enemy[];
  playerPosition: Vector3;
  onDamage: (targetId: string, damage: number, position?: Vector3) => void;
  onDeath: (skeletonId: string) => void;
  onTakeDamage: (id: string, damage: number) => void;
  setDamageNumbers: (callback: (prev: Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isSummon?: boolean;
  }>) => Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isSummon?: boolean;
  }>) => void;
  nextDamageNumberId: React.MutableRefObject<number>;
}

export default function AbysalSkeletonSummon({
  id,
  position,
  health: initialHealth,
  damage,
  enemyData,
  playerPosition,
  onDamage,
  setDamageNumbers,
  nextDamageNumberId,
}: AbysalSkeletonSummonProps) {
  const groupRef = useRef<Group>(null);
  const [currentTarget, setCurrentTarget] = useState<Enemy | null>(null);
  const [health] = useState(initialHealth);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isWalking, setIsWalking] = useState(false);

  const constants = useRef({
    lastAttackTime: 0,
    lastTargetSwitchTime: Date.now(),
    startTime: Date.now(), // Track when skeleton was summoned
    ATTACK_COOLDOWN: 2200, // 1.2 seconds between attacks
    ATTACK_RANGE: 3, // Melee range for attacking
    FOLLOW_RANGE: 3, // Range to stay near player
    DAMAGE: damage,
    TARGET_SWITCH_INTERVAL: 9000, // 6 seconds between target switches
    MOVEMENT_SPEED: 2.5, // Movement speed
    PLAYER_FOLLOW_SPEED: 2, // Speed when following player
    // DURATION: 10000, // Removed - skeletons now last indefinitely
    nextProjectileId: 0
  }).current;

  // Calculate distance between two positions
  const calculateDistance = useCallback((pos1: { x: number, z: number }, pos2: { x: number, z: number }) => {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
  }, []);

  // Simplified targeting: always target closest enemy
  const findNewTarget = useCallback((excludeCurrentTarget: boolean = false): Enemy | null => {
    if (!groupRef.current) return null;

    let availableEnemies = enemyData.filter(enemy => 
      enemy.health > 0 && 
      !enemy.isDying && 
      !enemy.deathStartTime && 
      enemy.position
    );

    if (excludeCurrentTarget && currentTarget) {
      availableEnemies = availableEnemies.filter(enemy => enemy.id !== currentTarget.id);
    }

    if (availableEnemies.length === 0) return null;

    // Always target the closest enemy - simple and decisive
    const skeletonPosition = groupRef.current.position;
    let closestEnemy: Enemy | null = null;
    let closestDistance = Infinity;
    
    for (const enemy of availableEnemies) {
      const distance = calculateDistance(skeletonPosition, enemy.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }
    
    return closestEnemy;
  }, [enemyData, currentTarget, calculateDistance]);

  // Handle attacking an enemy
  const handleAttack = useCallback((target: Enemy) => {
    if (!target || 
        target.health <= 0 || 
        target.isDying || 
        target.deathStartTime || 
        !target.position ||
        !groupRef.current) {
      return;
    }

    const isBossTarget = target.id.startsWith('boss-') || target.id.startsWith('enemy-boss-');
    const actualDamage = isBossTarget ? Math.floor(constants.DAMAGE * 0.5) : constants.DAMAGE; // Half damage to bosses
    
    const impactPosition = target.position.clone().setY(1.5);
    
    // Check if enemy still exists
    if (!enemyData.find(e => e.id === target.id && e.health > 0)) {
      return;
    }

    onDamage(target.id, actualDamage, impactPosition);
    
    // AbyssalSkeletons are no longer targetable by enemies - remove aggro registration
    
    // Add damage number
    setDamageNumbers(prev => [...prev, {
      id: nextDamageNumberId.current++,
      damage: actualDamage,
      position: impactPosition.clone(),
      isCritical: false,
      isSummon: true
    }]);

    // Set attacking animation
    setIsAttacking(true);
    setTimeout(() => setIsAttacking(false), 400); // Attack animation duration

  }, [constants, onDamage, setDamageNumbers, nextDamageNumberId, enemyData]);

  // Main AI loop
  useFrame((_, delta) => {
    if (!groupRef.current || health <= 0) return;

    const now = Date.now();
    const skeletonPosition = groupRef.current.position;
    
    // Skeletons now last indefinitely - no duration check

    // Find valid enemies in range
    const validEnemies = enemyData.filter(enemy => 
      enemy.health > 0 && 
      !enemy.isDying && 
      !enemy.deathStartTime && 
      enemy.position
    );

    // Simplified target switching logic - switch every 6 seconds or if target is invalid
    const shouldSwitchTarget = () => {
      // Always switch if current target is invalid
      if (!currentTarget || currentTarget.health <= 0 || currentTarget.isDying || currentTarget.deathStartTime) {
        return true;
      }

      // Switch targets every 6 seconds for variety
      return now - constants.lastTargetSwitchTime > constants.TARGET_SWITCH_INTERVAL;
    };

    if (shouldSwitchTarget()) {
      const newTarget = findNewTarget(true);
      if (newTarget && (!currentTarget || newTarget.id !== currentTarget.id)) {
        setCurrentTarget(newTarget);
        constants.lastTargetSwitchTime = now;
      } else if (!newTarget) {
        setCurrentTarget(null);
      }
    }

    // Find fresh target data
    const freshTarget = currentTarget ? validEnemies.find(e => e.id === currentTarget.id) : null;

    if (freshTarget && freshTarget.health > 0) {
      // COMBAT MODE: Attack enemy
      const targetDistance = calculateDistance(skeletonPosition, freshTarget.position);

      if (targetDistance > constants.ATTACK_RANGE) {
        // Move toward target
        const direction = freshTarget.position.clone().sub(skeletonPosition).normalize();
        direction.y = 0; // Keep on ground level
        
        const movement = direction.multiplyScalar(constants.MOVEMENT_SPEED * delta);
        groupRef.current.position.add(movement);
        
        // Face the target
        const angle = Math.atan2(direction.x, direction.z);
        groupRef.current.rotation.y = angle;
        
        setIsWalking(true);
        setIsAttacking(false);
      } else {
        // In range - attack
        setIsWalking(false);
        
        if (now - constants.lastAttackTime > constants.ATTACK_COOLDOWN) {
          handleAttack(freshTarget);
          constants.lastAttackTime = now;
        }
      }
    } else {
      // FOLLOW MODE: Follow player when no enemies
      const playerDistance = calculateDistance(skeletonPosition, playerPosition);
      
      if (playerDistance > constants.FOLLOW_RANGE) {
        // Move toward player
        const direction = playerPosition.clone().sub(skeletonPosition).normalize();
        direction.y = 0; // Keep on ground level
        
        const movement = direction.multiplyScalar(constants.PLAYER_FOLLOW_SPEED * delta);
        groupRef.current.position.add(movement);
        
        // Face the player
        const angle = Math.atan2(direction.x, direction.z);
        groupRef.current.rotation.y = angle;
        
        setIsWalking(true);
        setIsAttacking(false);
      } else {
        // Close enough to player - idle
        setIsWalking(false);
        setIsAttacking(false);
      }
      
      // Clear current target when following player
      if (currentTarget) {
        setCurrentTarget(null);
      }
    }
  });

  // AbyssalSkeletons are no longer targetable - remove takeDamage function
  // They will only die from duration expiry

  // AbyssalSkeletons are no longer targetable - remove takeDamage exposure
  useEffect(() => {
    if (groupRef.current) {
      // Add skeleton ID to userData for identification only
      groupRef.current.userData = { skeletonId: id };
    }
  }, [id]);

  // Initialize position
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(position);
    }
  }, [position]);

  // Cleanup aggro system on unmount
  useEffect(() => {
    return () => {
      globalAggroSystem.removeTarget(id);
    };
  }, [id]);

  // Don't render if dead
  if (health <= 0) return null;

  return (
    <group ref={groupRef}>
      {/* Removed health bar - AbyssalSkeletons are no longer targetable */}
      
      <AbyssalSkeletonModel
        position={[0, -0.1, 0]}
        isAttacking={isAttacking}
        isWalking={isWalking && health > 0}
        onHit={() => {}} // AbyssalSkeletons don't take damage anymore
        isUsingDeathGrasp={false} // AbyssalSkeletons don't use Death Grasp
        isUsingFrostStrike={false} // AbyssalSkeletons don't use Frost Strike
        onDeathGraspStart={undefined}
        onFrostStrikeStart={undefined}
      />
    </group>
  );
}