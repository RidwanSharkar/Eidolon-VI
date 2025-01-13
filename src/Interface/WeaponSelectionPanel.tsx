import React from 'react';
import styles from './WeaponSelectionPanel.module.css';
import { WeaponType } from '@/Weapons/weapons';
import Image from 'next/image';

interface WeaponSelectionPanelProps {
  onWeaponSelect: (weapon: WeaponType) => void;
  selectedWeapon: WeaponType | null;
  onStart: () => void;
}

export default function WeaponSelectionPanel({ 
  onWeaponSelect, 
  selectedWeapon,
  onStart 
}: WeaponSelectionPanelProps) {
  return (
    <div 
      className={styles.panel} 
      onContextMenu={(e) => e.preventDefault()}
    >
      <h2>Eidolon</h2>

      
      <div className={styles.iconSelection}>
        <div 
          className={`${styles.icon} ${selectedWeapon === WeaponType.SWORD ? styles.selected : ''}`}
          onClick={() => onWeaponSelect(WeaponType.SWORD)}
        >
          <div className={styles.iconContent}>
            <Image 
              src="/Eidolon/icons/2.svg"
              alt="Sword"
              width={280}
              height={320}
              unoptimized
            />
          </div>
        </div>

        <div 
          className={`${styles.icon} ${selectedWeapon === WeaponType.SCYTHE ? styles.selected : ''}`}
          onClick={() => onWeaponSelect(WeaponType.SCYTHE)}
        >
          <div className={styles.iconContent}>
            <Image 
              src="/Eidolon/icons/1.svg"
              alt="Scythe"
              width={280}
              height={320}
              unoptimized
            />
          </div>
        </div>

        <div 
          className={`${styles.icon} ${selectedWeapon === WeaponType.SABRES ? styles.selected : ''}`}
          onClick={() => onWeaponSelect(WeaponType.SABRES)}
        >
          <div className={styles.iconContent}>
            <Image 
              src="/Eidolon/icons/3.svg"
              alt="Sabres"
              width={280}
              height={320}
              unoptimized
            />
          </div>
        </div>
      </div>

      <button 
        className={styles.startButton}
        onClick={onStart}
        disabled={!selectedWeapon}
      >
        Enter
      </button>
    </div>
  );
}

