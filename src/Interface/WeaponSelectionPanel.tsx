import React, { useState } from 'react';
import styles from './WeaponSelectionPanel.module.css';
import { WeaponType, WeaponSubclass, WEAPON_SUBCLASSES, ABILITY_TOOLTIPS, SUBCLASS_ABILITIES, DEFAULT_WEAPON_ABILITIES } from '@/Weapons/weapons';
import Image from 'next/image';
import Tooltip from '@/Interface/Tooltip';

interface WeaponSelectionPanelProps {
  onWeaponSelect: (weapon: WeaponType, subclass?: WeaponSubclass) => void;
  selectedWeapon: WeaponType | null;
  selectedSubclass: WeaponSubclass | null;
  onStart: () => void;
}

export default function WeaponSelectionPanel({ 
  onWeaponSelect, 
  selectedWeapon,
  selectedSubclass,
  onStart 
}: WeaponSelectionPanelProps) {
  const [tooltipContent, setTooltipContent] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Get available subclasses for the selected weapon
  const getSubclassesForWeapon = (weaponType: WeaponType): WeaponSubclass[] => {
    return Object.values(WeaponSubclass).filter(subclass => 
      WEAPON_SUBCLASSES[subclass].weaponType === weaponType
    );
  };

  const handleWeaponClick = (weapon: WeaponType) => {
    if (selectedWeapon === weapon) {
      // If clicking the same weapon, deselect it
      onWeaponSelect(weapon, undefined);
    } else {
      // Select the weapon but don't select a subclass yet
      onWeaponSelect(weapon, undefined);
    }
  };

  const handleSubclassClick = (subclass: WeaponSubclass) => {
    if (selectedWeapon) {
      onWeaponSelect(selectedWeapon, subclass);
    }
  };

  const handleAbilityHover = (e: React.MouseEvent, weapon: WeaponType, abilityType: 'q' | 'e' | 'innate') => {
    // Get the ability info from the selected subclass only for the currently selected weapon
    let abilityInfo;
    if (selectedWeapon === weapon && selectedSubclass && SUBCLASS_ABILITIES[selectedSubclass]) {
      abilityInfo = SUBCLASS_ABILITIES[selectedSubclass][abilityType];
    }
    
    const tooltip = abilityInfo ? {
      name: abilityInfo.name,
      description: ABILITY_TOOLTIPS[abilityType].description
    } : ABILITY_TOOLTIPS[abilityType];
    
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Calculate viewport boundaries
    const viewportWidth = window.innerWidth;
    
    // Initial position calculation
    let x = rect.left + rect.width / 2;
    let y = rect.top - 10;
    
    // Ensure tooltip stays within viewport bounds
    // Add some padding from viewport edges
    const VIEWPORT_PADDING = 10;
    const TOOLTIP_WIDTH = 300; // This should match the max-width in CSS
    const TOOLTIP_HEIGHT = 150; // Approximate height, adjust as needed
    
    // Adjust horizontal position if needed
    if (x - TOOLTIP_WIDTH / 2 < VIEWPORT_PADDING) {
      x = VIEWPORT_PADDING + TOOLTIP_WIDTH / 2;
    } else if (x + TOOLTIP_WIDTH / 2 > viewportWidth - VIEWPORT_PADDING) {
      x = viewportWidth - VIEWPORT_PADDING - TOOLTIP_WIDTH / 2;
    }
    
    // Adjust vertical position if needed
    if (y - TOOLTIP_HEIGHT < VIEWPORT_PADDING) {
      // If tooltip would be cut off at top, show it below the element instead
      y = rect.bottom + TOOLTIP_HEIGHT / 2;
    }
    
    setTooltipContent({
      title: tooltip.name,
      description: tooltip.description
    });
    setTooltipPosition({ x, y });
  };

  const handleAbilityLeave = () => {
    setTooltipContent(null);
  };

  // Get the ability icons for the current weapon/subclass combination
  const getAbilityIcon = (weapon: WeaponType, abilityType: 'q' | 'e' | 'innate'): string => {
    // Only show subclass-specific icons for the currently selected weapon
    if (selectedWeapon === weapon && selectedSubclass && SUBCLASS_ABILITIES[selectedSubclass]) {
      return SUBCLASS_ABILITIES[selectedSubclass][abilityType].icon;
    }
    
    // For all other weapons (or when no subclass is selected), show default subclass icons
    const defaultAbilities = DEFAULT_WEAPON_ABILITIES[weapon];
    if (defaultAbilities && defaultAbilities[abilityType]) {
      return defaultAbilities[abilityType].icon;
    }
    
    // Fallback to generic icons if default abilities not found
    const fallbackIcons = {
      [WeaponType.SWORD]: { q: '/icons/q2.svg', e: '/icons/e2.svg', innate: '/icons/VengeanceSwordInnate.png' },
      [WeaponType.SCYTHE]: { q: '/icons/q1.svg', e: '/icons/e1.svg', innate: '/icons/ChaosScytheInnate.png' },
      [WeaponType.SABRES]: { q: '/icons/q3.svg', e: '/icons/e3.svg', innate: '/icons/AssassinSabresInnate.png' },
      [WeaponType.SPEAR]: { q: '/icons/q4.svg', e: '/icons/e4.svg', innate: '/icons/StormSpearInnate.png' },
      [WeaponType.BOW]: { q: '/icons/q5.svg', e: '/icons/e5.svg', innate: '/icons/ElementalBowInnate.png' }
    };
    
    return fallbackIcons[weapon][abilityType];
  };

  return (
    <div 
      className={`${styles.panel} ${
        selectedWeapon === WeaponType.SWORD ? styles.swordTheme :
        selectedWeapon === WeaponType.SCYTHE ? styles.scytheTheme :
        selectedWeapon === WeaponType.SABRES ? styles.sabresTheme :
        selectedWeapon === WeaponType.SPEAR ? styles.spearTheme :
        selectedWeapon === WeaponType.BOW ? styles.bowTheme :
        ''
      }`}
      onContextMenu={(e) => e.preventDefault()}
    >
      
      <div className={styles.iconSelection}>
        <div className={styles.weaponContainer}>
          <div 
            className={`${styles.icon} ${selectedWeapon === WeaponType.SWORD ? styles.selected : ''}`}
            onClick={() => handleWeaponClick(WeaponType.SWORD)}
          >
            <div className={styles.iconContent}>
              <Image 
                src="/icons/1.svg"
                alt="Sword"
                width={240}
                height={280}
                unoptimized
              />
            </div>
          </div>
          <div className={styles.abilityIcons}>
            <div 
              className={styles.abilityIcon}
              onMouseEnter={(e) => handleAbilityHover(e, WeaponType.SWORD, 'q')}
              onMouseLeave={handleAbilityLeave}
            >
              <Image 
                src={getAbilityIcon(WeaponType.SWORD, 'q')}
                alt="Q Ability"
                width={80}
                height={100}
                unoptimized
              />
              <span className={styles.abilityKey}>Q</span>
            </div>
            <div 
              className={styles.abilityIcon}
              onMouseEnter={(e) => handleAbilityHover(e, WeaponType.SWORD, 'e')}
              onMouseLeave={handleAbilityLeave}
            >
              <Image 
                src={getAbilityIcon(WeaponType.SWORD, 'e')}
                alt="E Ability"
                width={80}
                height={100}
                unoptimized
              />
              <span className={styles.abilityKey}>E</span>
            </div>
          </div>
          <div className={styles.innateAbilityRow}>
            <div 
              className={styles.abilityIcon}
              onMouseEnter={(e) => handleAbilityHover(e, WeaponType.SWORD, 'innate')}
              onMouseLeave={handleAbilityLeave}
            >
              <Image 
                src={getAbilityIcon(WeaponType.SWORD, 'innate')}
                alt="Innate Ability"
                width={80}
                height={100}
                unoptimized
              />
              <span className={styles.abilityKey}>W</span>
            </div>
          </div>
        </div>

        <div className={styles.weaponContainer}>
          <div 
            className={`${styles.icon} ${selectedWeapon === WeaponType.SCYTHE ? styles.selected : ''}`}
            onClick={() => handleWeaponClick(WeaponType.SCYTHE)}
          >
            <div className={styles.iconContent}>
              <Image 
                src="/icons/3.svg"
                alt="Scythe"
                width={240}
                height={280}
                unoptimized
              />
            </div>
          </div>
          <div className={styles.abilityIcons}>
            <div 
              className={styles.abilityIcon}
              onMouseEnter={(e) => handleAbilityHover(e, WeaponType.SCYTHE, 'q')}
              onMouseLeave={handleAbilityLeave}
            >
              <Image 
                src={getAbilityIcon(WeaponType.SCYTHE, 'q')}
                alt="Q Ability"
                width={80}
                height={100}
                unoptimized
              />
              <span className={styles.abilityKey}>Q</span>
            </div>
            <div 
              className={styles.abilityIcon}
              onMouseEnter={(e) => handleAbilityHover(e, WeaponType.SCYTHE, 'e')}
              onMouseLeave={handleAbilityLeave}
            >
              <Image 
                src={getAbilityIcon(WeaponType.SCYTHE, 'e')}
                alt="E Ability"
                width={80}
                height={100}
                unoptimized
              />
              <span className={styles.abilityKey}>E</span>
            </div>
          </div>
          <div className={styles.innateAbilityRow}>
            <div 
              className={styles.abilityIcon}
              onMouseEnter={(e) => handleAbilityHover(e, WeaponType.SCYTHE, 'innate')}
              onMouseLeave={handleAbilityLeave}
            >
              <Image 
                src={getAbilityIcon(WeaponType.SCYTHE, 'innate')}
                alt="Innate Ability"
                width={80}
                height={100}
                unoptimized
              />
              <span className={styles.abilityKey}>W</span>
            </div>
          </div>
        </div>

        <div className={styles.weaponContainer}>
          <div 
            className={`${styles.icon} ${selectedWeapon === WeaponType.SABRES ? styles.selected : ''}`}
            onClick={() => handleWeaponClick(WeaponType.SABRES)}
          >
            <div className={styles.iconContent}>
              <Image 
                src="/icons/2.svg"
                alt="Sabres"
                width={240}
                height={280}
                unoptimized
              />
            </div>
          </div>
          <div className={styles.abilityIcons}>
            <div 
              className={styles.abilityIcon}
              onMouseEnter={(e) => handleAbilityHover(e, WeaponType.SABRES, 'q')}
              onMouseLeave={handleAbilityLeave}
            >
              <Image 
                src={getAbilityIcon(WeaponType.SABRES, 'q')}
                alt="Q Ability"
                width={80}
                height={100}
                unoptimized
              />
              <span className={styles.abilityKey}>Q</span>
            </div>
            <div 
              className={styles.abilityIcon}
              onMouseEnter={(e) => handleAbilityHover(e, WeaponType.SABRES, 'e')}
              onMouseLeave={handleAbilityLeave}
            >
              <Image 
                src={getAbilityIcon(WeaponType.SABRES, 'e')}
                alt="E Ability"
                width={80}
                height={100}
                unoptimized
              />
              <span className={styles.abilityKey}>E</span>
            </div>
          </div>
          <div className={styles.innateAbilityRow}>
            <div 
              className={styles.abilityIcon}
              onMouseEnter={(e) => handleAbilityHover(e, WeaponType.SABRES, 'innate')}
              onMouseLeave={handleAbilityLeave}
            >
              <Image 
                src={getAbilityIcon(WeaponType.SABRES, 'innate')}
                alt="Innate Ability"
                width={80}
                height={100}
                unoptimized
              />
              <span className={styles.abilityKey}>W</span>
            </div>
          </div>
        </div>

        <div className={styles.weaponContainer}>
          <div 
            className={`${styles.icon} ${selectedWeapon === WeaponType.SPEAR ? styles.selected : ''}`}
            onClick={() => handleWeaponClick(WeaponType.SPEAR)}
          >
            <div className={styles.iconContent}>
              <Image 
                src="/icons/4.svg"
                alt="Spear"
                width={240}
                height={280}
                unoptimized
              />
            </div>
          </div>
          <div className={styles.abilityIcons}>
            <div 
              className={styles.abilityIcon}
              onMouseEnter={(e) => handleAbilityHover(e, WeaponType.SPEAR, 'q')}
              onMouseLeave={handleAbilityLeave}
            >
              <Image 
                src={getAbilityIcon(WeaponType.SPEAR, 'q')}
                alt="Q Ability"
                width={80}
                height={100}
                unoptimized
              />
              <span className={styles.abilityKey}>Q</span>
            </div>
            <div 
              className={styles.abilityIcon}
              onMouseEnter={(e) => handleAbilityHover(e, WeaponType.SPEAR, 'e')}
              onMouseLeave={handleAbilityLeave}
            >
              <Image 
                src={getAbilityIcon(WeaponType.SPEAR, 'e')}
                alt="E Ability"
                width={80}
                height={100}
                unoptimized
              />
              <span className={styles.abilityKey}>E</span>
            </div>
          </div>
          <div className={styles.innateAbilityRow}>
            <div 
              className={styles.abilityIcon}
              onMouseEnter={(e) => handleAbilityHover(e, WeaponType.SPEAR, 'innate')}
              onMouseLeave={handleAbilityLeave}
            >
              <Image 
                src={getAbilityIcon(WeaponType.SPEAR, 'innate')}
                alt="Innate Ability"
                width={80}
                height={100}
                unoptimized
              />
              <span className={styles.abilityKey}>W</span>
            </div>
          </div>
        </div>

        <div className={styles.weaponContainer}>
          <div 
            className={`${styles.icon} ${selectedWeapon === WeaponType.BOW ? styles.selected : ''}`}
            onClick={() => handleWeaponClick(WeaponType.BOW)}
          >
            <div className={styles.iconContent}>
              <Image 
                src="/icons/5.svg"
                alt="Bow"
                width={240}
                height={280}
                unoptimized
              />
            </div>
          </div>
          <div className={styles.abilityIcons}>
            <div 
              className={styles.abilityIcon}
              onMouseEnter={(e) => handleAbilityHover(e, WeaponType.BOW, 'q')}
              onMouseLeave={handleAbilityLeave}
            >
              <Image 
                src={getAbilityIcon(WeaponType.BOW, 'q')}
                alt="Q Ability"
                width={80}
                height={100}
                unoptimized
              />
              <span className={styles.abilityKey}>Q</span>
            </div>
            <div 
              className={styles.abilityIcon}
              onMouseEnter={(e) => handleAbilityHover(e, WeaponType.BOW, 'e')}
              onMouseLeave={handleAbilityLeave}
            >
              <Image 
                src={getAbilityIcon(WeaponType.BOW, 'e')}
                alt="E Ability"
                width={80}
                height={100}
                unoptimized
              />
              <span className={styles.abilityKey}>E</span>
            </div>
          </div>
          <div className={styles.innateAbilityRow}>
            <div 
              className={styles.abilityIcon}
              onMouseEnter={(e) => handleAbilityHover(e, WeaponType.BOW, 'innate')}
              onMouseLeave={handleAbilityLeave}
            >
              <Image 
                src={getAbilityIcon(WeaponType.BOW, 'innate')}
                alt="Innate Ability"
                width={80}
                height={100}
                unoptimized
              />
              <span className={styles.abilityKey}>W</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subclass Selection - only show if weapon is selected */}
      {selectedWeapon && (
        <div className={styles.subclassSelection}>
          <div className={styles.subclassGrid}>
            {getSubclassesForWeapon(selectedWeapon).map((subclass) => {
              const subclassInfo = WEAPON_SUBCLASSES[subclass];
              return (
                <div key={subclass} className={styles.subclassContainer}>
                  <div 
                    className={`${styles.subclassCard} ${selectedSubclass === subclass ? styles.selected : ''}`}
                    onClick={() => handleSubclassClick(subclass)}
                  >
                    <h4>{subclassInfo.name}</h4>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button 
        className={styles.startButton}
        onClick={onStart}
        disabled={!selectedSubclass}
      >
        Enter
      </button>

      {tooltipContent && (
        <Tooltip 
          content={tooltipContent}
          visible={!!tooltipContent}
          x={tooltipPosition.x}
          y={tooltipPosition.y}
        />
      )}
    </div>
  );
}
