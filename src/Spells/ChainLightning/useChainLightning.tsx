import { useCallback, useState } from 'react';
import { Group, Vector3 } from 'three';
import { Enemy } from '@/Versus/enemy';
import { SynchronizedEffect } from '@/Multiplayer/MultiplayerContext';

interface ChainLightningProps {
  parentRef: React.RefObject<Group>;
  enemies: Enemy[];
  onEnemyDamage: (targetId: string, damage: number, isCritical: boolean, position: Vector3, isChainLightning: boolean) => void;
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

export const useChainLightning = ({
  parentRef,
  enemies,
  onEnemyDamage,
  setDamageNumbers,
  nextDamageNumberId,
  sendEffect,
  isInRoom,
  isPlayer
}: ChainLightningProps) => {
  const CHAIN_CHANCE = 0.375;
  const INITIAL_DAMAGE = 23;
  const MAX_JUMPS = 3; 
  
  const [lightningTargets, setLightningTargets] = useState<Vector3[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processChainLightning = useCallback(() => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Check chain chance first
    if (Math.random() >= CHAIN_CHANCE) {
      setIsProcessing(false);
      return;
    }

    const findNextTarget = (currentPos: Vector3, hitTargets: Set<string>): { position: Vector3, id: string } | null => {
      let nearestEnemy = null;
      let shortestDistance = Infinity;
      let enemyId = '';

      enemies.forEach(enemy => {
        if (enemy.isDying || !enemy.position || enemy.health <= 0 || hitTargets.has(enemy.id)) return;

        const distance = currentPos.distanceTo(enemy.position);
        if (distance < shortestDistance && distance < 11.25) {
          shortestDistance = distance;
          nearestEnemy = enemy.position;
          enemyId = enemy.id;
        }
      });

      return nearestEnemy ? { position: nearestEnemy, id: enemyId } : null;
    };

    const chainDamage = (jumpIndex: number) => {
      const damages = [19, 17, 13]; // CUSTOM DAMAGE PRIMES
      return damages[jumpIndex];
    };

    // Find first target
    const hitTargets = new Set<string>();
    const firstTarget = findNextTarget(parentRef.current!.position.clone(), hitTargets);
    if (!firstTarget) {
      setIsProcessing(false);
      return;
    }

    // Add first target to hit targets and start building chain
    hitTargets.add(firstTarget.id);
    const targets: Vector3[] = [firstTarget.position];

    // Process first target damage
    onEnemyDamage(firstTarget.id, INITIAL_DAMAGE, false, firstTarget.position, true);
    setDamageNumbers(prev => [...prev, {
      id: nextDamageNumberId.current++,
      damage: INITIAL_DAMAGE,
      position: firstTarget.position.clone().add(new Vector3(0, 1.5, 0)),
      isCritical: false,
      isChainLightning: true
    }]);

    // Process chain targets
    let currentPos = firstTarget.position;
    for (let i = 1; i < Math.min(enemies.length, MAX_JUMPS); i++) {
      const nextTarget = findNextTarget(currentPos, hitTargets);
      if (!nextTarget) break;
      
      const damage = chainDamage(i);
      
      targets.push(nextTarget.position);
      hitTargets.add(nextTarget.id);
      
      setTimeout(() => {
        onEnemyDamage(nextTarget.id, damage, false, nextTarget.position, true);
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage,
          position: nextTarget.position.clone().add(new Vector3(0, 1.5, 0)),
          isCritical: false,
          isChainLightning: true
        }]);
      }, i * 100);
      
      currentPos = nextTarget.position;
    }
    
    if (targets.length > 0) {
      setLightningTargets(targets);
      
      // Send chain lightning effect to other players in multiplayer
      if (isInRoom && isPlayer && sendEffect && parentRef.current) {
        sendEffect({
          type: 'chainLightning',
          position: parentRef.current.position.clone(),
          direction: new Vector3(0, 1, 0), // Upward direction for lightning
          duration: 500, // 500ms duration
          chainTargets: targets
        });
      }
      
      setTimeout(() => {
        setLightningTargets([]);
        setIsProcessing(false);
      }, 500);
    }
  }, [parentRef, enemies, onEnemyDamage, setDamageNumbers, nextDamageNumberId, isProcessing, sendEffect, isInRoom, isPlayer]);

  return {
    processChainLightning,
    lightningTargets,
    isProcessing
  };
}; 