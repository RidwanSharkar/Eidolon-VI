import React, { forwardRef, useImperativeHandle } from 'react';
import { Group, Vector3 } from 'three';
import { useGlacialShard } from './useGlacialShard';
import GlacialShardProjectile from './GlacialShardProjectile';
import GlacialShardShield from './GlacialShardShield';
import { WeaponSubclass } from '@/Weapons/weapons';
import { SynchronizedEffect } from '@/Multiplayer/MultiplayerContext';

interface GlacialShardProps {
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
  isEnemyFrozen?: (enemyId: string) => boolean;
  currentSubclass?: WeaponSubclass;
  // Multiplayer props
  sendEffect?: (effect: Omit<SynchronizedEffect, 'id' | 'startTime'>) => void;
  isInRoom?: boolean;
  isPlayer?: boolean;
}

export interface GlacialShardRef {
  shootGlacialShard: () => boolean;
  absorbDamage: (damage: number) => number;
  hasShield: boolean;
  shieldAbsorption: number;
  getKillCount: () => number;
}

const GlacialShard = forwardRef<GlacialShardRef, GlacialShardProps>(({
  parentRef,
  onHit,
  enemyData,
  setDamageNumbers,
  nextDamageNumberId,
  charges,
  setCharges,
  setActiveEffects,
  isEnemyFrozen,
  currentSubclass,
  // Multiplayer props
  sendEffect,
  isInRoom,
  isPlayer
}, ref) => {
  const {
    activeShards,
    shootGlacialShard,
    handleShardImpact,
    checkShardCollisions,
    hasShield,
    shieldAbsorption,
    absorbDamage,
    glacialShardKillCount
  } = useGlacialShard({
    parentRef,
    onHit,
    enemyData,
    setDamageNumbers,
    nextDamageNumberId,
    charges,
    setCharges,
    setActiveEffects,
    isEnemyFrozen,
    currentSubclass,
    // Multiplayer props
    sendEffect,
    isInRoom,
    isPlayer
  });

  useImperativeHandle(ref, () => ({
    shootGlacialShard,
    absorbDamage,
    hasShield,
    shieldAbsorption,
    getKillCount: () => glacialShardKillCount
  }));

  return (
    <group>
      {/* Render active shards */}
      {activeShards.map(shard => (
        <GlacialShardProjectile
          key={shard.id}
          id={shard.id}
          position={shard.position}
          direction={shard.direction}
          onImpact={(impactPosition) => handleShardImpact(shard.id, impactPosition)}
          checkCollisions={checkShardCollisions}
        />
      ))}

      {/* Render shield effect if active */}
      {hasShield && (
        <GlacialShardShield
          parentRef={parentRef}
          absorption={shieldAbsorption}
        />
      )}
    </group>
  );
});

GlacialShard.displayName = 'GlacialShard';

export default GlacialShard; 