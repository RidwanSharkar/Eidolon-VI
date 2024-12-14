import { Vector3 } from 'three';

export interface FireballType {
  id: number;
  position: Vector3;
  direction: Vector3;
  startPosition: Vector3;
  maxDistance: number;
  hitTargets: Set<string>;
}

export interface FireballProps {
  position: Vector3;
  direction: Vector3;
  onImpact: () => void;
} 