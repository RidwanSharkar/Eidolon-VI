import { useRef } from 'react';
import { Vector3, Group } from 'three';
import { useFrame } from '@react-three/fiber';

interface VaultWestProps {
  parentRef: React.RefObject<Group>;
  isActive: boolean;
  onComplete: () => void;
}

const VAULT_DISTANCE = 3.5; // Distance in units to vault to the left
const VAULT_DURATION = 0.25; // Duration in seconds

export default function VaultWest({ parentRef, isActive, onComplete }: VaultWestProps) {
  const startPosition = useRef<Vector3 | null>(null);
  const startTime = useRef<number | null>(null);

  useFrame(() => {
    if (!isActive || !parentRef.current) return;

    // Initialize vault on first active frame
    if (!startTime.current) {
      startTime.current = Date.now();
      startPosition.current = parentRef.current.position.clone();
      return;
    }

    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / VAULT_DURATION, 1);

    // Calculate movement using easing function
    const easeOutQuad = 1 - Math.pow(1 - progress, 2);
    
    // Get left direction based on current rotation
    const leftDirection = new Vector3(1, 0, 0)
      .applyQuaternion(parentRef.current.quaternion)
      .normalize();

    // Calculate new position
    const newPosition = startPosition.current!.clone().add(
      leftDirection.multiplyScalar(VAULT_DISTANCE * easeOutQuad)
    );

    // Update position
    parentRef.current.position.copy(newPosition);

    // Complete vault when finished
    if (progress === 1) {
      onComplete();
      startTime.current = null;
      startPosition.current = null;
    }
  });

  return null;
} 