import React, { useRef, useMemo } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// MEMORY FIX: Import shared geometries to avoid creating new geometry objects on every render
import { 
  SPHERE_GEOMETRIES, 
  CYLINDER_GEOMETRIES, 
  TORUS_GEOMETRIES, 
  PLANE_GEOMETRIES, 
  CONE_GEOMETRIES,
  RING_GEOMETRIES,
  BOX_GEOMETRIES,
  MULTIPLAYER_EFFECT_GEOMETRIES,
  MODEL_GEOMETRIES
} from '@/Scene/SharedGeometries';

// Import weapon components
import Scythe from '@/Weapons/Scythe';
import Sword from '@/Weapons/Sword';
import Sabres from '@/Weapons/Sabres';
import EtherealBow from '@/Weapons/EtherBow';
import Spear from '@/Weapons/Spear';

// Import visual effects and gear
import GhostTrail from '@/color/GhostTrail';
import BoneWings from '@/gear/BoneWings';
import BoneAura from '@/color/BoneAura';
import BonePlate from '@/gear/BonePlate';
import BoneTail from '@/gear/BoneTail';
import BoneVortex from '@/color/BoneVortex';
import ChargedOrbitals from '@/color/ChargedOrbitals';
import { DragonHorns } from '@/gear/DragonHorns';

// Import spell effects for multiplayer synchronization
import Smite from '@/Spells/Smite/Smite';
import StealthMistEffect from '@/Spells/Stealth/StealthMistEffect';

import { WeaponType, WeaponSubclass } from '@/Weapons/weapons';
import type { MultiplayerPlayer, SynchronizedEffect } from './MultiplayerContext';
import Billboard from '@/Interface/Billboard';

interface MultiplayerPlayerProps {
  player: MultiplayerPlayer;
  isLocalPlayer?: boolean;
}

