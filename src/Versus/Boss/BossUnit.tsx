import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import BossModel from './BossModel';
import { Enemy } from '../enemy';
import Meteor from '@/Versus/Boss/Meteor';

interface BossUnitProps {
  id: string;
  initialPosition: Vector3;
  position: Vector3;
  health: number;
  maxHealth: number;
  onTakeDamage: (id: string, damage: number) => void;
  onPositionUpdate: (id: string, position: Vector3) => void;
  playerPosition: Vector3;
  onAttackPlayer: (damage: number) => void;
}

export default function BossUnit({
  id,
  initialPosition,
  position,
  health,
  maxHealth,
  onTakeDamage,
  onPositionUpdate,
  playerPosition,
  onAttackPlayer,
}: BossUnitProps & Pick<Enemy, 'position'>) {
  const bossRef = useRef<Group>(null);
  const lastAttackTime = useRef<number>(Date.now() + 2000);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isSpawning, setIsSpawning] = useState(true);
  const [isCastingMeteor, setIsCastingMeteor] = useState(false);

  const currentPosition = useRef(initialPosition.clone());
  const targetPosition = useRef(initialPosition.clone());
  const currentHealth = useRef(health);

  // Boss-specific constants
  const ATTACK_RANGE = 3.5;
  const ATTACK_COOLDOWN_NORMAL = 2000;
  const ATTACK_COOLDOWN_ENRAGED = 1000;
  const MOVEMENT_SPEED = 0.01;
  const SMOOTHING_FACTOR = 0.003;
  const ATTACK_DAMAGE = 12;
  const BOSS_HIT_HEIGHT = 2.0;      
  const BOSS_HIT_RADIUS = 4.0;      
  const BOSS_HIT_HEIGHT_RANGE = 4.0; 
  const METEOR_COOLDOWN_NORMAL = 9000;
  const METEOR_COOLDOWN_ENRAGED = 5000;
  const lastMeteorTime = useRef<number>(Date.now());

  // Add a ref to track current cooldowns
  const currentAttackCooldown = useRef(ATTACK_COOLDOWN_NORMAL);
  const currentMeteorCooldown = useRef(METEOR_COOLDOWN_NORMAL);

  // Sync health changes
  useEffect(() => {
    currentHealth.current = health;
  }, [health]);

  // Add hit detection helper function after the constants
  const isWithinHitBox = (attackerPosition: Vector3, attackHeight: number = 1.0) => {
    const bossPosition = currentPosition.current;
    
    // Check horizontal distance first (cylindrical collision)
    const horizontalDist = new Vector3(
      bossPosition.x - attackerPosition.x,
      0,
      bossPosition.z - attackerPosition.z
    ).length();
    
    if (horizontalDist > BOSS_HIT_RADIUS) return false;
    
    // Check vertical distance
    const heightDiff = Math.abs(attackerPosition.y + attackHeight - (bossPosition.y + BOSS_HIT_HEIGHT));
    return heightDiff <= BOSS_HIT_HEIGHT_RANGE;
  };

  // Handle damage with proper synchronization
  const handleDamage = useCallback((damage: number, attackerPosition?: Vector3) => {
    if (currentHealth.current <= 0) return;
    
    // Only check hitbox if attackerPosition is provided (for melee attacks)
    if (attackerPosition && !isWithinHitBox(attackerPosition)) {
      return;
    }
    
    // Use the same ID format as EnemyUnit
    onTakeDamage(`enemy-${id}`, damage);
    
    // Check if this damage would kill the boss
    const updatedHealth = Math.max(0, currentHealth.current - damage);
    if (updatedHealth === 0 && currentHealth.current > 0) {
      setIsDead(true);
    }
  }, [id, onTakeDamage]);

  // Position update logic
  useEffect(() => {
    if (position) {
      currentPosition.current = position.clone();
    }
  }, [position]);

  useEffect(() => {
    if (bossRef.current) {
      bossRef.current.position.copy(currentPosition.current);
    }
  }, []);

  // Add effect to handle enrage state
  useEffect(() => {
    const isEnraged = health <= maxHealth / 2;
    currentAttackCooldown.current = isEnraged ? ATTACK_COOLDOWN_ENRAGED : ATTACK_COOLDOWN_NORMAL;
    currentMeteorCooldown.current = isEnraged ? METEOR_COOLDOWN_ENRAGED : METEOR_COOLDOWN_NORMAL;
  }, [health, maxHealth]);

  // Movement and attack logic
  useFrame(() => {
    if (!bossRef.current || health <= 0 || !playerPosition) return;

    const currentTime = Date.now();
    const distanceToPlayer = currentPosition.current.distanceTo(playerPosition);

    // Update meteor check to use current cooldown
    if (currentTime - lastMeteorTime.current >= currentMeteorCooldown.current && health > 0) {
      castMeteor();
      lastMeteorTime.current = currentTime;
    }

    const direction = new Vector3()
      .subVectors(playerPosition, currentPosition.current)
      .normalize();

    if (distanceToPlayer > ATTACK_RANGE && health > 0) {
      setIsAttacking(false);
      
      targetPosition.current.copy(currentPosition.current).add(
        direction.multiplyScalar(MOVEMENT_SPEED)
      );
      
      currentPosition.current.lerp(targetPosition.current, SMOOTHING_FACTOR);
      
      if (bossRef.current) {
        bossRef.current.position.copy(currentPosition.current);
        
        const lookTarget = new Vector3()
          .copy(playerPosition)
          .setY(currentPosition.current.y);
        bossRef.current.lookAt(lookTarget);
      }
      
      if (currentPosition.current.distanceTo(position) > 0.01) {
        onPositionUpdate(id, currentPosition.current.clone());
      }
    } else if (health > 0) {
      // Update attack check to use current cooldown
      if (currentTime - lastAttackTime.current >= currentAttackCooldown.current) {
        setIsAttacking(true);
        onAttackPlayer(ATTACK_DAMAGE);
        lastAttackTime.current = currentTime;

        setTimeout(() => {
          setIsAttacking(false);
        }, 270);
      }
    }
  });

  // Death handling
  useEffect(() => {
    if (health === 0 && !isDead) {
      console.log(`Boss ${id} died`);
      setIsDead(true);
    }
  }, [setIsDead, health, id, isDead]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSpawning(false);
    }, 3000); // 1 second delay before showing the boss

    return () => clearTimeout(timer);
  }, []);

  const castMeteor = useCallback(() => {
    if (!isCastingMeteor) {
      setIsCastingMeteor(true);
      
      setTimeout(() => {
        setIsCastingMeteor(false);
      }, 4000);
    }
  }, [isCastingMeteor]);

  return (
    <>
      <group 
        ref={bossRef} 
        visible={!isSpawning && health > 0}
        position={currentPosition.current}
        scale={[1.35, 1.35, 1.35]}
        onClick={(e) => {
          e.stopPropagation();
          if (currentHealth.current > 0) { // ??!?!?!
            handleDamage(10);
          }
        }}
      >
        <BossModel
          isAttacking={isAttacking}
          isWalking={!isAttacking && health > 0}
          onHit={handleDamage}
          playerPosition={playerPosition}
        />

        {/* Boss health bar */}
        <Billboard
          position={[0, 5, 0]}
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          {currentHealth.current > 0 && (
            <>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[4.0, 0.4]} />
                <meshBasicMaterial color="#333333" opacity={0.8} transparent />
              </mesh>
              <mesh position={[-2.0 + (currentHealth.current / maxHealth) * 2, 0, 0.001]}>
                <planeGeometry args={[(currentHealth.current / maxHealth) * 4.0, 0.35]} />
                <meshBasicMaterial color="#ff0000" opacity={0.9} transparent />
              </mesh>
              <Text
                position={[0, 0, 0.002]}
                fontSize={0.3}
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
      
      {isCastingMeteor && (
        <Meteor
          targetPosition={playerPosition}
          onImpact={(damage) => onAttackPlayer(damage)}
          onComplete={() => setIsCastingMeteor(false)}
          playerPosition={playerPosition}
        />
      )}
    </>
  );
} 