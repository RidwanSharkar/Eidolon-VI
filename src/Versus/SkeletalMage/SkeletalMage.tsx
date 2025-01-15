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
  
  // Use refs for position tracking
  const currentPosition = useRef(initialPosition.clone());
  const targetPosition = useRef(initialPosition.clone());
  const lastUpdateTime = useRef(Date.now());
  const currentHealth = useRef(health);

  const ATTACK_RANGE = 17;
  const MOVEMENT_SPEED = 0.15;                         // 0.15 BOTH IDEAL
  const SMOOTHING_FACTOR = 0.15;
  const POSITION_UPDATE_THRESHOLD = 0.1;
  const MINIMUM_UPDATE_INTERVAL = 50;
  const SEPARATION_RADIUS = 0.95; // Minimum distance between enemies
  const SEPARATION_FORCE = 0.125; // Strength of the separation force
  const FIREBALL_COOLDOWN = 4250;
  const FIREBALL_DAMAGE = 16;

  // Sync health changes
  useEffect(() => {
    currentHealth.current = health;
  }, [health]);

  // Handle damage with proper synchronization
  const handleDamage = useCallback((damage: number) => {
    if (currentHealth.current <= 0) return;
    
    const newHealth = Math.max(0, currentHealth.current - damage);
    onTakeDamage(`enemy-${id}`, damage);
    
    if (newHealth === 0 && currentHealth.current > 0) {
      setIsDead(true);
      setShowDeathEffect(true);
    }
  }, [id, onTakeDamage]);

  // Immediately sync with provided position
  useEffect(() => {
    if (position) {
      currentPosition.current.copy(position);
      targetPosition.current.copy(position);
      if (enemyRef.current) {
        enemyRef.current.position.copy(position);
      }
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

  // Update frame logic
  useFrame((state, delta) => {
    if (!enemyRef.current || currentHealth.current <= 0) return;
    
    const currentTime = Date.now();
    const distanceToPlayer = currentPosition.current.distanceTo(playerPosition);

    // Check if we should cast fireball
    if (currentTime - lastFireballTime.current >= FIREBALL_COOLDOWN) {
      if (distanceToPlayer <= ATTACK_RANGE) {
        // Add rotation to face player while casting
        const lookTarget = new Vector3()
          .copy(playerPosition)
          .setY(currentPosition.current.y);
        enemyRef.current.lookAt(lookTarget);
        
        castFireball();
        lastFireballTime.current = currentTime;
      }
    }

    // Move AWAY if player gets too close (since we're a ranged caster)
    const MINIMUM_RANGE = 0.5; // Keep at least this far from player
    if (distanceToPlayer < MINIMUM_RANGE && currentHealth.current > 0) {
      setIsMoving(true);
      
      // Calculate direction AWAY from player
      const direction = new Vector3()
        .subVectors(currentPosition.current, playerPosition)
        .normalize();

      // Move away from player
      const nextPos = currentPosition.current.clone().add(
        direction.multiplyScalar(MOVEMENT_SPEED)
      );
      currentPosition.current.lerp(nextPos, SMOOTHING_FACTOR);
      
      // Update position and rotation
      enemyRef.current.position.copy(currentPosition.current);
      const lookTarget = new Vector3()
        .copy(playerPosition)
        .setY(currentPosition.current.y);
      enemyRef.current.lookAt(lookTarget);
    }
    // Move closer if too far to cast
    else if (distanceToPlayer > ATTACK_RANGE && currentHealth.current > 0) {
      setIsMoving(true);
      
      // Calculate direction to player
      const direction = new Vector3()
        .subVectors(playerPosition, currentPosition.current)
        .normalize();

      // Get all other enemy positions from the scene
      const otherEnemies = enemyRef.current.parent?.children
        .filter(child => 
          child !== enemyRef.current && 
          child.position && 
          child.position.distanceTo(currentPosition.current) < SEPARATION_RADIUS
        ) || [];

      // Calculate separation force
      const separationForce = new Vector3();
      otherEnemies.forEach(enemy => {
        // Create a ground-plane version of positions for separation calculation
        const currentGroundPos = currentPosition.current.clone().setY(0);
        const enemyGroundPos = enemy.position.clone().setY(0);
        
        const diff = new Vector3()
          .subVectors(currentGroundPos, enemyGroundPos)
          .normalize()
          .multiplyScalar(SEPARATION_FORCE / Math.max(0.1, enemyGroundPos.distanceTo(currentGroundPos)));
        separationForce.add(diff);
      });

      // Combine forces and ensure Y remains 0
      const finalDirection = direction.add(separationForce).normalize();
      finalDirection.y = 0; // Force movement to stay on ground plane

      // Update target position with combined forces
      const movement = finalDirection.multiplyScalar(MOVEMENT_SPEED * delta * 60);
      targetPosition.current.copy(currentPosition.current).add(movement);
      targetPosition.current.y = 0; // Ensure target position stays on ground

      // Smooth movement
      currentPosition.current.lerp(targetPosition.current, SMOOTHING_FACTOR);
      currentPosition.current.y = 0; // Force current position to stay on ground

      // Apply position to mesh
      enemyRef.current.position.copy(currentPosition.current);

      // Handle rotation smoothly
      const lookTarget = new Vector3()
        .copy(playerPosition)
        .setY(currentPosition.current.y);
      enemyRef.current.lookAt(lookTarget);

      // Update position with rate limiting
      const now = Date.now();
      if (now - lastUpdateTime.current >= MINIMUM_UPDATE_INTERVAL) {
        if (currentPosition.current.distanceTo(position) > POSITION_UPDATE_THRESHOLD) {
          onPositionUpdate(id, currentPosition.current.clone());
          lastUpdateTime.current = now;
        }
      }
    } else {
      setIsMoving(false);
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
          onHit={handleDamage}
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
    </>
  );
} 