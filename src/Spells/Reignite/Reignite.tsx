import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { Group, Vector3, MeshStandardMaterial } from 'three';
import * as THREE from 'three';
import { useReigniteManager } from './useReigniteManager';
import { ChargeStatus } from '@/color/ChargedOrbitals';
import { useFrame } from '@react-three/fiber';


interface ReigniteProps {
  parentRef: React.RefObject<Group>;
  charges: Array<ChargeStatus>;
  setCharges: React.Dispatch<React.SetStateAction<Array<ChargeStatus>>>;
  isActive?: boolean; // New prop to determine if the effect is active
}

export interface ReigniteRef {
  processKill: (position?: Vector3) => void; // Updated to accept enemy position
}

const Reignite = forwardRef<ReigniteRef, ReigniteProps>(({
  parentRef,
  setCharges,
  isActive = true // Default to true for backward compatibility
}, ref) => {
  const auraRef = useRef<Group>(null);
  const rotationSpeed = 0.05; 
  const [showFlameEffect, setShowFlameEffect] = useState(false);
  const [killPosition, setKillPosition] = useState<Vector3 | null>(null);

  const { restoreCharge } = useReigniteManager({
    setCharges,
  });

  // Modified to show flame effect when processKill is called and handle multiple kills
  const processKillWithEffect = (position?: Vector3) => {
    const killTime = Date.now();
    
    // Detailed position logging
    if (position) {
      console.log(`[Reignite] Kill position details:`, {
        x: position.x.toFixed(3),
        y: position.y.toFixed(3),
        z: position.z.toFixed(3),
        type: position.constructor.name,
        isVector3: position instanceof Vector3
      });
    }
    
    // Always process the kill for logging purposes
    if (isActive) {
      // Only restore charge and show visual effects if active
      console.log(`[Reignite] Calling restoreCharge() to replenish orbs at time ${killTime}`);
      
      // CRITICAL: Call restoreCharge immediately to ensure it's processed for this kill
      restoreCharge();
      
      // Show visual effect
      setShowFlameEffect(true);
      
      // Store the kill position if provided, otherwise default to player position
      if (position && position instanceof Vector3) {
        console.log(`[Reignite] Using provided kill position for visual effect:`, {
          x: position.x.toFixed(3),
          y: position.y.toFixed(3),
          z: position.z.toFixed(3)
        });
        
        // Create a completely new Vector3 object with explicit values
        // This ensures we have a completely independent position object that won't be modified elsewhere
        const newPos = new Vector3(
          position.x, 
          0.1,   // Keep this slightly above ground level 
          position.z
        );
        
        console.log(`[Reignite] Created new position vector for kill effect:`, {
          x: newPos.x.toFixed(3),
          y: newPos.y.toFixed(3),
          z: newPos.z.toFixed(3)
        });
        
        // Directly set the killPosition state with our new independent Vector3
        setKillPosition(newPos);
      } else if (parentRef.current) {
        console.log(`[Reignite] No valid position provided, using player position`);
        
        // Create a new Vector3 for player position too
        const playerPos = new Vector3(
          parentRef.current.position.x,
          0.1,
          parentRef.current.position.z
        );
        
        setKillPosition(playerPos);
      }
      
      // Hide the effect after a duration, but don't interfere with the orb restoration
      setTimeout(() => {
        setShowFlameEffect(false);
        setKillPosition(null);
      }, 1000); // 1 second flame effect duration
    } else {
      console.log(`[Reignite] Kill detected but Reignite not active (not using Spear with passive)`);
    }
  };

  useImperativeHandle(ref, () => ({
    processKill: processKillWithEffect
  }));

  useFrame(() => {
    if (auraRef.current && parentRef.current) {
      const parentPosition = parentRef.current.position;
      auraRef.current.position.set(parentPosition.x, 0.015, parentPosition.z);
      auraRef.current.rotation.y += rotationSpeed * 0.008;
    }
  });

  // Don't render anything if not active
  if (!isActive) return null;

  return (
    <group ref={auraRef}>
      {/* Rotating inner elements */}
      <group rotation={[0, 0, 0]} position={[0, 0.005, 0]}>
        {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((rotation, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, rotation + Date.now() * 0.001]}>
            <ringGeometry args={[0.85, 1.0, 3]} />
            <meshStandardMaterial
              color="#ff3300"
              emissive="#ff0000"
              emissiveIntensity={2.5}
              transparent
              opacity={0.65}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Circle */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.925, 0.5, -0.175, 32]} />
        <meshStandardMaterial
          color="#ff2200"
          emissive="#cc0000"
          emissiveIntensity={1.2}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>
      
      {/* Flame effect that appears when Reignite is triggered */}
      {showFlameEffect && parentRef.current && (
        <FlameEffect position={parentRef.current.position} />
      )}
      
      {/* Concentrated flame effect at kill position */}
      {showFlameEffect && killPosition && (
        <KillFlameEffect position={killPosition} />
      )}
    </group>
  );
});

