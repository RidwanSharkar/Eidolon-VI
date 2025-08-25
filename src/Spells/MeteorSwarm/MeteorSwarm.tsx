import React, { useState, useEffect } from 'react';
import { Vector3 } from 'three';
import Meteor from '@/Versus/Boss/Meteor';
import { Enemy } from '@/Versus/enemy';

interface MeteorTarget {
  position: Vector3;
  targetId: string;
  delay: number;
}

interface MeteorSwarmProps {
  targets: MeteorTarget[];
  startTime: number;
  onComplete: () => void;
  playerPosition: Vector3;
  onImpact: (damage: number) => void;
  enemyData: Enemy[];
  onHit?: (targetId: string, damage: number, isCritical: boolean, position: Vector3) => void;
}

interface ActiveMeteor {
  id: string;
  target: MeteorTarget;
  startTime: number;
}

export default function MeteorSwarm({ 
  targets, 
  startTime, 
  onComplete, 
  playerPosition, 
  onImpact,
  enemyData,
  onHit
}: MeteorSwarmProps) {
  const [activeMeteors, setActiveMeteors] = useState<ActiveMeteor[]>([]);

  useEffect(() => {
    // Schedule meteors to start based on their delays
    targets.forEach((target) => {
      const meteorStartTime = startTime + target.delay;
      const timeUntilStart = meteorStartTime - Date.now();

      if (timeUntilStart <= 0) {
        // Start immediately if delay has already passed
        setActiveMeteors(prev => [...prev, {
          id: `${target.targetId}-${target.delay}`,
          target,
          startTime: Date.now()
        }]);
      } else {
        // Schedule the meteor to start after the delay
        setTimeout(() => {
          setActiveMeteors(prev => [...prev, {
            id: `${target.targetId}-${target.delay}`,
            target,
            startTime: Date.now()
          }]);
        }, timeUntilStart);
      }
    });
  }, [targets, startTime]);

  const handleMeteorComplete = (meteorId: string) => {
    setActiveMeteors(prev => {
      const updated = prev.filter(meteor => meteor.id !== meteorId);
      
      // If this was the last meteor, notify parent that the swarm is complete
      if (updated.length === 0 && prev.length > 0) {
        onComplete();
      }
      
      return updated;
    });
  };

  const handleMeteorImpact = (damage: number) => {
    onImpact(damage);
  };

  return (
    <>
      {activeMeteors.map((meteor) => (
        <Meteor
          key={meteor.id}
          targetId={meteor.target.targetId}
          initialTargetPosition={meteor.target.position}
          onImpact={handleMeteorImpact}
          onComplete={() => handleMeteorComplete(meteor.id)}
          playerPosition={playerPosition}
          enemyData={enemyData}
          onHit={onHit}
        />
      ))}
    </>
  );
} 