// src/versus/enemy.ts

import { Vector3 } from 'three';
import { RefObject } from 'react';
import { Group } from 'three';

export type EnemyType = 'regular' | 'mage' | 'abomination';

export interface Enemy {
  id: string;
  position: Vector3;
  rotation: number;
  initialPosition: Vector3;
  health: number;
  maxHealth: number;
  ref?: RefObject<Group>;
  isDying?: boolean;
  deathStartTime?: number;
  type?: EnemyType;
  currentPosition?: Vector3;
}