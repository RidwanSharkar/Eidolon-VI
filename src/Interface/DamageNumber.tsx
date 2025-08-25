import { useRef } from 'react';
import { Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Material, Mesh } from 'three';

interface DamageNumberProps {
  damage: number;
  position: Vector3;
  isCritical?: boolean;
  isLightning?: boolean;
  isBlizzard?: boolean;
  isHealing?: boolean;
  isBoneclaw?: boolean;
  isSmite?: boolean;
  isSword?: boolean;
  isSabres?: boolean;
  isOathstrike?: boolean;
  isFirebeam?: boolean;
  isOrbShield?: boolean;
  isChainLightning?: boolean;
  isFireball?: boolean;
  isSummon?: boolean;
  isStealthStrike?: boolean;
  isPyroclast?: boolean;
  isEagleEye?: boolean;
  isBreach?: boolean;
  isBowLightning?: boolean;
  isBarrage?: boolean;
  isGlacialShard?: boolean;
  isAegis?: boolean;
  isCrossentropyBolt?: boolean;
  isGuidedBolt?: boolean;
  isDivineStorm?: boolean;
  isHolyBurn?: boolean;
  isColossusStrike?: boolean;
  isColossusLightning?: boolean;
  isFirestorm?: boolean;
  isElementalBowPowershot?: boolean;
  isElementalQuickShot?: boolean;
  isPoisonDoT?: boolean;
  isRaze?: boolean;
  isSoulReaper?: boolean;
  isEviscerate?: boolean;
  isDragonBreath?: boolean;
  isLavaLash?: boolean;
  isMeteor?: boolean;
  isLegion?: boolean;
  isIcicle?: boolean;
  isLegionEmpoweredScythe?: boolean;
  onComplete: () => void;
}

interface TextMesh extends Mesh {
  material: Material & {
    opacity: number;
  };
}

