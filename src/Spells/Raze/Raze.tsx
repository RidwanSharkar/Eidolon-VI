// src/Spells/Raze/Raze.tsx
import { useEffect, useCallback } from 'react';
import RazeStrip from '@/Spells/Raze/RazeStrip';
import { useRaze } from '@/Spells/Raze/useRaze';
import { Vector3 } from 'three';

interface RazeProps {
  enemyData: Array<{ id: string; position: Vector3; health: number; isDying?: boolean }>;
  onHit: (targetId: string, damage: number, isCritical?: boolean, position?: Vector3) => void;
  level: number;
  razeManagerRef?: React.MutableRefObject<{
    createRazeStrip: (startPosition: Vector3, direction: Vector3, maxDistance?: number) => number;
    cleanupAll: () => void;
  } | null>;
}

export default function Raze({ 
  enemyData, 
  onHit, 
  level,
  razeManagerRef 
}: RazeProps) {
  // Use a callback that always returns fresh enemy data
  const getEnemyData = useCallback(() => {
    return enemyData;
  }, [enemyData]);

  const {
    activeRazeStrips,
    createRazeStrip,
    updateRazeStripProgress,
    cleanupAll
  } = useRaze({ onHit, getEnemyData, level });

  // Expose methods through ref
  useEffect(() => {
    if (razeManagerRef) {
      razeManagerRef.current = {
        createRazeStrip,
        cleanupAll
      };
    }
  }, [createRazeStrip, cleanupAll, razeManagerRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);

  return (
    <>
      {activeRazeStrips.map((strip) => (
        <RazeStrip
          key={strip.id}
          startPosition={strip.startPosition}
          direction={strip.direction}
          maxDistance={strip.maxDistance}
          width={strip.width}
          currentDistance={strip.currentDistance}
          onProgressUpdate={(distance) => updateRazeStripProgress(strip.id, distance)}
          isComplete={strip.isComplete}
        />
      ))}
    </>
  );
}