import { useState, useRef, useCallback, useEffect } from 'react';
import { Vector3 } from 'three';
import { Group } from 'three';
import { WeaponSubclass } from '@/Weapons/weapons';
import { SynchronizedEffect } from '@/Multiplayer/MultiplayerContext';

interface UseGlacialShardProps {
  parentRef: React.RefObject<Group>;
  onHit: (targetId: string, damage: number) => void;
  enemyData: Array<{
    id: string;
    position: Vector3;
    health: number;
    isDying?: boolean;
  }>;
  setDamageNumbers: (callback: (prev: Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isGlacialShard?: boolean;
  }>) => Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isGlacialShard?: boolean;
  }>) => void;
  nextDamageNumberId: { current: number };
  onImpact?: (shardId: number, impactPosition?: Vector3) => void;
  charges: Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>;
  setCharges: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>>>;

  setActiveEffects?: (callback: (prev: Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
  }>) => Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
  }>) => void;
  
  // Add function to check if enemy is frozen for 2x damage multiplier
  isEnemyFrozen?: (enemyId: string) => boolean;
  currentSubclass?: WeaponSubclass;
  // Multiplayer props
  sendEffect?: (effect: Omit<SynchronizedEffect, 'id' | 'startTime'>) => void;
  isInRoom?: boolean;
  isPlayer?: boolean;
}

const GLACIAL_SHARD_DAMAGE = 251;
const GLACIAL_SHARD_CRIT_CHANCE = 0.15; // 20%
const GLACIAL_SHARD_HIT_RADIUS = 1.8; // Increased from 1.5 for better collision detection
const SHIELD_DURATION = 6000; // 5 seconds
const SHIELD_ABSORPTION = 40;
const DAMAGE_PER_KILL = 6;
const CRIT_CHANCE_PER_KILL = 0.025; // 2.5%

function calculateGlacialShardDamage(isFrozen: boolean = false, bonusDamage: number = 0, bonusCritChance: number = 0): { damage: number; isCritical: boolean } {
  let damage = GLACIAL_SHARD_DAMAGE + bonusDamage;
  
  // Base crit chance plus bonus from kills
  const totalCritChance = GLACIAL_SHARD_CRIT_CHANCE + bonusCritChance;
  const isCritical = Math.random() < totalCritChance;
  
  // Double damage on critical hits
  if (isCritical) {
    damage *= 2;
  }
  
  // Double damage if enemy is frozen (Deep Freeze passive)
  if (isFrozen) {
    damage *= 2;  // FROZENDAMAGEMULTIPLIER 2x
  }
  
  return { damage, isCritical };
}

