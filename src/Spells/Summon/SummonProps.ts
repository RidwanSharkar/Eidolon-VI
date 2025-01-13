import { Vector3, Group } from 'three';
import { Enemy } from '../../Versus/enemy';

export interface SummonProps {
  id: string;
  position: Vector3;
  groupRef?: React.RefObject<Group>;
  enemyData: Enemy[];
  onDamage: (targetId: string, damage: number, position?: Vector3, isSummon?: boolean) => void;
  onComplete: () => void;
  onStartCooldown: () => void;
  setDamageNumbers: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isSummon?: boolean;
  }>>>;
  nextDamageNumberId: React.MutableRefObject<number>;
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