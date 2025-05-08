import { useRef } from 'react';
import { Vector3, Group } from 'three';
import { useFrame } from '@react-three/fiber';

interface VaultProps {
  parentRef: React.RefObject<Group>;
  isActive: boolean;
  onComplete: () => void;
}

const VAULT_DISTANCE = 4; // Distance in units to vault backwards
const VAULT_DURATION = 0.25; // Duration in seconds

export default function Vault({ parentRef, isActive, onComplete }: VaultProps) {
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
    
    // Get backward direction based on current rotation
    const backwardDirection = new Vector3(0, 0, -1)
      .applyQuaternion(parentRef.current.quaternion)
      .normalize();

    // Calculate new position
    const newPosition = startPosition.current!.clone().add(
      backwardDirection.multiplyScalar(VAULT_DISTANCE * easeOutQuad)
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