export function useGlacialShard({
  parentRef,
  onHit,
  enemyData,
  setDamageNumbers,
  nextDamageNumberId,
  onImpact,
  charges,
  setCharges,
  setActiveEffects,
  isEnemyFrozen,
  currentSubclass,
  // Multiplayer props
  sendEffect,
  isInRoom = false,
  isPlayer = false
}: UseGlacialShardProps) {
  const [activeShards, setActiveShards] = useState<Array<{
    id: number;
    position: Vector3;
    direction: Vector3;
    hitEnemies?: Set<string>;
  }>>([]);
  const nextShardId = useRef(0);
  const [hasShield, setHasShield] = useState(false);
  const [shieldAbsorption, setShieldAbsorption] = useState(SHIELD_ABSORPTION);
  const shieldStartTime = useRef<number | null>(null);

  // Track Glacial Shard kill count for Frost subclass
  const [glacialShardKillCount, setGlacialShardKillCount] = useState(0);

  // Calculate bonus damage and crit chance for Frost subclass
  const getGlacialShardBonusDamage = useCallback(() => {
    if (currentSubclass === WeaponSubclass.FROST) {
      return glacialShardKillCount * DAMAGE_PER_KILL;
    }
    return 0;
  }, [currentSubclass, glacialShardKillCount]);

  const getGlacialShardBonusCritChance = useCallback(() => {
    if (currentSubclass === WeaponSubclass.FROST) {
      return glacialShardKillCount * CRIT_CHANCE_PER_KILL;
    }
    return 0;
  }, [currentSubclass, glacialShardKillCount]);

  // Reset Glacial Shard kill count
  const resetGlacialShardKillCount = useCallback(() => {
    setGlacialShardKillCount(0);
  }, []);

  // Listen for reset events to reset Glacial Shard kill count
  useEffect(() => {
    const handleGameReset = () => {
      resetGlacialShardKillCount();
    };

    window.addEventListener('gameReset', handleGameReset);
    return () => window.removeEventListener('gameReset', handleGameReset);
  }, [resetGlacialShardKillCount]);

  // Track enemy health for kill detection
  const enemyHealthTracker = useRef<Record<string, number>>({});
  
  // Update health tracker when enemy data changes
  useEffect(() => {
    if (enemyData) {
      enemyData.forEach(enemy => {
        enemyHealthTracker.current[enemy.id] = enemy.health;
      });
    }
  }, [enemyData]);

  // Restore 3 orb charges when killing an enemy
  const restoreCharges = useCallback(() => {
    setCharges(currentCharges => {
      const unavailableIndices = currentCharges
        .map((charge, index) => charge.available ? -1 : index)
        .filter(index => index !== -1)
        .slice(0, 3); // Restore exactly 3 charges per kill
      
      if (unavailableIndices.length === 0) {
        return currentCharges;
      }
      
      const updatedCharges = currentCharges.map((charge, index) => 
        unavailableIndices.includes(index) ? {
          ...charge,
          available: true,
          cooldownStartTime: null
        } : charge
      );
      
      return updatedCharges;
    });
  }, [setCharges]);

  // Activate temporary shield
  const activateShield = useCallback(() => {
    setHasShield(true);
    setShieldAbsorption(SHIELD_ABSORPTION);
    shieldStartTime.current = Date.now();

    // Create shield visual effect
    if (setActiveEffects && parentRef.current) {
      const shieldPosition = parentRef.current.position.clone();
      shieldPosition.y += 1;
      
      setActiveEffects(prev => [...prev, {
        id: Date.now(),
        type: 'glacialShield',
        position: shieldPosition,
        direction: new Vector3(0, 0, 0),
        duration: SHIELD_DURATION,
        startTime: Date.now()
      }]);

      // Send glacial shield effect to other players in multiplayer
      if (isInRoom && isPlayer && sendEffect) {
        sendEffect({
          type: 'glacialShardShield',
          position: shieldPosition.clone(),
          direction: new Vector3(0, 0, 0),
          duration: SHIELD_DURATION,
          weaponType: 'sabres',
          subclass: 'frost'
        });
      }
    }

    // Automatically remove shield after duration
    setTimeout(() => {
      setHasShield(false);
      setShieldAbsorption(SHIELD_ABSORPTION);
      shieldStartTime.current = null;
    }, SHIELD_DURATION);
  }, [setActiveEffects, parentRef, isInRoom, isPlayer, sendEffect]);

  // Function to absorb damage if shield is active
  const absorbDamage = useCallback((damage: number): number => {
    if (!hasShield || !shieldStartTime.current) return damage;

    const elapsedTime = Date.now() - shieldStartTime.current;
    if (elapsedTime >= SHIELD_DURATION) {
      setHasShield(false);
      return damage;
    }

    if (shieldAbsorption >= damage) {
      setShieldAbsorption(prev => prev - damage);
      return 0; // All damage absorbed
    } else {
      const remainingDamage = damage - shieldAbsorption;
      setShieldAbsorption(0);
      setHasShield(false);
      shieldStartTime.current = null;
      return remainingDamage;
    }
  }, [hasShield, shieldAbsorption]);

  const shootGlacialShard = useCallback(() => {
    if (!parentRef.current) {
      return false;
    }

    // Check if we have at least one available charge (no charge consumption for Glacial Shard)
    const hasAvailableCharges = charges.some(charge => charge.available);
    if (!hasAvailableCharges) {
      return false;
    }

    const position = parentRef.current.position.clone();
    position.y += 1;

    const direction = new Vector3(0, 0, 1)
      .applyQuaternion(parentRef.current.quaternion)
      .normalize();

    setActiveShards(prev => [...prev, {
      id: nextShardId.current++,
      position,
      direction,
      hitEnemies: new Set<string>()
    }]);

    return true;
  }, [parentRef, charges]);

  const handleShardImpact = useCallback((shardId: number, impactPosition?: Vector3) => {
    if (onImpact) {
      onImpact(shardId, impactPosition);
    }
    setActiveShards(prev => prev.filter(shard => shard.id !== shardId));
  }, [onImpact]);



  const checkShardCollisions = useCallback((shardId: number, currentPosition: Vector3): boolean => {
    let collisionOccurred = false;
    const shard = activeShards.find(s => s.id === shardId);

    if (!shard) {
      return false;
    }

    // Initialize hitEnemies if it doesn't exist
    if (!shard.hitEnemies) {
      shard.hitEnemies = new Set<string>();
    }

    // Check all enemies for collisions
    for (const enemy of enemyData) {
      // Skip dead, dying enemies or enemies we've already hit with this shard
      if (enemy.health <= 0 || enemy.isDying || shard.hitEnemies.has(enemy.id)) {
        continue;
      }

      // Normalize positions for better collision detection (similar to fireball logic)
      const shardPos = currentPosition.clone();
      const enemyPos = enemy.position.clone();
      enemyPos.y = 1.5; // Match the shard's approximate height

      // Check distance with improved collision radius
      const distance = shardPos.distanceTo(enemyPos);
      
      // If within hit radius, process the hit
      if (distance < GLACIAL_SHARD_HIT_RADIUS) {
        // Mark this enemy as hit by this shard to prevent multiple hits
        shard.hitEnemies.add(enemy.id);
        
        // Check if enemy is frozen for bonus damage
        const isFrozen = isEnemyFrozen ? isEnemyFrozen(enemy.id) : false;
        
        // Get bonus damage and crit chance from kills
        const bonusDamage = getGlacialShardBonusDamage();
        const bonusCritChance = getGlacialShardBonusCritChance();
        
        // Calculate damage with critical chance, frozen bonus, and kill bonuses
        const { damage, isCritical } = calculateGlacialShardDamage(isFrozen, bonusDamage, bonusCritChance);
        
        // Store enemy position and health before damage
        const enemyPosition = enemy.position.clone();
        const previousHealth = enemy.health;
        
        // Apply damage directly
        onHit(enemy.id, damage);
        
        // Check if enemy was killed by this hit (compare with damage, not updated health)
        const wouldBeKilled = previousHealth > 0 && previousHealth <= damage;
        if (wouldBeKilled) {
          // Restore 3 orb charges on kill
          restoreCharges();
          
          // Activate shield on kill
          activateShield();
          
          // Increment kill counter for Frost subclass
          if (currentSubclass === WeaponSubclass.FROST) {
            setGlacialShardKillCount(prev => prev + 1);
          }
        }
        
        // Create damage number for visual feedback
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage,
          position: enemyPosition,
          isCritical,
          isGlacialShard: true
        }]);
        
        collisionOccurred = true;
        
        // Glacial Shard hits only one enemy then stops
        break;
      }
    }

    return collisionOccurred;
  }, [activeShards, enemyData, setDamageNumbers, nextDamageNumberId, onHit, restoreCharges, activateShield, isEnemyFrozen, getGlacialShardBonusDamage, getGlacialShardBonusCritChance, currentSubclass]);

  return {
    activeShards,
    shootGlacialShard,
    handleShardImpact,
    checkShardCollisions,
    hasShield,
    shieldAbsorption,
    absorbDamage,
    glacialShardKillCount,
    getGlacialShardBonusDamage,
    getGlacialShardBonusCritChance,
    resetGlacialShardKillCount
  };
} 