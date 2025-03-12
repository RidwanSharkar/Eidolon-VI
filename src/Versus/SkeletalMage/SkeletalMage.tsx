// src/versus/SkeletalMage/SkeletalMage.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import CustomSkeletonMage from '@/Versus/SkeletalMage/CustomSkeletonMage';
import BoneVortex2 from '@/color/SpawnAnimation';
import { Enemy } from '@/Versus/enemy';
import BoneVortex from '@/color/DeathAnimation';
import { WeaponType } from '@/Weapons/weapons';
import MageFireball from '@/Versus/SkeletalMage/MageFireball';
import { stealthManager } from '@/Spells/Stealth/StealthManager';
import StealthStrikeEffect from '@/Spells/Stealth/StealthStrikeEffect';

interface SkeletalMageProps {
  id: string;
  initialPosition: Vector3;
  position: Vector3;
  health: number;
  maxHealth: number;
  onTakeDamage: (id: string, damage: number) => void;
  onPositionUpdate: (id: string, position: Vector3) => void;
  playerPosition: Vector3;
  onAttackPlayer: (damage: number) => void;
  weaponType: WeaponType;
  isDying?: boolean;
}

// Add DamageSource interface at the top
interface DamageSource {
  type: WeaponType;
  hasActiveAbility?: boolean;
}

