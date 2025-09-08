import { useRef, useState, useEffect } from 'react';
import { Vector3, Group } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ReigniteRef } from '../Reignite/Reignite';
import { calculateDamage } from '@/Weapons/damage';

// Import the constant from useUnitControls or define it here
const PLAY_AREA_RADIUS = 28.5; // MAP BOUNDARY (same as in useUnitControls)

interface BreachProps {
  parentRef: React.RefObject<Group>;
  isActive: boolean;
  onComplete: () => void;
  enemyData?: Array<{
    id: string;
    position: Vector3;
    health: number;
  }>;
  onHit?: (targetId: string, damage: number) => void;
  showDamageNumber?: (targetId: string, damage: number, position: Vector3, isBreach: boolean, isCritical?: boolean) => void;
  onCriticalHit?: () => void;
  reigniteRef?: React.RefObject<ReigniteRef>;
}

const BREACH_DISTANCE = 7.5; // Distance in units to dash forward
const BREACH_DURATION = 0.35; // Duration in seconds
const BREACH_DAMAGE = 113; // Base damage for wbreach collision
const BREACH_COLLISION_RADIUS = 2.0; // collision radius
const MAX_BREACH_BOUNDS = 25; // Maximum distance from origin (same as Vault)

export default function Breach({ 
  parentRef, 
  isActive, 
  onComplete, 
  enemyData = [], 
  onHit, 
  showDamageNumber,
  onCriticalHit,
  reigniteRef
}: BreachProps) {
  const startPosition = useRef<Vector3 | null>(null);
  const startTime = useRef<number | null>(null);
  const direction = useRef<Vector3>(new Vector3());
  const lastPosition = useRef<Vector3 | null>(null);
  const hitEnemies = useRef<Set<string>>(new Set());
  const [fireTrail, setFireTrail] = useState<Array<{id: number, position: Vector3}>>([]);
  const nextFireParticleId = useRef(1);
  const enemyHealthTracker = useRef<Record<string, number>>({});

  // Log if reigniteRef is available when the component mounts - removed temp
  useEffect(() => {
  }, [reigniteRef]);

  useFrame(() => {
    if (!isActive || !parentRef.current) return;

    // Initialize breach on first active frame
    if (!startTime.current) {
      startTime.current = Date.now();
      startPosition.current = parentRef.current.position.clone();
      lastPosition.current = parentRef.current.position.clone();
      hitEnemies.current.clear();
      
      // Get forward direction
      direction.current = new Vector3(0, 0, 1)
        .applyQuaternion(parentRef.current.quaternion)
        .normalize();
      
      // Safety check: ensure we have a valid direction
      if (!direction.current || direction.current.length() === 0) {
        onComplete();
        startTime.current = null;
        startPosition.current = null;
        lastPosition.current = null;
        return;
      }
      
      // Initialize fire trail
      setFireTrail([]);

      // Initialize health tracker
      if (enemyData) {
        enemyData.forEach(enemy => {
          enemyHealthTracker.current[enemy.id] = enemy.health;
        });
      }
      
      return;
    }

    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / BREACH_DURATION, 1);

    // Calculate movement using easing function
    const easeOutQuad = 1 - Math.pow(1 - progress, 2);
    
    // Safety checks: Ensure we have valid references (like Vault does)
    if (!startPosition.current || !direction.current || !parentRef.current) {
      onComplete();
      startTime.current = null;
      startPosition.current = null;
      lastPosition.current = null;
      return;
    }
    
    // Get forward direction from stored value - clone it to avoid modifying the original
    const forwardDirection = direction.current.clone();

    // Calculate new position
    const displacement = forwardDirection.multiplyScalar(BREACH_DISTANCE * easeOutQuad);
    const newPosition = startPosition.current.clone().add(displacement);

    // Bounds checking: Ensure position is within reasonable limits (like Vault does)
    const distanceFromOrigin = newPosition.length();
    if (distanceFromOrigin > MAX_BREACH_BOUNDS) {
      // Cancel breach if it would move too far from origin
      onComplete();
      startTime.current = null;
      startPosition.current = null;
      lastPosition.current = null;
      return;
    }

    // Additional check for play area boundary
    let adjustedProgress = progress;
    if (distanceFromOrigin >= PLAY_AREA_RADIUS) {
      // If we'd breach the boundary, clamp the position to stay inside
      newPosition.normalize().multiplyScalar(PLAY_AREA_RADIUS * 0.95);
      
      // End the breach effect early
      if (adjustedProgress < 0.9) {
        adjustedProgress = 0.9;
      }
    }

    // Create fire particles between last position and current position
    if (lastPosition.current && adjustedProgress < 1) {
      const particlePositions: Array<{id: number, position: Vector3}> = [];
      
      // Only add particles occasionally
      if (Math.random() > 0.6) {
        // Create a particle along the path
        const particleProgress = Math.random();
        const particlePos = lastPosition.current.clone().lerp(newPosition, particleProgress);
        
        // Add some random offset
        particlePos.x += (Math.random() - 0.5) * 1.5;
        particlePos.y += Math.random() * 0.5;
        particlePos.z += (Math.random() - 0.5) * 1.5;
        
        particlePositions.push({
          id: nextFireParticleId.current++,
          position: particlePos
        });
      }
      
      if (particlePositions.length > 0) {
        setFireTrail(prev => [...prev, ...particlePositions]);
      }
    }

    // Check for collisions with enemies
    if (enemyData && enemyData.length > 0 && onHit) {
      // Check for collision with any enemy
      for (const enemy of enemyData) {
        // Skip already hit enemies
        if (hitEnemies.current.has(enemy.id)) continue;
        
        // Skip if enemy health is 0 or below
        if (enemy.health <= 0) continue;
        
        // Calculate distance between line segment (last position to current position) and enemy
        const distance = distanceToLineSegment(
          lastPosition.current!,
          newPosition,
          enemy.position
        );
        
        if (distance < BREACH_COLLISION_RADIUS) {
          // We hit this enemy
          hitEnemies.current.add(enemy.id);
          
          // IMPORTANT: Store previous health before damage is applied
          const previousHealth = enemy.health;
          
          // Calculate damage with critical chance
          const damageResult = calculateDamage(BREACH_DAMAGE);
          
          // Apply damage
          onHit(enemy.id, damageResult.damage);
          
          // Trigger critical hit callback if it's a critical
          if (damageResult.isCritical && onCriticalHit) {
            onCriticalHit();
          }
          
          // Show damage number if function is provided
          if (showDamageNumber) {
            showDamageNumber(
              enemy.id, 
              damageResult.damage, 
              enemy.position.clone(), 
              true,
              damageResult.isCritical
            );
          }
          
          // Check if enemy was killed by this hit
          if (previousHealth > 0 && previousHealth - damageResult.damage <= 0) {
            
            // Verify reigniteRef is available before calling
            if (reigniteRef && reigniteRef.current) {
              reigniteRef.current.processKill(enemy.position.clone());
            }
          }
        }
      }
    }

    // Update position
    parentRef.current.position.copy(newPosition);
    lastPosition.current = newPosition.clone();

    // Complete breach when finished
    if (adjustedProgress === 1) {
      onComplete();
      startTime.current = null;
      startPosition.current = null;
      lastPosition.current = null;
      
      // Clear fire trail after a delay
      setTimeout(() => {
        setFireTrail([]);
      }, 1500);
    }
  });

  return (
    <>
      {/* Render fire particles */}
      {fireTrail.map(particle => (
        <FireParticle key={particle.id} position={particle.position} />
      ))}
    </>
  );
}

