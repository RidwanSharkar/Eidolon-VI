import React, { useState } from 'react';
import { WeaponAbilities, WeaponType, WeaponInfo, WeaponSubclass, DashChargesState } from '@/Weapons/weapons';
import styles from '@/Interface/Panel.module.css';
import Image from 'next/image';
import { ABILITY_TOOLTIPS } from '@/Weapons/weapons';
import Tooltip from '@/Interface/Tooltip';
import { Vector3 } from 'three';
import DashCharges from '@/Interface/DashCharges';


interface PanelProps {
  currentWeapon: WeaponType;
  currentSubclass?: WeaponSubclass;
  onWeaponSelect: (weapon: WeaponType) => void;
  abilities: WeaponInfo;
  onReset: () => void;
  activeEffects?: Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
    summonId?: number;
    targetId?: string;
  }>;
  stealthKillCount?: number;
  glacialShardKillCount?: number;
  dashCharges: DashChargesState;
  eviscerateLashes?: Array<{ id: number; available: boolean; cooldownStartTime: number | null }>;
  boneclawCharges?: Array<{ id: number; available: boolean; cooldownStartTime: number | null }>;
  incinerateStacks?: number; // For Pyro Spear Incinerate stacks
}



/**
 * RoundedSquareProgress Component
 * Renders a sweeping cooldown animation around a rounded square.
 */
const RoundedSquareProgress: React.FC<{
  size: number;
  strokeWidth: number;
  percentage: number;
  borderRadius: number;
  isActive?: boolean;
}> = ({ size, strokeWidth, percentage, borderRadius, isActive }) => {
  const halfStroke = strokeWidth / 2;
  const adjustedSize = size - strokeWidth;
  const perimeter = 4 * adjustedSize;
  const dashOffset = perimeter - (perimeter * percentage) / 100;

  return (
    <svg
      width={size}
      height={size}
      className={styles.roundedSquareProgress}
    >
      <rect
        x={halfStroke}
        y={halfStroke}
        width={adjustedSize}
        height={adjustedSize}
        rx={borderRadius}
        ry={borderRadius}
        stroke={isActive ? "#ff3333" : "#39ff14"}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={perimeter}
        strokeDashoffset={dashOffset}
        className={styles.progressForeground}
      />
    </svg>
  );
};