export default function SkeletalMage({
  id,
  initialPosition,
  position,
  health,
  maxHealth,
  onTakeDamage,
  onPositionUpdate,
  playerPosition,
  onAttackPlayer,
  weaponType,
}: SkeletalMageProps & Pick<Enemy, 'position'>) {
  const enemyRef = useRef<Group>(null);
  const [showDeathEffect, setShowDeathEffect] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isSpawning, setIsSpawning] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [isCastingFireball, setIsCastingFireball] = useState(false);
  const lastFireballTime = useRef<number>(Date.now() + 2000);
  const [activeFireballs, setActiveFireballs] = useState<Array<{
    id: number;
    position: Vector3;
    target: Vector3;
  }>>([]);
  
  // Add to existing state declarations
  const [activeEffects, setActiveEffects] = useState<Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration: number;
    startTime: number;
  }>>([]);
  
  // Use refs for position tracking
  const currentPosition = useRef(initialPosition.clone());
  const targetPosition = useRef(initialPosition.clone());
  const lastUpdateTime = useRef(Date.now());
  const currentHealth = useRef(health);

  // Add this near your other refs
  const velocity = useRef(new Vector3());

  const ATTACK_RANGE = 20;
  const MOVEMENT_SPEED = 0.030;
  const POSITION_UPDATE_THRESHOLD = 0.1;
  const MINIMUM_UPDATE_INTERVAL = 35;
  const SEPARATION_RADIUS = 1.25;
  const SEPARATION_FORCE = 0.155;
  const FIREBALL_COOLDOWN = 4250;
  const FIREBALL_DAMAGE = 18;
  const ACCELERATION = 6.0;
  const DECELERATION = 8.0;
  const ROTATION_SPEED = 8.0;

  // Add these constants near the other ones (after line 89)
  const WANDER_DURATION = 4500;
  const WANDER_RADIUS = 5; // Slightly smaller for the mage
  const WANDER_ROTATION_SPEED = 4.0;
  const WANDER_MOVEMENT_SPEED = 0.025;

  // Add these refs near the other refs
  const wanderTarget = useRef<Vector3 | null>(null);
  const wanderStartTime = useRef<number>(Date.now());

  // Sync health changes
  useEffect(() => {
    currentHealth.current = health;
  }, [health]);

  // Handle damage with proper synchronization
  const handleDamage = useCallback((damage: number, source: DamageSource) => {
    if (currentHealth.current <= 0) return;
    
    const newHealth = Math.max(0, currentHealth.current - damage);
    onTakeDamage(`enemy-${id}`, damage);
    
    // Add stealth strike effect
    if (source.type && stealthManager.hasShadowStrikeBuff()) {
      const effectDirection = new Vector3().subVectors(
        currentPosition.current,
        playerPosition
      ).normalize();
      
      setActiveEffects(prev => [...prev, {
        id: Date.now(),
        type: 'stealthStrike',
        position: currentPosition.current.clone(),
        direction: effectDirection,
        duration: 0.2,
        startTime: Date.now()
      }]);
    }
    
    if (newHealth === 0 && currentHealth.current > 0) {
      setIsDead(true);
      setShowDeathEffect(true);
    }
  }, [id, onTakeDamage, playerPosition]);

  // Immediately sync with provided position
  useEffect(() => {
    if (position) {
      targetPosition.current.copy(position);
      targetPosition.current.y = 0;
    }
  }, [position]);

  // Cast fireball with telegraph
  const castFireball = useCallback(() => {
    if (!isCastingFireball && !isDead) {
      setIsCastingFireball(true);
      
      // Telegraph animation for 1 second before launching fireball
      setTimeout(() => {
        if (enemyRef.current) {
          const startPos = currentPosition.current.clone();
          startPos.y += 1.5; // Adjust height to match mage's hands
          
          setActiveFireballs(prev => [...prev, {
            id: Date.now(),
            position: startPos,
            target: playerPosition.clone(),
          }]);
        }
        
        // Reset casting state after fireball is launched
        setTimeout(() => {
          setIsCastingFireball(false);
        }, 500);
      }, 1000);
    }
  }, [isCastingFireball, isDead, playerPosition]);

  // Add the getNewWanderTarget function after the constants
  const getNewWanderTarget = useCallback(() => {
    if (!enemyRef.current) return null;
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * WANDER_RADIUS;
    
    return new Vector3(
      currentPosition.current.x + Math.cos(angle) * distance,
      0,
      currentPosition.current.z + Math.sin(angle) * distance
    );
  }, []);

  // Update frame logic
  useFrame((_, delta) => {
    if (!enemyRef.current || currentHealth.current <= 0 || !playerPosition) {
      setIsMoving(false);
      return;
    }

    // Add stealth check
    if (stealthManager.isUnitStealthed()) {
      setIsMoving(false);
      setIsCastingFireball(false);
      
      const now = Date.now();
      if (!wanderTarget.current || now - wanderStartTime.current > WANDER_DURATION) {
        if (!wanderTarget.current) {
          wanderTarget.current = getNewWanderTarget();
        } else {
          // Smoothly transition to new target
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
        
        const normalizedSpeed = WANDER_MOVEMENT_SPEED * 60;
        const currentFrameSpeed = normalizedSpeed * delta;
        
        const direction = new Vector3()
          .subVectors(wanderTarget.current, currentPosition.current)
          .normalize();
        
        const targetVelocity = direction.multiplyScalar(currentFrameSpeed);
        velocity.current.lerp(targetVelocity, (ACCELERATION * 0.5) * delta);
        
        currentPosition.current.add(velocity.current);
        currentPosition.current.y = 0;
        enemyRef.current.position.copy(currentPosition.current);
        
        const targetRotation = Math.atan2(direction.x, direction.z);
        const currentRotationY = enemyRef.current.rotation.y;
        let rotationDiff = targetRotation - currentRotationY;
        
        while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
        
        enemyRef.current.rotation.y += rotationDiff * Math.min(1, WANDER_ROTATION_SPEED * delta);
      }
      
      return;
    }

    const distanceToPlayer = currentPosition.current.distanceTo(playerPosition);

    if (distanceToPlayer > ATTACK_RANGE && currentHealth.current > 0) {
      setIsMoving(true);

      const normalizedSpeed = MOVEMENT_SPEED * 60;
      const currentFrameSpeed = normalizedSpeed * delta;

      // Calculate direction to player
      const direction = new Vector3()
        .subVectors(playerPosition, currentPosition.current)
        .normalize();

      // Calculate separation force
      const separationForce = new Vector3();
      const otherEnemies = enemyRef.current.parent?.children
        .filter(child => 
          child !== enemyRef.current && 
          child.position && 
          child.position.distanceTo(currentPosition.current) < SEPARATION_RADIUS
        ) || [];

      otherEnemies.forEach(enemy => {
        const currentGroundPos = currentPosition.current.clone().setY(0);
        const enemyGroundPos = enemy.position.clone().setY(0);
        
        const diff = new Vector3()
          .subVectors(currentGroundPos, enemyGroundPos)
          .normalize()
          .multiplyScalar(SEPARATION_FORCE / Math.max(0.1, enemyGroundPos.distanceTo(currentGroundPos)));
        separationForce.add(diff);
      });

      // Combine forces and normalize
      const finalDirection = direction.add(separationForce).normalize();
      finalDirection.y = 0;

      // Calculate target velocity
      const targetVelocity = finalDirection.multiplyScalar(currentFrameSpeed);
      
      // Smoothly interpolate current velocity towards target
      velocity.current.lerp(targetVelocity, ACCELERATION * delta);
      
      // Update position with smoothed velocity
      currentPosition.current.add(velocity.current);
      currentPosition.current.y = 0;

      // Apply position to mesh
      enemyRef.current.position.copy(currentPosition.current);

      // Smooth rotation
      const lookTarget = new Vector3()
        .copy(playerPosition)
        .setY(currentPosition.current.y);
      const targetRotation = Math.atan2(
        lookTarget.x - currentPosition.current.x,
        lookTarget.z - currentPosition.current.z
      );

      // Interpolate rotation
      const currentRotationY = enemyRef.current.rotation.y;
      let rotationDiff = targetRotation - currentRotationY;
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      enemyRef.current.rotation.y += rotationDiff * Math.min(1, ROTATION_SPEED * delta);

    } else {
      setIsMoving(false);
      // Decelerate smoothly
      velocity.current.multiplyScalar(1 - DECELERATION * delta);
      
      if (velocity.current.length() > 0.001) {
        currentPosition.current.add(velocity.current);
        enemyRef.current.position.copy(currentPosition.current);
      }
    }

    // Check if we should cast fireball
    if (Date.now() - lastFireballTime.current >= FIREBALL_COOLDOWN) {
      if (distanceToPlayer <= ATTACK_RANGE) {
        castFireball();
        lastFireballTime.current = Date.now();
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
      if (enemyRef.current) {
        enemyRef.current.visible = true;
      }
    }
  }, [health, isDead]);

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

  return (
    <>
      <group 
        ref={enemyRef} 
        visible={!isSpawning && currentHealth.current > 0}
        position={currentPosition.current}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <CustomSkeletonMage
          position={[0, 0.76, 0]}
          isAttacking={isCastingFireball}
          isWalking={isMoving && currentHealth.current > 0}
          onHit={(damage) => handleDamage(damage, { type: weaponType })}
        />

        {/* Visual telegraph when casting */}
        {isCastingFireball && (
          <group position={[0.4, 2.265, 0]}>
            <mesh>
              <sphereGeometry args={[0.125, 16, 16]} />
              <meshStandardMaterial
                color="#ff3333"
                emissive="#ff0000"
                emissiveIntensity={1}
                transparent
                opacity={0.8}
              />
            </mesh>
            <pointLight color="#ff3333" intensity={2} distance={3} />
          </group>
        )}

                {/* Visual telegraph when casting */}
                {isCastingFireball && (
          <group position={[-.4, 2.265, -0.05]}>
            <mesh>
              <sphereGeometry args={[0.125, 16, 16]} />
              <meshStandardMaterial
                color="#ff3333"
                emissive="#ff0000"
                emissiveIntensity={2}
                transparent
                opacity={0.7}
              />
            </mesh>
            <pointLight color="#ff3333" intensity={2} distance={3} />
          </group>
        )}


        <Billboard
          position={[0, 3.5, 0]}
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
        />
      )}

      {/* Render active fireballs */}
      {activeFireballs.map(fireball => (
        <MageFireball
          key={fireball.id}
          position={fireball.position}
          target={fireball.target}
          playerPosition={playerPosition}
          onHit={(didHitPlayer) => {
            setActiveFireballs(prev => 
              prev.filter(f => f.id !== fireball.id)
            );
            
            if (didHitPlayer) {
              onAttackPlayer(FIREBALL_DAMAGE);
            }
          }}
        />
      ))}

      {/* Add stealth strike effect */}
      {activeEffects.map(effect => {
        if (effect.type === 'stealthStrike') {
          return (
            <StealthStrikeEffect
              key={effect.id}
              position={effect.position}
              direction={effect.direction}
              onComplete={() => {
                setActiveEffects(prev => prev.filter(e => e.id !== effect.id));
              }}
              parentRef={enemyRef}
            />
          );
        }
        return null;
      })}
    </>
  );
} 