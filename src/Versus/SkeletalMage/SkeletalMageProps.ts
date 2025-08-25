   // src/types/SkeletalMageProps.ts
   import { Vector3 } from 'three';
   import { WeaponType } from '../../Weapons/weapons';
   import { PlayerInfo, SummonedUnitInfo } from '../AggroSystem';

   export interface SkeletalMageProps {
     id: string;
     initialPosition: Vector3;
     position: Vector3;
     health: number;
     maxHealth: number;
     onTakeDamage: (id: string, damage: number) => void;
     onPositionUpdate: (id: string, position: Vector3) => void;
     // Updated to support multiple players
     playerPosition?: Vector3; // Keep for backward compatibility
     allPlayers?: PlayerInfo[]; // New prop for multiplayer support
     summonedUnits?: SummonedUnitInfo[]; // New prop for summoned units
     onAttackPlayer: (damage: number) => void;
     onAttackSummonedUnit?: (summonId: string, damage: number) => void; // New callback for attacking summoned units
     weaponType: WeaponType;
     isDying?: boolean;
     isFrozen?: boolean;
     isSlowed?: boolean;
     level?: number; // Current game level for ability unlocks
     isStunned?: boolean;
     knockbackEffect?: { direction: Vector3; distance: number; progress: number; isActive: boolean } | null;
     playerStunRef?: React.MutableRefObject<{ triggerStun: (duration: number) => void } | null>;
     getCurrentPlayerPosition?: () => Vector3; // Function to get real-time player position
   }