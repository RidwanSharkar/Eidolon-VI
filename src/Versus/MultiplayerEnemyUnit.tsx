import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

// Import visual models only (not full unit components)
import CustomSkeleton from '@/Versus/CustomSkeleton';
import CustomSkeletonMage from '@/Versus/SkeletalMage/CustomSkeletonMage';
import CustomAbomination from '@/Versus/Abomination/CustomAbomination';
import ReaperModel from '@/Versus/Reaper/ReaperModel';
import FallenTitanModel from '@/Versus/FallenTitan/FallenTitanModel';
import AscendantModel from '@/Versus/Ascendant/AscendantModel';
import DeathKnightModel from '@/Versus/DeathKnight/DeathKnightModel';

// Import effects
import BoneVortex2 from '@/color/SpawnAnimation';
import BoneVortex from '@/color/DeathAnimation';
import MageFireball from '@/Versus/SkeletalMage/MageFireball';

import MageLightningStrike from '@/Versus/SkeletalMage/MageLightningStrike';
import LightningWarningIndicator from '@/Versus/SkeletalMage/LightningWarningIndicator';
import DeathKnightChargingIndicator from '@/Versus/DeathKnight/DeathKnightChargingIndicator';
import DeathKnightSlashEffect from '@/Versus/DeathKnight/DeathKnightSlashEffect';
import DeathGrasp from '@/Versus/DeathKnight/DeathGrasp';
import FrostStrike from '@/Versus/DeathKnight/FrostStrike';
import AscendantChargingIndicator from '@/Versus/Ascendant/AscendantChargingIndicator';
import ArchonLightning from '@/Versus/Ascendant/ArchonLightning';

import AscendantForcePulse from '@/Versus/Ascendant/AscendantForcePulse';
import AbominationLeapIndicator from '@/Versus/Abomination/AbominationLeapIndicator';
import SkeletonChargingIndicator from '@/Versus/SkeletonChargingIndicator';
import EnemySlashEffect from '@/Versus/EnemySlashEffect';
import ReaperMistEffect from '@/Versus/Reaper/ReaperMistEffect';

// Import types
import { WeaponType } from '@/Weapons/weapons';
import { FrostExplosion } from '@/Spells/Avalanche/FrostExplosion';
import { type MultiplayerEnemy } from '@/Multiplayer/MultiplayerContext';
import { useMultiplayer } from '@/Multiplayer/MultiplayerContext';
import { globalAggroSystem, PlayerInfo, TargetInfo } from '@/Versus/AggroSystem';

interface MultiplayerEnemyUnitProps {
  enemy: MultiplayerEnemy;
  weaponType: WeaponType;
}