// Flame effect component that surrounds the player when Reignite is triggered
function FlameEffect({ position }: { position: Vector3 }) {
  const flameGroupRef = useRef<Group>(null);
  const flameParticles = useRef<Array<{id: number, offset: Vector3, scale: number, rotSpeed: number}>>([]);
  const startTime = useRef(Date.now());
  
  // Create flame particles on mount
  useEffect(() => {
    // Generate 20 flame particles around the player
    const particles = [];
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const radius = 0.35 + Math.random() * 0.5;
      
      particles.push({
        id: i,
        offset: new Vector3(
          Math.cos(angle) * radius,
          0.5 + Math.random() * 1.5, // Varying heights
          Math.sin(angle) * radius
        ),
        scale: 0.25 + Math.random() * 1.0,
        rotSpeed: 0.01 + Math.random() * 0.03
      });
    }
    
    flameParticles.current = particles;
  }, []);
  
  // Animate the flame particles
  useFrame(() => {
    if (!flameGroupRef.current) return;
    
    const elapsed = (Date.now() - startTime.current) / 1000;
    const effectProgress = Math.min(elapsed, 1); // 0 to 1 over 1 second
    
    // Position the flame group at the player's position
    flameGroupRef.current.position.copy(position);
    
    // Animate each flame child
    flameGroupRef.current.children.forEach((child, i) => {
      if (i < flameParticles.current.length) {
        const particle = flameParticles.current[i];
        
        // Rise effect
        child.position.y += 0.03;
        
        // Pulsate scale based on sin wave
        const pulse = Math.sin(elapsed * 10 + i) * 0.2 + 0.8;
        child.scale.set(
          particle.scale * pulse * (1 - effectProgress * 0.5),
          particle.scale * pulse * (1 - effectProgress * 0.5),
          particle.scale * pulse * (1 - effectProgress * 0.5)
        );
        
        // Rotate
        child.rotation.y += particle.rotSpeed;
        
        // Fade out at the end of the effect
        const mesh = child as THREE.Mesh;
        if (mesh.material && mesh.material instanceof MeshStandardMaterial) {
          mesh.material.opacity = 1 - effectProgress;
        }
      }
    });
  });
  
  return (
    <group ref={flameGroupRef}>
      {flameParticles.current.map(particle => (
        <mesh 
          key={particle.id} 
          position={[particle.offset.x, particle.offset.y, particle.offset.z]}
        >
          <sphereGeometry args={[0.2, 0.6, 8]} />
          <meshStandardMaterial 
            color="#ff6600"
            emissive="#ff3300"
            emissiveIntensity={3}
            transparent={true}
            opacity={0.8}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// New concentrated flame effect that appears at the kill position
function KillFlameEffect({ position }: { position: Vector3 }) {
  const flameGroupRef = useRef<Group>(null);
  const flameParticles = useRef<Array<{id: number, offset: Vector3, scale: number, rotSpeed: number, riseFactor: number}>>([]);
  const startTime = useRef(Date.now());
  
  // Create a frozen copy of the position that won't be affected by any external changes
  // This is critical to ensure the effect stays at the exact death location
  const fixedPosition = useRef(new Vector3(position.x, 0.1, position.z));
  
  // Update fixedPosition whenever the position prop changes
  useEffect(() => {
    // Create a completely new Vector3 to avoid any reference issues
    fixedPosition.current = new Vector3(position.x, 0.1, position.z);
    
    console.log(`[KillFlameEffect] Updated fixed position:`, {
      x: fixedPosition.current.x.toFixed(3),
      y: fixedPosition.current.y.toFixed(3),
      z: fixedPosition.current.z.toFixed(3)
    });
  }, [position]); // Add position as a dependency
  
  // Create concentrated flame particles on mount
  useEffect(() => {
    const particles = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 0.2 + Math.random() * 0.3; // Smaller radius for concentration
      
      particles.push({
        id: i,
        offset: new Vector3(
          Math.cos(angle) * radius,
          0, // Start at ground level
          Math.sin(angle) * radius
        ),
        scale: 0.125 + Math.random() * 0.4, // Smaller scale
        rotSpeed: 0.02 + Math.random() * 0.05, // Faster rotation
        riseFactor: 0.04 + Math.random() * 0.03 // Varying rise speeds
      });
    }
    
    flameParticles.current = particles;
  }, []);
  
  // Animate the flame particles
  useFrame(() => {
    if (!flameGroupRef.current) return;
    
    const elapsed = (Date.now() - startTime.current) / 1000;
    const effectProgress = Math.min(elapsed, 1); // 0 to 1 over 1 second
    
    // Always use our fixed position reference to prevent drift
    flameGroupRef.current.position.copy(fixedPosition.current);
    
    // Animate each flame child
    flameGroupRef.current.children.forEach((child, i) => {
      if (i < flameParticles.current.length) {
        const particle = flameParticles.current[i];
        
        // Rise effect starting from ground level
        child.position.y = particle.offset.y + (particle.riseFactor * elapsed * 2);
        
        // Tighter spiral pattern
        const spiralFactor = 0.005;
        const spiralRadius = 0.1;
        child.position.x = particle.offset.x + Math.cos(elapsed * 5 + i) * spiralFactor * spiralRadius;
        child.position.z = particle.offset.z + Math.sin(elapsed * 5 + i) * spiralFactor * spiralRadius;
        
        // Pulsate scale based on sin wave
        const pulse = Math.sin(elapsed * 12 + i) * 0.15 + 0.85; // Reduced pulsing
        const fadeScale = 1 - (effectProgress * 0.5); // Gentler fade out
        child.scale.set(
          particle.scale * pulse * fadeScale,
          particle.scale * pulse * fadeScale * 1.2, // Slightly taller
          particle.scale * pulse * fadeScale
        );
        
        // Rotate faster
        child.rotation.y += particle.rotSpeed;
        child.rotation.x = Math.sin(elapsed * 8) * 0.1; // Reduced wobble
        
        // Fade out at the end of the effect
        const mesh = child as THREE.Mesh;
        if (mesh.material && mesh.material instanceof MeshStandardMaterial) {
          mesh.material.opacity = Math.max(0, 0.9 - effectProgress);
          mesh.material.emissiveIntensity = 4 + Math.sin(elapsed * 10 + i);
        }
      }
    });
  });
  
  return (
    <group ref={flameGroupRef}>
      {flameParticles.current.map(particle => (
        <mesh 
          key={particle.id} 
          position={[particle.offset.x, particle.offset.y, particle.offset.z]}
        >
          <sphereGeometry args={[0.115, 0.6, 6]} /> {/* Slightly smaller cones */}
          <meshStandardMaterial 
            color="#ff4400"
            emissive="#ff2200"
            emissiveIntensity={4}
            transparent={true}
            opacity={0.9}
            depthWrite={false}
          />
        </mesh>
      ))}
      
      {/* Central glow effect at ground level */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial
          color="#ff3300"
          emissive="#ff0000"
          emissiveIntensity={5}
          transparent={true}
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

Reignite.displayName = 'Reignite';

export default Reignite;