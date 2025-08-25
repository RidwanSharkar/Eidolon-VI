import { useImperativeHandle, forwardRef } from 'react';
import { Group, Vector3 } from 'three';
import { useChainLightning } from '@/Spells/ChainLightning/useChainLightning';
import ChainLightningEffect from '@/Spells/ChainLightning/ChainLightningEffect';
import { Enemy } from '@/Versus/enemy'; 
import { SynchronizedEffect } from '@/Multiplayer/MultiplayerContext';

interface ChainLightningProps {
  parentRef: React.RefObject<Group>;
  enemies: Enemy[];
  onEnemyDamage: (targetId: string, damage: number) => void;
  setDamageNumbers: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isHealing?: boolean;
    isChainLightning?: boolean;
  }>>>;
  nextDamageNumberId: React.MutableRefObject<number>;
  sendEffect?: (effect: Omit<SynchronizedEffect, 'id' | 'startTime'>) => void;
  isInRoom?: boolean;
  isPlayer?: boolean;
}

const ChainLightning = forwardRef<{ processChainLightning: () => void }, ChainLightningProps>(({
  parentRef,
  enemies,
  onEnemyDamage,
  setDamageNumbers,
  nextDamageNumberId,
  sendEffect,
  isInRoom,
  isPlayer
}, ref) => {
  const { processChainLightning, lightningTargets } = useChainLightning({
    parentRef,
    enemies,
    onEnemyDamage,
    setDamageNumbers,
    nextDamageNumberId,
    sendEffect,
    isInRoom,
    isPlayer
  });

  useImperativeHandle(ref, () => ({
    processChainLightning
  }));

  return (
    <>
      {lightningTargets.length > 0 && (
        <ChainLightningEffect
          startPosition={parentRef.current!.position}
          targetPositions={lightningTargets}
        />
      )}
    </>
  );
});

ChainLightning.displayName = 'ChainLightning';

export default ChainLightning; 