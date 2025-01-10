import { Vector3 } from 'three';
import { Enemy } from '../../versus/enemy';

export interface SummonProps {
  position: Vector3;
  enemyData: Enemy[];
  onDamage: (targetId: string, damage: number, position?: Vector3) => void;
  duration?: number;
  onComplete: () => void;
  onSummonExpire?: () => void;
  onStartCooldown: () => void;
} 