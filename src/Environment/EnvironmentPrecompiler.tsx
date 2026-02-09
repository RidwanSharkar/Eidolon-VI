import React, { useRef, useMemo } from 'react';
import { Color, Mesh, Group, Vector3 } from 'three';
import Terrain from './Terrain';
import CustomSky from './Sky';
import Pillar from './Pillar';
import Pedestal from './Pedestal';
import Planet from './Planet';

import InstancedMountains from './InstancedMountains';
import InstancedMushrooms from './InstancedMushrooms';
import InstancedVegetation from './InstancedVegetation';
import SimpleBorderEffects from './SimpleBorderEffects';
import DetailedTrees from './DetailedTrees';
import { generateMountains, generateMushrooms, generateClusteredTrees } from './terrainGenerators';

// Import trail components for shader precompilation
import MageFireballTrail from '../Versus/SkeletalMage/MageFireballTrail';
import FireballTrail from '../Spells/Fireball/FireballTrail';
import LavaLashTrail from '../Spells/LavaLash/LavaLashTrail';
import PyroclastTrail from '../Spells/Pyroclast/PyroclastTrail';
import ReaperTrailEffect from '../Versus/Reaper/ReaperTrailEffect';
import DeathKnightTrailEffect from '../Versus/DeathKnight/DeathKnightTrailEffect';
import MeteorTrail from '../Versus/Boss/MeteorTrail';
import AscendantTrailEffect from '../Versus/Ascendant/AscendantTrailEffect';
import AbominationTrailEffect from '../Versus/Abomination/AbominationTrailEffect';
import ElementalTrail from '../Spells/Summon/ElementalTrail';
import LegionMeteorTrail from '../Spells/Legion/LegionMeteorTrail';
import GuidedBoltTrail from '../Spells/GuidedBolts/GuidedBoltTrail';
import FrostTrail from '../Spells/GlacialShard/FrostTrail';
import CrossentropyBoltTrail from '../Spells/Fireball/CrossentropyBoltTrail';
import HolyTrail from '../Spells/Aegis/HolyTrail';

/**
 * Precompiles shaders for all environment and effect components.
 * This component renders the elements invisibly to force
 * Three.js to compile their shaders during the initial load.
 */
const EnvironmentPrecompiler: React.FC = () => {
  // We render for all levels to ensure all color-variant shaders are compiled
  const levels = [1, 2, 3, 4, 5];

  // Dummy data for environment components
  const mountainData = useMemo(() => generateMountains(), []);
  const mushroomData = useMemo(() => generateMushrooms(), []);
  const treeData = useMemo(() => generateClusteredTrees(), []);

  // Dummy refs for trail components
  const dummyMeshRef = useRef<Mesh>(null);
  const dummyGroupRef = useRef<Group>(null);
  const dummyColor = new Color('#ff0000');

  // Ensure refs are not null for components that expect them
  if (dummyMeshRef.current === null) {
    (dummyMeshRef as any).current = new Mesh();
    // Some components use getWorldPosition
    dummyMeshRef.current!.getWorldPosition = (v: Vector3) => v.set(0, 0, 0);
  }
  if (dummyGroupRef.current === null) {
    (dummyGroupRef as any).current = new Group();
    dummyGroupRef.current!.getWorldPosition = (v: Vector3) => v.set(0, 0, 0);
  }

  return (
    <group visible={false} name="ShaderPrecompiler">
      {levels.map((level) => (
        <group key={`precompile-level-${level}`}>
          <Terrain level={level} />
          <CustomSky level={level} />
          <Pillar level={level} />
          <Pedestal level={level} />
          <SimpleBorderEffects level={level} />
        </group>
      ))}
      
      {/* Other environment components that don't depend on level but have shaders */}
      <Planet />
      <InstancedMountains mountains={mountainData} />
      <InstancedMushrooms mushrooms={mushroomData} />
      <InstancedVegetation />
      <DetailedTrees trees={treeData} />

      {/* Precompile all trail shaders */}
      <MageFireballTrail color={dummyColor} size={1} meshRef={dummyMeshRef} />
      <FireballTrail color={dummyColor} size={1} meshRef={dummyMeshRef} />
      <LavaLashTrail color={dummyColor} size={1} meshRef={dummyMeshRef} />
      <PyroclastTrail color={dummyColor} size={1} meshRef={dummyMeshRef} />
      <ReaperTrailEffect parentRef={dummyGroupRef} />
      <DeathKnightTrailEffect parentRef={dummyGroupRef} />
      <MeteorTrail color={dummyColor} size={1} meshRef={dummyMeshRef} />
      <AscendantTrailEffect parentRef={dummyGroupRef} />
      <AbominationTrailEffect parentRef={dummyGroupRef} />
      <ElementalTrail color={dummyColor} size={1} meshRef={dummyMeshRef} />
      <LegionMeteorTrail color={dummyColor} size={1} meshRef={dummyMeshRef} />
      <GuidedBoltTrail color={dummyColor} size={1} meshRef={dummyMeshRef} />
      <FrostTrail color={dummyColor} size={1} meshRef={dummyMeshRef} />
      <CrossentropyBoltTrail color={dummyColor} size={1} mesh1Ref={dummyMeshRef} mesh2Ref={dummyMeshRef} />
      <HolyTrail color={dummyColor} size={1} meshRef={dummyMeshRef} />
    </group>
  );
};

export default React.memo(EnvironmentPrecompiler);
