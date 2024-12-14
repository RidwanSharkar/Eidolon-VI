import { Vector3 } from 'three';

export interface Enemy {
  id: string;
  position: Vector3;
  initialPosition: Vector3;
  health: number;
  maxHealth: number;
}