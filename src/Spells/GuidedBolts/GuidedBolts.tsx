import React from 'react';
import { Vector3 } from 'three';
import GuidedBoltMissile from './GuidedBoltMissile';

interface GuidedBoltMissile {
  id: number;
  position: Vector3;  
  targetId: string;
  startTime: number;
  damage: number;
  hasCollided: boolean;
  direction: Vector3;
  initialDirection: Vector3;
  homingStartTime: number;
}

interface GuidedBoltsProps {
  missiles: GuidedBoltMissile[];
  enemyData: Array<{ id: string; position: Vector3; health: number }>;
}

export default function GuidedBolts({ missiles, enemyData }: GuidedBoltsProps) {
  return (
    <>
      {missiles.map(missile => {
        const target = enemyData.find(enemy => enemy.id === missile.targetId);
        
        return (
          <GuidedBoltMissile
            key={missile.id}
            position={missile.position}
            targetPosition={target?.position || new Vector3()}
            direction={missile.direction}
          />
        );
      })}
    </>
  );
} 