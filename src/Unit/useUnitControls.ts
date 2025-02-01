// src/unit/useUnitControls.ts
import { useRef, useEffect } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { Camera } from 'three';
import { OrbitControls } from 'three-stdlib';

interface UseUnitControlsProps {
  groupRef: React.RefObject<Group>;
  controlsRef: React.RefObject<OrbitControls>;
  camera: Camera;
  speed?: number;
  onPositionUpdate: (position: Vector3) => void;
  health: number;
  isCharging?: boolean;
  onMovementUpdate?: (direction: Vector3) => void;
}

const PLAY_AREA_RADIUS = 27.5 // MAP BOUNDARY

// Base movement speed - this is our reference point
const BASE_SPEED = 3.6; // MOVEMENT_SPEED

// Direction multipliers
const BACKWARD_SPEED_MULTIPLIER = 0.6; // 60% speed moving backward
const STRAFE_SPEED_MULTIPLIER = 0.8;   // 80% speed moving sideways
const CHARGING_MULTIPLIER = 0.05;      // 4% speed while charging bow

export function useUnitControls({
  groupRef,
  controlsRef,
  camera,
  speed = BASE_SPEED,
  onPositionUpdate,
  health,
  isCharging = false,
  onMovementUpdate
}: UseUnitControlsProps) {
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false
  });

  const isGameOver = useRef(false);
  const movementDirection = useRef(new Vector3());

  useEffect(() => {
    if (health <= 0) {
      isGameOver.current = true;
      keys.current = {
        w: false,
        a: false,
        s: false,
        d: false,
        shift: false
      };
    } else {
      isGameOver.current = false;
    }
  }, [health]);

  useEffect(() => {
    const handleGameOver = () => {
      isGameOver.current = true;
      keys.current = {
        w: false,
        a: false,
        s: false,
        d: false,
        shift: false
      };
    };

    const handleGameReset = () => {
      isGameOver.current = false;
    };

    window.addEventListener('gameOver', handleGameOver);
    window.addEventListener('gameReset', handleGameReset);

    return () => {
      window.removeEventListener('gameOver', handleGameOver);
      window.removeEventListener('gameReset', handleGameReset);
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current || isGameOver.current) return;
    
    const cameraDirection = new Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    const cameraRight = new Vector3(
      -cameraDirection.z,
      0,
      cameraDirection.x
    );

    const moveDirection = new Vector3(0, 0, 0);

    if (keys.current.w) moveDirection.add(cameraDirection);
    if (keys.current.s) moveDirection.sub(cameraDirection);
    if (keys.current.a) moveDirection.sub(cameraRight);
    if (keys.current.d) moveDirection.add(cameraRight);

    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      movementDirection.current.copy(moveDirection);
      
      if (onMovementUpdate) {
        onMovementUpdate(moveDirection);
      }

      // Calculate base movement speed for this frame
      let frameSpeed = speed * delta;

      // Apply directional multiplier
      const dotProduct = moveDirection.dot(cameraDirection);
      if (dotProduct < -0.1) {
        frameSpeed *= BACKWARD_SPEED_MULTIPLIER;
      } else if (Math.abs(dotProduct) <= 0.1) {
        frameSpeed *= STRAFE_SPEED_MULTIPLIER;
      }

      // Apply charging multiplier if charging
      if (isCharging) {
        frameSpeed *= CHARGING_MULTIPLIER;
      }

      // Calculate new position
      const movement = moveDirection.multiplyScalar(frameSpeed);
      const potentialPosition = groupRef.current.position.clone().add(movement);
      
      // Apply movement if within bounds
      if (potentialPosition.length() < PLAY_AREA_RADIUS) {
        groupRef.current.position.copy(potentialPosition);
        onPositionUpdate(groupRef.current.position);
      }
    }

    // Handle rotation
    if (controlsRef.current && !keys.current.shift) {
      const targetRotation = Math.atan2(cameraDirection.x, cameraDirection.z);
      const currentRotation = groupRef.current.rotation.y;
      
      // Simple rotation interpolation
      let rotationDiff = targetRotation - currentRotation;
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      groupRef.current.rotation.y += rotationDiff * Math.min(1, 15 * delta);
    }

    if (controlsRef.current) {
      const unitPosition = groupRef.current.position;
      controlsRef.current.target.set(unitPosition.x, unitPosition.y, unitPosition.z);
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver.current) return;
      const key = e.key.toLowerCase();
      if (key === 'shift') {
        keys.current.shift = true;
      } else if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'shift') {
        keys.current.shift = false;
      } else if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return {
    keys
  };
} 