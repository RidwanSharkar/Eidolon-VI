import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Group, Vector3, AdditiveBlending, SphereGeometry, TorusGeometry, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import { SummonProps } from '@/Spells/Summon/SummonProps';
import { Enemy } from '@/Versus/enemy';
import TotemModel from '@/Spells/Summon/TotemModel';

// Shared geometries for summon explosion - avoid per-render allocations
const summonGeometries = {
  explosionSphere: new SphereGeometry(0.35, 32, 32),
  innerSphere: new SphereGeometry(0.25, 24, 24),
  torus0: new TorusGeometry(0.45, 0.045, 16, 32),
  torus1: new TorusGeometry(0.65, 0.045, 16, 32),
  torus2: new TorusGeometry(0.85, 0.045, 16, 32),
  spark: new SphereGeometry(0.05, 8, 8)
};

let summonResourceUsers = 0;

const disposeSummonResources = () => {
  Object.values(summonGeometries).forEach(geo => geo.dispose());
};

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
  const [currentTarget, setCurrentTarget] = useState<Enemy | null>(null);

  // Resource management
  useEffect(() => {
    summonResourceUsers += 1;
    return () => {
      summonResourceUsers = Math.max(0, summonResourceUsers - 1);
      if (summonResourceUsers === 0) {
        disposeSummonResources();
      }
    };
  }, []);

  // Shared materials - memoized to avoid recreation
  const explosionMaterials = useMemo(() => ({
    outer: new MeshStandardMaterial({
      color: "#8800ff",
      emissive: "#9933ff",
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: AdditiveBlending
    }),
    inner: new MeshStandardMaterial({
      color: "#aa66ff",
      emissive: "#ffffff",
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: AdditiveBlending
    }),
    torus: new MeshStandardMaterial({
      color: "#8800ff",
      emissive: "#9933ff",
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: AdditiveBlending
    }),
    spark: new MeshStandardMaterial({
      color: "#aa66ff",
      emissive: "#ffffff",
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: AdditiveBlending
    })
  }), []);

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(explosionMaterials).forEach(mat => mat.dispose());
    };
  }, [explosionMaterials]);
  
  const constants = useRef({
    lastAttackTime: 0,
    startTime: Date.now(),
    hasTriggeredCleanup: false,
    mountId: Date.now(),
    lastTargetSwitchTime: Date.now(),
    ATTACK_COOLDOWN: 1200,
    RANGE: 35,
    DURATION: 14000,
    DAMAGE: 47,
    EFFECT_DURATION: 225,
    TARGET_SWITCH_INTERVAL: 4000
  }).current;

  const calculateDistance = useCallback((pos1: { x: number, z: number }, pos2: { x: number, z: number }) => {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
  }, []);

  const findNewTarget = useCallback((excludeCurrentTarget: boolean = false): Enemy | null => {
    if (!groupRef.current) return null;
    
    const totemPosition = groupRef.current.position;
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
        { x: totemPosition.x, z: totemPosition.z }
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
        !target.position) {
      return;
    }

    const isBossTarget = target.id.startsWith('boss-') || target.id.startsWith('enemy-boss-');
    const damage = isBossTarget ? 17 : constants.DAMAGE;
    
    const impactPosition = target.position.clone().setY(1.5);
    
    if (!enemyData.find(e => e.id === target.id && e.health > 0)) {
      return;
    }

    onDamage(target.id, damage, impactPosition, true);
    
    const effectId = Date.now();
    const totemWorldPos = new Vector3();
    groupRef.current?.getWorldPosition(totemWorldPos);
    
    const updates = {
      damageNumber: {
        id: nextDamageNumberId.current++,
        damage,
        position: impactPosition.clone(),
        isCritical: false,
        isSummon: true,
        createdAt: Date.now() // MEMORY FIX: Required for cleanup
      },
      effect: {
        id: effectId,
        type: 'summonExplosion',
        position: impactPosition.clone().sub(totemWorldPos),
        direction: new Vector3(),
        duration: constants.EFFECT_DURATION / 1000,
        startTime: Date.now(),
        summonId: constants.mountId,
        targetId: target.id
      }
    };

    setDamageNumbers(prev => [...prev, updates.damageNumber]);
    setActiveEffects(prev => [
      ...prev.filter(effect => 
        effect.type !== 'summonExplosion' || 
        (effect.startTime && Date.now() - effect.startTime < constants.EFFECT_DURATION)
      ),
      updates.effect
    ]);

    requestAnimationFrame(() => {
      const cleanupTime = Date.now();
      if (cleanupTime - updates.effect.startTime >= constants.EFFECT_DURATION + 150) {
        setActiveEffects(prev => prev.filter(effect => effect.id !== effectId));
      }
    });
  }, [constants, onDamage, setActiveEffects, setDamageNumbers, nextDamageNumberId, enemyData]);

  useFrame(() => {
    const now = Date.now();
    
    if (now - constants.startTime > constants.DURATION) {
      if (!constants.hasTriggeredCleanup) {
        constants.hasTriggeredCleanup = true;
        onComplete();
        onStartCooldown();
      }
      return;
    }

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

    handleAttack(currentTarget);
    constants.lastAttackTime = now;
  });

  useEffect(() => {
    const currentMountId = constants.mountId;
    
    return () => {
      setActiveEffects(prev => 
        prev.filter(effect => 
          effect.type !== 'summonExplosion' || 
          effect.summonId !== currentMountId
        )
      );
    };
  }, [setActiveEffects, constants.mountId]);

  return (
    <group ref={groupRef} position={position.toArray()}>
      <TotemModel isAttacking={!!currentTarget} />

      {activeEffects.map(effect => {
        if (effect.type === 'summonExplosion') {
          const elapsed = effect.startTime ? (Date.now() - effect.startTime) / 1000 : 0;
          const duration = effect.duration || 0.2;
          const fade = Math.max(0, 1 - (elapsed / duration));
          
          const target = effect.targetId ? enemyData.find(e => e.id === effect.targetId) : null;
          
          if (target && groupRef.current) {
            const totemWorldPos = new Vector3();
            groupRef.current.getWorldPosition(totemWorldPos);
            
            const effectPosition = target.position.clone()
              .setY(1.5)
              .sub(totemWorldPos);

            // Update material opacities based on fade
            explosionMaterials.outer.opacity = 0.8 * fade;
            explosionMaterials.outer.emissiveIntensity = 0.5 * fade;
            explosionMaterials.inner.opacity = 0.9 * fade;
            explosionMaterials.inner.emissiveIntensity = 0.5 * fade;
            explosionMaterials.torus.opacity = 0.6 * fade;
            explosionMaterials.torus.emissiveIntensity = 1 * fade;
            explosionMaterials.spark.opacity = 0.8 * fade;
            explosionMaterials.spark.emissiveIntensity = 2 * fade;

            const getTorusGeometry = (i: number) => {
              if (i === 0) return summonGeometries.torus0;
              if (i === 1) return summonGeometries.torus1;
              return summonGeometries.torus2;
            };
            
            return (
              <group key={effect.id} position={effectPosition.toArray()}>
                <mesh
                  geometry={summonGeometries.explosionSphere}
                  material={explosionMaterials.outer}
                  scale={[1 + elapsed * 2, 1 + elapsed * 2, 1 + elapsed * 2]}
                />
                
                <mesh
                  geometry={summonGeometries.innerSphere}
                  material={explosionMaterials.inner}
                  scale={[1 + elapsed * 3, 1 + elapsed * 3, 1 + elapsed * 3]}
                />

                {[0, 1, 2].map((i) => (
                  <mesh 
                    key={i} 
                    rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
                    geometry={getTorusGeometry(i)}
                    material={explosionMaterials.torus}
                    scale={[1 + elapsed * 3, 1 + elapsed * 3, 1 + elapsed * 3]}
                  />
                ))}

                {[...Array(4)].map((_, i) => {
                  const angle = (i / 4) * Math.PI * 2;
                  const radius = 0.5 * (1 + elapsed * 2);
                  return (
                    <mesh
                      key={`spark-${i}`}
                      position={[
                        Math.sin(angle) * radius,
                        Math.cos(angle) * radius,
                        0
                      ]}
                      geometry={summonGeometries.spark}
                      material={explosionMaterials.spark}
                    />
                  );
                })}

                <pointLight
                  color="#8800ff"
                  intensity={1 * fade}
                  distance={4}
                  decay={2}
                />
                <pointLight
                  color="#aa66ff"
                  intensity={1 * fade}
                  distance={6}
                  decay={1}
                />
              </group>
            );
          }
        }
        return null;
      })}
    </group>
  );
}