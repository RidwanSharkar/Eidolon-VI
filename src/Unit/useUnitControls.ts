// src/unit/useUnitControls.ts
import { useRef, useEffect } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { Camera } from 'three';
import { OrbitControls } from 'three-stdlib';
import { stealthManager } from '@/Spells/Stealth/StealthManager';
import { WeaponType } from '@/Weapons/weapons';

interface UseUnitControlsProps {
  groupRef: React.RefObject<Group>;
  controlsRef: React.RefObject<OrbitControls>;
  camera: Camera;
  speed?: number;
  onPositionUpdate: (position: Vector3, isStealthed?: boolean) => void;
  health: number;
  isCharging?: boolean;
  onMovementUpdate?: (direction: Vector3) => void;
  currentWeapon: WeaponType;
  abilities: Record<WeaponType, { active?: { isUnlocked: boolean } }>;
}

const PLAY_AREA_RADIUS = 29 // MAP BOUNDARY

// Base movement speed - this is our reference point
const BASE_SPEED = 3.625; // MOVEMENT_SPEED

// Direction multipliers
const BACKWARD_SPEED_MULTIPLIER = 0.60; // 60% speed moving backward
const STRAFE_SPEED_MULTIPLIER = 0.80;   // 80% speed moving sideways
const BASE_ABILITY_CHARGING_MULTIPLIER = 0.10; // Default charging speed
const STEALTH_SPEED_MULTIPLIER = 1.7; // 130% speed while stealthed

export function useUnitControls({
  groupRef,
  controlsRef,
  camera,
  speed = BASE_SPEED,
  onPositionUpdate,
  health,
  isCharging = false,
  onMovementUpdate,
  currentWeapon,
  abilities
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

  // Inside the function, calculate the actual multiplier based on parameters
  const ABILITY_CHARGING_MULTIPLIER = currentWeapon === WeaponType.BOW && 
    abilities?.[WeaponType.BOW]?.active?.isUnlocked ? 0.60 : BASE_ABILITY_CHARGING_MULTIPLIER;

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

      // Apply charging multiplier if charging any ability
      if (isCharging) {
        frameSpeed *= ABILITY_CHARGING_MULTIPLIER;
      }

      // Add stealth speed boost if stealthed
      const isStealthed = stealthManager.isUnitStealthed();
      if (isStealthed) {
        frameSpeed *= STEALTH_SPEED_MULTIPLIER;
      }

      // Calculate new position
      const movement = moveDirection.multiplyScalar(frameSpeed);
      const potentialPosition = groupRef.current.position.clone().add(movement);
      
      // Check if we would exceed the boundary
      const distanceFromCenter = potentialPosition.length();
      if (distanceFromCenter < PLAY_AREA_RADIUS) {
        // If within bounds, move normally
        groupRef.current.position.copy(potentialPosition);
      } else {
        // If we hit the boundary, calculate the tangent movement
        // Project the movement vector onto the circular boundary
        const currentPos = groupRef.current.position.clone();
        const toCenter = currentPos.clone().normalize();
        const tangent = new Vector3(-toCenter.z, 0, toCenter.x);
        
        // Project our movement onto the tangent
        const tangentMovement = tangent.multiplyScalar(movement.dot(tangent));
        
        // Apply the tangential movement while keeping distance to center constant
        const newPosition = currentPos.add(tangentMovement);
        newPosition.normalize().multiplyScalar(PLAY_AREA_RADIUS);
        groupRef.current.position.copy(newPosition);
      }
      
      onPositionUpdate(groupRef.current.position, isStealthed);
    }

    // Updated rotation logic
    if (controlsRef.current) {
      if (!keys.current.shift && !controlsRef.current.mouseButtons.LEFT) {
        // Only rotate the unit when not holding shift and not using left mouse
        const targetRotation = Math.atan2(cameraDirection.x, cameraDirection.z);
        const currentRotation = groupRef.current.rotation.y;
        
        // Simple rotation interpolation
        let rotationDiff = targetRotation - currentRotation;
        while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
        
        groupRef.current.rotation.y += rotationDiff * Math.min(1, 15 * delta);
      }

      // Update orbit controls target to follow unit
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