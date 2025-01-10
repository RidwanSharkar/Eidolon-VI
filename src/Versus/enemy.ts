// src/versus/enemy.ts

import { Vector3 } from 'three';
import { RefObject } from 'react';
import { Group } from 'three';

export interface Enemy {
  id: string;
  position: Vector3;
  initialPosition: Vector3;
  health: number;
  maxHealth: number;
  ref?: RefObject<Group>;
  isDying?: boolean;
  deathStartTime?: number;
  type?: 'regular' | 'mage';
  currentPosition?: Vector3;
}