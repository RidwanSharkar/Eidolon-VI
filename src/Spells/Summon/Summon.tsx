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
}: SummonProps) {
  const groupRef = useRef<Group>(null);
  const [currentTarget, setCurrentTarget] = useState<Enemy | null>(null);
  const lastAttackTime = useRef(0);
  const ATTACK_COOLDOWN = 875;
  const RANGE = 40;
  const DURATION = 10000;
  const FIREBALL_DAMAGE = 43;
  const startTime = useRef(Date.now());
  const [projectiles, setProjectiles] = useState<SummonProjectile[]>([]);
  const EFFECT_DURATION = 251; // ms

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
      
      console.log(`Projectile ${projectile.id} impacting Enemy ${targetEnemy.id} at position`, impactPosition);
      onDamage(targetEnemy.id, damage, impactPosition);
      
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
  }, [enemyData, FIREBALL_DAMAGE, setActiveEffects, EFFECT_DURATION, onDamage]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Duration check
    if (Date.now() - startTime.current > DURATION) {
      console.log('Summon duration exceeded. Completing summon.');
      onComplete();
      onStartCooldown();
      return;
    }

    // target acquisition logic
    if (!currentTarget || currentTarget.health <= 0) {
      const newTarget = findNewTarget();
      if (newTarget) {
        console.log('New target acquired:', newTarget.id);
        setCurrentTarget(newTarget);
      } else {
        console.log('No new target found, clearing current target');
        setCurrentTarget(null); // Explicitly clear the current target
      }
    }

    // Check if current target is still valid
    const targetStillValid = currentTarget && 
      enemyData.find(e => e.id === currentTarget.id && e.health > 0);
    
    if (!targetStillValid && currentTarget) {
      console.log('Current target no longer valid, forcing new target search');
      setCurrentTarget(null);
    }

    // Update and filter projectiles
    setProjectiles(prev => prev.filter(projectile => {
      // Increase movement speed and make it more direct
      const speed = 0.4; // Adjusted for better control
      const movement = projectile.direction.clone().multiplyScalar(speed * delta * 40);
      projectile.position.add(movement);
      projectile.distanceTraveled += movement.length();

      // Enhanced homing effect
      const target = enemyData.find(enemy => enemy.id === projectile.targetId);
      if (target && target.health > 0) {
        const toTarget = new Vector3()
          .subVectors(target.position.clone().setY(1.5), projectile.position)
          .normalize();
        
        // Gradually adjust direction towards target
        projectile.direction.lerp(toTarget, 0.03).normalize();
      }

      // Check max distance
      if (projectile.distanceTraveled > projectile.maxDistance) {
        console.log(`Projectile ${projectile.id} exceeded max distance. Removing.`);
        return false;
      }

      // Check for impacts
      const impact = handleProjectileImpact(projectile);
      if (impact) {
        console.log(`Projectile ${projectile.id} impacted and will be removed.`);
      }
      return !impact;
    }));

    // Fire new projectile
    const now = Date.now();
    if (currentTarget && now - lastAttackTime.current >= ATTACK_COOLDOWN) {
      // Get the totem's world position
      const totemWorldPosition = new Vector3();
      if (groupRef.current) {
        groupRef.current.getWorldPosition(totemWorldPosition);
      }
      
      // Add height offset for projectile origin (from the totem's head)
      const startPos = totemWorldPosition.clone().add(new Vector3(0, 0.5, 0));
      
      // Get target's position with proper height for targeting
      const targetPos = currentTarget.position.clone().setY(1.5);
      
      // Calculate initial direction vector from totem to target
      const direction = new Vector3()
        .subVectors(targetPos, startPos)
        .normalize();
      
      // Add slight upward arc
      direction.y += 0.05;
      direction.normalize();

      console.log('Firing projectile:', {
        startPos: startPos.toArray(),
        targetPos: targetPos.toArray(),
        direction: direction.toArray()
      });

      setProjectiles(prev => [...prev, {
        id: Date.now(),
        position: startPos,
        startPosition: startPos.clone(),
        direction: direction,
        maxDistance: RANGE * 1.5,
        targetId: currentTarget.id,
        distanceTraveled: 0,
        meshRef: React.createRef<THREE.Mesh>()
      }]);

      lastAttackTime.current = now;
    }

    // Update projectile positions with arc
    setProjectiles(prev => prev.filter(projectile => {
      const speed = 0.405;
      
      // Add gravity effect
      projectile.direction.y -= 0.0015 * delta * 60;
      projectile.direction.normalize();
      
      const movement = projectile.direction.clone().multiplyScalar(speed * delta * 60);
      projectile.position.add(movement);
      projectile.distanceTraveled += movement.length();

      // Check max distance
      if (projectile.distanceTraveled > projectile.maxDistance) {
        console.log(`Projectile ${projectile.id} exceeded max distance. Removing.`);
        return false;
      }

      // Check for impacts
      const impact = handleProjectileImpact(projectile);
      if (impact) {
        console.log(`Projectile ${projectile.id} impacted and will be removed.`);
      }
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

  return (
    <group ref={groupRef} position={position.toArray()}>
      <TotemModel isAttacking={!!currentTarget} />
      
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
          <pointLight color="#00ff88" intensity={2} distance={4} />
          <FireballTrail 
            color={new THREE.Color("#00ff88")}
            size={0.5}
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
                intensity={2 * fade}
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