// Helper function to calculate distance from point to line segment
function distanceToLineSegment(lineStart: Vector3, lineEnd: Vector3, point: Vector3): number {
  const line = lineEnd.clone().sub(lineStart);
  const lineLength = line.length();
  
  if (lineLength === 0) return point.distanceTo(lineStart);
  
  // Calculate projection of point onto line
  const t = point.clone().sub(lineStart).dot(line) / (lineLength * lineLength);
  const clampedT = Math.max(0, Math.min(1, t));
  
  // Calculate closest point on line segment
  const closestPoint = lineStart.clone().add(line.multiplyScalar(clampedT));
  
  // Return distance
  return point.distanceTo(closestPoint);
}

// Fire particle component
function FireParticle({ position }: { position: Vector3 }) {
  const particleRef = useRef<THREE.Mesh>(null);
  const lifetime = useRef(0.5 + Math.random() * 1.0); // Random lifetime between 0.5-1.5 seconds
  const startTime = useRef(Date.now());
  const initialScale = useRef(0.2 + Math.random() * 0.6); // Random initial scale
  
  useFrame(() => {
    if (!particleRef.current) return;
    
    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / lifetime.current, 1);
    
    if (progress < 1) {
      // Make the particle rise slightly
      particleRef.current.position.y += 0.01;
      
      // Scale down as the particle ages
      const scale = initialScale.current * (1 - progress);
      particleRef.current.scale.set(scale, scale, scale);
      
      // Fade out
      const material = particleRef.current.material as THREE.MeshStandardMaterial;
      if (material) {
        material.opacity = 1 - progress;
      }
    }
  });
  
  return (
    <mesh ref={particleRef} position={[position.x, position.y, position.z]}>
      <sphereGeometry args={[0.5, 8, 8]} />
      <meshStandardMaterial 
        color="#ff4500"
        emissive="#ff7700"
        emissiveIntensity={2}
        transparent={true}
        opacity={0.8}
        depthWrite={false}
      />
    </mesh>
  );
}