export default function Panel({ 
  currentWeapon,
  currentSubclass,
  onWeaponSelect,
  abilities, 
  onReset,
  activeEffects,
  stealthKillCount = 0,
  glacialShardKillCount = 0,
  dashCharges,
  eviscerateLashes = [],
  boneclawCharges = [],
  incinerateStacks = 0
}: PanelProps) {
  // onWeaponSelect and onReset are part of the interface but not used in this component
  void onWeaponSelect;
  void onReset;
  
  const [tooltipContent, setTooltipContent] = useState<{
    name: string;
    description: string;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Debug logging for incinerate stacks

  // Ability Tooltip
  const handleAbilityHover = (
    e: React.MouseEvent,
    abilityKey: keyof WeaponAbilities
  ) => {
    const tooltip = ABILITY_TOOLTIPS[abilityKey];
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipContent(tooltip);
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const handleAbilityLeave = () => {
    setTooltipContent(null);
  };

  return (
    <>


      {/* Bottom Panel */}
      <div className={styles.bottomPanel}>
        {/* Dash Charges Display */}
        <DashCharges 
          currentWeapon={currentWeapon}
          dashCharges={dashCharges}
        />

        {/* Abilities Section */}
        {abilities[currentWeapon] && (
          <div className={styles.abilitiesContainer}>
            
            {/* Bottom Row: Innate, Passive (1) | Q, E, R, 2 */}
            <div className={styles.abilitiesRowBottom}>
              {/* Passive abilities group: innate and passive (1) */}
              <div className={styles.passiveAbilitiesGroup}>
                {Object.entries(abilities[currentWeapon])
                  .filter(([, ability]) => ['W', '1'].includes(ability.key.toUpperCase()))
                  .sort((a, b) => {
                    const order = ['W', '1']; // innate (W) first, then passive (1)
                    return order.indexOf(a[1].key.toUpperCase()) - order.indexOf(b[1].key.toUpperCase());
                  })
                  .map(([key, ability]) => (
                <div 
                  key={key}
                  className={`${styles.ability} ${!ability.isUnlocked ? styles.locked : ''} ${styles.passiveAbility}`}
                  onMouseEnter={(e) => handleAbilityHover(e, key as keyof WeaponAbilities)}
                  onMouseLeave={handleAbilityLeave}
                >
                  {/* No hotkey indicator for passive abilities */}
                  <Image 
                    src={ability.icon} 
                    alt={`${key} ability`} 
                    width={40}
                    height={40}
                    className={styles.abilityIcon}
                  />
                  {/* No cooldown overlay for passive abilities since they're always active */}
                  
                  {/* Incinerate stack counter for Pyro Spear Innate ability (key 'W') - always show */}
                  {(ability.key.toUpperCase() === 'W' && 
                    currentWeapon === WeaponType.SPEAR && 
                    currentSubclass === WeaponSubclass.PYRO) && (
                    <div className={`${styles.killCountOverlay} ${incinerateStacks >= 25 ? styles.incinerateEmpowered : ''}`}>
                      {incinerateStacks}
                    </div>
                  )}
                </div>
              ))}
              </div>
              
              {/* Separator */}
              <div className={styles.abilitySeparator}></div>
              
              {/* Active abilities group: Q, E, R, 2 */}
              <div className={styles.activeAbilitiesGroup}>
                {Object.entries(abilities[currentWeapon])
                  .filter(([, ability]) => ['Q', 'E', 'R', '2'].includes(ability.key.toUpperCase()))
                  .sort((a, b) => {
                    const order = ['Q', 'E', 'R', '2'];
                    return order.indexOf(a[1].key.toUpperCase()) - order.indexOf(b[1].key.toUpperCase());
                  })
                  .map(([key, ability]) => (
                <div 
                  key={key}
                  className={`${styles.ability} ${!ability.isUnlocked ? styles.locked : ''} ${styles.activeAbility}`}
                  onMouseEnter={(e) => handleAbilityHover(e, key as keyof WeaponAbilities)}
                  onMouseLeave={handleAbilityLeave}
                >
                  <div className={styles.keyBind}>{ability.key.toUpperCase()}</div>
                  <Image 
                    src={ability.icon} 
                    alt={`${key} ability`} 
                    width={40}
                    height={40}
                    className={styles.abilityIcon}
                  />
                  {key === 'active' && 
                   currentWeapon === WeaponType.SCYTHE && 
                   abilities[WeaponType.SCYTHE].active.isUnlocked &&
                   activeEffects?.some(effect => effect.type === 'summon') ? (
                    <div className={styles.activeOverlay}>
                      <RoundedSquareProgress
                        size={50}
                        strokeWidth={4}
                        percentage={100}
                        borderRadius={8}
                        isActive={true}
                      />
                    </div>
                  ) : ability.currentCooldown > 0 && (
                    <div className={styles.cooldownOverlay}>
                      <RoundedSquareProgress
                        size={50}
                        strokeWidth={4}
                        percentage={(ability.currentCooldown / ability.cooldown) * 100}
                        borderRadius={8}
                      />
                      <span className={styles.cooldownText}>
                        {Math.ceil(ability.currentCooldown)}
                      </span>
                    </div>
                  )}
                  
                  {/* Show next charge cooldown for charge-based abilities when all charges are on cooldown */}
                  {(() => {
                    // Eviscerate charge cooldown display
                    if (ability.key.toUpperCase() === '2' && 
                        currentWeapon === WeaponType.SABRES && 
                        currentSubclass === WeaponSubclass.ASSASSIN && 
                        eviscerateLashes.length > 0) {
                      const availableCharges = eviscerateLashes.filter(c => c.available);
                      if (availableCharges.length === 0) {
                        // Find the charge that will be available soonest
                        const nextCharge = eviscerateLashes
                          .filter(c => c.cooldownStartTime)
                          .sort((a, b) => (a.cooldownStartTime! + 10000) - (b.cooldownStartTime! + 10000))[0];
                        
                        if (nextCharge && nextCharge.cooldownStartTime) {
                          const timeRemaining = Math.max(0, 10 - (Date.now() - nextCharge.cooldownStartTime) / 1000);
                          if (timeRemaining > 0) {
                            return (
                              <div className={styles.cooldownOverlay}>
                                <RoundedSquareProgress
                                  size={50}
                                  strokeWidth={4}
                                  percentage={(timeRemaining / 10) * 100}
                                  borderRadius={8}
                                />
                                <span className={styles.cooldownText}>
                                  {Math.ceil(timeRemaining)}
                                </span>
                              </div>
                            );
                          }
                        }
                      }
                    }
                    
                    // Boneclaw charge cooldown display
                    if (ability.key.toUpperCase() === 'R' && 
                        currentWeapon === WeaponType.SCYTHE && 
                        currentSubclass === WeaponSubclass.CHAOS && 
                        boneclawCharges.length > 0) {
                      const availableCharges = boneclawCharges.filter(c => c.available);
                      if (availableCharges.length === 0) {
                        // Find the charge that will be available soonest
                        const nextCharge = boneclawCharges
                          .filter(c => c.cooldownStartTime)
                          .sort((a, b) => (a.cooldownStartTime! + 8000) - (b.cooldownStartTime! + 8000))[0];
                        
                        if (nextCharge && nextCharge.cooldownStartTime) {
                          const timeRemaining = Math.max(0, 8 - (Date.now() - nextCharge.cooldownStartTime) / 1000);
                          if (timeRemaining > 0) {
                            return (
                              <div className={styles.cooldownOverlay}>
                                <RoundedSquareProgress
                                  size={50}
                                  strokeWidth={4}
                                  percentage={(timeRemaining / 8) * 100}
                                  borderRadius={8}
                                />
                                <span className={styles.cooldownText}>
                                  {Math.ceil(timeRemaining)}
                                </span>
                              </div>
                            );
                          }
                        }
                      }
                    }
                    
                    return null;
                  })()}
                  
                  {/* Kill count overlays for specific abilities */}
                  {(ability.key.toUpperCase() === 'E' && 
                    currentWeapon === WeaponType.SABRES && 
                    currentSubclass === WeaponSubclass.ASSASSIN && 
                    stealthKillCount > 0) ? (
                    <div className={styles.killCountOverlay}>
                      {stealthKillCount}
                    </div>
                  ) : (ability.key.toUpperCase() === 'R' && 
                       currentWeapon === WeaponType.SABRES && 
                       currentSubclass === WeaponSubclass.FROST && 
                       glacialShardKillCount > 0) ? (
                    <div className={styles.killCountOverlay}>
                      {glacialShardKillCount}
                    </div>
                  ) : null}
                  
                  {/* Eviscerate charge indicators for Assassin Sabres active ability (key '2') */}
                  {(ability.key.toUpperCase() === '2' && 
                    currentWeapon === WeaponType.SABRES && 
                    currentSubclass === WeaponSubclass.ASSASSIN && 
                    eviscerateLashes.length > 0) && (
                    <div className={styles.eviscerateLashesContainer}>
                      {eviscerateLashes.map((charge) => (
                        <div 
                          key={charge.id}
                          className={`${styles.eviscerateLash} ${charge.available ? styles.available : styles.cooldown}`}
                        >
                          {!charge.available && charge.cooldownStartTime && (
                            <div className={styles.lashCooldownText}>
                              {Math.ceil(Math.max(0, 10 - (Date.now() - charge.cooldownStartTime) / 1000))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Boneclaw charge indicators for Chaos Scythe ultimate ability (key 'R') */}
                  {(ability.key.toUpperCase() === 'R' && 
                    currentWeapon === WeaponType.SCYTHE && 
                    currentSubclass === WeaponSubclass.CHAOS && 
                    boneclawCharges.length > 0) && (
                    <div className={styles.boneclawChargesContainer}>
                      {boneclawCharges.map((charge) => (
                        <div 
                          key={charge.id}
                          className={`${styles.boneclawCharge} ${charge.available ? styles.available : styles.cooldown}`}
                        >
                          {!charge.available && charge.cooldownStartTime && (
                            <div className={styles.boneclawCooldownText}>
                              {Math.ceil(Math.max(0, 8 - (Date.now() - charge.cooldownStartTime) / 1000))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
          </div>
        )}



        {tooltipContent && (
          <Tooltip 
            content={{ title: tooltipContent.name, description: tooltipContent.description }}
            visible={true}
            x={tooltipPosition.x}
            y={tooltipPosition.y}
          />
        )}
      </div>
    </>
  );
}