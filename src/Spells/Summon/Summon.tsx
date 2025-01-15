import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Group, Vector3, AdditiveBlending } from 'three';
import { useFrame } from '@react-three/fiber';
import { SummonProps } from '@/Spells/Summon/SummonProps';
import { Enemy } from '@/Versus/enemy';
import TotemModel from '@/Spells/Summon/TotemModel';

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
  const lastAttackTime = useRef(0);
  const ATTACK_COOLDOWN = 600;
  const RANGE = 40;
  const DURATION = 12000;
  const DAMAGE = 37;
  const startTime = useRef(Date.now());
  const EFFECT_DURATION = 400;
  const hasTriggeredCleanup = useRef(false);
  const mountId = useRef(Date.now());
  const lastTargetSwitchTime = useRef(Date.now());
  const TARGET_SWITCH_INTERVAL = 2400;

  // Modify the findNewTarget function to exclude the current target
  const findNewTarget = useCallback((excludeCurrentTarget: boolean = false): Enemy | null => {
    if (!groupRef.current) return null;

    const totemPosition = groupRef.current.position;
    const viableTargets = enemyData.filter(enemy => {
      // Thorough validation of target viability
      if (enemy.health <= 0 || 
          enemy.isDying || 
          enemy.deathStartTime || 
          !enemy.position ||
          (excludeCurrentTarget && currentTarget && enemy.id === currentTarget.id)) return false;
      
      const distance = new Vector3(
        enemy.position.x - totemPosition.x,
        0,
        enemy.position.z - totemPosition.z
      ).length();
      
      return distance <= RANGE;
    });

    if (viableTargets.length > 0) {
      return viableTargets[Math.floor(Math.random() * viableTargets.length)];
    }
    
    return null;
  }, [enemyData, RANGE, currentTarget]);

  // Handle direct damage and effect
  const handleAttack = useCallback((target: Enemy) => {
    // More thorough validation of target state
    if (!target || 
        target.health <= 0 || 
        target.isDying || 
        target.deathStartTime || 
        !target.position) {
      return;
    }

    // Check if target is a boss by checking both possible ID formats
    const isBossTarget = target.id.startsWith('boss-') || target.id.startsWith('enemy-boss-');
    // Reduce damage for boss targets
    const damage = isBossTarget ? 13 : DAMAGE;
    
    const impactPosition = target.position.clone().setY(1.5);
    
    // Only proceed with damage and effects if target is still valid
    const currentTarget = enemyData.find(e => e.id === target.id);
    if (!currentTarget || currentTarget.health <= 0) {
      return;
    }

    onDamage(target.id, damage, impactPosition, true);
    
    setDamageNumbers(prev => [...prev, {
      id: nextDamageNumberId.current++,
      damage,
      position: impactPosition.clone(),
      isCritical: false,
      isSummon: true
    }]);

    const effectId = Date.now();
    
    const totemWorldPos = new Vector3();
    if (groupRef.current) {
      groupRef.current.getWorldPosition(totemWorldPos);
    }
    
    const relativePosition = impactPosition.clone().sub(totemWorldPos);
    
    setActiveEffects(prev => [
      ...prev.filter(effect => 
        effect.type !== 'summonExplosion' || 
        (effect.startTime && Date.now() - effect.startTime < EFFECT_DURATION)
      ),
      {
        id: effectId,
        type: 'summonExplosion',
        position: relativePosition,
        direction: new Vector3(),
        duration: EFFECT_DURATION / 1000,
        startTime: Date.now(),
        summonId: mountId.current,
        targetId: target.id
      }
    ]);

    setTimeout(() => {
      setActiveEffects(prev => 
        prev.filter(effect => effect.id !== effectId)
      );
    }, EFFECT_DURATION + 150);
  }, [DAMAGE, onDamage, setActiveEffects, setDamageNumbers, nextDamageNumberId, enemyData]);

  // Modify useFrame to include target switching logic
  useFrame(() => {
    if (Date.now() - startTime.current > DURATION && !hasTriggeredCleanup.current) {
      hasTriggeredCleanup.current = true;
      onComplete();
      onStartCooldown();
      return;
    }

    const now = Date.now();
    
    // Check if it's time to switch targets
    if (now - lastTargetSwitchTime.current >= TARGET_SWITCH_INTERVAL) {
      const newTarget = findNewTarget(true); // Exclude current target when switching
      if (newTarget) {
        setCurrentTarget(newTarget);
      }
      lastTargetSwitchTime.current = now;
    }

    // Move target validation to a separate function
    const isTargetValid = (target: Enemy | null): boolean => {
      return !!(target && 
               target.health > 0 && 
               !target.isDying && 
               !target.deathStartTime);
    };

    // Always validate current target before any action
    if (!isTargetValid(currentTarget)) {
      const newTarget = findNewTarget();
      setCurrentTarget(newTarget);
    } else if (now - lastAttackTime.current >= ATTACK_COOLDOWN) {
      // Double-check target is still valid before attack
      if (isTargetValid(currentTarget) && currentTarget) {
        handleAttack(currentTarget);
        lastAttackTime.current = now;
      } else {
        // If target became invalid, find new target
        const newTarget = findNewTarget();
        setCurrentTarget(newTarget);
      }
    }
  });

  // Cleanup effect
  useEffect(() => {
    // Capture the current mountId value when the effect runs
    const currentMountId = mountId.current;
    
    return () => {
      setActiveEffects(prev => 
        prev.filter(effect => 
          effect.type !== 'summonExplosion' || 
          effect.summonId !== currentMountId
        )
      );
    };
  }, [setActiveEffects]);

  return (
    <group ref={groupRef} position={position.toArray()}>
      <TotemModel isAttacking={!!currentTarget} />

      {/* Render explosion effects */}
      {activeEffects.map(effect => {
        if (effect.type === 'summonExplosion') {
          const elapsed = effect.startTime ? (Date.now() - effect.startTime) / 1000 : 0;
          const duration = effect.duration || 0.2;
          const fade = Math.max(0, 1 - (elapsed / duration));
          
          // Find the current position of the target if it exists
          const target = effect.targetId ? enemyData.find(e => e.id === effect.targetId) : null;
          
          if (target && groupRef.current) {
            // Get totem's world position
            const totemWorldPos = new Vector3();
            groupRef.current.getWorldPosition(totemWorldPos);
            
            // Calculate relative position from totem to target
            const effectPosition = target.position.clone()
              .setY(1.5)
              .sub(totemWorldPos);
            
            return (
              <group key={effect.id} position={effectPosition.toArray()}>
                {/* Core explosion sphere */}
                <mesh>
                  <sphereGeometry args={[0.35 * (1 + elapsed * 2), 32, 32]} />
                  <meshStandardMaterial
                    color="#8800ff"
                    emissive="#9933ff"
                    emissiveIntensity={0.5 * fade}
                    transparent
                    opacity={0.8 * fade}
                    depthWrite={false}
                    blending={AdditiveBlending}
                  />
                </mesh>
                
                {/* Inner energy sphere */}
                <mesh>
                  <sphereGeometry args={[0.25 * (1 + elapsed * 3), 24, 24]} />
                  <meshStandardMaterial
                    color="#aa66ff"
                    emissive="#ffffff"
                    emissiveIntensity={0.5 * fade}
                    transparent
                    opacity={0.9 * fade}
                    depthWrite={false}
                    blending={AdditiveBlending}
                  />
                </mesh>

                {/* Multiple expanding rings */}
                {[0.45, 0.65, 0.85, 1.05].map((size, i) => (
                  <mesh key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}>
                    <torusGeometry args={[size * (1 + elapsed * 3), 0.045, 16, 32]} />
                    <meshStandardMaterial
                      color="#8800ff"
                      emissive="#9933ff"
                      emissiveIntensity={1 * fade}
                      transparent
                      opacity={0.6 * fade * (1 - i * 0.2)}
                      depthWrite={false}
                      blending={AdditiveBlending}
                    />
                  </mesh>
                ))}

                {/* Particle sparks */}
                {[...Array(8)].map((_, i) => {
                  const angle = (i / 8) * Math.PI * 2;
                  const radius = 0.5 * (1 + elapsed * 2);
                  return (
                    <mesh
                      key={`spark-${i}`}
                      position={[
                        Math.sin(angle) * radius,
                        Math.cos(angle) * radius,
                        0
                      ]}
                    >
                      <sphereGeometry args={[0.05, 8, 8]} />
                      <meshStandardMaterial
                        color="#aa66ff"
                        emissive="#ffffff"
                        emissiveIntensity={2 * fade}
                        transparent
                        opacity={0.8 * fade}
                        depthWrite={false}
                        blending={AdditiveBlending}
                      />
                    </mesh>
                  );
                })}

                {/* Dynamic lights */}
                <pointLight
                  color="#8800ff"
                  intensity={2 * fade}
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