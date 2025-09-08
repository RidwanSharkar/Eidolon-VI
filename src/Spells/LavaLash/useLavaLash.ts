import { useState, useCallback, useRef } from 'react';
import { Vector3 } from 'three';
import { DamageNumber } from '@/Unit/useDamageNumbers';

export interface LavaLashProjectile {
  id: number;
  position: Vector3;
  direction: Vector3;
  startTime: number;
  startPosition: Vector3;
  maxDistance: number;
  opacity?: number;
  fadeStartTime?: number | null;
  hasCollided?: boolean;
}

export interface UseLavaLashProps {
  onHit?: (targetId: string, damage: number) => void;
  setDamageNumbers?: (callback: (prev: DamageNumber[]) => DamageNumber[]) => void;
  nextDamageNumberId?: { current: number };
  enemyData?: Array<{
    id: string;
    position: Vector3;
    health: number;
  }>;
  level?: number; // Add level for damage scaling
  onIncinerateStackChange?: (stacks: number) => void; // Callback for stack changes
}

export function useLavaLash({
  onHit,
  setDamageNumbers,
  nextDamageNumberId,
  enemyData = [],
  level = 1,
  onIncinerateStackChange
}: UseLavaLashProps) {
  const [projectiles, setProjectiles] = useState<LavaLashProjectile[]>([]);
  const [incinerateStacks, setIncinerateStacks] = useState(0);
  const nextProjectileId = useRef(0);
  const hitEnemies = useRef<Set<string>>(new Set());

  // Calculate level-based damage
  const getLavaLashDamage = useCallback((currentLevel: number): number => {
    switch (currentLevel) {
      case 1: return 17;
      case 2: return 23;
      case 3: return 31;
      case 4: return 41;
      case 5: return 53;
      default: return 17; // Default to level 1 damage
    }
  }, []);

  // Function to increment Incinerate stacks
  const incrementIncinerateStacks = useCallback(() => {
    setIncinerateStacks(prev => {
      const newStacks = Math.min(25, prev + 1); // Cap at 25 stacks
      if (onIncinerateStackChange) {
        onIncinerateStackChange(newStacks);
      }
      return newStacks;
    });
  }, [onIncinerateStackChange]);

  // Function to reset Incinerate stacks (called when empowered Pyroclast is used)
  const resetIncinerateStacks = useCallback(() => {
    setIncinerateStacks(0);
    if (onIncinerateStackChange) {
      onIncinerateStackChange(0);
    }
  }, [onIncinerateStackChange]);

  const shootLavaLash = useCallback((position: Vector3, direction: Vector3) => {
    const newProjectile: LavaLashProjectile = {
      id: nextProjectileId.current++,
      position: position.clone(),
      direction: direction.clone().normalize(),
      startTime: Date.now(),
      startPosition: position.clone(),
      maxDistance: 15, 
      opacity: 1,
      fadeStartTime: null,
      hasCollided: false
    };

    setProjectiles(prev => [...prev, newProjectile]);
  }, []);

  const checkCollisions = useCallback((projectileId: number, position: Vector3): boolean => {
    // Find enemies within range - piercing projectile, so check all enemies
    const hitRadius = 2.25; // Increased collision radius for better hit detection
    
    for (const enemy of enemyData) {
      const distance = position.distanceTo(enemy.position);
      
      if (distance <= hitRadius) {
        const hitKey = `${projectileId}_${enemy.id}`;
        
        // Prevent multiple hits from the same projectile on the same enemy
        if (hitEnemies.current.has(hitKey)) {
          continue;
        }
        
        hitEnemies.current.add(hitKey);
        
        // Calculate level-based damage
        const baseDamage = getLavaLashDamage(level);
        const isCritical = Math.random() < 0.15; // 15% crit chance
        const finalDamage = isCritical ? baseDamage * 2 : baseDamage;
        
        if (onHit) {
          onHit(enemy.id, finalDamage);
        }
        
        // Increment Incinerate stacks on enemy hit
        incrementIncinerateStacks();
        
        if (setDamageNumbers && nextDamageNumberId) {
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage: finalDamage,
            position: enemy.position.clone(),
            isCritical,
            isLavaLash: true // Add LavaLash flag for damage number styling
          }]);
        }
      }
    }
    
    // Return false to allow piercing - projectile continues through enemies
    return false;
  }, [enemyData, onHit, setDamageNumbers, nextDamageNumberId, getLavaLashDamage, level, incrementIncinerateStacks]);

  const handleProjectileImpact = useCallback((projectileId: number) => {
    // Remove the projectile
    setProjectiles(prev => prev.filter(p => p.id !== projectileId));
    
    // Clean up hit tracking for this projectile
    const keysToRemove = Array.from(hitEnemies.current).filter(key => 
      key.startsWith(`${projectileId}_`)
    );
    keysToRemove.forEach(key => hitEnemies.current.delete(key));
  }, []);

  const updateProjectiles = useCallback(() => {
    const now = Date.now();
    setProjectiles(prev => prev.filter(projectile => {
      // Move projectile forward first
      if (!projectile.hasCollided && !projectile.fadeStartTime) {
        const speed = 0.2; // Fixed speed similar to other projectiles
        projectile.position.add(
          projectile.direction.clone().multiplyScalar(speed)
        );
        
        // Check collisions after movement
        checkCollisions(projectile.id, projectile.position);
      }
      
      const distanceTraveled = projectile.position.distanceTo(projectile.startPosition);
      
      // Handle fading when projectile reaches max distance
      if (distanceTraveled >= projectile.maxDistance && !projectile.fadeStartTime) {
        projectile.fadeStartTime = now;
      }
      
      // Handle fade effect
      if (projectile.fadeStartTime) {
        const fadeElapsed = now - projectile.fadeStartTime;
        const fadeProgress = fadeElapsed / 333; // 1 second fade duration
        projectile.opacity = Math.max(0, 1 - fadeProgress);
        
        if (fadeProgress >= 1) {
          // Clean up hit tracking for this projectile when it's removed
          const keysToRemove = Array.from(hitEnemies.current).filter(key => 
            key.startsWith(`${projectile.id}_`)
          );
          keysToRemove.forEach(key => hitEnemies.current.delete(key));
          return false; // Remove projectile after fade completes
        }
      }
      
      // Keep projectile alive if it's fading or hasn't reached max distance
      return projectile.fadeStartTime !== null || distanceTraveled < projectile.maxDistance;
    }));
  }, [checkCollisions]);

  const clearAllProjectiles = useCallback(() => {
    setProjectiles([]);
    hitEnemies.current.clear();
  }, []);

  return {
    projectiles,
    shootLavaLash,
    checkCollisions,
    handleProjectileImpact,
    updateProjectiles,
    clearAllProjectiles,
    incinerateStacks,
    resetIncinerateStacks
  };
}