export default function MultiplayerEnemyUnit({
  enemy,
  weaponType,
}: MultiplayerEnemyUnitProps) {
  const { players, socket } = useMultiplayer();
  const enemyRef = useRef<Group>(null);
  const [showDeathEffect, setShowDeathEffect] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isSpawning, setIsSpawning] = useState(true);
  const [showFrostEffect, setShowFrostEffect] = useState(false);
  
  // Special ability effects state
  const [activeFireballs, setActiveFireballs] = useState<Array<{
    id: string;
    position: Vector3;
    target: Vector3;
    playerPosition: Vector3; // Store player position at time of cast
  }>>([]);

  const [activeLightningWarnings, setActiveLightningWarnings] = useState<Array<{
    id: string;
    position: { x: number; y: number; z: number };
    startTime: number;
    duration: number;
  }>>([]);
  const [activeLightningStrikes, setActiveLightningStrikes] = useState<Array<{
    id: string;
    position: { x: number; y: number; z: number };
    startTime: number;
  }>>([]);
  
  // Death Knight ability effects
  const [activeDeathGrasp, setActiveDeathGrasp] = useState<Array<{
    id: string;
    position: Vector3;
    target: Vector3;
    startTime: number;
  }>>([]);
  const [activeFrostStrike, setActiveFrostStrike] = useState<Array<{
    id: string;
    position: Vector3;
    target: Vector3;
    startTime: number;
  }>>([]);
  const [activeDeathKnightCharging, setActiveDeathKnightCharging] = useState<Array<{
    id: string;
    position: Vector3;
    direction: Vector3;
    startTime: number;
  }>>([]);
  const [activeDeathKnightSlash, setActiveDeathKnightSlash] = useState<Array<{
    id: string;
    position: Vector3;
    direction: Vector3;
    startTime: number;
  }>>([]);
  
  // Ascendant ability effects
  const [activeArchonLightning, setActiveArchonLightning] = useState<Array<{
    id: string;
    position: Vector3;
    target: Vector3;
    startTime: number;
  }>>([]);
  const [activeForcePulse, setActiveForcePulse] = useState<Array<{
    id: string;
    position: Vector3;
    target: Vector3;
    startTime: number;
  }>>([]);
  const [activeAscendantCharging, setActiveAscendantCharging] = useState<Array<{
    id: string;
    position: Vector3;
    direction: Vector3;
    startTime: number;
  }>>([]);
  
  // Abomination ability effects
  const [activeLeapIndicator, setActiveLeapIndicator] = useState<Array<{
    id: string;
    position: Vector3;
    direction: Vector3;
    startTime: number;
  }>>([]);
  
  // Skeleton ability effects
  const [activeSkeletonCharging, setActiveSkeletonCharging] = useState<Array<{
    id: string;
    position: Vector3;
    direction: Vector3;
    attackRange: number;
    chargeDuration: number;
    startTime: number;
  }>>([]);
  const [activeSkeletonSlash, setActiveSkeletonSlash] = useState<Array<{
    id: string;
    position: Vector3;
    direction: Vector3;
    startTime: number;
  }>>([]);
  
  // Reaper ability effects
  const [activeReaperMist, setActiveReaperMist] = useState<Array<{
    id: string;
    position: Vector3;
    startTime: number;
  }>>([]);
  
  // Use refs for smooth position interpolation
  const currentPosition = useRef(enemy.position.clone());
  const targetPosition = useRef(enemy.position.clone());
  const currentRotation = useRef(enemy.rotation || 0);
  const targetRotation = useRef(enemy.rotation || 0);

  // Update target position and rotation when server state changes
  useEffect(() => {
    if (enemy.position) {
      targetPosition.current.copy(enemy.position);
    }
    if (enemy.rotation !== undefined) {
      targetRotation.current = enemy.rotation;
    }
  }, [enemy.position, enemy.rotation]);

  // Handle death state
  useEffect(() => {
    if (enemy.health <= 0 && !isDead) {
      setIsDead(true);
      setShowDeathEffect(true);
      // Clear any active fireballs when enemy dies
      setActiveFireballs([]);
      setActiveLightningWarnings([]);
      setActiveLightningStrikes([]);
      // Remove from aggro system when enemy dies
      globalAggroSystem.removeEnemy(enemy.id);
    }
  }, [enemy.health, isDead, enemy.id]);

  // Handle death cleanup
  useEffect(() => {
    if (isDead) {
      const cleanup = setTimeout(() => {
        setShowDeathEffect(false);
        if (enemyRef.current?.parent) {
          enemyRef.current.parent.remove(enemyRef.current);
        }
      }, 3000);
      return () => clearTimeout(cleanup);
    }
  }, [isDead]);

  // Get the target player using aggro system (prioritizes highest aggro, falls back to closest)
  const getTargetPlayer = useCallback((): TargetInfo | null => {
    // Initialize enemy in aggro system
    globalAggroSystem.initializeEnemy(enemy.id);
    
    // Convert players to PlayerInfo format
    const playersInfo: PlayerInfo[] = Array.from(players.values()).map(player => ({
      id: player.id,
      position: player.position,
      name: player.name,
      health: player.health,
      maxHealth: player.maxHealth
    }));
    
    if (playersInfo.length === 0) return null;
    
    // Get highest aggro target
    return globalAggroSystem.getHighestAggroTarget(enemy.id, currentPosition.current, playersInfo, []);
  }, [players, enemy.id]);

  // Get the target player's position (using aggro system)
  const getTargetPlayerPosition = useCallback(() => {
    const targetPlayer = getTargetPlayer();
    return targetPlayer?.position || currentPosition.current;
  }, [getTargetPlayer]);

  // Keep backward compatibility for existing code
  const getClosestPlayerPosition = useCallback(() => {
    return getTargetPlayerPosition();
  }, [getTargetPlayerPosition]);

  // Listen for special ability events from multiplayer context
  useEffect(() => {
    if (!socket) return;

    const handleMageFireball = (data: { enemyId: string; startPosition: { x: number; y: number; z: number }; targetPosition: { x: number; y: number; z: number } }) => {
      if (data.enemyId === enemy.id) {
        const targetPlayerPos = getTargetPlayerPosition();
        setActiveFireballs(prev => [...prev, {
          id: `fireball-${Date.now()}`,
          position: new Vector3(data.startPosition.x, data.startPosition.y + 2.25, data.startPosition.z),
          target: new Vector3(data.targetPosition.x, data.targetPosition.y + 1.5, data.targetPosition.z),
          playerPosition: targetPlayerPos.clone()
        }]);
      }
    };

    const handleReaperReEmerge = (data: { enemyId: string; newPosition: { x: number; y: number; z: number } }) => {
      if (data.enemyId === enemy.id) {
        setActiveReaperMist(prev => [...prev, {
          id: `reaper-mist-${Date.now()}`,
          position: new Vector3(data.newPosition.x, data.newPosition.y, data.newPosition.z),
          startTime: Date.now()
        }]);
      }
    };

    const handleMageLightningStrike = (data: { enemyId: string; targetPosition: { x: number; y: number; z: number }; warningDuration: number }) => {
      if (data.enemyId === enemy.id) {
        const warningId = `lightning-warning-${Date.now()}`;
        
        setActiveLightningWarnings(prev => [...prev, {
          id: warningId,
          position: data.targetPosition,
          startTime: Date.now(),
          duration: data.warningDuration
        }]);
        
        setTimeout(() => {
          setActiveLightningWarnings(prev => prev.filter(w => w.id !== warningId));
          
          const strikeId = `lightning-strike-${Date.now()}`;
          setActiveLightningStrikes(prev => [...prev, {
            id: strikeId,
            position: data.targetPosition,
            startTime: Date.now()
          }]);
          
          setTimeout(() => {
            setActiveLightningStrikes(prev => prev.filter(s => s.id !== strikeId));
          }, 3000);
        }, data.warningDuration * 1000);
      }
    };

    const handleDeathKnightDeathGrasp = (data: { enemyId: string; startPosition: { x: number; y: number; z: number }; targetPosition: { x: number; y: number; z: number } }) => {
      if (data.enemyId === enemy.id) {
        setActiveDeathGrasp(prev => [...prev, {
          id: `death-grasp-${Date.now()}`,
          position: new Vector3(data.startPosition.x, data.startPosition.y, data.startPosition.z),
          target: new Vector3(data.targetPosition.x, data.targetPosition.y, data.targetPosition.z),
          startTime: Date.now()
        }]);
      }
    };

    const handleDeathKnightFrostStrike = (data: { enemyId: string; startPosition: { x: number; y: number; z: number }; targetPosition: { x: number; y: number; z: number } }) => {
      if (data.enemyId === enemy.id) {
        setActiveFrostStrike(prev => [...prev, {
          id: `frost-strike-${Date.now()}`,
          position: new Vector3(data.startPosition.x, data.startPosition.y, data.startPosition.z),
          target: new Vector3(data.targetPosition.x, data.targetPosition.y, data.targetPosition.z),
          startTime: Date.now()
        }]);
      }
    };

    const handleAscendantArchonLightning = (data: { enemyId: string; startPosition: { x: number; y: number; z: number }; targetPosition: { x: number; y: number; z: number } }) => {
      if (data.enemyId === enemy.id) {
        setActiveArchonLightning(prev => [...prev, {
          id: `archon-lightning-${Date.now()}`,
          position: new Vector3(data.startPosition.x, data.startPosition.y, data.startPosition.z),
          target: new Vector3(data.targetPosition.x, data.targetPosition.y, data.targetPosition.z),
          startTime: Date.now()
        }]);
      }
    };

    const handleAscendantForcePulse = (data: { enemyId: string; startPosition: { x: number; y: number; z: number }; targetPosition: { x: number; y: number; z: number } }) => {
      if (data.enemyId === enemy.id) {
        setActiveForcePulse(prev => [...prev, {
          id: `force-pulse-${Date.now()}`,
          position: new Vector3(data.startPosition.x, data.startPosition.y, data.startPosition.z),
          target: new Vector3(data.targetPosition.x, data.targetPosition.y, data.targetPosition.z),
          startTime: Date.now()
        }]);
      }
    };

    const handleAscendantBlink = (data: { enemyId: string; newPosition: { x: number; y: number; z: number } }) => {
      if (data.enemyId === enemy.id) {
        setActiveReaperMist(prev => [...prev, {
          id: `reaper-mist-${Date.now()}`,
          position: new Vector3(data.newPosition.x, data.newPosition.y, data.newPosition.z),
          startTime: Date.now()
        }]);
      }
    };

    const handleAbominationLeap = (data: { enemyId: string; newPosition: { x: number; y: number; z: number } }) => {
      if (data.enemyId === enemy.id) {
        const direction = new Vector3(data.newPosition.x, data.newPosition.y, data.newPosition.z)
          .sub(currentPosition.current).normalize();
        
        setActiveLeapIndicator(prev => [...prev, {
          id: `leap-${Date.now()}`,
          position: currentPosition.current.clone(),
          direction: direction,
          startTime: Date.now()
        }]);
      }
    };



    const handleDeathKnightAttack = (data: { enemyId: string; startPosition: { x: number; y: number; z: number }; targetPosition: { x: number; y: number; z: number } }) => {
      if (data.enemyId === enemy.id && enemy.type === 'death-knight') {
        const direction = new Vector3(data.targetPosition.x, data.targetPosition.y, data.targetPosition.z)
          .sub(new Vector3(data.startPosition.x, data.startPosition.y, data.startPosition.z)).normalize();
        
        setActiveDeathKnightCharging(prev => [...prev, {
          id: `deathknight-charging-${Date.now()}`,
          position: new Vector3(data.startPosition.x, data.startPosition.y, data.startPosition.z),
          direction: direction,
          startTime: Date.now()
        }]);
        
        setTimeout(() => {
          setActiveDeathKnightCharging(prev => prev.filter(c => c.id !== `deathknight-charging-${Date.now()}`));
          setActiveDeathKnightSlash(prev => [...prev, {
            id: `deathknight-slash-${Date.now()}`,
            position: new Vector3(data.startPosition.x, data.startPosition.y, data.startPosition.z),
            direction: direction,
            startTime: Date.now()
          }]);
        }, 1100);
      }
    };

    const handleAscendantAttack = (data: { enemyId: string; startPosition: { x: number; y: number; z: number }; targetPosition: { x: number; y: number; z: number } }) => {
      if (data.enemyId === enemy.id && enemy.type === 'ascendant') {
        const direction = new Vector3(data.targetPosition.x, data.targetPosition.y, data.targetPosition.z)
          .sub(new Vector3(data.startPosition.x, data.startPosition.y, data.startPosition.z)).normalize();
        
        setActiveAscendantCharging(prev => [...prev, {
          id: `ascendant-charging-${Date.now()}`,
          position: new Vector3(data.startPosition.x, data.startPosition.y, data.startPosition.z),
          direction: direction,
          startTime: Date.now()
        }]);
        
        setTimeout(() => {
          setActiveAscendantCharging(prev => prev.filter(c => c.id !== `ascendant-charging-${Date.now()}`));
          setActiveArchonLightning(prev => [...prev, {
            id: `archon-lightning-${Date.now()}`,
            position: new Vector3(data.startPosition.x, data.startPosition.y, data.startPosition.z),
            target: new Vector3(data.targetPosition.x, data.targetPosition.y, data.targetPosition.z),
            startTime: Date.now()
          }]);
        }, 1000);
      }
    };

    const handleReaperMist = (data: { enemyId: string; startPosition: { x: number; y: number; z: number } }) => {
      if (data.enemyId === enemy.id && enemy.type === 'reaper') {
        setActiveReaperMist(prev => [...prev, {
          id: `reaper-mist-${Date.now()}`,
          position: new Vector3(data.startPosition.x, data.startPosition.y, data.startPosition.z),
          startTime: Date.now()
        }]);
      }
    };

    // Handle skeleton charging (matches single player charging indicator)
    const handleSkeletonCharging = (data: { 
      enemyId: string; 
      startPosition: { x: number; y: number; z: number }; 
      targetPosition: { x: number; y: number; z: number };
      chargeDuration: number;
      attackRange: number;
    }) => {
      if (data.enemyId === enemy.id && enemy.type === 'skeleton') {
        const direction = new Vector3(data.targetPosition.x, data.targetPosition.y, data.targetPosition.z)
          .sub(new Vector3(data.startPosition.x, data.startPosition.y, data.startPosition.z))
          .normalize();
        
        setActiveSkeletonCharging(prev => [...prev, {
          id: `skeleton-charging-${Date.now()}`,
          position: new Vector3(data.startPosition.x, data.startPosition.y, data.startPosition.z),
          direction: direction,
          attackRange: data.attackRange,
          chargeDuration: data.chargeDuration,
          startTime: Date.now()
        }]);
        
        console.log(`⚡ Skeleton ${enemy.id} charging indicator started`);
      }
    };

    // Handle skeleton attack start (for slash effect)
    const handleSkeletonAttackStart = (data: { 
      enemyId: string; 
      attackType: string;
      startPosition: { x: number; y: number; z: number }; 
      targetPosition: { x: number; y: number; z: number } | null;
    }) => {
      if (data.enemyId === enemy.id && data.attackType === 'skeleton') {
        // Handle case where targetPosition might be null
        if (!data.targetPosition) {
          console.warn(`⚔️ Skeleton ${enemy.id} attack start received with null targetPosition`);
          return;
        }
        
        const direction = new Vector3(data.targetPosition.x, data.targetPosition.y, data.targetPosition.z)
          .sub(new Vector3(data.startPosition.x, data.startPosition.y, data.startPosition.z))
          .normalize();
        
        // Calculate slash position to match single player version
        const slashPosition = new Vector3(data.startPosition.x, data.startPosition.y, data.startPosition.z);
        slashPosition.add(direction.clone().multiplyScalar(1.2)); // Move forward like single player
        slashPosition.y += 0.65; // Raise it slightly off the ground (matches single player)
        slashPosition.z -= 0.5; // Adjust Z position (matches single player)
        
        setActiveSkeletonSlash(prev => [...prev, {
          id: `skeleton-slash-${Date.now()}`,
          position: slashPosition,
          direction: direction,
          startTime: Date.now()
        }]);
        
        console.log(`⚔️ Skeleton ${enemy.id} slash effect started`);
      }
    };

    socket.on('mage-fireball-cast', handleMageFireball);
    socket.on('reaper-re-emerged', handleReaperReEmerge);
    socket.on('mage-lightning-strike', handleMageLightningStrike);
    socket.on('deathknight-death-grasp-cast', handleDeathKnightDeathGrasp);
    socket.on('deathknight-frost-strike-cast', handleDeathKnightFrostStrike);
    socket.on('ascendant-archon-lightning-cast', handleAscendantArchonLightning);
    socket.on('ascendant-force-pulse-cast', handleAscendantForcePulse);
    socket.on('ascendant-blinked', handleAscendantBlink);
    socket.on('abomination-leaped', handleAbominationLeap);

    socket.on('enemy-attacked-player', handleDeathKnightAttack);
    socket.on('enemy-attacked-player', handleAscendantAttack);
    socket.on('reaper-mist-effect', handleReaperMist);
    socket.on('enemy-charging', handleSkeletonCharging);
    socket.on('enemy-attack-start', handleSkeletonAttackStart);

    return () => {
      socket.off('mage-fireball-cast', handleMageFireball);
      socket.off('reaper-re-emerged', handleReaperReEmerge);
      socket.off('mage-lightning-strike', handleMageLightningStrike);
      socket.off('deathknight-death-grasp-cast', handleDeathKnightDeathGrasp);
      socket.off('deathknight-frost-strike-cast', handleDeathKnightFrostStrike);
      socket.off('ascendant-archon-lightning-cast', handleAscendantArchonLightning);
      socket.off('ascendant-force-pulse-cast', handleAscendantForcePulse);
      socket.off('ascendant-blinked', handleAscendantBlink);
      socket.off('abomination-leaped', handleAbominationLeap);

      socket.off('enemy-attacked-player', handleDeathKnightAttack);
      socket.off('enemy-attacked-player', handleAscendantAttack);
      socket.off('reaper-mist-effect', handleReaperMist);
      socket.off('enemy-charging', handleSkeletonCharging);
      socket.off('enemy-attack-start', handleSkeletonAttackStart);
    };
  }, [getTargetPlayerPosition, enemy.id, socket, enemy.type, currentPosition]);

  // Smooth position and rotation interpolation
  useFrame((_, delta) => {
    if (!enemyRef.current || enemy.health <= 0) return;

    // Check if enemy is currently charging (has active charging indicators)
    const isCurrentlyCharging = activeSkeletonCharging.length > 0 || 
                               activeDeathKnightCharging.length > 0 || 
                               activeAscendantCharging.length > 0;

    // Always interpolate position to match server state, but adjust interpolation speed
    // This prevents teleporting when attacks complete
    if (enemy.isMoving && !enemy.isCharging && !enemy.isAttacking && !isCurrentlyCharging) {
      // Normal movement - fast interpolation
      currentPosition.current.lerp(targetPosition.current, 10 * delta);
    } else {
      // During charging/attacking - slower interpolation to prevent teleporting
      // Still sync with server but more gradually
      const distance = currentPosition.current.distanceTo(targetPosition.current);
      if (distance > 0.1) { // Only interpolate if there's a meaningful difference
        currentPosition.current.lerp(targetPosition.current, 2 * delta);
      }
    }
    
    // Always update the visual position
    enemyRef.current.position.copy(currentPosition.current);

    // Always update rotation for proper facing direction
    const rotationDiff = targetRotation.current - currentRotation.current;
    let normalizedDiff = rotationDiff;
    
    // Normalize rotation difference to shortest path
    while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
    while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
    
    currentRotation.current += normalizedDiff * 10 * delta;
    enemyRef.current.rotation.y = currentRotation.current;
  });

  // Get enemy model based on type (using visual models only)
  const getEnemyModel = () => {
    const isAttacking = enemy.isAttacking || false;
    const isMoving = enemy.isMoving || false;
    const playerPosition = getTargetPlayerPosition();

    switch (enemy.type) {
      case 'skeleton':
        return (
          <CustomSkeleton
            position={[0, 0.795, 0]}
            isAttacking={isAttacking}
            isWalking={isMoving}
            onHit={() => {}} // Remove damage handling - handled by Unit collision detection
          />
        );
      
      case 'mage':
        return (
          <CustomSkeletonMage
            position={[0, 0.76, 0]}
            isAttacking={isAttacking}
            isWalking={isMoving}
            onHit={() => {}} // Remove damage handling - handled by Unit collision detection
          />
        );
      
      case 'abomination':
        return (
          <CustomAbomination
            position={[0, 0.765, 0]}
            isAttacking={isAttacking}
            isWalking={isMoving}
            onHit={() => {}} // Remove damage handling - handled by Unit collision detection
          />
        );
      
      case 'reaper':
        return (
          <ReaperModel
            isAttacking={isAttacking}
            isWalking={isMoving}
            onHit={() => {}} // Remove damage handling - handled by Unit collision detection
            playerPosition={playerPosition}
          />
        );
      
      case 'fallen-titan':
        return (
          <FallenTitanModel
            position={[0, 0, 0]}
            isAttacking={isAttacking}
            isWalking={isMoving}
            onHit={() => {}} // Remove damage handling - handled by Unit collision detection
          />
        );
      
      case 'ascendant':
        return (
          <AscendantModel
            isAttacking={isAttacking}
            onHit={() => {}} // Remove damage handling - handled by Unit collision detection
          />
        );
      
      case 'death-knight':
        return (
          <DeathKnightModel
            position={[0, 0, 0]}
            isAttacking={isAttacking}
            isWalking={isMoving}
            onHit={() => {}} // Remove damage handling - handled by Unit collision detection
          />
        );
      
      default:
        return null;
    }
  };

  // Get health bar height based on enemy type
  const getHealthBarHeight = () => {
    switch (enemy.type) {
      case 'skeleton': return 2.5;
      case 'mage': return 3.5;
      case 'abomination': return 5.5;
      case 'reaper': return 3.2;
      case 'fallen-titan': return 6.5; // Much taller
      case 'ascendant': return 4.2; // Slightly taller than reaper
      case 'death-knight': return 3.2; // Slightly taller than reaper
      default: return 2.5;
    }
  };

  return (
    <>
      <group 
        ref={enemyRef} 
        visible={!isSpawning && enemy.health > 0}
        position={currentPosition.current}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {getEnemyModel()}
        
        {/* Status effect visual indicators */}
        {enemy.isStunned && (
          <mesh position={[0, getHealthBarHeight() + 1, 0]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial
              color="#FFD700"
              emissive="#FFD700"
              emissiveIntensity={0.5}
              transparent
              opacity={0.8}
            />
          </mesh>
        )}
        
        {enemy.isFrozen && (
          <mesh position={[0, getHealthBarHeight() + 0.5, 0]}>
            <icosahedronGeometry args={[0.4, 1]} />
            <meshStandardMaterial
              color="#87CEEB"
              emissive="#87CEEB"
              emissiveIntensity={0.7}
              transparent
              opacity={0.9}
            />
          </mesh>
        )}
        
        {enemy.isSlowed && (
          <mesh position={[0, getHealthBarHeight() + 0.2, 0]}>
            <ringGeometry args={[0.2, 0.4, 8]} />
            <meshStandardMaterial
              color="#8B4513"
              emissive="#8B4513"
              emissiveIntensity={0.3}
              transparent
              opacity={0.7}
            />
          </mesh>
        )}
        
        {/* Health bar for all enemy types */}
        <Billboard
          position={[0, getHealthBarHeight(), 0]}
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          {enemy.health > 0 && (
            <>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[2.0, 0.25]} />
                <meshBasicMaterial color="#333333" opacity={0.8} transparent />
              </mesh>
              <mesh position={[-1.0 + (enemy.health / enemy.maxHealth), 0, 0.001]}>
                <planeGeometry args={[(enemy.health / enemy.maxHealth) * 2.0, 0.23]} />
                <meshBasicMaterial color="#ff3333" opacity={0.9} transparent />
              </mesh>
              <Text
                position={[0, 0, 0.002]}
                fontSize={0.2}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
              >
                {`${Math.ceil(enemy.health)}/${enemy.maxHealth}`}
              </Text>
            </>
          )}
        </Billboard>
      </group>

      {/* Spawn animation */}
      {isSpawning && (
        <BoneVortex2 
          position={currentPosition.current}
          onComplete={() => {
            setIsSpawning(false);
          }}
          isSpawning={true}
          scale={enemy.type === 'abomination' ? 1.5 : enemy.type === 'fallen-titan' ? 2.4 : enemy.type === 'ascendant' ? 1.15 : 1.0}
        />
      )}

      {/* Death animation */}
      {showDeathEffect && (
        <BoneVortex 
          position={currentPosition.current}
          onComplete={() => {
            setShowDeathEffect(false);
          }}
          isSpawning={false}
          weaponType={weaponType}
          weaponSubclass={undefined}
          scale={enemy.type === 'abomination' ? 1.5 : enemy.type === 'fallen-titan' ? 2.4 : enemy.type === 'ascendant' ? 1.15 : 1.0}
        />
      )}

      {/* Frost effect for sabres */}
      {showFrostEffect && (
        <FrostExplosion
          position={currentPosition.current}
          onComplete={() => setShowFrostEffect(false)}
        />
      )}

      {/* Special ability effects */}
      {/* Mage fireballs */}
      {activeFireballs.map(fireball => (
        <MageFireball
          key={fireball.id}
          playerPosition={fireball.playerPosition}
          position={fireball.position}
          target={fireball.target}
          onHit={() => {
            setActiveFireballs(prev => prev.filter(f => f.id !== fireball.id));
          }}
          getCurrentPlayerPosition={getClosestPlayerPosition}
        />
      ))}


      {/* Lightning warning indicators */}
      {activeLightningWarnings.map(warning => (
        <LightningWarningIndicator
          key={warning.id}
          position={new Vector3(warning.position.x, warning.position.y, warning.position.z)}
          duration={warning.duration}
          onComplete={() => {
            setActiveLightningWarnings(prev => prev.filter(w => w.id !== warning.id));
          }}
        />
      ))}

      {/* Lightning strikes */}
      {activeLightningStrikes.map(strike => (
        <MageLightningStrike
          key={strike.id}
          position={new Vector3(strike.position.x, strike.position.y, strike.position.z)}
          onComplete={() => {
            setActiveLightningStrikes(prev => prev.filter(s => s.id !== strike.id));
          }}
        />
      ))}

      {/* Death Knight ability effects */}
      {/* Death Grasp */}
      {activeDeathGrasp.map(effect => (
        <DeathGrasp
          key={effect.id}
          startPosition={effect.position}
          targetPosition={effect.target}
          onComplete={() => {
            setActiveDeathGrasp(prev => prev.filter(e => e.id !== effect.id));
          }}
          onPullStart={() => {}}
        />
      ))}

      {/* Frost Strike */}
      {activeFrostStrike.map(effect => (
        <FrostStrike
          key={effect.id}
          position={effect.position}
          direction={new Vector3().subVectors(effect.target, effect.position).normalize()}
          onComplete={() => {
            setActiveFrostStrike(prev => prev.filter(e => e.id !== effect.id));
          }}
          parentRef={enemyRef}
        />
      ))}

      {/* Death Knight Charging Indicator */}
      {activeDeathKnightCharging.map(effect => (
        <DeathKnightChargingIndicator
          key={effect.id}
          position={effect.position}
          direction={effect.direction}
          attackRange={3.0}
          chargeDuration={1100}
          onComplete={() => {
            setActiveDeathKnightCharging(prev => prev.filter(e => e.id !== effect.id));
          }}
        />
      ))}

      {/* Death Knight Slash Effect */}
      {activeDeathKnightSlash.map(effect => (
        <DeathKnightSlashEffect
          key={effect.id}
          startPosition={effect.position}
          direction={effect.direction}
          onComplete={() => {
            setActiveDeathKnightSlash(prev => prev.filter(e => e.id !== effect.id));
          }}
        />
      ))}

      {/* Ascendant ability effects */}
      {/* Archon Lightning */}
      {activeArchonLightning.map(effect => (
        <ArchonLightning
          key={effect.id}
          startPosition={effect.position}
          targetPosition={effect.target}
          onComplete={() => {
            setActiveArchonLightning(prev => prev.filter(e => e.id !== effect.id));
          }}
        />
      ))}

      {/* Force Pulse */}
      {activeForcePulse.map(effect => (
        <AscendantForcePulse
          key={effect.id}
          position={effect.position}
          onComplete={() => {
            setActiveForcePulse(prev => prev.filter(e => e.id !== effect.id));
          }}
        />
      ))}

      {/* Ascendant Charging Indicator */}
      {activeAscendantCharging.map(effect => (
        <AscendantChargingIndicator
          key={effect.id}
          startPosition={effect.position}
          targetPosition={effect.position.clone().add(effect.direction.clone().multiplyScalar(4.0))}
          chargeDuration={1000}
          onComplete={() => {
            setActiveAscendantCharging(prev => prev.filter(e => e.id !== effect.id));
          }}
        />
      ))}

      {/* Abomination ability effects */}
      {/* Leap Indicator */}
      {activeLeapIndicator.map(effect => (
        <AbominationLeapIndicator
          key={effect.id}
          position={effect.position}
          onComplete={() => {
            setActiveLeapIndicator(prev => prev.filter(e => e.id !== effect.id));
          }}
        />
      ))}

      {/* Skeleton ability effects */}
      {/* Charging Indicator */}
      {activeSkeletonCharging.map(effect => (
        <SkeletonChargingIndicator
          key={effect.id}
          position={effect.position}
          direction={effect.direction}
          attackRange={effect.attackRange}
          chargeDuration={effect.chargeDuration}
          onComplete={() => {
            setActiveSkeletonCharging(prev => prev.filter(e => e.id !== effect.id));
          }}
        />
      ))}

      {/* Slash Effect */}
      {activeSkeletonSlash.map(effect => (
        <EnemySlashEffect
          key={effect.id}
          startPosition={effect.position}
          direction={effect.direction}
          onComplete={() => {
            setActiveSkeletonSlash(prev => prev.filter(e => e.id !== effect.id));
          }}
        />
      ))}

      {/* Reaper ability effects */}
      {/* Reaper Mist Effect */}
      {activeReaperMist.map(effect => (
        <ReaperMistEffect
          key={effect.id}
          position={effect.position}
          duration={1000}
          onComplete={() => {
            setActiveReaperMist(prev => prev.filter(e => e.id !== effect.id));
          }}
        />
      ))}
    </>
  );
}