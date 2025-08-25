import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Vector3 } from 'three';
import { WeaponType, WeaponSubclass } from '@/Weapons/weapons';
import { globalAggroSystem } from '@/Versus/AggroSystem';
import { performanceMonitor } from '@/Scene/PerformanceMonitor';

// Effect synchronization interface
export interface SynchronizedEffect {
  id: string;
  type: 'smite' | 'fireball' | 'fireballExplosion' | 'bowProjectile' | 'bowCharge' | 'stealth' | 'whirlwind' |
        // Sword abilities
        'divineStorm' | 'crusaderAura' | 'colossusStrike' | 'oathstrike' | 'aegis' | 'divineShield' |
        'chainLightning' | 'swordCombo' |
        // Scythe abilities  
        'totem' | 'crossentropy' | 'dragonClaw' | 'dragonBreath' | 'dualWield' |
        'soulReaper' | 'soulReaperMark' | 'soulReaperSword' | 'abyssalSlash' | 'frenzyAura' |
        // Sabre abilities
        'firebeam' | 'glacialShard' | 'glacialShardTrail' | 'glacialShardShield' | 'deepFreeze' | 
        'stealthStrike' | 'stealthMist' | 'blizzard' | 'icicleProjectile' |
        // Spear abilities  
        'pyroclast' | 'pyroclastTrail' | 'pyroclastExplosion' | 'reignite' | 'breach' |
        'lavaLashProjectile' | 'lavaLashTrail' |
        // Bow abilities
        'bowPowershot' | 'bowPowershotTrail' | 'quickShot' | 'barrageProjectile' | 'eagleEyeEffect' |
        'venomEffect' | 'guidedBolt' |
        // Additional effects
        'holyBurn' | 'swordAnimation';
  position: Vector3;
  direction: Vector3;
  startTime: number;
  duration?: number;
  // Ability-specific data
  power?: number; // For bow shots
  targetPosition?: Vector3; // For smite, oathstrike
  isFullyCharged?: boolean; // For bow
  // Fireball-specific data
  speed?: number; // Movement speed
  lifespan?: number; // Max travel time
  hasCollided?: boolean; // Collision state
  collisionPosition?: Vector3; // Position where collision occurred
  collisionTime?: number; // When collision occurred
  fireballId?: string; // Unique fireball identifier for collision updates
  // Sword-specific data
  weaponType?: string; // For sword animations
  subclass?: string; // For subclass-specific effects
  // Aegis-specific data
  bounceCount?: number; // For aegis projectile bounces
  // Totem-specific data
  totemId?: string; // For totem summoning
  // Dragon Breath-specific data
  coneAngle?: number; // For breath cone angle
  range?: number; // For breath range
  // Dual wield data
  isSecondaryWeapon?: boolean; // For dual scythe tracking
  // Bow-specific data
  isPerfectShot?: boolean; // For perfect bow shots
  isElementalShot?: boolean; // For elemental bow shots
  isVenomShot?: boolean; // For venom bow shots
  projectileId?: string; // For tracking individual projectiles
  // Combo data
  comboStep?: number; // For combo attacks (sword, icicles)
  // Chain lightning data
  chainTargets?: Vector3[]; // For chain lightning targets
  // Soul Reaper data
  markDuration?: number; // For soul reaper mark duration
  // Effect intensity/scale
  intensity?: number; // For variable intensity effects
  scale?: number; // For variable scale effects
}

// Server data interfaces
interface ServerPlayer {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  weapon: WeaponType;
  subclass?: WeaponSubclass;
  health: number;
  maxHealth: number;
}

interface ServerEnemy {
  id: string;
  type: 'skeleton' | 'mage' | 'abomination' | 'reaper' | 'fallen-titan' | 'ascendant' | 'death-knight';
  position: { x: number; y: number; z: number };
  health: number;
  maxHealth: number;
  isDying?: boolean;
}

// Client-side types
export interface MultiplayerPlayer {
  id: string;
  name: string;
  position: Vector3;
  rotation: Vector3;
  weapon: WeaponType;
  subclass?: WeaponSubclass;
  health: number;
  maxHealth: number;
  isConnected: boolean;
  // Add animation states
  isSwinging: boolean;
  isSmiting: boolean;
  isWhirlwinding: boolean;
  isBowCharging: boolean;
  isStealthed: boolean;
  movementDirection: Vector3;
  currentAbility: string | null;
  lastAttackTime: number;
  lastAbilityTime: number;
  activeEffects: SynchronizedEffect[];
}

export interface MultiplayerEnemy {
  id: string;
  type: 'skeleton' | 'mage' | 'abomination' | 'reaper' | 'fallen-titan' | 'ascendant' | 'death-knight';
  position: Vector3;
  health: number;
  maxHealth: number;
  isDying?: boolean;
  // Server-controlled properties
  isMoving?: boolean;
  isAttacking?: boolean;
  isCharging?: boolean;
  targetPlayerId?: string;
  rotation?: number;
  lastServerUpdate?: number;
  // Status effects
  isStunned?: boolean;
  isFrozen?: boolean;
  isSlowed?: boolean;
}

export interface RoomPreview {
  roomId: string;
  exists: boolean;
  players: ServerPlayer[];
  playerCount: number;
  maxPlayers: number;
  enemies: ServerEnemy[];
}

export interface MultiplayerContextType {
  // Connection state
  socket: Socket | null;
  isConnected: boolean;
  roomId: string | null;
  playerId: string | null;
  isInRoom: boolean;
  connectionError: string | null;
  
  // Game state
  players: Map<string, MultiplayerPlayer>;
  enemies: Map<string, MultiplayerEnemy>;
  killCount: number;
  gameStarted: boolean;
  
  // Current player state
  currentPlayerHealth: number;
  currentPlayerMaxHealth: number;
  
  // Room preview
  currentPreview: RoomPreview | null;
  
  // Actions
  joinRoom: (roomId: string, playerName: string, weapon: WeaponType, subclass?: WeaponSubclass) => void;
  leaveRoom: () => void;
  startGame: () => void;
  previewRoom: (roomId: string) => void;
  clearPreview: () => void;
  updatePlayerPosition: (position: Vector3, rotation: Vector3, movementDirection?: Vector3) => void;
  changeWeapon: (weapon: WeaponType, subclass?: WeaponSubclass) => void;
  damageEnemy: (enemyId: string, damage: number, position: Vector3, damageType?: string, isCritical?: boolean) => void;
  updatePlayerHealth: (health: number) => void;
  healAllies: (healAmount: number, position: Vector3, abilityType: 'reanimate' | 'oathstrike') => void;
  sendAttackAnimation: (attackType: string, position: Vector3, direction: Vector3) => void;
  sendAbilityAnimation: (abilityType: string, position: Vector3, direction: Vector3, target?: string) => void;
  sendEffect: (effect: Omit<SynchronizedEffect, 'id' | 'startTime'>) => void;
  applyEnemyStatusEffect: (enemyId: string, effectType: 'stun' | 'freeze' | 'slow', duration: number) => void;
}

