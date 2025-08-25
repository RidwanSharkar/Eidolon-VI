import React from 'react';
import { WeaponType, WEAPON_DASH_CHARGES } from '@/Weapons/weapons';
import { DashChargesState } from '@/Weapons/weapons';
import styles from './DashCharges.module.css';

interface DashChargesProps {
  currentWeapon: WeaponType;
  dashCharges: DashChargesState;
}

// Weapon color mapping for the orb fluids
const getWeaponColor = (weaponType: WeaponType): string => {
  switch (weaponType) {
    case WeaponType.SCYTHE:
      return '#00FF37'; // Green
    case WeaponType.SWORD:
      return '#FFB300'; // Gold/Orange
    case WeaponType.SABRES:
      return '#00BFFF'; // Blue
    case WeaponType.SPEAR:
      return '#FF544E'; // Red
    case WeaponType.BOW:
      return '#3A905E'; // Forest Green
    default:
      return '#00ff44';
  }
};

const DashChargeOrb: React.FC<{
  isAvailable: boolean;
  cooldownRemaining: number;
  weaponColor: string;
}> = ({ isAvailable, cooldownRemaining, weaponColor }) => {
  // Calculate fill percentage (6 seconds total cooldown)
  const fillPercentage = isAvailable ? 100 : Math.max(0, ((6.0 - cooldownRemaining) / 6.0) * 100);
  
  // Determine if this orb should show draining animation (just used, high cooldown)
  const shouldDrain = !isAvailable && cooldownRemaining > 5.8; // Just used (within first 0.2s)
  const shouldFill = !isAvailable && cooldownRemaining <= 5.8 && cooldownRemaining > 0.1; // Refilling
  
  return (
    <div className={styles.orbContainer}>
      {/* Glass orb shell */}
      <div className={styles.glassOrb}>
        {/* Inner fluid container */}
        <div className={styles.fluidContainer}>
          {/* Animated fluid fill */}
          <div 
            className={`${styles.fluid} ${shouldFill ? styles.filling : ''} ${shouldDrain ? styles.draining : ''}`}
            style={{
              backgroundColor: weaponColor,
              height: shouldDrain ? '100%' : `${fillPercentage}%`,
              boxShadow: `0 0 10px ${weaponColor}40`,
              transition: isAvailable ? 'none' : shouldDrain ? 'none' : 'height 0.15s ease-out'
            }}
          />
          
          {/* Fluid surface highlight */}
          {fillPercentage > 0 && !shouldDrain && (
            <div 
              className={styles.fluidSurface}
              style={{
                bottom: `${fillPercentage}%`,
                backgroundColor: `${weaponColor}80`,
                boxShadow: `0 0 8px ${weaponColor}60`
              }}
            />
          )}
        </div>
        
        {/* Glass highlight and shine effects */}
        <div className={styles.glassHighlight} />
        <div className={styles.glassShine} />
        
        {/* Cooldown timer text */}
        {!isAvailable && cooldownRemaining > 0.1 && (
          <div className={styles.cooldownTimer}>
            {Math.ceil(cooldownRemaining)}
          </div>
        )}
      </div>
      
      {/* Glow effect */}
      <div 
        className={styles.orbGlow}
        style={{
          backgroundColor: `${weaponColor}20`,
          boxShadow: `0 0 20px ${weaponColor}30`
        }}
      />
    </div>
  );
};

export default function DashCharges({ currentWeapon, dashCharges }: DashChargesProps) {
  const weaponColor = getWeaponColor(currentWeapon);
  const chargeCount = WEAPON_DASH_CHARGES[currentWeapon];

  return (
    <div className={styles.dashChargesContainer}>
      <div className={styles.orbsRow}>
        {Array.from({ length: chargeCount }, (_, index) => {
          const charge = dashCharges.charges[index];
          return (
            <DashChargeOrb
              key={index}
              isAvailable={charge?.isAvailable ?? false}
              cooldownRemaining={charge?.cooldownRemaining ?? 0}
              weaponColor={weaponColor}
            />
          );
        })}
      </div>
      

    </div>
  );
}