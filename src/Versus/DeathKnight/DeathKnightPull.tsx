// src/Versus/DeathKnight/DeathKnightPull.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';

interface DeathKnightPullProps {
  playerRef: React.RefObject<Group>;
  deathKnightPosition: Vector3;
  isActive: boolean;
  onComplete: () => void;
}

const PULL_DISTANCE = 10.0; // How far to pull the player WAS 4.0
const PULL_DURATION = 0.6; // Faster duration for more responsive feel WAS 0.4
const MAX_PULL_BOUNDS = 25; // Maximum distance from origin

export default function DeathKnightPull({ 
  playerRef, 
  deathKnightPosition, 
  isActive, 
  onComplete 
}: DeathKnightPullProps) {
  const startPosition = useRef<Vector3 | null>(null);
  const startTime = useRef<number | null>(null);
  const targetPosition = useRef<Vector3 | null>(null);

  useFrame(() => {
    if (!isActive || !playerRef.current) return;

    // Find the actual Unit group inside the playerRef wrapper
    const unitGroup = playerRef.current.children.find(child => child.type === 'Group') as Group;
    if (!unitGroup) {
      onComplete();
      return;
    }

    // Initialize pull on first active frame
    if (!startTime.current) {
      startTime.current = Date.now();
      startPosition.current = unitGroup.position.clone();
      
      // Safety check to ensure startPosition is set
      if (!startPosition.current) {
        onComplete();
        return;
      }
      
      // Calculate target position - pull player towards Death Knight (only X and Z, preserve Y)
      const startGroundPos = startPosition.current.clone();
      startGroundPos.y = 0; // Use ground level for calculations
      const knightGroundPos = deathKnightPosition.clone();
      knightGroundPos.y = 0; // Use ground level for calculations
      
      const directionToKnight = knightGroundPos.clone()
        .sub(startGroundPos)
        .normalize();
      
      targetPosition.current = startGroundPos.clone()
        .add(directionToKnight.multiplyScalar(PULL_DISTANCE));
      
      // Ensure target position doesn't go beyond Death Knight position
      const distanceToKnight = startGroundPos.distanceTo(knightGroundPos);
      if (PULL_DISTANCE >= distanceToKnight * 0.8) {
        // If pull would bring player too close to Death Knight, reduce pull distance
        const safePullDistance = distanceToKnight * 0.6;
        const pullDirection = knightGroundPos.clone()
          .sub(startGroundPos)
          .normalize();
        targetPosition.current = startGroundPos.clone()
          .add(pullDirection.multiplyScalar(safePullDistance));
      }
      
      // Ensure target position stays at ground level
      targetPosition.current.y = 0;
      
      return;
    }

    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / PULL_DURATION, 1);

    // Use ease-out quad for smoother pull effect (like Vault)
    const easeOutQuad = 1 - Math.pow(1 - progress, 2);
    
    // Safety checks
    if (!startPosition.current || !targetPosition.current || !unitGroup) {
      onComplete();
      startTime.current = null;
      startPosition.current = null;
      targetPosition.current = null;
      return;
    }

    // Calculate displacement like Vault does (only for X and Z)
    const startGroundPos = startPosition.current.clone();
    startGroundPos.y = 0;
    
    const displacement = targetPosition.current.clone()
      .sub(startGroundPos)
      .multiplyScalar(easeOutQuad);
    
    const newPosition = startGroundPos.clone().add(displacement);
    // Ensure Y stays at ground level
    newPosition.y = 0;

    // Bounds checking (only check X and Z distance)
    const distanceFromOrigin = Math.sqrt(newPosition.x * newPosition.x + newPosition.z * newPosition.z);
    if (distanceFromOrigin > MAX_PULL_BOUNDS) {
      // Cancel pull if it would move too far from origin
      onComplete();
      startTime.current = null;
      startPosition.current = null;
      targetPosition.current = null;
      return;
    }

    // Update Unit position directly (like Vault does) - preserve original Y
    const originalY = unitGroup.position.y;
    unitGroup.position.copy(newPosition);
    unitGroup.position.y = originalY; // Keep the player at their current height

    // Complete pull when finished
    if (progress === 1) {
      onComplete();
      startTime.current = null;
      startPosition.current = null;
      targetPosition.current = null;
    }
  });

  return null;
}