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

const PLAY_AREA_RADIUS = 29.75; // Match this with where mountains start

export function useUnitControls({
  groupRef,
  controlsRef,
  camera,
  speed = 0.06575,
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

  useFrame(() => {
    if (!groupRef.current || isGameOver.current) return;

    const cameraDirection = new Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    if (controlsRef.current && !keys.current.shift) {
      const targetRotation = Math.atan2(cameraDirection.x, cameraDirection.z);
      groupRef.current.rotation.y = targetRotation;
    }

    const currentRotation = groupRef.current.rotation.y;
    const targetRotation = Math.atan2(cameraDirection.x, cameraDirection.z);
    const rotationSpeed = 0.075; // 0.1 defaulted 
    
    groupRef.current.rotation.y = currentRotation + (targetRotation - currentRotation) * rotationSpeed;

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

    if (controlsRef.current) {
      const targetRotation = Math.atan2(cameraDirection.x, cameraDirection.z);
      groupRef.current.rotation.y = targetRotation;
    }

    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      
      // Update movement direction
      if (onMovementUpdate) {
        onMovementUpdate(moveDirection);
      }

      // Calculate dot product between movement and facing direction
      const dotProduct = moveDirection.dot(cameraDirection);
      
      // Adjust speed based on movement direction and charging state
      const baseSpeed = isCharging ? 0.001 : speed; // BOW CHARGING NO MOVEMENT SPEED
      const backwardsSpeed = baseSpeed * 0.675; // 45% of normal speed when moving backwards
      const currentSpeed = dotProduct < 0 ? backwardsSpeed : baseSpeed;
      
      // Calculate new position before applying it
      const newPosition = groupRef.current.position.clone().add(
        moveDirection.multiplyScalar(currentSpeed)
      );

      // Check if new position is within bounds
      const distanceFromCenter = Math.sqrt(
        newPosition.x * newPosition.x + 
        newPosition.z * newPosition.z
      );

      // Only update position if within bounds
      if (distanceFromCenter < PLAY_AREA_RADIUS) {
        groupRef.current.position.copy(newPosition);
      } else {
        // Optional: Slide along the boundary
        const angle = Math.atan2(newPosition.z, newPosition.x);
        groupRef.current.position.x = PLAY_AREA_RADIUS * Math.cos(angle);
        groupRef.current.position.z = PLAY_AREA_RADIUS * Math.sin(angle);
      }
    } else if (onMovementUpdate) {
      // Reset movement direction when not moving
      onMovementUpdate(new Vector3());
    }

    if (controlsRef.current) {
      const unitPosition = groupRef.current.position;
      controlsRef.current.target.set(unitPosition.x, unitPosition.y, unitPosition.z);
    }

    onPositionUpdate(groupRef.current.position.clone());
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