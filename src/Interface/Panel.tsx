import React, { useState } from 'react';
import { WeaponAbilities, WeaponType, WeaponInfo, WeaponSubclass, DashChargesState, getAbilityTooltip } from '@/Weapons/weapons';
import styles from '@/Interface/Panel.module.css';
import Image from 'next/image';
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
 * TechCooldownProgress Component
 * Renders a modern techno/cyberpunk cooldown animation with hexagonal segments.
 */
const TechCooldownProgress: React.FC<{
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

  // Create hexagonal corner cuts for techno look
  const cornerSize = 6;
  const hexPath = `
    M ${halfStroke + cornerSize} ${halfStroke}
    L ${halfStroke + adjustedSize - cornerSize} ${halfStroke}
    L ${halfStroke + adjustedSize} ${halfStroke + cornerSize}
    L ${halfStroke + adjustedSize} ${halfStroke + adjustedSize - cornerSize}
    L ${halfStroke + adjustedSize - cornerSize} ${halfStroke + adjustedSize}
    L ${halfStroke + cornerSize} ${halfStroke + adjustedSize}
    L ${halfStroke} ${halfStroke + adjustedSize - cornerSize}
    L ${halfStroke} ${halfStroke + cornerSize}
    Z
  `;
  
  const hexPathLength = 4 * adjustedSize - 8 * cornerSize + 8 * cornerSize * Math.SQRT2;
  const hexDashOffset = hexPathLength - (hexPathLength * percentage) / 100;

  const color = isActive ? "#ff3333" : "#39ff14";
  const glowColor = isActive ? "rgba(255, 51, 51, 0.6)" : "rgba(57, 255, 20, 0.6)";

  return (
    <svg
      width={size}
      height={size}
      className={styles.techCooldownProgress}
    >
      {/* Background glow layer */}
      <defs>
        <filter id={`glow-${isActive ? 'active' : 'normal'}`}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id={`gradient-${isActive ? 'active' : 'normal'}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: color, stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Outer dim border */}
      <path
        d={hexPath}
        stroke={`${color}40`}
        strokeWidth={strokeWidth * 0.8}
        fill="none"
        className={styles.techProgressBackground}
      />

      {/* Main progress indicator with gradient */}
      <path
        d={hexPath}
        stroke={`url(#gradient-${isActive ? 'active' : 'normal'})`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={hexPathLength}
        strokeDashoffset={hexDashOffset}
        strokeLinecap="round"
        className={styles.techProgressForeground}
        filter={`url(#glow-${isActive ? 'active' : 'normal'})`}
      />

      {/* Corner accent dots */}
      {[0, 25, 50, 75].map((pos, i) => {
        const opacity = (percentage >= pos) ? 1 : 0.2;
        const points = [
          { x: halfStroke + cornerSize, y: halfStroke },
          { x: halfStroke + adjustedSize, y: halfStroke + cornerSize },
          { x: halfStroke + adjustedSize - cornerSize, y: halfStroke + adjustedSize },
          { x: halfStroke, y: halfStroke + adjustedSize - cornerSize },
        ];
        return (
          <circle
            key={i}
            cx={points[i].x}
            cy={points[i].y}
            r={1.5}
            fill={color}
            opacity={opacity}
            className={styles.techCornerDot}
          />
        );
      })}

      {/* Inner scanline effect */}
      <rect
        x={halfStroke + strokeWidth}
        y={halfStroke + strokeWidth}
        width={adjustedSize - strokeWidth * 2}
        height={adjustedSize - strokeWidth * 2}
        rx={borderRadius - strokeWidth}
        fill="none"
        stroke={glowColor}
        strokeWidth={0.5}
        opacity={0.3}
        className={styles.techScanline}
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
    cooldown?: string;
    unlockLevel?: number;
    isLocked?: boolean;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Debug logging for incinerate stacks

  // Ability Tooltip
  const handleAbilityHover = (
    e: React.MouseEvent,
    abilityKey: keyof WeaponAbilities
  ) => {
    const ability = abilities[currentWeapon]?.[abilityKey];
    if (!ability) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    
    if (currentSubclass) {
      const tooltip = getAbilityTooltip(currentWeapon, currentSubclass, abilityKey);
      setTooltipContent({
        name: tooltip.name,
        description: tooltip.description,
        cooldown: tooltip.cooldown,
        unlockLevel: tooltip.unlockLevel,
        isLocked: !ability.isUnlocked
      });
    } else {
      // Fallback when subclass is not set
      setTooltipContent({
        name: ability.name || abilityKey,
        description: 'Select a subclass to see ability details',
        cooldown: ability.cooldown > 0 ? `${ability.cooldown}s` : 'Always Active',
        unlockLevel: ability.unlockLevel,
        isLocked: !ability.isUnlocked
      });
    }
    
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
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
                      <TechCooldownProgress
                        size={50}
                        strokeWidth={4}
                        percentage={100}
                        borderRadius={8}
                        isActive={true}
                      />
                    </div>
                  ) : ability.currentCooldown > 0 && (
                    <div className={styles.cooldownOverlay}>
                      <TechCooldownProgress
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
                                <TechCooldownProgress
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
                                <TechCooldownProgress
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
            content={{ 
              title: tooltipContent.name, 
              description: tooltipContent.description,
              cooldown: tooltipContent.cooldown,
              unlockLevel: tooltipContent.unlockLevel,
              isLocked: tooltipContent.isLocked
            }}
            visible={true}
            x={tooltipPosition.x}
            y={tooltipPosition.y}
          />
        )}
      </div>
    </>
  );
}