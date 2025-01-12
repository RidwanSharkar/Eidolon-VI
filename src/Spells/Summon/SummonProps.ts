import { Vector3 } from 'three';
import { Enemy } from '../../Versus/enemy';

export interface SummonProps {
  position: Vector3;
  enemyData: Enemy[];
  onDamage: (targetId: string, damage: number, position?: Vector3) => void;
  onComplete: () => void;
  onStartCooldown: () => void;
  setActiveEffects: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
  }>>>;
  activeEffects: Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
  }>;
} 