const MultiplayerContext = createContext<MultiplayerContextType | null>(null);

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  }
  return context;
};

interface MultiplayerProviderProps {
  children: React.ReactNode;
  serverUrl?: string;
}

export const MultiplayerProvider: React.FC<MultiplayerProviderProps> = ({ 
  children, 
  serverUrl = process.env.NEXT_PUBLIC_MULTIPLAYER_SERVER_URL || 
    (process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8080' 
      : 'https://eidolon-vi-multiplayer-backend.fly.dev')
}) => {
  // Connection state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Game state
  const [players, setPlayers] = useState<Map<string, MultiplayerPlayer>>(new Map());
  const [enemies, setEnemies] = useState<Map<string, MultiplayerEnemy>>(new Map());
  const [killCount, setKillCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Current player state
  const [currentPlayerHealth, setCurrentPlayerHealth] = useState(200);
  const [currentPlayerMaxHealth, setCurrentPlayerMaxHealth] = useState(200);
  
  // Room preview state
  const [currentPreview, setCurrentPreview] = useState<RoomPreview | null>(null);
  
  // Refs for throttling
  const lastPositionUpdate = useRef<number>(0);
  const positionUpdateThrottle = 100; // 10 updates per second max (reduced from 20fps to 10fps)

  // Initialize socket connection
  useEffect(() => {
    console.log('Connecting to multiplayer server:', serverUrl);
    
    const newSocket = io(serverUrl, {
      autoConnect: true,  // Enable auto-connect
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'], // Explicitly specify transports
      timeout: 20000, // Increase timeout
    });

    // Start heartbeat system
    const heartbeatInterval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('heartbeat');
      }
    }, 45000); // Send heartbeat every 45 seconds (reduced frequency)

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to multiplayer server');
      setIsConnected(true);
      setConnectionError(null);
      setPlayerId(newSocket.id || '');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionError(error.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from multiplayer server:', reason);
      setIsConnected(false);
      setIsInRoom(false);
      setRoomId(null);
      setPlayerId(null);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Room events
    newSocket.on('room-joined', (data: { 
      roomId: string; 
      playerId: string; 
      players: ServerPlayer[]; 
      enemies: ServerEnemy[];
      killCount?: number;
      gameStarted?: boolean;
    }) => {
      console.log('Joined room:', data);
      setRoomId(data.roomId);
      setPlayerId(data.playerId);
      setIsInRoom(true);
      setConnectionError(null);
      
      // Set game state
      const initialKillCount = data.killCount || 0;
      setKillCount(initialKillCount);
      setGameStarted(data.gameStarted || false);
      
      // Set initial health values based on kill count (matches single player logic)
      const initialMaxHealth = 200 + initialKillCount;
      setCurrentPlayerMaxHealth(initialMaxHealth);
      // Start with full health when joining
      setCurrentPlayerHealth(initialMaxHealth);
      
      // Update players
      const playersMap = new Map();
      data.players.forEach((player: ServerPlayer) => {
        playersMap.set(player.id, {
          ...player,
          position: new Vector3(player.position.x, player.position.y, player.position.z),
          rotation: new Vector3(player.rotation.x, player.rotation.y, player.rotation.z),
          subclass: player.subclass,
          isConnected: true,
          // Initialize animation states
          isSwinging: false,
          isSmiting: false,
          isWhirlwinding: false,
          isBowCharging: false,
          isStealthed: false,
          movementDirection: new Vector3(),
          currentAbility: null,
          lastAttackTime: 0,
          lastAbilityTime: 0,
          activeEffects: [] // Initialize active effects
        });
        
        // Set current player health if this is our player
        if (player.id === data.playerId) {
          setCurrentPlayerHealth(player.health);
          setCurrentPlayerMaxHealth(player.maxHealth);
        }
      });
      setPlayers(playersMap);
      
      // Update enemies
      const enemiesMap = new Map();
      data.enemies.forEach((enemy: ServerEnemy) => {
        console.log('🎯 Initial enemy from room-joined:', enemy.type, enemy.id, `Health: ${enemy.health}/${enemy.maxHealth}`);
        enemiesMap.set(enemy.id, {
          ...enemy,
          position: new Vector3(enemy.position.x, enemy.position.y, enemy.position.z)
        });
      });
      setEnemies(enemiesMap);
      
      // Request up-to-date enemy state from server
      setTimeout(() => {
        newSocket.emit('request-enemy-state', { roomId: data.roomId });
      }, 100);
    });

    newSocket.on('room-full', () => {
      setConnectionError('Room is full (max 3 players)');
    });

    newSocket.on('player-joined', (data: { playerId: string; players: ServerPlayer[] }) => {
      console.log('Player joined:', data);
      setPlayers(prev => {
        const newPlayers = new Map(prev);
        data.players.forEach((player: ServerPlayer) => {
          newPlayers.set(player.id, {
            ...player,
            position: new Vector3(player.position.x, player.position.y, player.position.z),
            rotation: new Vector3(player.rotation.x, player.rotation.y, player.rotation.z),
            subclass: player.subclass,
            isConnected: true,
            // Initialize animation states
            isSwinging: false,
            isSmiting: false,
            isWhirlwinding: false,
            isBowCharging: false,
            isStealthed: false,
            movementDirection: new Vector3(),
            currentAbility: null,
            lastAttackTime: 0,
            lastAbilityTime: 0,
            activeEffects: [] // Initialize active effects
          });
        });
        return newPlayers;
      });
    });

    newSocket.on('player-left', (data: { playerId: string }) => {
      console.log('Player left:', data);
      setPlayers(prev => {
        const newPlayers = new Map(prev);
        newPlayers.delete(data.playerId);
        return newPlayers;
      });
    });

    // Player movement events
    newSocket.on('player-moved', (data: { playerId: string; position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number }; weapon?: WeaponType; subclass?: WeaponSubclass; health?: number; movementDirection?: { x: number; y: number; z: number } }) => {
      setPlayers(prev => {
        const newPlayers = new Map(prev);
        const player = newPlayers.get(data.playerId);
        if (player) {
          newPlayers.set(data.playerId, {
            ...player,
            position: new Vector3(data.position.x, data.position.y, data.position.z),
            rotation: new Vector3(data.rotation.x, data.rotation.y, data.rotation.z),
            weapon: data.weapon || player.weapon,
            subclass: data.subclass !== undefined ? data.subclass : player.subclass,
            health: data.health !== undefined ? data.health : player.health,
            movementDirection: data.movementDirection ? new Vector3(data.movementDirection.x, data.movementDirection.y, data.movementDirection.z) : player.movementDirection
          });
        }
        return newPlayers;
      });
    });

    // Weapon change events
    newSocket.on('player-weapon-changed', (data: { playerId: string; weapon: WeaponType; subclass?: WeaponSubclass }) => {
      setPlayers(prev => {
        const newPlayers = new Map(prev);
        const player = newPlayers.get(data.playerId);
        if (player) {
          newPlayers.set(data.playerId, {
            ...player,
            weapon: data.weapon,
            subclass: data.subclass
          });
        }
        return newPlayers;
      });
    });

    // Attack and ability animation events
    newSocket.on('player-attacked', (data: { playerId: string; attackType: string; position: { x: number; y: number; z: number }; direction: { x: number; y: number; z: number }; timestamp: number; weapon?: WeaponType; subclass?: WeaponSubclass }) => {
      console.log('Player attacked:', data);
      setPlayers(prev => {
        const newPlayers = new Map(prev);
        const player = newPlayers.get(data.playerId);
        if (player) {
          // Calculate animation duration based on actual weapon timing
          // These durations match the real animation calculations in each weapon component
          let animationDuration = 600; // Default
          switch (data.weapon || player.weapon) {
            case WeaponType.SCYTHE:
              // Check if dual wielding (Abyssal subclass level 2+)
              // Dual scythes have different timing similar to Sabres
              if (data.subclass === WeaponSubclass.ABYSSAL) {
                // Dual scythe timing: similar to Sabres with delays
                animationDuration = 350;
              } else {
                // Single scythe: swingProgress += delta * 8 until >= Math.PI * 0.85
                // At 60fps: (Math.PI * 0.85) / 8 / (1/60) ≈ 335ms
                animationDuration = 167.5;
              }
              break;
            case WeaponType.SWORD:
              // swingProgress += delta * 6.75 until >= Math.PI * 0.55 (or 0.9 for combo step 3)
              // At 60fps: (Math.PI * 0.55) / 6.75 / (1/60) ≈ 400ms
              // Note: 3rd combo hit takes longer but we use average timing for multiplayer sync
              animationDuration = 200;
              break;
            case WeaponType.SABRES:
              // Two swings with delays - total duration roughly 350ms
              animationDuration = 350;
              break;
            case WeaponType.SPEAR:
              // Check if Storm subclass (has burst attacks with different timing)
              if (data.subclass === WeaponSubclass.STORM) {
                // Storm spear burst: swingProgress += delta * 22.5 (faster)
                // At 60fps: (Math.PI * 0.75) / 22.5 / (1/60) ≈ 133ms per swing, 3 swings = ~400ms total
                animationDuration = 300;
              } else {
                // Regular spear: swingProgress += delta * 15 until >= Math.PI * 0.75
                // At 60fps: (Math.PI * 0.75) / 15 / (1/60) ≈ 200ms
                animationDuration = 200;
              }
              break;
            case WeaponType.BOW:
              animationDuration = 300; // Quick shots
              break;
          }

          newPlayers.set(data.playerId, {
            ...player,
            isSwinging: true,
            lastAttackTime: data.timestamp,
            currentAbility: data.attackType,
            weapon: data.weapon || player.weapon,
            subclass: data.subclass || player.subclass
          });
          
          // Reset swing state after weapon-specific animation duration
          setTimeout(() => {
            setPlayers(prev => {
              const newPlayers = new Map(prev);
              const player = newPlayers.get(data.playerId);
              if (player) {
                newPlayers.set(data.playerId, {
                  ...player,
                  isSwinging: false,
                  currentAbility: null
                });
              }
              return newPlayers;
            });
          }, animationDuration);
        }
        return newPlayers;
      });
    });

    newSocket.on('player-used-ability', (data: { playerId: string; abilityType: string; position: { x: number; y: number; z: number }; direction: { x: number; y: number; z: number }; timestamp: number }) => {
      console.log('Player used ability:', data);
      setPlayers(prev => {
        const newPlayers = new Map(prev);
        const player = newPlayers.get(data.playerId);
        if (player) {
          const updates: Partial<MultiplayerPlayer> = {
            lastAbilityTime: data.timestamp,
            currentAbility: data.abilityType
          };
          
          // Set ability-specific states
          switch (data.abilityType) {
            case 'smite':
              updates.isSmiting = true;
              updates.isSwinging = true;
              // Reset after smite duration
              setTimeout(() => {
                setPlayers(prev => {
                  const newPlayers = new Map(prev);
                  const player = newPlayers.get(data.playerId);
                  if (player) {
                    newPlayers.set(data.playerId, {
                      ...player,
                      isSmiting: false,
                      isSwinging: false,
                      currentAbility: null
                    });
                  }
                  return newPlayers;
                });
              }, 800);
              break;
            case 'whirlwind':
              updates.isWhirlwinding = true;
              break;
            case 'bowCharge':
              updates.isBowCharging = true;
              break;
            case 'stealth':
              updates.isStealthed = true;
              // Reset after stealth duration
              setTimeout(() => {
                setPlayers(prev => {
                  const newPlayers = new Map(prev);
                  const player = newPlayers.get(data.playerId);
                  if (player) {
                    newPlayers.set(data.playerId, {
                      ...player,
                      isStealthed: false,
                      currentAbility: null
                    });
                  }
                  return newPlayers;
                });
              }, 5000);
              break;
            default:
              // Reset after default ability duration
              setTimeout(() => {
                setPlayers(prev => {
                  const newPlayers = new Map(prev);
                  const player = newPlayers.get(data.playerId);
                  if (player) {
                    newPlayers.set(data.playerId, {
                      ...player,
                      currentAbility: null
                    });
                  }
                  return newPlayers;
                });
              }, 1000);
          }
          
          newPlayers.set(data.playerId, {
            ...player,
            ...updates
          });
        }
        return newPlayers;
      });
    });

    // Listen for effect synchronization from other players
    newSocket.on('player-effect', (data: { 
      playerId: string; 
      effect: {
        type: 'smite' | 'fireball' | 'fireballExplosion' | 'bowProjectile' | 'bowCharge' | 'stealth' | 'whirlwind' |
              'divineStorm' | 'crusaderAura' | 'colossusStrike' | 'oathstrike' | 'aegis' | 'divineShield' |
              'chainLightning' | 'swordCombo' |
              'totem' | 'crossentropy' | 'dragonClaw' | 'dragonBreath' | 'dualWield' |
              'soulReaper' | 'soulReaperMark' | 'soulReaperSword' | 'abyssalSlash' | 'frenzyAura' |
              'firebeam' | 'glacialShard' | 'glacialShardTrail' | 'glacialShardShield' | 'deepFreeze' | 
              'stealthStrike' | 'stealthMist' | 'blizzard' | 'icicleProjectile' |
              'pyroclast' | 'pyroclastTrail' | 'pyroclastExplosion' | 'reignite' | 'breach' |
              'lavaLashProjectile' | 'lavaLashTrail' |
              'bowPowershot' | 'bowPowershotTrail' | 'quickShot' | 'barrageProjectile' | 'eagleEyeEffect' |
              'venomEffect' | 'guidedBolt' |
              'holyBurn' | 'swordAnimation';
        position: { x: number; y: number; z: number };
        direction: { x: number; y: number; z: number };
        duration?: number;
        power?: number;
        targetPosition?: { x: number; y: number; z: number };
        isFullyCharged?: boolean;
        speed?: number; // Movement speed
        lifespan?: number; // Max travel time
        hasCollided?: boolean; // Collision state
        collisionPosition?: { x: number; y: number; z: number }; // Where collision occurred
        collisionTime?: number; // When collision occurred
        fireballId?: string; // Unique fireball identifier for collision updates
        // Extended properties for new abilities
        weaponType?: string;
        subclass?: string;
        bounceCount?: number;
        totemId?: string;
        coneAngle?: number;
        range?: number;
        isSecondaryWeapon?: boolean;
        // New properties for additional effects
        isPerfectShot?: boolean;
        isElementalShot?: boolean;
        isVenomShot?: boolean;
        projectileId?: string;
        comboStep?: number;
        chainTargets?: { x: number; y: number; z: number }[];
        markDuration?: number;
        intensity?: number;
        scale?: number;
      };
      timestamp: number;
    }) => {
      console.log('Player effect received:', data);
      
      // Skip effects from the local player to prevent duplicate rendering
      if (data.playerId === newSocket.id) {
        console.log('Skipping effect from local player:', data.playerId);
        return;
      }
      
      setPlayers(prev => {
        const newPlayers = new Map(prev);
        const player = newPlayers.get(data.playerId);
        if (player) {
          // Special handling for fireball collision updates
          if (data.effect.type === 'fireball' && data.effect.hasCollided && data.effect.fireballId) {
            // Find existing fireball effect to update
            const existingFireballIndex = player.activeEffects.findIndex(
              effect => effect.type === 'fireball' && 
              effect.fireballId === data.effect.fireballId &&
              !effect.hasCollided
            );
            
            if (existingFireballIndex !== -1) {
              // Update existing fireball with collision data
              const updatedEffects = [...player.activeEffects];
              updatedEffects[existingFireballIndex] = {
                ...updatedEffects[existingFireballIndex],
                hasCollided: true,
                collisionPosition: data.effect.collisionPosition ? 
                  new Vector3(data.effect.collisionPosition.x, data.effect.collisionPosition.y, data.effect.collisionPosition.z) : 
                  undefined,
                collisionTime: data.effect.collisionTime
              };
              
              newPlayers.set(data.playerId, {
                ...player,
                activeEffects: updatedEffects
              });
              
              return newPlayers;
            }
          }
          
          // For non-collision updates or new effects, create a new synchronized effect
          const synchronizedEffect: SynchronizedEffect = {
            id: `${data.playerId}-${data.timestamp}`,
            type: data.effect.type,
            position: new Vector3(data.effect.position.x, data.effect.position.y, data.effect.position.z),
            direction: new Vector3(data.effect.direction.x, data.effect.direction.y, data.effect.direction.z),
            startTime: data.timestamp,
            duration: data.effect.duration,
            power: data.effect.power,
            targetPosition: data.effect.targetPosition ? new Vector3(data.effect.targetPosition.x, data.effect.targetPosition.y, data.effect.targetPosition.z) : undefined,
            isFullyCharged: data.effect.isFullyCharged,
            speed: data.effect.speed,
            lifespan: data.effect.lifespan,
            hasCollided: data.effect.hasCollided,
            collisionPosition: data.effect.collisionPosition ? 
              new Vector3(data.effect.collisionPosition.x, data.effect.collisionPosition.y, data.effect.collisionPosition.z) : 
              undefined,
            collisionTime: data.effect.collisionTime,
            fireballId: data.effect.fireballId,
            // Extended properties for new abilities
            weaponType: data.effect.weaponType,
            subclass: data.effect.subclass,
            bounceCount: data.effect.bounceCount,
            totemId: data.effect.totemId,
            coneAngle: data.effect.coneAngle,
            range: data.effect.range,
            isSecondaryWeapon: data.effect.isSecondaryWeapon,
            // New properties for additional effects
            isPerfectShot: data.effect.isPerfectShot,
            isElementalShot: data.effect.isElementalShot,
            isVenomShot: data.effect.isVenomShot,
            projectileId: data.effect.projectileId,
            comboStep: data.effect.comboStep,
            chainTargets: data.effect.chainTargets ? data.effect.chainTargets.map(target => 
              new Vector3(target.x, target.y, target.z)
            ) : undefined,
            markDuration: data.effect.markDuration,
            intensity: data.effect.intensity,
            scale: data.effect.scale
          };

          newPlayers.set(data.playerId, {
            ...player,
            activeEffects: [...player.activeEffects, synchronizedEffect]
          });

          // Clean up effect after its duration or a default timeout
          const effectDuration = data.effect.duration || 5000; // Default 5 second cleanup
          setTimeout(() => {
            setPlayers(prev => {
              const newPlayers = new Map(prev);
              const player = newPlayers.get(data.playerId);
              if (player) {
                newPlayers.set(data.playerId, {
                  ...player,
                  activeEffects: player.activeEffects.filter(effect => effect.id !== synchronizedEffect.id)
                });
              }
              return newPlayers;
            });
          }, effectDuration);
        }
        return newPlayers;
      });
    });

    // Room preview events
    newSocket.on('room-preview', (data: RoomPreview) => {
      console.log('Room preview received:', data);
      console.log('Room exists:', data.exists, 'Player count:', data.playerCount);
      setCurrentPreview(data);
    });

    // Enemy events
    newSocket.on('enemy-health-updated', (data: { enemyId: string; health: number; maxHealth: number; damage: number; wasKilled: boolean; fromPlayerId: string }) => {
      console.log(`[Client] Enemy ${data.enemyId} health updated by player ${data.fromPlayerId}: ${data.health}/${data.maxHealth} (damage: ${data.damage})`);
      setEnemies(prev => {
        const newEnemies = new Map(prev);
        const enemy = newEnemies.get(data.enemyId);
        if (enemy) {
          newEnemies.set(data.enemyId, {
            ...enemy,
            health: data.health,
            isDying: data.wasKilled
          });
        }
        return newEnemies;
      });
    });

    newSocket.on('enemy-died', (data: { enemyId: string }) => {
      setEnemies(prev => {
        const newEnemies = new Map(prev);
        const enemy = newEnemies.get(data.enemyId);
        if (enemy) {
          newEnemies.set(data.enemyId, {
            ...enemy,
            health: 0,
            isDying: true
          });
        }
        return newEnemies;
      });
      
      // Remove enemy after death animation
      setTimeout(() => {
        setEnemies(prev => {
          const newEnemies = new Map(prev);
          newEnemies.delete(data.enemyId);
          return newEnemies;
        });
      }, 1500);
    });

    newSocket.on('enemy-spawned', (data: { enemy: ServerEnemy }) => {
      console.log('🎯 Enemy spawned from server:', data.enemy.type, data.enemy.id, `Health: ${data.enemy.health}/${data.enemy.maxHealth}`);
      const enemy = {
        ...data.enemy,
        position: new Vector3(data.enemy.position.x, data.enemy.position.y, data.enemy.position.z)
      };
      
      setEnemies(prev => {
        const newEnemies = new Map(prev);
        newEnemies.set(enemy.id, enemy);
        console.log('📊 Total enemies after spawn:', newEnemies.size);
        return newEnemies;
      });
    });

    // Handle status effect updates
    newSocket.on('enemy-status-effect', (data: { enemyId: string; effectType: 'stun' | 'freeze' | 'slow'; duration: number }) => {
      console.log(`[Client] Enemy ${data.enemyId} affected by ${data.effectType} for ${data.duration}ms`);
      setEnemies(prev => {
        const newEnemies = new Map(prev);
        const enemy = newEnemies.get(data.enemyId);
        if (enemy) {
          const updatedEnemy = { ...enemy };
          
          // Apply status effect
          switch (data.effectType) {
            case 'stun':
              updatedEnemy.isStunned = true;
              break;
            case 'freeze':
              updatedEnemy.isFrozen = true;
              break;
            case 'slow':
              updatedEnemy.isSlowed = true;
              break;
          }
          
          newEnemies.set(data.enemyId, updatedEnemy);
          
          // Remove status effect after duration
          setTimeout(() => {
            setEnemies(prevEnemies => {
              const newerEnemies = new Map(prevEnemies);
              const currentEnemy = newerEnemies.get(data.enemyId);
              if (currentEnemy) {
                const clearedEnemy = { ...currentEnemy };
                switch (data.effectType) {
                  case 'stun':
                    clearedEnemy.isStunned = false;
                    break;
                  case 'freeze':
                    clearedEnemy.isFrozen = false;
                    break;
                  case 'slow':
                    clearedEnemy.isSlowed = false;
                    break;
                }
                newerEnemies.set(data.enemyId, clearedEnemy);
              }
              return newerEnemies;
            });
          }, data.duration);
        }
        return newEnemies;
      });
    });

    // Handle server-side enemy state updates
    newSocket.on('enemies-updated', (data: { enemies: Array<{
      id: string;
      position: { x: number; y: number; z: number };
      rotation: number;
      targetPlayerId: string;
      isMoving: boolean;
      isAttacking: boolean;
      isCharging?: boolean;
      isStunned?: boolean;
      isFrozen?: boolean;
      isSlowed?: boolean;
      timestamp: number;
    }>; timestamp: number }) => {
      setEnemies(prev => {
        const newEnemies = new Map(prev);
        data.enemies.forEach(enemyUpdate => {
          const existingEnemy = newEnemies.get(enemyUpdate.id);
          if (existingEnemy) {
            // Update enemy with server state
            newEnemies.set(enemyUpdate.id, {
              ...existingEnemy,
              position: new Vector3(enemyUpdate.position.x, enemyUpdate.position.y, enemyUpdate.position.z),
              // Add additional server-controlled properties
              isMoving: enemyUpdate.isMoving,
              isAttacking: enemyUpdate.isAttacking,
              isCharging: enemyUpdate.isCharging || false,
              targetPlayerId: enemyUpdate.targetPlayerId,
              rotation: enemyUpdate.rotation,
              lastServerUpdate: enemyUpdate.timestamp,
              // Update status effects from server
              isStunned: enemyUpdate.isStunned || false,
              isFrozen: enemyUpdate.isFrozen || false,
              isSlowed: enemyUpdate.isSlowed || false
            });
          }
        });
        return newEnemies;
      });
    });

    // Handle enemy state synchronization (for late-joining players)
    newSocket.on('enemy-state-sync', (data: { enemies: Array<{
      id: string;
      type: 'skeleton' | 'mage' | 'abomination' | 'reaper' | 'fallen-titan' | 'ascendant';
      position: { x: number; y: number; z: number };
      rotation: number;
      health: number;
      maxHealth: number;
      isDying: boolean;
      isMoving: boolean;
      isAttacking: boolean;
    }>; timestamp: number }) => {
      console.log('Enemy state sync:', data);
      setEnemies(prev => {
        const newEnemies = new Map(prev);
        data.enemies.forEach(enemy => {
          newEnemies.set(enemy.id, {
            ...enemy,
            position: new Vector3(enemy.position.x, enemy.position.y, enemy.position.z),
            lastServerUpdate: data.timestamp
          });
        });
        return newEnemies;
      });
    });

    // Handle enemy attacks on players
    newSocket.on('enemy-attacked-player', (data: { enemyId: string; targetPlayerId: string; damage: number; attackType: string; newPlayerHealth: number; timestamp: number }) => {
      console.log('Enemy attacked player:', data);
      
      // Update attacked player's health
      if (data.targetPlayerId === newSocket.id) {
        // Update our own health in both the players map and current player state
        setCurrentPlayerHealth(data.newPlayerHealth);
        setPlayers(prev => {
          const newPlayers = new Map(prev);
          const player = newPlayers.get(data.targetPlayerId);
          if (player) {
            newPlayers.set(data.targetPlayerId, {
              ...player,
              health: data.newPlayerHealth
            });
          }
          return newPlayers;
        });
      } else {
        // Update other player's health in the players map
        setPlayers(prev => {
          const newPlayers = new Map(prev);
          const player = newPlayers.get(data.targetPlayerId);
          if (player) {
            newPlayers.set(data.targetPlayerId, {
              ...player,
              health: data.newPlayerHealth
            });
          }
          return newPlayers;
        });
      }
    });

    // Handle damage confirmation for the attacking player
    newSocket.on('enemy-damage-confirmed', (data: { enemyId: string; health: number; maxHealth: number; damage: number; wasKilled: boolean }) => {
      console.log(`[Client] Damage confirmed for enemy ${data.enemyId}: ${data.health}/${data.maxHealth} (damage: ${data.damage})`);
      setEnemies(prev => {
        const newEnemies = new Map(prev);
        const enemy = newEnemies.get(data.enemyId);
        if (enemy) {
          newEnemies.set(data.enemyId, {
            ...enemy,
            health: data.health,
            isDying: data.wasKilled
          });
        }
        return newEnemies;
      });
    });

    // Handle ally healing events
    newSocket.on('ally-healed', (data: { healerId: string; healAmount: number; abilityType: 'reanimate' | 'oathstrike'; position: { x: number; y: number; z: number }; timestamp: number }) => {
      console.log(`[Client] Ally healing from ${data.healerId}: +${data.healAmount} HP (${data.abilityType})`);
      
      // Heal all players in the room (including the healer)
      setPlayers(prev => {
        const newPlayers = new Map(prev);
        newPlayers.forEach((player, playerId) => {
          const newHealth = Math.min(player.maxHealth, player.health + data.healAmount);
          newPlayers.set(playerId, {
            ...player,
            health: newHealth
          });
          
          // Update current player health if this is us
          if (playerId === newSocket.id) {
            setCurrentPlayerHealth(newHealth);
          }
        });
        return newPlayers;
      });
    });

    // Special ability events
    newSocket.on('reaper-re-emerged', (data: { enemyId: string; newPosition: { x: number; y: number; z: number }; targetPlayerId: string; timestamp: number }) => {
      console.log(`[Client] Reaper ${data.enemyId} re-emerged behind player ${data.targetPlayerId}`);
      setEnemies(prev => {
        const newEnemies = new Map(prev);
        const enemy = newEnemies.get(data.enemyId);
        if (enemy) {
          newEnemies.set(data.enemyId, {
            ...enemy,
            position: new Vector3(data.newPosition.x, data.newPosition.y, data.newPosition.z),
            isAttacking: true,
            targetPlayerId: data.targetPlayerId
          });
        }
        return newEnemies;
      });
    });

    newSocket.on('mage-fireball-cast', (data: { enemyId: string; targetPlayerId: string; startPosition: { x: number; y: number; z: number }; targetPosition: { x: number; y: number; z: number }; timestamp: number }) => {
      console.log(`[Client] Mage ${data.enemyId} casting fireball at player ${data.targetPlayerId}`);
      setEnemies(prev => {
        const newEnemies = new Map(prev);
        const enemy = newEnemies.get(data.enemyId);
        if (enemy) {
          newEnemies.set(data.enemyId, {
            ...enemy,
            isAttacking: true,
            targetPlayerId: data.targetPlayerId
          });
        }
        return newEnemies;
      });
    });

    newSocket.on('abomination-multi-arm-start', (data: { enemyId: string; targetPlayerId: string; totalArms: number; timestamp: number }) => {
      console.log(`[Client] Abomination ${data.enemyId} starting multi-arm attack on player ${data.targetPlayerId} (${data.totalArms} arms)`);
      setEnemies(prev => {
        const newEnemies = new Map(prev);
        const enemy = newEnemies.get(data.enemyId);
        if (enemy) {
          newEnemies.set(data.enemyId, {
            ...enemy,
            isAttacking: true,
            targetPlayerId: data.targetPlayerId
          });
        }
        return newEnemies;
      });
    });

    // Death Knight ability events
    newSocket.on('deathknight-death-grasp-cast', (data: { enemyId: string; targetPlayerId: string; startPosition: { x: number; y: number; z: number }; targetPosition: { x: number; y: number; z: number }; timestamp: number }) => {
      console.log(`[Client] Death Knight ${data.enemyId} casting Death Grasp at player ${data.targetPlayerId}`);
      setEnemies(prev => {
        const newEnemies = new Map(prev);
        const enemy = newEnemies.get(data.enemyId);
        if (enemy) {
          newEnemies.set(data.enemyId, {
            ...enemy,
            isAttacking: true,
            targetPlayerId: data.targetPlayerId
          });
        }
        return newEnemies;
      });
    });

    newSocket.on('deathknight-frost-strike-cast', (data: { enemyId: string; targetPlayerId: string; startPosition: { x: number; y: number; z: number }; targetPosition: { x: number; y: number; z: number }; timestamp: number }) => {
      console.log(`[Client] Death Knight ${data.enemyId} casting Frost Strike at player ${data.targetPlayerId}`);
      setEnemies(prev => {
        const newEnemies = new Map(prev);
        const enemy = newEnemies.get(data.enemyId);
        if (enemy) {
          newEnemies.set(data.enemyId, {
            ...enemy,
            isAttacking: true,
            targetPlayerId: data.targetPlayerId
          });
        }
        return newEnemies;
      });
    });

    // Ascendant ability events
    newSocket.on('ascendant-archon-lightning-cast', (data: { enemyId: string; targetPlayerId: string; startPosition: { x: number; y: number; z: number }; targetPosition: { x: number; y: number; z: number }; timestamp: number }) => {
      console.log(`[Client] Ascendant ${data.enemyId} casting Archon Lightning at player ${data.targetPlayerId}`);
      setEnemies(prev => {
        const newEnemies = new Map(prev);
        const enemy = newEnemies.get(data.enemyId);
        if (enemy) {
          newEnemies.set(data.enemyId, {
            ...enemy,
            isAttacking: true,
            targetPlayerId: data.targetPlayerId
          });
        }
        return newEnemies;
      });
    });

    newSocket.on('ascendant-blinked', (data: { enemyId: string; newPosition: { x: number; y: number; z: number }; targetPlayerId: string; timestamp: number }) => {
      console.log(`[Client] Ascendant ${data.enemyId} blinked to new position`);
      setEnemies(prev => {
        const newEnemies = new Map(prev);
        const enemy = newEnemies.get(data.enemyId);
        if (enemy) {
          newEnemies.set(data.enemyId, {
            ...enemy,
            position: new Vector3(data.newPosition.x, data.newPosition.y, data.newPosition.z),
            isAttacking: true,
            targetPlayerId: data.targetPlayerId
          });
        }
        return newEnemies;
      });
    });

    newSocket.on('ascendant-force-pulse-cast', (data: { enemyId: string; targetPlayerId: string; startPosition: { x: number; y: number; z: number }; targetPosition: { x: number; y: number; z: number }; timestamp: number }) => {
      console.log(`[Client] Ascendant ${data.enemyId} casting Force Pulse at player ${data.targetPlayerId}`);
      setEnemies(prev => {
        const newEnemies = new Map(prev);
        const enemy = newEnemies.get(data.enemyId);
        if (enemy) {
          newEnemies.set(data.enemyId, {
            ...enemy,
            isAttacking: true,
            targetPlayerId: data.targetPlayerId
          });
        }
        return newEnemies;
      });
    });

    // Abomination leap event
    newSocket.on('abomination-leaped', (data: { enemyId: string; newPosition: { x: number; y: number; z: number }; targetPlayerId: string; timestamp: number }) => {
      console.log(`[Client] Abomination ${data.enemyId} leaped to new position`);
      setEnemies(prev => {
        const newEnemies = new Map(prev);
        const enemy = newEnemies.get(data.enemyId);
        if (enemy) {
          newEnemies.set(data.enemyId, {
            ...enemy,
            position: new Vector3(data.newPosition.x, data.newPosition.y, data.newPosition.z),
            isAttacking: true,
            targetPlayerId: data.targetPlayerId
          });
        }
        return newEnemies;
      });
    });

    // Game start events
    newSocket.on('game-started', (data: { roomId: string; initiatingPlayerId: string; killCount: number; timestamp: number }) => {
      console.log(`Game started in room ${data.roomId} by player ${data.initiatingPlayerId}`);
      setGameStarted(true);
      setKillCount(data.killCount);
    });

    newSocket.on('start-game-success', (data: { roomId: string; killCount: number; timestamp: number }) => {
      console.log(`Successfully started game in room ${data.roomId}`);
      setGameStarted(true);
      setKillCount(data.killCount);
    });

    newSocket.on('start-game-failed', (data: { error: string }) => {
      console.error('Failed to start game:', data.error);
      // Could show an error message to user
    });

    // Kill count events
    newSocket.on('kill-count-updated', (data: { killCount: number; killedBy: string; enemyType: string; timestamp: number }) => {
      console.log(`Kill count updated: ${data.killCount} (${data.enemyType} killed by ${data.killedBy})`);
      
      // Update kill count
      setKillCount(prevKillCount => {
        const newKillCount = data.killCount;
        
        // Apply health increase logic (matches single player: +1 max health and +1 heal per kill)
        if (newKillCount > prevKillCount) {
          const killIncrease = newKillCount - prevKillCount;
          
          // Update max health based on new kill count (200 + killCount)
          const newMaxHealth = 200 + newKillCount;
          setCurrentPlayerMaxHealth(newMaxHealth);
          
          // Heal by the number of kills gained (but don't exceed max health)
          setCurrentPlayerHealth(prevHealth => Math.min(newMaxHealth, prevHealth + killIncrease));
          
          console.log(`[Multiplayer] Health increased: +${killIncrease} kills, new max health: ${newMaxHealth}`);
        }
        
        return newKillCount;
      });
    });

    // Periodic cleanup for expired effects
    const effectCleanupInterval = setInterval(() => {
      const now = Date.now();
      setPlayers(prev => {
        const newPlayers = new Map(prev);
        let hasChanges = false;
        
        for (const [playerId, player] of newPlayers) {
          const cleanedEffects = player.activeEffects.filter(effect => {
            const effectAge = now - effect.startTime;
            const maxAge = effect.duration || 10000; // Default 10 second max age
            return effectAge < maxAge;
          });
          
          if (cleanedEffects.length !== player.activeEffects.length) {
            newPlayers.set(playerId, {
              ...player,
              activeEffects: cleanedEffects
            });
            hasChanges = true;
          }
        }
        
        if (hasChanges) {
          console.log('🧹 Multiplayer effect cleanup completed');
        }
        
        // Update performance monitor with multiplayer metrics
        const totalEffects = Array.from(newPlayers.values()).reduce((sum, player) => sum + player.activeEffects.length, 0);
        performanceMonitor.updateObjectCount('projectiles', totalEffects);
        
        return hasChanges ? newPlayers : prev;
      });
    }, 5000); // Clean up every 5 seconds

    setSocket(newSocket);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(effectCleanupInterval);
      newSocket.close();
    };
  }, [serverUrl]);

  // Actions
  const joinRoom = useCallback((roomId: string, playerName: string, weapon: WeaponType, subclass?: WeaponSubclass) => {
    if (socket) {
      socket.emit('join-room', { roomId, playerName, weapon, subclass });
    }
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
    setIsInRoom(false);
    setRoomId(null);
    setPlayers(new Map());
    setEnemies(new Map());
  }, [socket]);

  const updatePlayerPosition = useCallback((position: Vector3, rotation: Vector3, movementDirection?: Vector3) => {
    if (!socket || !isInRoom || !roomId) return;
    
    const now = Date.now();
    if (now - lastPositionUpdate.current < positionUpdateThrottle) return;
    
    lastPositionUpdate.current = now;
    
    const updateData: {
      roomId: string;
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number };
      movementDirection?: { x: number; y: number; z: number };
    } = {
      roomId,
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: rotation.x, y: rotation.y, z: rotation.z }
    };
    
    if (movementDirection) {
      updateData.movementDirection = { x: movementDirection.x, y: movementDirection.y, z: movementDirection.z };
    }
    
    socket.emit('player-update', updateData);
  }, [socket, isInRoom, roomId]);

  const changeWeapon = useCallback((weapon: WeaponType, subclass?: WeaponSubclass) => {
    if (!socket || !isInRoom || !roomId) return;
    
    socket.emit('weapon-changed', { roomId, weapon, subclass });
  }, [socket, isInRoom, roomId]);

  const damageEnemy = useCallback((enemyId: string, damage: number, position: Vector3, damageType?: string, isCritical?: boolean) => {
    if (!socket || !isInRoom || !roomId || !playerId) return;
    
    // Add damage aggro to the aggro system
    globalAggroSystem.addDamageAggro(enemyId, playerId, damage, 'player');
    
    socket.emit('enemy-damaged', {
      roomId,
      enemyId,
      damage,
      position: { x: position.x, y: position.y, z: position.z },
      damageType,
      isCritical
    });
  }, [socket, isInRoom, roomId, playerId]);

  const updatePlayerHealth = useCallback((health: number) => {
    if (!socket || !isInRoom || !roomId) return;
    
    socket.emit('player-health-changed', { roomId, health });
  }, [socket, isInRoom, roomId]);

  const healAllies = useCallback((healAmount: number, position: Vector3, abilityType: 'reanimate' | 'oathstrike') => {
    if (!socket || !isInRoom || !roomId) return;
    
    console.log(`[Client] Sending ally healing: ${abilityType} +${healAmount} HP`);
    socket.emit('heal-allies', { 
      roomId, 
      healAmount, 
      abilityType,
      position: { x: position.x, y: position.y, z: position.z }
    });
  }, [socket, isInRoom, roomId]);

  const sendAttackAnimation = useCallback((attackType: string, position: Vector3, direction: Vector3) => {
    if (!socket || !isInRoom || !roomId) return;
    
    socket.emit('player-attack', {
      roomId,
      attackType,
      position: { x: position.x, y: position.y, z: position.z },
      direction: { x: direction.x, y: direction.y, z: direction.z }
    });
  }, [socket, isInRoom, roomId]);

  const sendAbilityAnimation = useCallback((abilityType: string, position: Vector3, direction: Vector3, target?: string) => {
    if (!socket || !isInRoom || !roomId) return;
    
    socket.emit('player-ability', {
      roomId,
      abilityType,
      position: { x: position.x, y: position.y, z: position.z },
      direction: { x: direction.x, y: direction.y, z: direction.z },
      target
    });
  }, [socket, isInRoom, roomId]);

  // Send status effect to enemy
  const applyEnemyStatusEffect = useCallback((enemyId: string, effectType: 'stun' | 'freeze' | 'slow', duration: number) => {
    if (!socket || !isInRoom || !roomId) return;
    
    console.log(`[Multiplayer] Applying ${effectType} to enemy ${enemyId} for ${duration}ms`);
    socket.emit('apply-enemy-status-effect', {
      roomId,
      enemyId,
      effectType,
      duration
    });
  }, [socket, isInRoom, roomId]);

  // Effect throttling - prevent only excessive spam, not normal effects
  const effectThrottleRef = useRef<{ [key: string]: number }>({});
  const maxEffectsPerSecond = 30; // Increased from 10 to 30 for smoother effects

  const sendEffect = useCallback((effect: Omit<SynchronizedEffect, 'id' | 'startTime'>) => {
    if (!socket || !isInRoom || !roomId) return;
    
    // Light throttling only to prevent excessive spam, not normal gameplay
    const now = Date.now();
    const effectKey = effect.type;
    const lastSent = effectThrottleRef.current[effectKey] || 0;
    const timeSinceLastSent = now - lastSent;
    const minInterval = 1000 / maxEffectsPerSecond; // ~33ms between effects of same type
    
    if (timeSinceLastSent < minInterval) {
      // Only log throttling for debugging, don't spam console
      return;
    }
    
    effectThrottleRef.current[effectKey] = now;
    
    socket.emit('player-effect', {
      roomId,
      effect: {
        ...effect,
        position: { x: effect.position.x, y: effect.position.y, z: effect.position.z },
        direction: { x: effect.direction.x, y: effect.direction.y, z: effect.direction.z },
        targetPosition: effect.targetPosition ? { x: effect.targetPosition.x, y: effect.targetPosition.y, z: effect.targetPosition.z } : undefined,
        speed: effect.speed,
        lifespan: effect.lifespan,
        hasCollided: effect.hasCollided,
        // Include extended properties
        weaponType: effect.weaponType,
        subclass: effect.subclass,
        bounceCount: effect.bounceCount,
        totemId: effect.totemId,
        coneAngle: effect.coneAngle,
        range: effect.range,
        isSecondaryWeapon: effect.isSecondaryWeapon,
        // Include new properties
        isPerfectShot: effect.isPerfectShot,
        isElementalShot: effect.isElementalShot,
        isVenomShot: effect.isVenomShot,
        projectileId: effect.projectileId,
        comboStep: effect.comboStep,
        chainTargets: effect.chainTargets ? effect.chainTargets.map(target => 
          ({ x: target.x, y: target.y, z: target.z })
        ) : undefined,
        markDuration: effect.markDuration,
        intensity: effect.intensity,
        scale: effect.scale
      }
    });
  }, [socket, isInRoom, roomId]);

  const previewRoom = useCallback((roomId: string) => {
    if (!socket) return;
    
    console.log('Requesting room preview for:', roomId);
    socket.emit('preview-room', { roomId });
  }, [socket]);

  const clearPreview = useCallback(() => {
    setCurrentPreview(null);
  }, []);

  const startGame = useCallback(() => {
    if (!socket || !isInRoom || !roomId) return;
    
    console.log(`Requesting to start game in room ${roomId}`);
    socket.emit('start-game', { roomId });
  }, [socket, isInRoom, roomId]);

  const contextValue: MultiplayerContextType = {
    // Connection state
    socket,
    isConnected,
    roomId,
    playerId,
    isInRoom,
    connectionError,
    
    // Game state
    players,
    enemies,
    killCount,
    gameStarted,
    
    // Current player state
    currentPlayerHealth,
    currentPlayerMaxHealth,
    
    // Room preview
    currentPreview,
    
    // Actions
    joinRoom,
    leaveRoom,
    startGame,
    previewRoom,
    clearPreview,
    updatePlayerPosition,
    changeWeapon,
    damageEnemy,
    updatePlayerHealth,
    healAllies,
    sendAttackAnimation,
    sendAbilityAnimation,
    sendEffect,
    applyEnemyStatusEffect,
  };

  return (
    <MultiplayerContext.Provider value={contextValue}>
      {children}
    </MultiplayerContext.Provider>
  );
}; 