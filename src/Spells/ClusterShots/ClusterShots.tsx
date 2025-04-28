import { Vector3, Quaternion } from 'three';
import { useRef, useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useClusterShotsManager } from './useClusterShotsManager';
import { ClusterShard } from './ClusterShard';

interface ClusterShotsProps {
  parentRef: React.RefObject<THREE.Group>;
  onHit: (targetId: string, damage: number) => void;
  enemyData: Array<{
    id: string;
    position: Vector3;
    health: number;
    isDying?: boolean;
  }>;
  setDamageNumbers: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isLightning?: boolean;
    isHealing?: boolean;
    isBlizzard?: boolean;
    isBoneclaw?: boolean;
    isOathstrike?: boolean;
    isFirebeam?: boolean;
    isOrbShield?: boolean;
    isChainLightning?: boolean;
    isFireball?: boolean;
    isSummon?: boolean;
    isStealthStrike?: boolean;
    isPyroclast?: boolean;
    isEagleEye?: boolean;
    isClusterShot?: boolean;
  }>>>;
  nextDamageNumberId: React.MutableRefObject<number>;
  charges: Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>;
  setCharges: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>>>;
  setDebuffedEnemies: React.Dispatch<React.SetStateAction<Array<{
    id: string;
    timestamp: number;
    duration: number;
  }>>>;
  setActiveEffects: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
  }>>>;
}

interface ArrowData {
  id: number;
  position: Vector3;
  direction: Vector3;
  startPosition: Vector3;
  rotation: Quaternion;
  maxDistance: number;
  active: boolean;
  startTime: number;
  hasCollided: boolean;
}

