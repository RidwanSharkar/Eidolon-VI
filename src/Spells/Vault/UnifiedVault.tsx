import { useRef, useCallback } from 'react';
import { Vector3, Group } from 'three';
import { useFrame } from '@react-three/fiber';

export type VaultDirection = 'south' | 'north' | 'east' | 'west';

interface UnifiedVaultProps {
  parentRef: React.RefObject<Group>;
  isActive: boolean;
  direction: VaultDirection;
  onComplete: () => void;
}

const VAULT_DISTANCE = 3.125; // Distance in units to vault
const VAULT_DURATION = 0.35; // Duration in seconds
const MAX_VAULT_BOUNDS = 25; // Maximum distance from origin

// Direction vectors for each vault direction
const DIRECTION_VECTORS: Record<VaultDirection, Vector3> = {
  south: new Vector3(0, 0, -1), // Backwards
  north: new Vector3(0, 0, 1),  // Forward
  east: new Vector3(-1, 0, 0),  // Right (note: -1 because of coordinate system)
  west: new Vector3(1, 0, 0),   // Left
};

export default function UnifiedVault({ 
  parentRef, 
  isActive, 
  direction, 
  onComplete 
}: UnifiedVaultProps) {
  const startPosition = useRef<Vector3 | null>(null);
  const startTime = useRef<number | null>(null);
  const vaultDirection = useRef<Vector3 | null>(null);

  // Memoize direction calculation to prevent recalculation
  const calculateDirection = useCallback(() => {
    if (!parentRef.current) return null;
    
    // Get the base direction vector for this vault direction
    const baseDirection = DIRECTION_VECTORS[direction].clone();
    
    // Apply the current rotation of the parent to get world-space direction
    const worldDirection = baseDirection.applyQuaternion(parentRef.current.quaternion).normalize();
    
    return worldDirection;
  }, [direction, parentRef]);

  useFrame(() => {
    if (!isActive || !parentRef.current) return;

    // Initialize vault on first active frame
    if (!startTime.current) {
      startTime.current = Date.now();
      startPosition.current = parentRef.current.position.clone();
      vaultDirection.current = calculateDirection();
      
      // Safety check: ensure we have a valid direction
      if (!vaultDirection.current) {
        onComplete();
        startTime.current = null;
        startPosition.current = null;
        return;
      }
      return;
    }

    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / VAULT_DURATION, 1);

    // Calculate movement using easing function (ease-out quad)
    const easeOutQuad = 1 - Math.pow(1 - progress, 2);
    
    // Safety checks: Ensure we have valid references
    if (!startPosition.current || !vaultDirection.current || !parentRef.current) {
      onComplete();
      startTime.current = null;
      startPosition.current = null;
      vaultDirection.current = null;
      return;
    }

    // Calculate new position
    const displacement = vaultDirection.current.clone().multiplyScalar(VAULT_DISTANCE * easeOutQuad);
    const newPosition = startPosition.current.clone().add(displacement);

    // Bounds checking: Ensure position is within reasonable limits
    const distanceFromOrigin = newPosition.length();
    if (distanceFromOrigin > MAX_VAULT_BOUNDS) {
      // Cancel vault if it would move too far from origin
      console.warn(`Vault cancelled: would move too far from origin (${distanceFromOrigin.toFixed(2)} > ${MAX_VAULT_BOUNDS})`);
      onComplete();
      startTime.current = null;
      startPosition.current = null;
      vaultDirection.current = null;
      return;
    }

    // Update position
    parentRef.current.position.copy(newPosition);

    // Complete vault when finished
    if (progress === 1) {
      onComplete();
      startTime.current = null;
      startPosition.current = null;
      vaultDirection.current = null;
    }
  });

  return null;
}