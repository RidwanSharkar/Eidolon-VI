import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { SummonProps } from '@/Spells/Summon/SummonProps';
import { Enemy } from '@/Versus/enemy';
import TotemModel from '@/Spells/Summon/TotemModel';
import { calculateDamage } from '@/Weapons/damage';
import FireballTrail from '@/Spells/Fireball/FireballTrail';
import * as THREE from 'three';


interface SummonProjectile {
  id: number;
  position: Vector3;
  direction: Vector3;
  startPosition: Vector3;
  maxDistance: number;
  targetId: string;
  distanceTraveled: number;
  meshRef: React.RefObject<THREE.Mesh>;
}

export default function SummonedHandler({
  position,
  enemyData,
  onDamage,
  onComplete,
  onStartCooldown,
  setActiveEffects,
  activeEffects,
  setDamageNumbers,
  nextDamageNumberId,
}: SummonProps) {
  const groupRef = useRef<Group>(null);
  const totemWorldPosition = useRef(position.clone());
  const [currentTarget, setCurrentTarget] = useState<Enemy | null>(null);
  const lastAttackTime = useRef(0);
  const ATTACK_COOLDOWN = 1000;
  const RANGE = 40;
  const DURATION = 7000;
  const FIREBALL_DAMAGE = 47;
  const startTime = useRef(Date.now());
  const [projectiles, setProjectiles] = useState<SummonProjectile[]>([]);
  const EFFECT_DURATION = 200; // ms
  const hasTriggeredCleanup = useRef(false);

  // Enhanced Logging for Debugging
  useEffect(() => {
    console.log('SummonedHandler Mounted');
    return () => {
      console.log('SummonedHandler Unmounted');
    };
  }, []);

  // Improved target acquisition
  const findNewTarget = useCallback((): Enemy | null => {
    if (!groupRef.current) return null;

    const totemPosition = groupRef.current.position;
    const viableTargets = enemyData.filter(enemy => {
      if (enemy.health <= 0) return false;
      
      // Calculate distance in 2D plane (ignoring height)
      const distance = new Vector3(
        enemy.position.x - totemPosition.x,
        0,
        enemy.position.z - totemPosition.z
      ).length();
      
      return distance <= RANGE;
    });

    if (viableTargets.length > 0) {
      console.log('Found viable targets:', viableTargets.length);
      return viableTargets[Math.floor(Math.random() * viableTargets.length)];
    }
    
    console.log('No viable targets found');
    return null;
  }, [enemyData, RANGE]);

  const handleProjectileImpact = useCallback((projectile: SummonProjectile) => {
    const targetEnemy = enemyData.find(enemy => 
      enemy.id === projectile.targetId && enemy.health > 0
    );
    
    if (!targetEnemy) {
      console.log(`Projectile ${projectile.id} has no valid target. Removing projectile.`);
      return true;
    }

    const projectilePos2D = new Vector3(projectile.position.x, 0, projectile.position.z);
    const targetPos2D = new Vector3(targetEnemy.position.x, 0, targetEnemy.position.z);
    const distance = projectilePos2D.distanceTo(targetPos2D);
    
    if (distance <= 2.5) {
      const { damage } = calculateDamage(FIREBALL_DAMAGE);
      const impactPosition = targetEnemy.position.clone().setY(1.5);
      
      // Pass the isSummon flag
      onDamage(targetEnemy.id, damage, impactPosition, true);
      
      setDamageNumbers(prev => [...prev, {
        id: nextDamageNumberId.current++,
        damage,
        position: impactPosition.clone(),
        isCritical: false,
        isSummon: true  // Explicitly set this flag
      }]);
      //  explicit type for summon explosions
      const effectId = Date.now();
      setActiveEffects(prev => [
        ...prev.filter(effect => 
          effect.type !== 'summonExplosion' || 
          (effect.startTime && Date.now() - effect.startTime < EFFECT_DURATION)
        ),
        {
          id: effectId,
          type: 'summonExplosion',
          position: impactPosition,
          direction: new Vector3(),
          duration: EFFECT_DURATION / 500,
          startTime: Date.now()
        }
      ]);

      // Schedule cleanup of this specific effect
      setTimeout(() => {
        setActiveEffects(prev => 
          prev.filter(effect => effect.id !== effectId)
        );
      }, EFFECT_DURATION +350); // Add small buffer for cleanup
      
      return true;
    }
    
    return false;
  }, [enemyData, FIREBALL_DAMAGE, setActiveEffects, EFFECT_DURATION, onDamage, setDamageNumbers, nextDamageNumberId]);

  // Add this effect to keep track of world position
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.getWorldPosition(totemWorldPosition.current);
    }
  }, [position]);

  // Modify the projectile creation logic
  const createProjectile = useCallback((target: Enemy) => {
    if (!groupRef.current) return;
    
    // Get current world position
    const currentWorldPos = new Vector3();
    groupRef.current.getWorldPosition(currentWorldPos);
    
    // Calculate eye position in world space
    const eyeHeight = 4 * 0.475; // Match the totem's height
    const startPos = currentWorldPos.clone().add(new Vector3(0, eyeHeight, 0));
    
    // Calculate direction to target
    const direction = new Vector3()
      .subVectors(target.position.clone().setY(1.5), startPos)
      .normalize();
    
    return {
      id: Date.now(),
      position: startPos,
      startPosition: startPos.clone(),
      direction: direction,
      maxDistance: RANGE * 1.5,
      targetId: target.id,
      distanceTraveled: 0,
      meshRef: React.createRef<THREE.Mesh>()
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Duration check with cleanup protection
    if (Date.now() - startTime.current > DURATION && !hasTriggeredCleanup.current) {
      console.log('Summon duration exceeded. Completing summon.');
      hasTriggeredCleanup.current = true;
      onComplete();
      onStartCooldown();
      return;
    }

    // Target acquisition logic
    if (!currentTarget || currentTarget.health <= 0) {
      const newTarget = findNewTarget();
      if (newTarget) {
        setCurrentTarget(newTarget);
      } else {
        setCurrentTarget(null);
      }
    }

    // Check if current target is still valid
    const targetStillValid = currentTarget && 
      enemyData.find(e => e.id === currentTarget.id && e.health > 0);
    
    if (!targetStillValid && currentTarget) {
      setCurrentTarget(null);
    }

    // Fire new projectile
    const now = Date.now();
    if (currentTarget && now - lastAttackTime.current >= ATTACK_COOLDOWN) {
      const newProjectile = createProjectile(currentTarget);
      if (newProjectile) {
        setProjectiles(prev => [...prev, newProjectile]);
        lastAttackTime.current = now;
      }
    }

    // Update projectiles
    setProjectiles(prev => prev.filter(projectile => {
      const speed = 0.4;
      
      projectile.direction.y -= 0.0015 * delta * 60;
      projectile.direction.normalize();
      
      const movement = projectile.direction.clone().multiplyScalar(speed * delta * 40);
      projectile.position.add(movement);
      projectile.distanceTraveled += movement.length();

      // Enhanced homing effect
      const target = enemyData.find(enemy => enemy.id === projectile.targetId);
      if (target && target.health > 0) {
        const toTarget = new Vector3()
          .subVectors(target.position.clone().setY(1.5), projectile.position)
          .normalize();
        
        projectile.direction.lerp(toTarget, 0.03).normalize();
      }

      if (projectile.distanceTraveled > projectile.maxDistance) {
        return false;
      }

      const impact = handleProjectileImpact(projectile);
      return !impact;
    }));
  });

  useEffect(() => {
    console.log('Enemy Data in Summon:', {
      totalEnemies: enemyData.length,
      livingEnemies: enemyData.filter(enemy => enemy.health > 0).length,
      enemyPositions: enemyData.map(e => ({
        id: e.id,
        health: e.health,
        position: e.position.toArray(),
      })),
    });
  }, [enemyData]);

  // Modify the effect cleanup to be more specific
  useEffect(() => {
    const cleanup = setInterval(() => {
      setActiveEffects(prev => 
        prev.filter(effect => {
          // Only handle summonExplosion effects, leave others alone
          if (effect.type !== 'summonExplosion') return true;
          if (!effect.startTime) return false;
          return Date.now() - effect.startTime < EFFECT_DURATION;
        })
      );
    }, 250);

    return () => {
      clearInterval(cleanup);
      // Only clear summon-related effects on unmount
      setActiveEffects(prev => 
        prev.filter(effect => effect.type !== 'summonExplosion')
      );
    };
  }, [EFFECT_DURATION, setActiveEffects]);

  // Add cleanup effect
  useEffect(() => {
    const safetyCleanup = setTimeout(() => {
      if (!hasTriggeredCleanup.current) {
        console.log('Safety cleanup triggered for summon');
        hasTriggeredCleanup.current = true;
        onComplete();
        onStartCooldown();
      }
    }, DURATION + 500); // 500ms safety buffer

    return () => {
      clearTimeout(safetyCleanup);
      hasTriggeredCleanup.current = false;
    };
  }, [onComplete, onStartCooldown]);

  return (
    <group ref={groupRef} position={position.toArray()}>
      <TotemModel isAttacking={!!currentTarget} />
      
      {/* Debug sphere to show spawn point */}
      <mesh position={[0, 4 * 0.475, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="red" />
      </mesh>
      
      {/* Render projectiles */}
      {projectiles.map(projectile => (
        <group key={projectile.id} position={projectile.position.toArray()}>
          <mesh ref={projectile.meshRef}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial 
              color="#00ff88"
              emissive="#00ff88"
              emissiveIntensity={2}
            />
          </mesh>
          <pointLight color="#00ff88" intensity={1} distance={4} />
          <FireballTrail 
            color={new THREE.Color("#00ff88")}
            size={0.225}
            meshRef={projectile.meshRef}
            opacity={0.8}
          />
        </group>
      ))}

      {/* Render explosion effects */}
      {activeEffects.map(effect => {
        if (effect.type === 'summonExplosion') {
          const elapsed = (Date.now() - (effect.startTime || 0)) / 1000;
          const fade = Math.max(0, 1 - (elapsed / (effect.duration || 0.2)));
          
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              <mesh>
                <sphereGeometry args={[0.5 * (1 + elapsed * 2), 32, 32]} />
                <meshStandardMaterial
                  color="#00ff88"
                  emissive="#00ff88"
                  emissiveIntensity={1 * fade}
                  transparent
                  opacity={0.8 * fade}
                />
              </mesh>
              <pointLight
                color="#00ff88"
                intensity={1 * fade}
                distance={4}
                decay={2}
              />
            </group>
          );
        }
        return null;
      })}
    </group>
  );
}