import React, { useCallback, useMemo } from 'react';
import { Group, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { WeaponType, WeaponSubclass } from '../Weapons/weapons';
import { useUnitControls } from './useUnitControls';
import { OrbitControls } from 'three-stdlib';
import UnifiedVault, { VaultDirection } from '@/Spells/Vault/UnifiedVault';

interface UnitMovementSystemProps {
  groupRef: React.RefObject<Group>;
  controlsRef: React.RefObject<OrbitControls>;
  currentWeapon: WeaponType;
  currentSubclass?: WeaponSubclass;
  level: number;
  health: number;
  
  // Movement state
  keys: React.MutableRefObject<Record<string, boolean>>;
  isPlayerStunned: boolean;
  movementDirection: Vector3;
  
  // Charging states that affect movement
  isBowCharging: boolean;
  isPyroclastActive: boolean;
  isFirebeaming: boolean;
  
  // Vault state
  activeVault: { isActive: boolean; direction: VaultDirection | null };
  setActiveVault: React.Dispatch<React.SetStateAction<{ isActive: boolean; direction: VaultDirection | null }>>;
  canVault: () => boolean;
  consumeDashCharge: () => boolean;
  
  // Callbacks
  onPositionUpdate: (position: Vector3, isStealthed?: boolean, rotation?: Vector3, movementDirection?: Vector3) => void;
  
  // Stealth state for position updates
  isStealthed: boolean;
}

const UnitMovementSystem = React.memo<UnitMovementSystemProps>(({
  groupRef,
  controlsRef,
  currentWeapon,
  currentSubclass,
  level,
  health,
  keys,
  isPlayerStunned,
  movementDirection,
  isBowCharging,
  isPyroclastActive,
  isFirebeaming,
  activeVault,
  setActiveVault,
  canVault,
  consumeDashCharge,
  onPositionUpdate,
  isStealthed
}) => {
  const { camera } = useThree();
  
  // Memoize the charging state to prevent unnecessary re-renders
  const isCharging = useMemo(() => 
    isBowCharging || isPyroclastActive || isFirebeaming,
    [isBowCharging, isPyroclastActive, isFirebeaming]
  );
  
  // Movement update callback
  const onMovementUpdate = useCallback((direction: Vector3) => {
    movementDirection.copy(direction);
  }, [movementDirection]);
  
  // Initialize movement controls
  const { keys: movementKeys } = useUnitControls({
    groupRef,
    controlsRef,
    camera: camera!,
    onPositionUpdate: (position: Vector3, _isStealthed?: boolean, rotation?: Vector3, movementDirection?: Vector3) => {
      onPositionUpdate(position, isStealthed, rotation, movementDirection);
    },
    health,
    isCharging,
    onMovementUpdate,
    currentWeapon,
    currentSubclass,
    level,
    isStunned: isPlayerStunned
  });
  
  // Update the keys ref with movement keys
  React.useEffect(() => {
    Object.assign(keys.current, movementKeys);
  }, [keys, movementKeys]);
  
  // Vault activation functions
  const activateVault = useCallback((direction: VaultDirection) => {
    if (canVault() && !activeVault.isActive) {
      const success = consumeDashCharge();
      if (success) {
        setActiveVault({ isActive: true, direction });
      }
    }
  }, [canVault, consumeDashCharge, activeVault.isActive, setActiveVault]);
  
  const completeVault = useCallback(() => {
    setActiveVault({ isActive: false, direction: null });
  }, [setActiveVault]);
  
  // Expose activateVault function for external use
  React.useEffect(() => {
    // This could be exposed through a ref or callback prop if needed
    console.log('Vault system ready:', { activateVault });
  }, [activateVault]);
  
  return (
    <>
      {/* Vault Effect */}
      {activeVault.isActive && activeVault.direction && (
        <UnifiedVault
          parentRef={groupRef}
          isActive={activeVault.isActive}
          direction={activeVault.direction}
          onComplete={completeVault}
        />
      )}
    </>
  );
});

UnitMovementSystem.displayName = 'UnitMovementSystem';

export default UnitMovementSystem;