export default function DamageNumber({ 
  damage, 
  position, 
  isCritical = false, 
  isLightning = false, 
  isBlizzard= false,
  isHealing = false, 
  isBoneclaw = false, 
  isOathstrike = false,
  isFirebeam = false,
  isOrbShield = false,
  isChainLightning = false,
  isFireball = false,
  isSummon = false,
  isStealthStrike = false,
  isPyroclast = false,
  isEagleEye = false,
  isBreach = false,
  isBowLightning = false,
  isBarrage = false,
  isGlacialShard = false,
  isAegis = false,
  isCrossentropyBolt = false,
  isGuidedBolt = false,
  isDivineStorm = false,
  isHolyBurn = false,
  isColossusStrike = false,
  isColossusLightning = false,
  isFirestorm = false,
  isElementalBowPowershot = false,
  isElementalQuickShot = false,
  isPoisonDoT = false,
  isRaze = false,
  isSoulReaper = false,
  isEviscerate = false,
  isDragonBreath = false,
  isLavaLash = false,
  isMeteor = false,
  isLegion = false,
  isIcicle = false,
  isLegionEmpoweredScythe = false,
  onComplete 
}: DamageNumberProps) {
  const textRef = useRef<TextMesh>(null);
  const startTime = useRef(Date.now());
  const startY = position.y + 3.5;
  const { camera } = useThree();
  
  // Spacing Offset
  const timeOffset = (Date.now() % 1000) / 1000;
  const horizontalOffset = Math.sin(timeOffset * Math.PI * 2) * 0.3;
  const verticalOffset = Math.cos(timeOffset * Math.PI * 2) * 0.2;

  useFrame(() => {
    if (!textRef.current) return;
    
    const elapsed = (Date.now() - startTime.current) / 1000;
    const lifespan = 1.5;
    
    if (elapsed >= lifespan) {
      onComplete();
      return;
    }

    // Make text always face the camera
    textRef.current.quaternion.copy(camera.quaternion);
    
    // Smooth movement using easing
    const progress = elapsed / lifespan;
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    const floatHeight = startY + (easedProgress * 1.2);
    const finalY = floatHeight + verticalOffset;
    const finalX = position.x + horizontalOffset;
    
    textRef.current.position.set(
      finalX,
      finalY,
      position.z
    );
    
    textRef.current.material.opacity = Math.min(1, 3 * (1 - progress));
  });

  // *** HEIRARCHY - orderIS CRUCIAL ***
  const getTextColor = () => {
    if (isHealing) return "#338C66";
    if (isPoisonDoT) return "#00ff44"; // Green for poison DoT damage
    if (isRaze) return "#FF4400"; // Orange-red for Raze fire damage
    if (isElementalQuickShot) return "#4DDDFF"; // Icy blue for Elemental BOW QuickShot at level 3+
    if (isElementalBowPowershot) return "#FF6A00"; // Orange for Elemental Bow fully charged shots
    if (isBreach) return "#FF6A00"; // OrangE
    if (isChainLightning) return "#ffff00";
    if (isOrbShield) return "#13F3FF"; // 58FCEC
    if (isEagleEye) return "#48FF00"; // venom green
    if (isCrossentropyBolt) return "#00FF44"; // Bright green for Crossentropy Bolt
    if (isLegionEmpoweredScythe) return "#8A2BE2"; // Purple for Legion empowered scythe attacks (47 damage)
    if (isCritical) return "#FF2D22";  //ff0000
    if (isSummon) return "#B999FF"; // 00FF51 00FF59 NO CRIT FOR TOTEM
    if (isBoneclaw) return "#00FF11"; // 39ff14
    if (isLightning) return "#FFD000";
    if (isOathstrike) return "#FF9441";
    if (isFirebeam) return "#00FFE5";
    if (isBlizzard) return "#00B7FF"; // 61EDFF
    if (isFireball) return "#00C946"; // 00C946
    if (isStealthStrike) return "#FF00FF"; // bright magenta for stealth strikes
    if (isPyroclast) return "#FF6A00"; // Orange for Pyroclast
    if (isBowLightning) return "#80D9FF"; // Light blue for bow lightning
    if (isGuidedBolt) return "#00AAFF"; // Bright blue for guided bolt missiles
    if (isBarrage) return "#FF8800"; // Orange-yellow for Barrage arrows
    if (isGlacialShard) return "#4DDDFF"; // Ice blue for Glacial Shard damage
    if (isAegis) return "#FFD700"; // Golden for Aegis nova damage
    if (isDivineStorm) return "#FFD700"; // Golden for Divine Storm damage
    if (isHolyBurn) return "#FFA500"; // Orange for Holy Burn DoT damage
    if (isColossusLightning) return "#FFD700"; // Golden yellow for Colossus Strike lightning
    if (isColossusStrike) return "#EBEBEB"; // Regular white for Colossus Strike main damage
    if (isFirestorm) return "#FF6A00"; // Orange for Firestorm damage
    if (isSoulReaper) return "#8A2BE2"; // Purple for Soul Reaper damage
    if (isEviscerate) return "#1f7fff"; // Bright blue for Eviscerate slashes
    if (isDragonBreath) return "#00FF44"; // Green for Dragon Breath damage
    if (isLavaLash) return "#FF4500"; // Orange-red for LavaLash damage
    if (isMeteor) return "#FF4500"; // Fire orange for Meteor damage
    if (isLegion) return "#00FF44"; // Green for Legion meteor damage
    if (isIcicle) return "#CCFFFF"; // Ice blue for Icicle damage
    return "#EBEBEB";
  };


  return (
    <Text
      ref={textRef}
      position={[position.x, startY, position.z]}
      fontSize={0.6}
      color={getTextColor()}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.05}
      outlineColor="#000000"
      material-transparent={true}
      material-depthTest={false}
    >
      {isHealing ? `+${damage}` : damage}
    </Text>
  );
} 