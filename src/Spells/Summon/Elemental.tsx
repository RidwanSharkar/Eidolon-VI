import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Group, Vector3, AdditiveBlending } from 'three';
import { useFrame } from '@react-three/fiber';
import { Enemy } from '@/Versus/enemy';
import ElementalModel from '@/Spells/Summon/ElementalModel';
import ElementalProjectile from '@/Spells/Summon/ElementalProjectile';
import { globalAggroSystem } from '@/Versus/AggroSystem';

interface ElementalProps {
  id: string;
  position: Vector3;
  enemyData: Enemy[];
  onDamage: (targetId: string, damage: number, position?: Vector3) => void;
  onDeath: (elementalId: string) => void;
  setActiveEffects: (callback: (prev: Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
    summonId?: number;
    targetId?: string;
  }>) => Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
    summonId?: number;
    targetId?: string;
  }>) => void;
  activeEffects: Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
    summonId?: number;
    targetId?: string;
  }>;
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

export default function Elemental({
  position,
  enemyData,
  onDamage,
  setActiveEffects,
  activeEffects,
  setDamageNumbers,
  nextDamageNumberId,
}: Omit<ElementalProps, 'id' | 'onDeath'>) {
  
  // Generate unique ID for this elemental instance
  const elementalId = useRef(`elemental-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).current;
  const groupRef = useRef<Group>(null);
  const [currentTarget, setCurrentTarget] = useState<Enemy | null>(null);
  const [projectiles, setProjectiles] = useState<Array<{
    id: number;
    position: Vector3;
    direction: Vector3;
    targetId: string;
  }>>([]);
  
  const constants = useRef({
    lastAttackTime: 0,
    startTime: Date.now(),
    mountId: Date.now(),
    lastTargetSwitchTime: Date.now(),
    ATTACK_COOLDOWN: 1000, // Slightly slower than totem
    RANGE: 35, // Slightly longer range than totem
    DAMAGE: 89,
    EFFECT_DURATION: 300,
    TARGET_SWITCH_INTERVAL: 3000, // Switch targets less frequently
    PROJECTILE_SPEED: 20,
    nextProjectileId: 0
  }).current;

  const calculateDistance = useCallback((pos1: { x: number, z: number }, pos2: { x: number, z: number }) => {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
  }, []);

  const findNewTarget = useCallback((excludeCurrentTarget: boolean = false): Enemy | null => {
    if (!groupRef.current) return null;
    
    const elementalPosition = groupRef.current.position;
    let closestDistance = constants.RANGE;
    let closestTarget: Enemy | null = null;

    for (let i = 0; i < enemyData.length; i++) {
      const enemy = enemyData[i];
      if (enemy.health <= 0 || 
          enemy.isDying || 
          enemy.deathStartTime || 
          !enemy.position ||
          (excludeCurrentTarget && currentTarget && enemy.id === currentTarget.id)) {
        continue;
      }

      const distance = calculateDistance(
        { x: enemy.position.x, z: enemy.position.z },
        { x: elementalPosition.x, z: elementalPosition.z }
      );

      if (distance <= closestDistance) {
        closestDistance = distance;
        closestTarget = enemy;
      }
    }
    
    return closestTarget;
  }, [enemyData, calculateDistance, currentTarget, constants.RANGE]);

  const handleAttack = useCallback((target: Enemy) => {
    if (!target || 
        target.health <= 0 || 
        target.isDying || 
        target.deathStartTime || 
        !target.position ||
        !groupRef.current) {
      return;
    }
    
    if (!enemyData.find(e => e.id === target.id && e.health > 0)) {
      return;
    }
    
    // Create projectile with proper world position
    const elementalWorldPosition = new Vector3();
    groupRef.current.getWorldPosition(elementalWorldPosition);
    elementalWorldPosition.y += 1.5; // Offset to elemental center
    
    // Aim at proper height (1.5 units above ground like other projectiles)
    const targetCenter = target.position.clone().setY(target.position.y + 1.5);
    const direction = targetCenter.sub(elementalWorldPosition).normalize();
    
    const newProjectile = {
      id: constants.nextProjectileId++,
      position: elementalWorldPosition.clone(),
      direction: direction,
      targetId: target.id
    };
    
    setProjectiles(prev => [...prev, newProjectile]);
  }, [constants, enemyData]);

  const handleProjectileImpact = useCallback((projectileId: number) => {
    setProjectiles(prev => prev.filter(p => p.id !== projectileId));
  }, []);

  const checkProjectileCollisions = useCallback((projectileId: number, position: Vector3): boolean => {
    // Check if projectile hits any enemy using 2D collision detection (like other projectiles)
    for (const enemy of enemyData) {
      if (enemy.health > 0 && !enemy.isDying && enemy.position) {
        // Use 2D collision detection (ignore Y axis) like QuickShot and other projectiles
        const projectilePos2D = new Vector3(position.x, 0, position.z);
        const enemyPos2D = new Vector3(enemy.position.x, 0, enemy.position.z);
        const distance = projectilePos2D.distanceTo(enemyPos2D);
        
        if (distance < 1.2) { // Collision radius similar to other projectiles
          // Apply damage when projectile actually hits
          const isBossTarget = enemy.id.startsWith('boss-') || enemy.id.startsWith('enemy-boss-');
          const damage = isBossTarget ? 137 : constants.DAMAGE; // Half damage to bosses
          
          const impactPosition = enemy.position.clone().setY(1.5);
          
          // Apply damage
          onDamage(enemy.id, damage, impactPosition);
          
          // Register damage with aggro system
          globalAggroSystem.addDamageAggro(enemy.id, elementalId, damage, 'summoned');
          
          // Create damage number
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage,
            position: impactPosition.clone(),
            isCritical: false,
            isSummon: true
          }]);
          
          // Create explosion effect
          const effectId = Date.now();
          setActiveEffects(prev => [
            ...prev.filter(effect => 
              effect.type !== 'elementalExplosion' || 
              (effect.startTime && Date.now() - effect.startTime < constants.EFFECT_DURATION)
            ),
            {
              id: effectId,
              type: 'elementalExplosion',
              position: impactPosition.clone(),
              direction: new Vector3(),
              duration: constants.EFFECT_DURATION / 1000,
              startTime: Date.now(),
              summonId: constants.mountId,
              targetId: enemy.id
            }
          ]);
          
          return true;
        }
      }
    }
    return false;
  }, [enemyData, constants, onDamage, elementalId, setDamageNumbers, nextDamageNumberId, setActiveEffects]);



  // Cleanup aggro system on unmount
  useEffect(() => {
    return () => {
      globalAggroSystem.removeTarget(elementalId);
    };
  }, [elementalId]);

  useFrame(() => {
    const now = Date.now();
    
    if (now - constants.lastAttackTime < constants.ATTACK_COOLDOWN) {
      return;
    }

    if (now - constants.lastTargetSwitchTime >= constants.TARGET_SWITCH_INTERVAL) {
      const newTarget = findNewTarget(true);
      if (newTarget) {
        setCurrentTarget(newTarget);
      }
      constants.lastTargetSwitchTime = now;
    }

    if (!currentTarget?.health || currentTarget.health <= 0 || currentTarget.isDying) {
      setCurrentTarget(findNewTarget());
      return;
    }

    // Face the target like AbyssalSkeletons do
    if (groupRef.current && currentTarget && currentTarget.position) {
      const elementalPosition = groupRef.current.position;
      const targetDirection = currentTarget.position.clone().sub(elementalPosition);
      targetDirection.y = 0.5; // Keep on ground level
      targetDirection.normalize();
      
      const angle = Math.atan2(targetDirection.x, targetDirection.z);
      groupRef.current.rotation.y = angle;
    }

    handleAttack(currentTarget);
    constants.lastAttackTime = now;
  });

  useEffect(() => {
    const currentMountId = constants.mountId;
    
    return () => {
      setActiveEffects(prev => 
        prev.filter(effect => 
          effect.type !== 'elementalExplosion' || 
          effect.summonId !== currentMountId
        )
      );
    };
  }, [setActiveEffects, constants.mountId]);

  return (
    <>
      <group ref={groupRef} position={position.toArray()}>
        <ElementalModel isAttacking={!!currentTarget} />
        
        {/* Point light for elemental glow */}
        <pointLight
          color="#4FC3F7"
          intensity={0.3}
          distance={5}
          decay={2}
        />
      </group>

      {/* Projectiles rendered at scene level to avoid coordinate conflicts */}
      {projectiles.map(projectile => {
        // Find current target position for homing behavior
        const currentTarget = enemyData.find(e => e.id === projectile.targetId);
        return (
          <ElementalProjectile
            key={projectile.id}
            id={projectile.id}
            position={projectile.position}
            direction={projectile.direction}
            targetId={projectile.targetId}
            currentTargetPosition={currentTarget?.position}
            onImpact={() => handleProjectileImpact(projectile.id)}
            checkCollisions={checkProjectileCollisions}
          />
        );
      })}

      {/* Explosion effects rendered at scene level */}
      {activeEffects.map(effect => {
        if (effect.type === 'elementalExplosion') {
          const elapsed = effect.startTime ? (Date.now() - effect.startTime) / 1000 : 0;
          const duration = effect.duration || 0.3;
          const fade = Math.max(0, 1 - (elapsed / duration));
          
          const target = effect.targetId ? enemyData.find(e => e.id === effect.targetId) : null;
          
          if (target) {
            const effectPosition = target.position.clone().setY(1.5);
            
            return (
              <group key={effect.id} position={effectPosition.toArray()}>
                {/* Water explosion effect */}
                <mesh>
                  <sphereGeometry args={[0.6 * (1 + elapsed * 2), 16, 16]} />
                  <meshStandardMaterial
                    color="#4FC3F7"
                    emissive="#29B6F6"
                    emissiveIntensity={0.8 * fade}
                    transparent
                    opacity={0.6 * fade}
                    depthWrite={false}
                    blending={AdditiveBlending}
                  />
                </mesh>
              

                <pointLight
                  color="#4FC3F7"
                  intensity={1.2 * fade}
                  distance={4}
                  decay={2}
                />
              </group>
            );
          }
        }
        return null;
      })}
    </>
  );
} 