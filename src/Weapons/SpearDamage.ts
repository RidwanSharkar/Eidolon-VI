import { Vector3 } from 'three';
import * as THREE from 'three';
import { DamageNumber } from '@/Unit/useDamageNumbers';

// Constants for spear combat
const SPEAR_BASE_DAMAGE = 25;
const SPEAR_RANGE = 6.0;
const SPEAR_HIT_DETECTION_DEBOUNCE = 200; // ms
const THRUST_ANGLE_THRESHOLD = Math.PI / 8; // 22.5 degrees - tight angle for precision

interface SpearHitContext {
  targetId: string;
  position: Vector3;
  health: number;
  isEnemy: boolean;
}

interface SpearHitHandlerParams {
  groupRef: React.RefObject<THREE.Group>;
  isSwinging: boolean;
  hitCountThisSwing: Record<string, number>;
  setHitCountThisSwing: (callback: (prev: Record<string, number>) => Record<string, number>) => void;
  onHit: (targetId: string, damage: number) => void;
  setDamageNumbers: (callback: (prev: DamageNumber[]) => DamageNumber[]) => void;
  nextDamageNumberId: { current: number };
  lastHitDetectionTime: { current: Record<string, number> };
}

// Spear-specific damage calculation
function calculateDamage(baseDamage: number) {
  const critChance = 0.15; // 15% chance to crit
  const critMultiplier = 1.5; // 50% bonus damage on crit
  const isCritical = Math.random() < critChance;
  const damage = Math.round(baseDamage * (isCritical ? critMultiplier : 1));

  return { damage, isCritical };
}

export function handleSpearHit(
  { targetId, position, health, isEnemy }: SpearHitContext,
  {
    groupRef,
    isSwinging,
    hitCountThisSwing,
    setHitCountThisSwing,
    onHit,
    setDamageNumbers,
    nextDamageNumberId,
    lastHitDetectionTime
  }: SpearHitHandlerParams
): boolean {
  if (!groupRef.current || !isSwinging) return false;

  const now = Date.now();
  const lastHitTime = lastHitDetectionTime.current[targetId] || 0;
  
  // Debounce hit detection with a shorter window for spear
  if (now - lastHitTime < SPEAR_HIT_DETECTION_DEBOUNCE) return false;
  
  lastHitDetectionTime.current[targetId] = now;
  
  // Check if we've already hit this target in this swing
  const currentHits = hitCountThisSwing[targetId] || 0;
  if (currentHits >= 1) return false;
  
  // Update hit count for this target
  setHitCountThisSwing(prev => ({
    ...prev,
    [targetId]: currentHits + 1
  }));

  if (!isEnemy) return false;

  const distance = groupRef.current.position.distanceTo(position);
  if (distance > SPEAR_RANGE) return false;

  // Check if target is in thrust line
  const toTarget = new Vector3()
    .subVectors(position, groupRef.current.position)
    .normalize();
  const forward = new Vector3(0, 0, 1)
    .applyQuaternion(groupRef.current.quaternion);
  
  const angle = toTarget.angleTo(forward);
  
  // Strict angle check for spear thrust
  if (Math.abs(angle) > THRUST_ANGLE_THRESHOLD) {
    return false;
  }

  // Calculate and apply damage
  const { damage, isCritical } = calculateDamage(SPEAR_BASE_DAMAGE);
  onHit(targetId, damage);

  // Only show damage numbers if target survives
  const targetAfterDamage = health - damage;
  if (targetAfterDamage > 0) {
    setDamageNumbers(prev => [...prev, {
      id: nextDamageNumberId.current++,
      damage,
      position: position.clone(),
      isCritical
    }]);
  }

  return true;
}

// Export constants for use in other files
export const SPEAR_COMBAT_CONSTANTS = {
  BASE_DAMAGE: SPEAR_BASE_DAMAGE,
  RANGE: SPEAR_RANGE,
  HIT_DEBOUNCE: SPEAR_HIT_DETECTION_DEBOUNCE,
  ANGLE_THRESHOLD: THRUST_ANGLE_THRESHOLD
}; 