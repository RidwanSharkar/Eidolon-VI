import React, { useState } from 'react';
import styles from './LevelCompletionPanel.module.css';
import { WeaponType } from '../Weapons/weapons';
import { WEAPON_ABILITY_TOOLTIPS } from '../Weapons/weapons';
import Tooltip from './Tooltip';

interface LevelCompletionPanelProps {
  onContinue: () => void;
  onSelectIcon: (iconId: number) => void;
  selectedIcon: number | null;
  currentWeapon: WeaponType;
  onAbilityUnlock: (abilityType: 'r' | 'passive') => void;
}

export default function LevelCompletionPanel({ 
  onContinue, 
  onSelectIcon, 
  selectedIcon,
  currentWeapon,
  onAbilityUnlock
}: LevelCompletionPanelProps) {
  const [tooltipContent, setTooltipContent] = useState<{
    title: string;
    description: string;
    cost?: number | string;
    range?: number | string;
    damage?: number | string;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const getAbilityIcons = () => {
    switch (currentWeapon) {
      case WeaponType.SCYTHE:
        return { r: 'Eidolon/icons/r1.svg', p: '/Eidolon/icons/p1.svg' };
      case WeaponType.SWORD:
        return { r: 'Eidolon/icons/r2.svg', p: '/Eidolon/icons/p2.svg' };
      case WeaponType.SABRES:
        return { r: '/Eidolon/icons/r3.svg', p: '/Eidolon/icons/p3.svg' };
      case WeaponType.SABRES2:
        return { r: '/Eidolon/icons/r4.svg', p: '/Eidolon/icons/p4.svg' };
    }
  };

  const handleIconHover = (e: React.MouseEvent, abilityType: 'r' | 'passive') => {
    const tooltip = WEAPON_ABILITY_TOOLTIPS[currentWeapon][abilityType];
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipContent(tooltip);
    setTooltipPosition({
      x: rect.left - 721,
      y: rect.top -  70
    });
  };

  const handleIconLeave = () => {
    setTooltipContent(null);
  };

  const icons = getAbilityIcons();

  const handleIconSelect = (iconId: number) => {
    onSelectIcon(iconId);
    // iconId 1 is R ability, iconId 2 is passive
    const abilityType = iconId === 1 ? 'r' : 'passive';
    onAbilityUnlock(abilityType);
  };

  return (
    <div 
      className={styles.panel} 
      style={{ pointerEvents: 'auto' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <h2>Level Complete!</h2>
      <p>Choose an ability to unlock:</p>
      <div className={styles.iconSelection}>
        <div 
          className={`${styles.icon} ${selectedIcon === 1 ? styles.selected : ''}`}
          onClick={() => handleIconSelect(1)}
          onMouseEnter={(e) => handleIconHover(e, 'r')}
          onMouseLeave={handleIconLeave}
        >
          <div className={styles.iconContent}>
            <img src={icons?.r} alt="R Ability" style={{ width: '75px', height: '75px' }} />
            <p>[R] Hotkey</p>
          </div>
        </div>
        <div 
          className={`${styles.icon} ${selectedIcon === 2 ? styles.selected : ''}`}
          onClick={() => handleIconSelect(2)}
          onMouseEnter={(e) => handleIconHover(e, 'passive')}
          onMouseLeave={handleIconLeave}
        >
          <div className={styles.iconContent}>
            <img src={icons?.p} alt="Passive Ability" style={{ width: '75px', height: '75px' }} />
            <p>[1] Hotkey</p>
          </div>
        </div>
      </div>
      <button 
        className={styles.continueButton}
        onClick={onContinue}
        disabled={selectedIcon === null}
      >
        Confirm
      </button>

      <Tooltip 
        content={tooltipContent!}
        visible={!!tooltipContent}
        x={tooltipPosition.x}
        y={tooltipPosition.y}
      />
    </div>
  );
} 