export default function MultiplayerPlayer({ player, isLocalPlayer = false }: MultiplayerPlayerProps) {
  const groupRef = useRef<Group>(null);
  
  // Add this debugging line
  console.log(`MultiplayerPlayer ${player.id}: weapon is ${player.weapon}, name is ${player.name}`);
  
  // Create weapon and subclass-specific colors
  const playerColor = useMemo(() => {
    // Base colors by weapon type
    const baseColors = {
      [WeaponType.SCYTHE]: '#00FF37', // Green
      [WeaponType.SWORD]: '#FFB300', // Orange/Gold
      [WeaponType.SABRES]: '#00BFFF', // Blue
      [WeaponType.SPEAR]: '#FF544E', // Red
      [WeaponType.BOW]: '#3A905E', // Green/Brown
    };

    // Subclass-specific color variations
    if (player.subclass) {
      switch (player.subclass) {
        case WeaponSubclass.CHAOS:
          return '#00FF37'; // Chaos Scythe - Green
        case WeaponSubclass.ABYSSAL:
          return '#8B00FF'; // Abyssal Scythe - Purple
        case WeaponSubclass.VENGEANCE:
          return '#FFB300'; // Vengeance Sword - Orange/Gold
        case WeaponSubclass.DIVINITY:
          return '#FFD700'; // Divinity Sword - Bright Gold
        case WeaponSubclass.ASSASSIN:
          return '#00BFFF'; // Assassin Sabres - Blue
        case WeaponSubclass.FROST:
          return '#87CEEB'; // Frost Sabres - Light Blue
        case WeaponSubclass.STORM:
          return '#FF544E'; // Storm Spear - Red
        case WeaponSubclass.PYRO:
          return '#FF4500'; // Pyro Spear - Orange Red
        case WeaponSubclass.ELEMENTAL:
          return '#3A905E'; // Elemental Bow - Green/Brown
        case WeaponSubclass.VENOM:
          return '#32CD32'; // Venom Bow - Lime Green
        default:
          return baseColors[player.weapon] || '#00FF37';
      }
    }

    return baseColors[player.weapon] || '#00FF37';
  }, [player.weapon, player.subclass]);

  // Use actual movement direction from player data
  const movementDirection = useMemo(() => player.movementDirection || new Vector3(), [player.movementDirection]);

  // Create mock charges for ChargedOrbitals (simplified for multiplayer display)
  const mockCharges = useMemo(() => {
    const chargeCount = 5; // Standard count for display
    return Array.from({ length: chargeCount }, (_, i) => ({
      id: i + 1,
      available: true,
      cooldownStartTime: null
    }));
  }, []);



  // Update position and rotation - full 60fps for smooth visuals
  useFrame(() => {
    if (groupRef.current && !isLocalPlayer) {
      // Set initial position on first frame
      if (!groupRef.current.userData.initialized) {
        groupRef.current.position.copy(player.position);
        groupRef.current.rotation.set(player.rotation.x, player.rotation.y, player.rotation.z);
        groupRef.current.userData.initialized = true;
      } else {
        // Smoothly interpolate to target position for other players
        const targetPosition = player.position;
        const currentPosition = groupRef.current.position;
        
        // Use smooth lerp for natural movement
        currentPosition.lerp(targetPosition, 0.2);
        
        // Apply rotation (simplified for now)
        if (player.rotation) {
          groupRef.current.rotation.set(player.rotation.x, player.rotation.y, player.rotation.z);
        }
      }
    }
  });

  // Render weapon based on player's current weapon
  const renderWeapon = () => {
    const weaponProps = {
      isSwinging: player.isSwinging,
      onSwingComplete: () => {},
      isBowCharging: player.isBowCharging
    };

    switch (player.weapon) {
      case WeaponType.SCYTHE:
        return <Scythe parentRef={groupRef} {...weaponProps} />;
      case WeaponType.SWORD:
        return (
          <Sword
            {...weaponProps}
            isSmiting={player.isSmiting}
            isOathstriking={false}
            onSmiteComplete={() => {}}
            onOathstrikeComplete={() => {}}
            hasChainLightning={false}
            comboStep={1}
            currentSubclass={player.subclass}
          />
        );
      case WeaponType.SABRES:
        return <Sabres {...weaponProps} hasActiveAbility={false} onLeftSwingStart={() => {}} onRightSwingStart={() => {}} />;
      case WeaponType.SPEAR:
        return (
          <Spear
            {...weaponProps}
            enemyData={[]}
            onHit={() => {}}
            setDamageNumbers={() => {}}
            nextDamageNumberId={{ current: 0 }}
            isWhirlwinding={player.isWhirlwinding}
            fireballCharges={mockCharges}
            currentSubclass={player.subclass}
          />
        );
      case WeaponType.BOW:
        return (
          <group position={[0, 0.1, 0.3]}>
            <EtherealBow
              position={new Vector3()}
              direction={new Vector3(0, 0, 1)}
              chargeProgress={player.isBowCharging ? 0.5 : 0}
              isCharging={player.isBowCharging}
              onRelease={() => {}}
            />
          </group>
        );
      default:
        return null;
    }
  };

  if (isLocalPlayer) {
    // Don't render the local player (they see themselves through the main Unit component)
    return null;
  }

  // Function to render synchronized effects from other players
  const renderSynchronizedEffects = () => {
    if (!player.activeEffects || player.activeEffects.length === 0) return null;

    // Limit the number of effects rendered per player to prevent performance issues
    const maxEffects = 20; // Increased from 10 to 20 for richer visual effects
    const effectsToRender = player.activeEffects
      .filter(effect => {
        const timeElapsed = Date.now() - effect.startTime;
        return !effect.duration || timeElapsed <= effect.duration;
      })
      .slice(-maxEffects); // Keep only the most recent effects

    return effectsToRender.map((effect: SynchronizedEffect) => {
      const timeElapsed = Date.now() - effect.startTime;
      
      // Skip effects that have exceeded their duration
      if (effect.duration && timeElapsed > effect.duration) {
        return null;
      }

      switch (effect.type) {
        case 'fireball':
          // Calculate fireball position based on elapsed time
          const fireballSpeed = effect.speed || 0.4;
          const fireballLifespan = effect.lifespan || 10;
          const timeElapsedSeconds = timeElapsed / 1000;
          
          // If fireball has collided, don't render the projectile, only the explosion
          if (effect.hasCollided) {
            // Only render explosion effect at collision position
            if (!effect.collisionPosition) return null;
            
            const collisionElapsed = effect.collisionTime ? 
              (Date.now() - effect.collisionTime) / 1000 : 
              0;
            const explosionDuration = 0.3; // 0.3 seconds explosion duration
            const fade = Math.max(0, 1 - (collisionElapsed / explosionDuration));
            
            if (fade <= 0) return null;

            return (
              <group key={effect.id} position={effect.collisionPosition}>
                {/* Core explosion sphere */}
                <mesh scale={0.3 * (1 + collisionElapsed * 2)} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.explosionSphere}>
                  <meshStandardMaterial
                    color="#00ff44"
                    emissive="#33ff66"
                    emissiveIntensity={2 * fade}
                    transparent
                    opacity={0.8 * fade}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
                
                {/* Inner energy sphere */}
                <mesh scale={0.2 * (1 + collisionElapsed * 3)} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.explosionInner}>
                  <meshStandardMaterial
                    color="#66ff88"
                    emissive="#ffffff"
                    emissiveIntensity={3 * fade}
                    transparent
                    opacity={0.9 * fade}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>

                {/* Multiple expanding rings */}
                {[0.4, 0.6, 0.8].map((size, i) => (
                  <mesh key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]} scale={size * (1 + collisionElapsed * 3)} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.explosionRing}>
                    <meshStandardMaterial
                      color="#00ff44"
                      emissive="#33ff66"
                      emissiveIntensity={0.8 * fade}
                      transparent
                      opacity={0.5 * fade * (1 - i * 0.2)}
                      depthWrite={false}
                      blending={THREE.AdditiveBlending}
                    />
                  </mesh>
                ))}

                {/* Particle sparks */}
                {[...Array(8)].map((_, i) => {
                  const angle = (i / 8) * Math.PI * 2;
                  const radius = 0.5 * (1 + collisionElapsed * 2);
                  return (
                    <mesh
                      key={`spark-${i}`}
                      position={[
                        Math.sin(angle) * radius,
                        Math.cos(angle) * radius,
                        0
                      ]}
                      geometry={MULTIPLAYER_EFFECT_GEOMETRIES.explosionSpark}
                      scale={0.05}
                    >
                      <meshStandardMaterial
                        color="#66ff88"
                        emissive="#ffffff"
                        emissiveIntensity={1.85 * fade}
                        transparent
                        opacity={0.85 * fade}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                      />
                    </mesh>
                  );
                })}

                {/* Dynamic lights */}
                <pointLight
                  color="#00ff44"
                  intensity={2 * fade}
                  distance={4}
                  decay={2}
                />
                <pointLight
                  color="#66ff88"
                  intensity={1 * fade}
                  distance={6}
                  decay={1}
                />
              </group>
            );
          }
          
          // Check if fireball has exceeded its lifespan
          if (timeElapsedSeconds > fireballLifespan) {
            return null;
          }

          // Calculate current position for non-collided fireball
          const fireballDistance = fireballSpeed * timeElapsedSeconds * 60; // Match original calculation
          const currentFireballPosition = effect.position.clone().add(
            effect.direction.clone().multiplyScalar(fireballDistance)
          );

          return (
            <group key={effect.id}>
              <mesh position={currentFireballPosition} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.fireballCore}>
                <meshStandardMaterial
                  color="#00ff44"
                  emissive="#33ff66"
                  emissiveIntensity={2}
                  toneMapped={false}
                />
                <pointLight color="#00ff44" intensity={5} distance={12} />
              </mesh>
              
              {/* Fireball trail effect */}
              <group position={currentFireballPosition}>
                {[...Array(8)].map((_, i) => {
                  const trailOffset = -i * 0.3;
                  const trailPosition = effect.direction.clone().multiplyScalar(trailOffset);
                  const opacity = Math.max(0, 1 - (i * 0.15));
                  
                  return (
                    <mesh
                      key={`trail-${i}`}
                      position={trailPosition}
                      geometry={MULTIPLAYER_EFFECT_GEOMETRIES.fireballTrail}
                      scale={1 - i * 0.1}
                    >
                      <meshStandardMaterial
                        color="#00ff44"
                        emissive="#33ff66"
                        emissiveIntensity={1.5 * opacity}
                        transparent
                        opacity={opacity}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                      />
                    </mesh>
                  );
                })}
              </group>
              

            </group>
          );

        case 'fireballExplosion':
          // Render fireball explosion effect
          const explosionElapsed = timeElapsed / 1000; // Convert to seconds
          const explosionDuration = (effect.duration || 225) / 1000; // Convert to seconds
          const fade = Math.max(0, 1 - (explosionElapsed / explosionDuration));
          
          if (fade <= 0) return null;

          return (
            <group key={effect.id} position={effect.position}>
              {/* Core explosion sphere */}
              <mesh scale={0.3 * (1 + explosionElapsed * 2)} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.explosionSphere}>
                <meshStandardMaterial
                  color="#00ff44"
                  emissive="#33ff66"
                  emissiveIntensity={2 * fade}
                  transparent
                  opacity={0.8 * fade}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              
              {/* Inner energy sphere */}
              <mesh scale={0.2 * (1 + explosionElapsed * 3)} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.explosionInner}>
                <meshStandardMaterial
                  color="#66ff88"
                  emissive="#ffffff"
                  emissiveIntensity={3 * fade}
                  transparent
                  opacity={0.9 * fade}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>

              {/* Multiple expanding rings */}
              {[0.4, 0.6, 0.8].map((size, i) => (
                <mesh key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]} scale={size * (1 + explosionElapsed * 3)} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.explosionRing}>
                  <meshStandardMaterial
                    color="#00ff44"
                    emissive="#33ff66"
                    emissiveIntensity={0.8 * fade}
                    transparent
                    opacity={0.5 * fade * (1 - i * 0.2)}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
              ))}

              {/* Particle sparks */}
              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const radius = 0.5 * (1 + explosionElapsed * 2);
                return (
                  <mesh
                    key={`spark-${i}`}
                    position={[
                      Math.sin(angle) * radius,
                      Math.cos(angle) * radius,
                      0
                    ]}
                    geometry={MULTIPLAYER_EFFECT_GEOMETRIES.explosionSpark}
                    scale={0.05}
                  >
                    <meshStandardMaterial
                      color="#66ff88"
                      emissive="#ffffff"
                      emissiveIntensity={1.85 * fade}
                      transparent
                      opacity={0.85 * fade}
                      depthWrite={false}
                      blending={THREE.AdditiveBlending}
                    />
                  </mesh>
                );
              })}

              {/* Dynamic lights */}
              <pointLight
                color="#00ff44"
                intensity={2 * fade}
                distance={4}
                decay={2}
              />
              <pointLight
                color="#66ff88"
                intensity={1 * fade}
                distance={6}
                decay={1}
              />
            </group>
          );

        case 'smite':
          return (
            <Smite
              key={effect.id}
              weaponType={player.weapon}
              position={effect.targetPosition || effect.position}
              onComplete={() => {}} // No-op for other players' effects
            />
          );

        case 'bowProjectile':
          // Calculate current position based on time elapsed
          const arrowSpeed = effect.isFullyCharged ? 0.5 : 0.375;
          const arrowDistance = (timeElapsed / 1000) * arrowSpeed * 60; // Convert to world units
          const currentPosition = effect.position.clone().add(
            effect.direction.clone().multiplyScalar(arrowDistance)
          );

          return (
            <group key={effect.id}>
              <group
                position={currentPosition.toArray()}
                rotation={[
                  0,
                  Math.atan2(effect.direction.x, effect.direction.z),
                  0
                ]}
              >
                {/* Base arrow */}
                <mesh rotation={[Math.PI/2, 0, 0]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.arrowBody}>
                  <meshStandardMaterial
                    color="#00ffff"
                    emissive="#00ffff"
                    emissiveIntensity={1}
                    transparent
                    opacity={1}
                  />
                </mesh>

                {/* Arrow Rings */}
                {[...Array(3)].map((_, i) => (
                  <mesh
                    key={`ring-${i}`}
                    position={[0, 0, -i * 0.45 + 0.5]}
                    rotation={[Math.PI, 0, timeElapsed * 0.003 + i * Math.PI / 3]}
                    geometry={MULTIPLAYER_EFFECT_GEOMETRIES.arrowRing}
                    scale={1 + i * 0.32}
                  >
                    <meshStandardMaterial
                      color="#00ffff"
                      emissive="#00ffff"
                      emissiveIntensity={3}
                      transparent
                      opacity={0.9 - i * 0.125}
                      blending={THREE.AdditiveBlending}
                    />
                  </mesh>
                ))}

                <pointLight 
                  color="#00ffff" 
                  intensity={3} 
                  distance={5}
                  decay={2}
                />
              </group>
            </group>
          );

        case 'bowCharge':
          if (!player.isBowCharging) return null;
          
          // Show charging effect
          const chargeProgress = Math.min(timeElapsed / 1675, 1); // 1.675 second charge time
          
          return (
            <group 
              key={effect.id}
              position={groupRef.current ? (() => {
                const forward = new Vector3(0, 0, 1)
                  .applyQuaternion(groupRef.current.quaternion)
                  .multiplyScalar(2);
                return [
                  groupRef.current.position.x + forward.x,
                  0.01,
                  groupRef.current.position.z + forward.z
                ];
              })() : [0, 0.015, 0]}
            >
              {/* Main rectangular charge area */}
              <mesh 
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.15, (chargeProgress * 15 - 4.5)]}
                geometry={MULTIPLAYER_EFFECT_GEOMETRIES.chargeArea}
                scale={[0.4, chargeProgress * 30 - 4, 1]}
              >
                <meshStandardMaterial
                  color="#C18C4B"
                  emissive="#C18C4B"
                  emissiveIntensity={1}
                  transparent
                  opacity={0.3 + (0.4 * chargeProgress)}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            </group>
          );

        case 'stealth':
          return (
            <StealthMistEffect
              key={effect.id}
              parentRef={groupRef}
            />
          );

        case 'whirlwind':
          if (!player.isWhirlwinding) return null;
          
          return (
            <group key={effect.id} position={groupRef.current?.position || [0, 0, 0]}>
              {/* Whirlwind visual effect - simplified version */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.whirlwindRing}>
                <meshStandardMaterial
                  color="#FF544E"
                  emissive="#FF544E"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.6}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              <pointLight
                color="#FF544E"
                intensity={5}
                distance={8}
                decay={2}
              />
            </group>
          );

        // SWORD ABILITIES
        case 'oathstrike':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Oathstrike arc effect */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.slashArc}>
                <meshStandardMaterial
                  color="#FF9748"
                  emissive="#FF6F00"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.9}
                />
              </mesh>
              <pointLight
                color="#FF9748"
                intensity={8}
                distance={6}
                decay={2}
              />
            </group>
          );

        case 'aegis':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Aegis projectile - simplified shield shape */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.aegisProjectile}>
                <meshStandardMaterial
                  color="#FFD700"
                  emissive="#FFD700"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.9}
                />
              </mesh>
              <pointLight
                color="#FFD700"
                intensity={3}
                distance={4}
                decay={2}
              />
            </group>
          );

        case 'colossusStrike':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Lightning strike effect */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.lightningBolt} scale={[1, 20, 1]}>
                <meshStandardMaterial
                  color="#FFD700"
                  emissive="#FFD700"
                  emissiveIntensity={3}
                  transparent
                  opacity={0.8}
                />
              </mesh>
              <pointLight
                color="#FFD700"
                intensity={25}
                distance={8}
                decay={2}
              />
            </group>
          );

        case 'crusaderAura':
          return (
            <group key={effect.id} position={groupRef.current?.position || [0, 0, 0]}>
              {/* Crusader aura rings */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.auraRing}>
                <meshStandardMaterial
                  color="#ffaa00"
                  emissive="#ff8800"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            </group>
          );

        case 'divineShield':
          return (
            <group key={effect.id} position={groupRef.current?.position || [0, 0, 0]}>
              {/* Divine shield bubble */}
              <mesh scale={1.2} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.shieldBubble}>
                <meshStandardMaterial
                  color="#FFD700"
                  emissive="#FFD700"
                  emissiveIntensity={1}
                  transparent
                  opacity={0.3}
                />
              </mesh>
            </group>
          );

        case 'chainLightning':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Chain lightning effect */}
              {effect.chainTargets && effect.chainTargets.map((target, i) => (
                <group key={`chain-${i}`}>
                  {/* Lightning bolt from source to target */}
                  <mesh 
                    position={[
                      (effect.position.x + target.x) / 2,
                      (effect.position.y + target.y) / 2 + 1,
                      (effect.position.z + target.z) / 2
                    ]}
                    rotation={[
                      0,
                      Math.atan2(target.x - effect.position.x, target.z - effect.position.z),
                      0
                    ]}
                    geometry={MULTIPLAYER_EFFECT_GEOMETRIES.lightningBolt}
                    scale={[0.5, effect.position.distanceTo(target), 0.5]}
                  >
                    <meshStandardMaterial
                      color="#FFD700"
                      emissive="#FFD700"
                      emissiveIntensity={4}
                      transparent
                      opacity={0.9}
                    />
                  </mesh>
                  
                  {/* Lightning impact at target */}
                  <mesh position={[target.x, target.y + 1, target.z]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.lightningImpact}>
                    <meshStandardMaterial
                      color="#FFFFFF"
                      emissive="#FFD700"
                      emissiveIntensity={6}
                      transparent
                      opacity={0.8}
                      blending={THREE.AdditiveBlending}
                    />
                  </mesh>
                </group>
              ))}
              
              {/* Source lightning effect */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.lightningSource}>
                <meshStandardMaterial
                  color="#FFFFFF"
                  emissive="#FFD700"
                  emissiveIntensity={8}
                  transparent
                  opacity={0.9}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              
              <pointLight
                color="#FFD700"
                intensity={15}
                distance={8}
                decay={2}
              />
            </group>
          );

        case 'swordCombo':
          const comboStep = effect.comboStep || 1;
          const swordComboFade = Math.max(0, 1 - (timeElapsed / 600)); // 600ms duration
          
          return (
            <group key={effect.id} position={groupRef.current?.position || [0, 0, 0]}>
              {/* Sword combo visual indicator */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.comboRing}>
                <meshStandardMaterial
                  color={comboStep === 3 ? "#FF4444" : "#FFD700"}
                  emissive={comboStep === 3 ? "#FF2222" : "#FFB300"}
                  emissiveIntensity={(comboStep === 3 ? 3 : 2) * swordComboFade}
                  transparent
                  opacity={0.7 * swordComboFade}
                  depthWrite={false}
                />
              </mesh>
              
              {/* Combo step indicators */}
              {[...Array(comboStep)].map((_, i) => (
                <mesh 
                  key={i}
                  position={[
                    Math.cos((i / 3) * Math.PI * 2) * 0.8,
                    0.2,
                    Math.sin((i / 3) * Math.PI * 2) * 0.8
                  ]}
                  geometry={MULTIPLAYER_EFFECT_GEOMETRIES.comboOrb}
                >
                  <meshStandardMaterial
                    color={comboStep === 3 ? "#FF6666" : "#FFD700"}
                    emissive={comboStep === 3 ? "#FF4444" : "#FFB300"}
                    emissiveIntensity={3 * swordComboFade}
                    transparent
                    opacity={0.9 * swordComboFade}
                  />
                </mesh>
              ))}
              
              <pointLight
                color={comboStep === 3 ? "#FF4444" : "#FFD700"}
                intensity={5 * swordComboFade}
                distance={4}
                decay={2}
              />
            </group>
          );

        // SCYTHE ABILITIES
        case 'dragonBreath':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Dragon breath cone */}
              <mesh rotation={[0, Math.atan2(effect.direction.x, effect.direction.z), 0]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.breathCone}>
                <meshStandardMaterial
                  color="#00ff44"
                  emissive="#00ff44"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.4}
                />
              </mesh>
              <pointLight
                color="#00ff44"
                intensity={10}
                distance={12}
                decay={2}
              />
            </group>
          );

        case 'dragonClaw':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Dragon claw slash effect */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.clawSlash}>
                <meshStandardMaterial
                  color="#ff4444"
                  emissive="#ff4444"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.8}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          );

        case 'totem':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Totem summoning effect */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.totemPillar}>
                <meshStandardMaterial
                  color="#8B4513"
                  emissive="#ff6600"
                  emissiveIntensity={1}
                  transparent
                  opacity={0.8}
                />
              </mesh>
              <pointLight
                color="#ff6600"
                intensity={5}
                distance={6}
                decay={2}
              />
            </group>
          );

        case 'crossentropy':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* CrossEntropy bolt effect */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.crossEntropyBolt}>
                <meshStandardMaterial
                  color="#00ff44"
                  emissive="#00ff44"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.9}
                />
              </mesh>
              <pointLight
                color="#00ff44"
                intensity={3}
                distance={4}
                decay={2}
              />
            </group>
          );

        case 'dualWield':
          return (
            <group key={effect.id} position={groupRef.current?.position || [0, 0, 0]}>
              {/* Dual wield indicator - second scythe glow */}
              <mesh position={[0.5, 0, 0]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.dualWieldGlow}>
                <meshStandardMaterial
                  color="#8B008B"
                  emissive="#8B008B"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.7}
                />
              </mesh>
            </group>
          );

        case 'soulReaper':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Soul Reaper main effect */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.soulOrb}>
                <meshStandardMaterial
                  color="#8B008B"
                  emissive="#8B008B"
                  emissiveIntensity={3}
                  transparent
                  opacity={0.6}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
              
              {/* Soul energy swirls */}
              {[...Array(6)].map((_, i) => {
                const angle = (i / 6) * Math.PI * 2;
                const radius = 1.5;
                return (
                  <mesh
                    key={i}
                    position={[
                      Math.sin(angle + timeElapsed * 0.002) * radius,
                      Math.cos(timeElapsed * 0.003 + i) * 0.5,
                      Math.cos(angle + timeElapsed * 0.002) * radius
                    ]}
                    rotation={[timeElapsed * 0.01, timeElapsed * 0.01, 0]}
                    geometry={MULTIPLAYER_EFFECT_GEOMETRIES.soulParticle}
                  >
                    <meshStandardMaterial
                      color="#AA44AA"
                      emissive="#AA44AA"
                      emissiveIntensity={4}
                      transparent
                      opacity={0.8}
                    />
                  </mesh>
                );
              })}
              
              <pointLight
                color="#8B008B"
                intensity={10}
                distance={8}
                decay={2}
              />
            </group>
          );

        case 'soulReaperMark':
          const markProgress = Math.min(timeElapsed / (effect.markDuration || 2000), 1);
          const markPulse = Math.sin(timeElapsed * 0.01) * 0.3 + 0.7;
          
          return (
            <group key={effect.id} position={[effect.position.x, effect.position.y + 0.1, effect.position.z]}>
              {/* Soul Reaper mark circle */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.soulReaperMarkOuter}>
                <meshStandardMaterial
                  color="#8B008B"
                  emissive="#8B008B"
                  emissiveIntensity={3 * markPulse}
                  transparent
                  opacity={0.8 * (1 - markProgress * 0.3)}
                  depthWrite={false}
                />
              </mesh>
              
              {/* Inner mark */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.soulReaperMarkInner}>
                <meshStandardMaterial
                  color="#AA44AA"
                  emissive="#AA44AA"
                  emissiveIntensity={4 * markPulse}
                  transparent
                  opacity={0.9 * (1 - markProgress * 0.2)}
                  depthWrite={false}
                />
              </mesh>
              
              {/* Mark symbols */}
              {[...Array(8)].map((_, i) => (
                <mesh 
                  key={i}
                  position={[
                    Math.cos((Math.PI * 2 * i) / 8) * 1.0,
                    0.05,
                    Math.sin((Math.PI * 2 * i) / 8) * 1.0
                  ]}
                  rotation={[0, (Math.PI * 2 * i) / 8, 0]}
                  geometry={MULTIPLAYER_EFFECT_GEOMETRIES.soulReaperSymbol}
                >
                  <meshStandardMaterial
                    color="#8B008B"
                    emissive="#8B008B"
                    emissiveIntensity={2 * markPulse}
                    transparent
                    opacity={0.7}
                  />
                </mesh>
              ))}
              
              <pointLight
                color="#8B008B"
                intensity={6 * markPulse}
                distance={6}
                decay={2}
              />
            </group>
          );

        case 'soulReaperSword':
          const swordProgress = Math.min(timeElapsed / 1000, 1);
          const swordY = 8 - (swordProgress * 8); // Sword drops from above
          
          return (
            <group key={effect.id} position={[effect.position.x, swordY, effect.position.z]}>
              {/* Soul Reaper sword */}
              <mesh rotation={[0, 0, 0]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.soulReaperBlade}>
                <meshStandardMaterial
                  color="#444444"
                  emissive="#8B008B"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.9}
                />
              </mesh>
              
              {/* Sword blade glow */}
              <mesh rotation={[0, 0, 0]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.soulReaperGlow}>
                <meshStandardMaterial
                  color="#8B008B"
                  emissive="#8B008B"
                  emissiveIntensity={3}
                  transparent
                  opacity={0.6}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
              
              {/* Sword trail as it falls */}
              {swordProgress < 1 && (
                <mesh position={[0, 2, 0]} rotation={[0, 0, 0]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.soulReaperTrail}>
                  <meshStandardMaterial
                    color="#8B008B"
                    emissive="#8B008B"
                    emissiveIntensity={2}
                    transparent
                    opacity={0.4 * (1 - swordProgress)}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                  />
                </mesh>
              )}
              
              <pointLight
                color="#8B008B"
                intensity={8}
                distance={6}
                decay={2}
              />
            </group>
          );

        case 'abyssalSlash':
          const slashProgress = Math.min(timeElapsed / 200, 1); // 200ms duration like original
          const slashFade = Math.sin(slashProgress * Math.PI);
          
          return (
            <group key={effect.id} position={groupRef.current?.position || [0, 0, 0]}>
              {/* Main slash arc - green theme like AbyssalSlashEffect */}
              <group position={[0, 0.1, 2]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.0, 1.0, 0.5]}>
                {/* Core slash */}
                <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.slashArc}>
                  <meshStandardMaterial
                    color="#17CE54"
                    emissive="#00ff44"
                    emissiveIntensity={2 * slashFade}
                    transparent
                    opacity={0.9 * slashFade}
                  />
                </mesh>

                {/* Inner glow */}
                <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.slashInner}>
                  <meshStandardMaterial
                    color="#17CE54"
                    emissive="#00ff44"
                    emissiveIntensity={1 * slashFade}
                    transparent
                    opacity={0.7 * slashFade}
                  />
                </mesh>

                {/* Outer glow */}
                <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.slashOuter}>
                  <meshStandardMaterial
                    color="#17CE54"
                    emissive="#00ff44"
                    emissiveIntensity={1.3 * slashFade}
                    transparent
                    opacity={0.5 * slashFade}
                  />
                </mesh>

                {/* Slash particles */}
                {[...Array(12)].map((_, i) => (
                  <mesh
                    key={i}
                    position={[
                      Math.cos((i * Math.PI) / 6) * 1.5,
                      Math.sin((i * Math.PI) / 6) * 1.5,
                      0
                    ]}
                    geometry={MULTIPLAYER_EFFECT_GEOMETRIES.soulParticle}
                  >
                    <meshStandardMaterial
                      color="#17CE54"
                      emissive="#00ff44"
                      emissiveIntensity={1.5 * slashFade}
                      transparent
                      opacity={0.6 * slashFade}
                    />
                  </mesh>
                ))}

                {/* Dynamic lighting */}
                <pointLight color="#17CE54" intensity={15 * slashFade} distance={8} />
                <pointLight color="#00ff44" intensity={10 * slashFade} distance={12} />
              </group>
            </group>
          );

        case 'frenzyAura':
          const frenzyIntensity = (effect.intensity || 1.5) + Math.sin(timeElapsed * 0.008) * 0.5;
          const frenzyFade = Math.abs(Math.sin(timeElapsed * 0.004));
          
          return (
            <group key={effect.id} position={[groupRef.current?.position.x || 0, 0.015, groupRef.current?.position.z || 0]}>
              {/* Rotating inner elements - green theme */}
              <group rotation={[0, timeElapsed * 0.0008, 0]} position={[0, 0.005, 0]}>
                {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((rotation, i) => (
                  <mesh key={i} rotation={[-Math.PI / 2, 0, rotation]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.frenzyRing}>
                    <meshStandardMaterial
                      color="#0BDA51"
                      emissive="#0BDA51"
                      emissiveIntensity={frenzyIntensity}
                      transparent
                      opacity={0.6 * frenzyFade}
                      depthWrite={false}
                    />
                  </mesh>
                ))}
              </group>

              {/* Pulsing outer glow */}
              <mesh position={[0, 0.05, 0]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.frenzyGlow}>
                <meshStandardMaterial
                  color="#0BDA51"
                  emissive="#0BDA51"
                  emissiveIntensity={1.5}
                  transparent
                  opacity={0.3 * frenzyFade}
                  depthWrite={false}
                />
              </mesh>
            </group>
          );

        // SABRE ABILITIES
        case 'firebeam':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Firebeam effect */}
              <mesh geometry={CYLINDER_GEOMETRIES.beam}>
                <meshStandardMaterial
                  color="#FF4444"
                  emissive="#FF2222"
                  emissiveIntensity={3}
                  transparent
                  opacity={0.8}
                />
              </mesh>
              <pointLight
                color="#FF4444"
                intensity={6}
                distance={10}
                decay={2}
              />
            </group>
          );

        case 'glacialShard':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Glacial Shard projectile */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.glacialShard}>
                <meshStandardMaterial
                  color="#88DDFF"
                  emissive="#44AADD"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.9}
                />
              </mesh>
              <pointLight
                color="#88DDFF"
                intensity={4}
                distance={6}
                decay={2}
              />
            </group>
          );

        case 'glacialShardTrail':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Frost trail effect */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.glacialTrail}>
                <meshStandardMaterial
                  color="#AAEEFF"
                  emissive="#66CCFF"
                  emissiveIntensity={1.5}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            </group>
          );

        case 'glacialShardShield':
          return (
            <group key={effect.id} position={groupRef.current?.position || [0, 0, 0]}>
              {/* Glacial Shield effect */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.glacialShield}>
                <meshStandardMaterial
                  color="#CCFFFF"
                  emissive="#88DDFF"
                  emissiveIntensity={1}
                  transparent
                  opacity={0.4}
                  wireframe
                />
              </mesh>
            </group>
          );

        case 'deepFreeze':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Deep Freeze effect */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.icosahedron}>
                <meshStandardMaterial
                  color="#FFFFFF"
                  emissive="#AAEEFF"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.8}
                />
              </mesh>
              <pointLight
                color="#FFFFFF"
                intensity={5}
                distance={8}
                decay={2}
              />
            </group>
          );

        case 'stealthStrike':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Stealth Strike effect */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.stealthStrike}>
                <meshStandardMaterial
                  color="#8844FF"
                  emissive="#6622DD"
                  emissiveIntensity={3}
                  transparent
                  opacity={0.7}
                />
              </mesh>
            </group>
          );

        case 'stealthMist':
          return (
            <group key={effect.id} position={groupRef.current?.position || [0, 0, 0]}>
              {/* Stealth Mist effect */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.stealthMist}>
                <meshStandardMaterial
                  color="#4444AA"
                  emissive="#2222AA"
                  emissiveIntensity={1}
                  transparent
                  opacity={0.3}
                />
              </mesh>
            </group>
          );

        case 'blizzard':
          return (
            <group key={effect.id} position={groupRef.current?.position || [0, 0, 0]}>
              {/* Blizzard effect */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.blizzardArea}>
                <meshStandardMaterial
                  color="#FFFFFF"
                  emissive="#AAEEFF"
                  emissiveIntensity={1.5}
                  transparent
                  opacity={0.5}
                />
              </mesh>
              <pointLight
                color="#FFFFFF"
                intensity={8}
                distance={12}
                decay={2}
              />
            </group>
          );

        case 'icicleProjectile':
          // Calculate current position based on time elapsed
          const icicleSpeed = 0.35;
          const icicleDistance = (timeElapsed / 1000) * icicleSpeed * 60;
          const iciclePosition = effect.position.clone().add(
            effect.direction.clone().multiplyScalar(icicleDistance)
          );

          return (
            <group key={effect.id}>
              <group
                position={iciclePosition.toArray()}
                rotation={[
                  Math.PI/2,
                  Math.atan2(effect.direction.x, effect.direction.z),
                  -Math.PI/2
                ]}
              >
                {/* Icicle projectile */}
                <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.icicle}>
                  <meshStandardMaterial
                    color="#CCFFFF"
                    emissive="#CCFFFF"
                    emissiveIntensity={0.6}
                    transparent
                    opacity={0.8}
                  />
                </mesh>

                {/* Icicle trail */}
                {[...Array(3)].map((_, i) => (
                  <mesh
                    key={`trail-${i}`}
                    position={[0, -i * 0.2 - 0.2, 0]}
                    geometry={MULTIPLAYER_EFFECT_GEOMETRIES.icicleSmall}
                    scale={1 - i * 0.2}
                  >
                    <meshStandardMaterial
                      color="#CCFFFF"
                      emissive="#CCFFFF"
                      emissiveIntensity={0.4}
                      transparent
                      opacity={0.6 * (1 - i * 0.2)}
                      blending={THREE.AdditiveBlending}
                      depthWrite={false}
                    />
                  </mesh>
                ))}

                <pointLight
                  color="#CCFFFF"
                  intensity={2}
                  distance={4}
                  decay={1.5}
                />
              </group>
            </group>
          );

        // SPEAR ABILITIES
        case 'pyroclast':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Pyroclast missile */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.pyroclastCore}>
                <meshStandardMaterial
                  color="#FF6600"
                  emissive="#FF4400"
                  emissiveIntensity={3}
                  transparent
                  opacity={0.9}
                />
              </mesh>
              <pointLight
                color="#FF6600"
                intensity={5}
                distance={6}
                decay={2}
              />
            </group>
          );

        case 'pyroclastTrail':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Pyroclast trail */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.pyroclastTrail}>
                <meshStandardMaterial
                  color="#FF8844"
                  emissive="#FF6622"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.7}
                />
              </mesh>
            </group>
          );

        case 'pyroclastExplosion':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Pyroclast explosion */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.pyroclastExplosion}>
                <meshStandardMaterial
                  color="#FFAA00"
                  emissive="#FF6600"
                  emissiveIntensity={4}
                  transparent
                  opacity={0.8}
                />
              </mesh>
              <pointLight
                color="#FFAA00"
                intensity={10}
                distance={8}
                decay={2}
              />
            </group>
          );

        case 'reignite':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Reignite effect */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.reigniteColumn}>
                <meshStandardMaterial
                  color="#FF2200"
                  emissive="#FF1100"
                  emissiveIntensity={3}
                  transparent
                  opacity={0.8}
                />
              </mesh>
              <pointLight
                color="#FF2200"
                intensity={6}
                distance={6}
                decay={2}
              />
            </group>
          );

        case 'breach':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Breach effect */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.breachTorus}>
                <meshStandardMaterial
                  color="#00FFFF"
                  emissive="#00DDDD"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.7}
                />
              </mesh>
              <pointLight
                color="#00FFFF"
                intensity={7}
                distance={8}
                decay={2}
              />
            </group>
          );

        case 'lavaLashProjectile':
          // Calculate current position based on time elapsed
          const lavaSpeed = 0.4;
          const lavaDistance = (timeElapsed / 1000) * lavaSpeed * 60;
          const lavaPosition = effect.position.clone().add(
            effect.direction.clone().multiplyScalar(lavaDistance)
          );

          return (
            <group key={effect.id}>
              <group
                position={lavaPosition.toArray()}
                rotation={[
                  0,
                  Math.atan2(effect.direction.x, effect.direction.z),
                  0
                ]}
              >
                {/* Main fireball core */}
                <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.lavaCore}>
                  <meshStandardMaterial
                    color="#FF6600"
                    emissive="#FF6600"
                    emissiveIntensity={3.0}
                    transparent
                    opacity={0.9}
                  />
                </mesh>

                {/* Inner fire core */}
                <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.lavaInner}>
                  <meshStandardMaterial
                    color="#FFAA00"
                    emissive="#FFAA00"
                    emissiveIntensity={4.0}
                    transparent
                    opacity={0.8}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                  />
                </mesh>

                {/* Outer fire aura */}
                <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.lavaOuter}>
                  <meshStandardMaterial
                    color="#FF4500"
                    emissive="#FF4500"
                    emissiveIntensity={2.0}
                    transparent
                    opacity={0.4}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                  />
                </mesh>

                {/* Rotating fire rings for dynamic effect */}
                {[...Array(2)].map((_, i) => (
                  <mesh
                    key={`fire-ring-${i}`}
                    rotation={[Math.PI/2, 0, timeElapsed * 0.003 + i * Math.PI]}
                    geometry={MULTIPLAYER_EFFECT_GEOMETRIES.lavaRing}
                    scale={1 + i * 0.27}
                  >
                    <meshStandardMaterial
                      color="#FF6600"
                      emissive="#FF6600"
                      emissiveIntensity={2.5}
                      transparent
                      opacity={0.7 - i * 0.2}
                      blending={THREE.AdditiveBlending}
                    />
                  </mesh>
                ))}

                {/* Enhanced light source */}
                <pointLight
                  color="#FF4500"
                  intensity={5}
                  distance={8}
                  decay={2}
                />
              </group>
            </group>
          );

        case 'lavaLashTrail':
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Lava trail effect */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.lavaTrail}>
                <meshStandardMaterial
                  color="#FF4500"
                  emissive="#FF4500"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.6}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
              
              <pointLight
                color="#FF4500"
                intensity={3}
                distance={4}
                decay={2}
              />
            </group>
          );

        // BOW ABILITIES
        case 'bowPowershot':
          // Calculate current position based on time elapsed
          const powershotSpeed = effect.isFullyCharged ? 0.5 : 0.375;
          const powershotDistance = (timeElapsed / 1000) * powershotSpeed * 60;
          const powershotPosition = effect.position.clone().add(
            effect.direction.clone().multiplyScalar(powershotDistance)
          );

          // Determine colors based on subclass
          const getPowershotColors = () => {
            if (effect.subclass === 'venom') {
              return {
                core: "#00ff40",
                emissive: "#00aa20",
                outer: "#00ff60"
              };
            } else if (effect.subclass === 'elemental') {
              if (effect.isElementalShot) {
                return {
                  core: "#ff4400",
                  emissive: "#cc0000", 
                  outer: "#ff6600"
                };
              } else {
                return {
                  core: "#0066ff",
                  emissive: "#0044cc",
                  outer: "#0088ff"
                };
              }
            }
            return {
              core: "#ffffff",
              emissive: "#cccccc",
              outer: "#ffffff"
            };
          };

          const powershotColors = getPowershotColors();
          const isPerfect = effect.isPerfectShot || false;

          return (
            <group key={effect.id}>
              <group
                position={powershotPosition.toArray()}
                rotation={[
                  0,
                  Math.atan2(effect.direction.x, effect.direction.z),
                  0
                ]}
              >
                {/* Core beam */}
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 10]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.beamCore} scale={[isPerfect ? 1.4 : 1, 1, isPerfect ? 1.4 : 1]}>
                  <meshStandardMaterial
                    color={powershotColors.core}
                    emissive={powershotColors.emissive}
                    emissiveIntensity={isPerfect ? 15 : 12}
                    transparent
                    opacity={0.95}
                  />
                </mesh>

                {/* Inner glow */}
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 10]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.beamGlow} scale={[isPerfect ? 1.28 : 1, 1, isPerfect ? 1.28 : 1]}>
                  <meshStandardMaterial
                    color={powershotColors.core}
                    emissive={powershotColors.emissive}
                    emissiveIntensity={isPerfect ? 10 : 8}
                    transparent
                    opacity={0.7}
                  />
                </mesh>

                {/* Point light */}
                <pointLight
                  color={powershotColors.core}
                  intensity={isPerfect ? 20 : 15}
                  distance={isPerfect ? 10 : 8}
                  decay={2}
                  position={[0, 0, 10]}
                />

                {/* Perfect shot effects */}
                {isPerfect && (
                  <>
                    {[...Array(4)].map((_, i) => {
                      const angle = (i / 4) * Math.PI * 2;
                      const radius = 0.15;
                      return (
                        <group key={`lightning-${i}`} position={[
                          Math.sin(angle + timeElapsed * 0.01) * radius,
                          Math.cos(angle + timeElapsed * 0.01) * radius,
                          10 + Math.sin(timeElapsed * 0.005 + i) * 2
                        ]}>
                          <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.beamSpark}>
                            <meshStandardMaterial
                              color="#ffffff"
                              emissive="#ffffff"
                              emissiveIntensity={8}
                              transparent
                              opacity={0.8}
                              blending={THREE.AdditiveBlending}
                            />
                          </mesh>
                        </group>
                      );
                    })}
                  </>
                )}
              </group>
            </group>
          );

        case 'quickShot':
          // Calculate current position based on time elapsed
          const quickShotSpeed = 0.5;
          const quickShotDistance = (timeElapsed / 1000) * quickShotSpeed * 60;
          const quickShotPosition = effect.position.clone().add(
            effect.direction.clone().multiplyScalar(quickShotDistance)
          );

          // Determine colors based on subclass
          const getQuickShotColors = () => {
            if (effect.subclass === 'venom') {
              return {
                core: "#00ff40",
                emissive: "#00aa20"
              };
            } else if (effect.subclass === 'elemental') {
              if (effect.isElementalShot) {
                return {
                  core: "#ff4400",
                  emissive: "#cc0000"
                };
              } else {
                return {
                  core: "#0066ff",
                  emissive: "#0044cc"
                };
              }
            }
            return {
              core: "#00ffff",
              emissive: "#00cccc"
            };
          };

          const quickShotColors = getQuickShotColors();

          return (
            <group key={effect.id}>
              <group
                position={quickShotPosition.toArray()}
                rotation={[
                  0,
                  Math.atan2(effect.direction.x, effect.direction.z),
                  0
                ]}
              >
                {/* Base arrow */}
                <mesh rotation={[Math.PI/2, 0, 0]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.arrowBody}>
                  <meshStandardMaterial
                    color={quickShotColors.core}
                    emissive={quickShotColors.core}
                    emissiveIntensity={1}
                    transparent
                    opacity={1}
                  />
                </mesh>

                {/* Arrow Rings */}
                {[...Array(3)].map((_, i) => (
                  <mesh
                    key={`ring-${i}`}
                    position={[0, 0, -i * 0.45 + 0.5]}
                    rotation={[Math.PI, 0, timeElapsed * 0.003 + i * Math.PI / 3]}
                    geometry={MULTIPLAYER_EFFECT_GEOMETRIES.arrowRing}
                    scale={1 + i * 0.32}
                  >
                    <meshStandardMaterial
                      color={quickShotColors.core}
                      emissive={quickShotColors.core}
                      emissiveIntensity={3}
                      transparent
                      opacity={0.9 - i * 0.125}
                      blending={THREE.AdditiveBlending}
                    />
                  </mesh>
                ))}

                <pointLight 
                  color={quickShotColors.core} 
                  intensity={3} 
                  distance={5}
                  decay={2}
                />
              </group>
            </group>
          );

        case 'barrageProjectile':
          // Calculate current position based on time elapsed
          const barrageSpeed = 0.45;
          const barrageDistance = (timeElapsed / 1000) * barrageSpeed * 60;
          const barragePosition = effect.position.clone().add(
            effect.direction.clone().multiplyScalar(barrageDistance)
          );

          return (
            <group key={effect.id}>
              <group
                position={barragePosition.toArray()}
                rotation={[
                  0,
                  Math.atan2(effect.direction.x, effect.direction.z),
                  0
                ]}
              >
                {/* Barrage arrow - larger and more powerful looking */}
                <mesh rotation={[Math.PI/2, 0, 0]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.barrageArrow}>
                  <meshStandardMaterial
                    color="#ffaa00"
                    emissive="#ff8800"
                    emissiveIntensity={2}
                    transparent
                    opacity={1}
                  />
                </mesh>

                {/* Barrage rings - more intense */}
                {[...Array(4)].map((_, i) => (
                  <mesh
                    key={`ring-${i}`}
                    position={[0, 0, -i * 0.5 + 0.75]}
                    rotation={[Math.PI, 0, timeElapsed * 0.004 + i * Math.PI / 4]}
                    geometry={MULTIPLAYER_EFFECT_GEOMETRIES.barrageRing}
                    scale={1 + i * 0.33}
                  >
                    <meshStandardMaterial
                      color="#ffaa00"
                      emissive="#ff8800"
                      emissiveIntensity={4}
                      transparent
                      opacity={1 - i * 0.15}
                      blending={THREE.AdditiveBlending}
                    />
                  </mesh>
                ))}

                <pointLight 
                  color="#ffaa00" 
                  intensity={5} 
                  distance={6}
                  decay={2}
                />
              </group>
            </group>
          );

        case 'eagleEyeEffect':
          const eagleEyeProgress = Math.min(timeElapsed / 500, 1);
          const eagleEyeScale = 1 + eagleEyeProgress * 2;
          const eagleEyeFade = 1 - eagleEyeProgress;

          return (
            <group key={effect.id} position={[effect.position.x, effect.position.y + 1, effect.position.z]} scale={[eagleEyeScale, eagleEyeScale, eagleEyeScale]}>
              {/* Eagle Eye Symbol - Circular Aura */}
              <mesh rotation={[Math.PI/2, 0, 0]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.eagleEyeOuter}>
                <meshStandardMaterial 
                  color="#ffcc00" 
                  emissive="#ffcc00"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.9 * eagleEyeFade}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              
              {/* Inner Eye Symbol */}
              <mesh rotation={[Math.PI/2, 0, 0]} geometry={MULTIPLAYER_EFFECT_GEOMETRIES.eagleEyeInner}>
                <meshStandardMaterial 
                  color="#ffffff" 
                  emissive="#ffffff"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.9 * eagleEyeFade}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              
              {/* Light flash */}
              <pointLight color="#ffcc00" intensity={3 * eagleEyeFade} distance={5} decay={2} />
              
              {/* Radiating lines */}
              {[...Array(8)].map((_, i) => (
                <mesh 
                  key={i}
                  position={[
                    Math.cos((Math.PI * 2 * i) / 8) * 0.4,
                    0,
                    Math.sin((Math.PI * 2 * i) / 8) * 0.4
                  ]}
                  rotation={[0, 0, (Math.PI * 2 * i) / 8]}
                  geometry={MULTIPLAYER_EFFECT_GEOMETRIES.eagleEyeLine}
                >
                  <meshStandardMaterial 
                    color="#ffcc00" 
                    emissive="#ffcc00"
                    emissiveIntensity={2}
                    transparent
                    opacity={0.8 * eagleEyeFade}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
              ))}
            </group>
          );

        case 'venomEffect':
          const venomProgress = Math.min(timeElapsed / 1000, 1);
          const venomFade = 1 - venomProgress;

          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Venom cloud effect */}
              <mesh geometry={MULTIPLAYER_EFFECT_GEOMETRIES.venomCloud} scale={1 + venomProgress}>
                <meshStandardMaterial
                  color="#00ff40"
                  emissive="#00aa20"
                  emissiveIntensity={2 * venomFade}
                  transparent
                  opacity={0.6 * venomFade}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>

              {/* Venom particles */}
              {[...Array(6)].map((_, i) => {
                const angle = (i / 6) * Math.PI * 2;
                const radius = 1.0 * (1 + venomProgress * 0.5);
                return (
                  <mesh
                    key={i}
                    position={[
                      Math.sin(angle) * radius,
                      Math.cos(angle) * radius * 0.3,
                      Math.cos(angle + Math.PI/3) * radius * 0.3
                    ]}
                    geometry={MULTIPLAYER_EFFECT_GEOMETRIES.venomParticle}
                  >
                    <meshStandardMaterial
                      color="#00ff60"
                      emissive="#00ff60"
                      emissiveIntensity={3 * venomFade}
                      transparent
                      opacity={0.8 * venomFade}
                    />
                  </mesh>
                );
              })}

              <pointLight
                color="#00ff40"
                intensity={4 * venomFade}
                distance={6}
                decay={2}
              />
            </group>
          );

        default:
          return null;
      }
    }).filter(Boolean); // Remove null entries
  };

  return (
    <>
    <group
      ref={groupRef}
      position={[0, 1, 0]}
    >
      {/* DRAGON HORNS */}
      <group scale={[0.335, 0.335, 0.335]} position={[-0.05, 0.215, 0.35]} rotation={[+0.15, 0, -5]}>
        <DragonHorns isLeft={true} />
      </group>

      <group scale={[0.335, 0.335, 0.335]} position={[0.05, 0.215, 0.35]} rotation={[+0.15, 0, 5]}>
        <DragonHorns isLeft={false} />
      </group>

      {/* Outer glow sphere layer */}
      <mesh scale={1.085} geometry={MODEL_GEOMETRIES.playerGlow}>
        <meshBasicMaterial
          color={playerColor}
          transparent
          opacity={0.125}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* WINGS */}
      <group position={[0, 0.2, -0.2]}>
        {/* Left Wing */}
        <group rotation={[0, Math.PI / 5.5, 0]}>
          <BoneWings 
            collectedBones={15} 
            isLeftWing={true}
            parentRef={groupRef} 
          />
        </group>
        
        {/* Right Wing */}
        <group rotation={[0, -Math.PI / 5.5, 0]}>
          <BoneWings 
            collectedBones={15} 
            isLeftWing={false}
            parentRef={groupRef} 
          />
        </group>
      </group>

      <ChargedOrbitals 
        parentRef={groupRef} 
        charges={mockCharges}
        weaponType={player.weapon}
        weaponSubclass={player.subclass}
      />

      <group scale={[0.8, 0.55, 0.8]} position={[0, 0.04, -0.015]} rotation={[0.4, 0, 0]}>
        <BonePlate />
      </group>

      <group scale={[0.85, 0.85, 0.85]} position={[0, 0.05, +0.1]}>
        <BoneTail movementDirection={movementDirection} />
      </group>

            {/* Weapon */}
      {renderWeapon()}

      {/* Player name tag */}
      <Billboard position={[0, 2.2, 0]} lockX={false} lockY={false} lockZ={false}>
        <mesh geometry={MODEL_GEOMETRIES.nameTagBg}>
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.7}
          />
        </mesh>
        <mesh position={[0, 0, 0.001]} geometry={MODEL_GEOMETRIES.nameTagFill}>
          <meshBasicMaterial
            color={playerColor}
            transparent
            opacity={0.9}
          />
        </mesh>
      </Billboard>

      {/* Health bar */}
      <Billboard position={[0, 1.8, 0]} lockX={false} lockY={false} lockZ={false}>
        <mesh geometry={MODEL_GEOMETRIES.healthBarBg}>
          <meshBasicMaterial color="#333333" />
        </mesh>
        <mesh position={[0.5 + (player.health / player.maxHealth) * 0.5, 0, 0.001]} geometry={MODEL_GEOMETRIES.healthBarFill} scale={[player.health / player.maxHealth, 1, 1]}>
          <meshBasicMaterial 
            color={player.health > player.maxHealth * 0.5 ? "#4CAF50" : player.health > player.maxHealth * 0.25 ? "#FFA500" : "#FF4444"}
          />
        </mesh>
      </Billboard>

      {/* Connection indicator */}
      {!player.isConnected && (
        <mesh position={[0.6, 1.6, 0]} geometry={MODEL_GEOMETRIES.disconnectIndicator}>
          <meshBasicMaterial 
            color="#FF4444"
            transparent
            opacity={0.8}
          />
        </mesh>
      )}



      {/* Player light with weapon-specific color */}
      <pointLight 
        color={playerColor} 
        intensity={0.5} 
        distance={3}
        decay={2}
        position={[0, 1.5, 0]}
      />
    </group>

    {/* Visual effects - positioned outside group like in main Unit component */}
    <GhostTrail parentRef={groupRef} weaponType={player.weapon} weaponSubclass={player.subclass} />
    <BoneVortex parentRef={groupRef} weaponType={player.weapon} weaponSubclass={player.subclass} />
    <BoneAura parentRef={groupRef} />
    
    {/* Render synchronized effects from other players */}
    {renderSynchronizedEffects()}
    </>
  );
} 