export const useClusterShots = ({
  parentRef,
  onHit,
  enemyData,
  setDamageNumbers,
  nextDamageNumberId,
  charges,
  setCharges,
  setDebuffedEnemies,
  setActiveEffects
}: ClusterShotsProps) => {
  const [activeArrows, setActiveArrows] = useState<ArrowData[]>([]);
  const activeArrowsRef = useRef<ArrowData[]>([]);
  const arrowPool = useRef<ArrowData[]>([]);
  const POOL_SIZE = 15;
  const DAMAGE_PER_ARROW = 50;
  const CONE_ANGLE = Math.PI / 6; // 30 degrees
  const CONE_RANGE = 15; // Units
  const ARROWS_PER_BLAST = 12;
  const DEBUFF_DURATION = 5000; // 5 seconds in milliseconds

  const { consumeCharges } = useClusterShotsManager({
    charges,
    setCharges
  });

  // Initialize arrow pool
  useEffect(() => {
    arrowPool.current = Array(POOL_SIZE).fill(null).map((_, index) => ({
      id: index,
      position: new Vector3(),
      direction: new Vector3(),
      startPosition: new Vector3(),
      rotation: new Quaternion(),
      maxDistance: CONE_RANGE,
      active: false,
      startTime: 0,
      hasCollided: false
    }));
  }, []);

  const getInactiveArrow = () => {
    return arrowPool.current.find(a => !a.active);
  };

  const fireClusterShots = useCallback(() => {
    if (!parentRef.current) return false;
    
    // Consume 2 orb charges
    if (!consumeCharges(2)) return false;
    
    const tempVec3 = new Vector3();
    const tempQuat = new Quaternion();
    
    // Get the parent position and direction
    tempVec3.copy(parentRef.current.position);
    tempVec3.y += 1; // Adjust to shoot from higher position
    
    const forward = new Vector3(0, 0, 1);
    forward.applyQuaternion(parentRef.current.quaternion);
    
    // Create arrows in a cone pattern
    for (let i = 0; i < ARROWS_PER_BLAST; i++) {
      const arrow = getInactiveArrow();
      if (!arrow) continue;
      
      // Calculate angle within the cone
      const angleOffset = (Math.random() * 2 - 1) * CONE_ANGLE;
      const verticalOffset = (Math.random() * 2 - 1) * CONE_ANGLE * 0.5;
      
      // Apply rotation to the direction
      const direction = forward.clone();
      
      // Apply horizontal spread
      tempQuat.setFromAxisAngle(new Vector3(0, 1, 0), angleOffset);
      direction.applyQuaternion(tempQuat);
      
      // Apply vertical spread
      tempQuat.setFromAxisAngle(new Vector3(1, 0, 0), verticalOffset);
      direction.applyQuaternion(tempQuat);
      
      // Configure the arrow
      arrow.position.copy(tempVec3);
      arrow.startPosition.copy(tempVec3);
      arrow.direction.copy(direction);
      arrow.rotation.setFromUnitVectors(new Vector3(0, 0, 1), direction);
      arrow.startTime = Date.now();
      arrow.hasCollided = false;
      arrow.active = true;
      
      // Add to active arrows
      activeArrowsRef.current.push(arrow);
    }
    
    setActiveArrows([...activeArrowsRef.current]);
    return true;
  }, [parentRef, consumeCharges, CONE_ANGLE, ARROWS_PER_BLAST]);

  const updateArrows = useCallback(() => {
    const now = Date.now();
    const speed = 0.5;
    const hitEnemies = new Set<string>();
    
    activeArrowsRef.current = activeArrowsRef.current.filter(arrow => {
      if (!arrow.active) return false;
      
      // Move the arrow
      const elapsed = (now - arrow.startTime) / 1000;
      arrow.position.copy(arrow.startPosition).addScaledVector(arrow.direction, elapsed * speed * 60);
      
      // Check if arrow has traveled its max distance
      const distanceTraveled = arrow.position.distanceTo(arrow.startPosition);
      if (distanceTraveled >= arrow.maxDistance) {
        arrow.active = false;
        return false;
      }
      
      // Check for collisions with enemies
      for (const enemy of enemyData) {
        if (enemy.isDying || enemy.health <= 0 || hitEnemies.has(enemy.id)) continue;
        
        const distance = arrow.position.distanceTo(enemy.position);
        if (distance < 1.5) { // Hit radius
          // Apply damage
          onHit(enemy.id, DAMAGE_PER_ARROW);
          
          // Create damage number
          setDamageNumbers(prev => [
            ...prev,
            {
              id: nextDamageNumberId.current++,
              damage: DAMAGE_PER_ARROW,
              position: enemy.position.clone().add(new Vector3(0, 2, 0)),
              isCritical: false,
              isClusterShot: true
            }
          ]);
          
          // Create impact effect
          setActiveEffects(prev => [...prev, {
            id: Date.now(),
            type: 'clusterImpact',
            position: enemy.position.clone(),
            direction: arrow.direction,
            duration: 0.3,
            startTime: Date.now()
          }]);
          
          // Apply debuff to enemy
          setDebuffedEnemies(prev => [
            ...prev.filter(de => de.id !== enemy.id), // Remove existing debuff if any
            {
              id: enemy.id,
              timestamp: Date.now(),
              duration: DEBUFF_DURATION
            }
          ]);
          
          hitEnemies.add(enemy.id);
          arrow.active = false;
          arrow.hasCollided = true;
          return false;
        }
      }
      
      return true;
    });
    
    setActiveArrows([...activeArrowsRef.current]);
  }, [enemyData, onHit, setDamageNumbers, nextDamageNumberId, setDebuffedEnemies, setActiveEffects]);

  useEffect(() => {
    const interval = setInterval(updateArrows, 16); // ~60fps
    return () => clearInterval(interval);
  }, [updateArrows]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDebuffedEnemies(prev => prev.filter(debuff => {
        return (now - debuff.timestamp) < DEBUFF_DURATION;
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [setDebuffedEnemies]);

  return {
    activeArrows,
    fireClusterShots
  };
};

// The visual component for the cluster shots effect
export function ClusterShots({ activeArrows }: { activeArrows: ArrowData[] }) {
  return (
    <>
      {activeArrows.map(arrow => (
        <ClusterShard
          key={arrow.id}
          position={arrow.position}
          direction={arrow.direction}
        />
      ))}
    </>
  );
} 