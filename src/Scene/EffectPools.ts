import {
  AdditiveBlending,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Material,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
  SphereGeometry,
  Texture,
  TorusGeometry
} from 'three';

// Generic object pool class
class ObjectPool<T> {
  private pool: T[] = [];
  private create: () => T;
  private reset?: (item: T) => void;
  private maxSize: number;

  constructor(createFn: () => T, initialSize: number, maxSize: number, resetFn?: (item: T) => void) {
    this.create = createFn;
    this.reset = resetFn;
    this.maxSize = maxSize;
    
    // Initialize pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.create());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.create();
  }

  release(object: T) {
    if (this.pool.length >= this.maxSize) {
      // Dispose of object if pool is full to prevent memory leaks
      this.disposeObject(object);
      return;
    }
    if (this.reset) {
      this.reset(object);
    }
    this.pool.push(object);
  }

  private disposeObject(object: T) {
    // Properly dispose of Three.js geometries and materials
    if (object && typeof object === 'object') {
      // Handle Three.js geometries
      if (object instanceof BufferGeometry) {
        try {
          object.dispose();
        } catch (e) {
          console.warn('Failed to dispose geometry:', e);
        }
      }
      // Handle Three.js materials
      else if (object instanceof Material) {
        try {
          // Dispose all texture maps first
          const material = object as Material & {
            map?: Texture | Texture[];
            normalMap?: Texture | Texture[];
            roughnessMap?: Texture | Texture[];
            metalnessMap?: Texture | Texture[];
            emissiveMap?: Texture | Texture[];
            aoMap?: Texture | Texture[];
            displacementMap?: Texture | Texture[];
            bumpMap?: Texture | Texture[];
            lightMap?: Texture | Texture[];
          };

          const disposeTexture = (texture: Texture | Texture[] | undefined) => {
            if (!texture) return;
            if (Array.isArray(texture)) {
              texture.forEach(tex => tex?.dispose?.());
            } else {
              texture?.dispose?.();
            }
          };

          disposeTexture(material.map);
          disposeTexture(material.normalMap);
          disposeTexture(material.roughnessMap);
          disposeTexture(material.metalnessMap);
          disposeTexture(material.emissiveMap);
          disposeTexture(material.aoMap);
          disposeTexture(material.displacementMap);
          disposeTexture(material.bumpMap);
          disposeTexture(material.lightMap);

          object.dispose();
        } catch (e) {
          console.warn('Failed to dispose material:', e);
        }
      }
    }
  }

  clear() {
    // Dispose of all objects in pool during cleanup
    this.pool.forEach(item => {
      this.disposeObject(item);
    });
    this.pool = [];
  }

  dispose() {
    this.pool.forEach(item => {
      this.disposeObject(item);
    });
    this.clear();
  }
}

// Shared geometry pools
class GeometryPools {
  private static instance: GeometryPools;
  
  // Skeleton slash effect geometries
  public slashMainTorus: ObjectPool<TorusGeometry>;
  public slashInnerGlow: ObjectPool<TorusGeometry>;
  public slashOuterGlow: ObjectPool<TorusGeometry>;
  public slashParticle: ObjectPool<SphereGeometry>;
  public slashTrailSegment: ObjectPool<CylinderGeometry>;
  
  // Skeleton charging indicator geometries
  public chargingAttackArea: ObjectPool<BufferGeometry>;
  public chargingRing: ObjectPool<RingGeometry>;
  public chargingOrb: ObjectPool<SphereGeometry>;
  public chargingLine: ObjectPool<CylinderGeometry>;
  
  // Mage effect geometries
  public mageFireballSphere: ObjectPool<SphereGeometry>;
  public mageTrailSegment: ObjectPool<SphereGeometry>;
  public mageLightningCylinder: ObjectPool<CylinderGeometry>;
  public mageLightningRing: ObjectPool<RingGeometry>;

  // Reaper effect geometries
  public reaperMistParticle: ObjectPool<SphereGeometry>;

  // DeathKnight effect geometries (reuse skeleton patterns)
  public deathKnightSlashTorus: ObjectPool<TorusGeometry>;
  public deathKnightSlashParticle: ObjectPool<SphereGeometry>;
  public deathKnightChargingArea: ObjectPool<BufferGeometry>;
  public deathKnightChargingRing: ObjectPool<RingGeometry>;
  public deathKnightChargingOrb: ObjectPool<SphereGeometry>;
  public deathGraspTentacle: ObjectPool<CylinderGeometry>;
  public frostStrikeShard: ObjectPool<ConeGeometry>;
  public frostStrikeRing: ObjectPool<RingGeometry>;

  // Ascendant effect geometries
  public ascendantLightningBolt: ObjectPool<CylinderGeometry>;
  public ascendantLightningRing: ObjectPool<RingGeometry>;
  public ascendantChargingArea: ObjectPool<BufferGeometry>;
  public ascendantChargingOrb: ObjectPool<SphereGeometry>;
  public ascendantForcePulse: ObjectPool<SphereGeometry>;

  // Unit projectile geometries
  public arrowCylinder: ObjectPool<CylinderGeometry>;
  public arrowRing: ObjectPool<TorusGeometry>;
  public spearCylinder: ObjectPool<CylinderGeometry>;
  public projectileParticle: ObjectPool<SphereGeometry>;
  public projectileTorus: ObjectPool<TorusGeometry>;
  public projectileSphere: ObjectPool<SphereGeometry>;
  public projectileCone: ObjectPool<ConeGeometry>;
  public projectilePlane: ObjectPool<PlaneGeometry>;

  private constructor() {
    // Skeleton slash effect pools - reduced sizes for memory management
    this.slashMainTorus = new ObjectPool(
      () => new TorusGeometry(1.2, 0.15, 8, 32, Math.PI * 0.8),
      3, 6 // Reduced from 5,10 to 3,6
    );

    this.slashInnerGlow = new ObjectPool(
      () => new TorusGeometry(1.2, 0.08, 16, 32, Math.PI * 0.8),
      3, 6 // Reduced from 5,10 to 3,6
    );

    this.slashOuterGlow = new ObjectPool(
      () => new TorusGeometry(1.4, 0.2, 16, 32, Math.PI * 0.8),
      3, 6 // Reduced from 5,10 to 3,6
    );

    this.slashParticle = new ObjectPool(
      () => new SphereGeometry(0.06, 6, 6),
      12, 24 // Reduced from 20,40 to 12,24
    );

    this.slashTrailSegment = new ObjectPool(
      () => new CylinderGeometry(0.08, 0.02, 0.4, 8),
      8, 16 // Reduced from 15,30 to 8,16
    );

    // Skeleton charging indicator pools
    this.chargingAttackArea = new ObjectPool(
      () => this.createAttackAreaGeometry(),
      5, 10
    );
    
    this.chargingRing = new ObjectPool(
      () => new RingGeometry(0.6, 0.68, 16),
      10, 20
    );
    
    this.chargingOrb = new ObjectPool(
      () => new SphereGeometry(0.08, 8, 8),
      10, 20
    );
    
    this.chargingLine = new ObjectPool(
      () => new CylinderGeometry(0.015, 0.015, 1, 6),
      20, 40
    );

    // Mage effect pools
    this.mageFireballSphere = new ObjectPool(
      () => new SphereGeometry(0.3, 8, 8),
      10, 20
    );
    
    this.mageTrailSegment = new ObjectPool(
      () => new SphereGeometry(0.15, 6, 6),
      30, 60
    );
    
    this.mageLightningCylinder = new ObjectPool(
      () => new CylinderGeometry(0.1, 0.1, 1, 8),
      15, 30
    );
    
    this.mageLightningRing = new ObjectPool(
      () => new RingGeometry(0.5, 0.7, 16),
      10, 20
    );

    // Reaper effect pools
    this.reaperMistParticle = new ObjectPool(
      () => new SphereGeometry(0.25, 8, 8),
      60, 120 // High count since mist creates many particles and is used twice per use
    );

    // DeathKnight effect pools (REDUCED for memory management)
    this.deathKnightSlashTorus = new ObjectPool(
      () => new TorusGeometry(1.4, 0.18, 8, 32, Math.PI * 0.9),
      2, 4 // Reduced from 3,6 to 2,4 for stricter memory control
    );

    this.deathKnightSlashParticle = new ObjectPool(
      () => new SphereGeometry(0.08, 6, 6),
      6, 12 // Reduced from 8,16 to 6,12 for stricter memory control
    );

    this.deathKnightChargingArea = new ObjectPool(
      () => this.createAttackAreaGeometry(),
      2, 4 // Kept at 2,4 for charging area reuse
    );

    this.deathKnightChargingRing = new ObjectPool(
      () => new RingGeometry(0.7, 0.78, 16),
      3, 6 // Reduced from 4,8 to 3,6 for stricter memory control
    );

    this.deathKnightChargingOrb = new ObjectPool(
      () => new SphereGeometry(0.1, 8, 8),
      3, 6 // Reduced from 4,8 to 3,6 for stricter memory control
    );

    this.deathGraspTentacle = new ObjectPool(
      () => new CylinderGeometry(0.12, 0.08, 2, 8),
      4, 8 // Reduced from 6,12 to 4,8 for stricter memory control
    );

    this.frostStrikeShard = new ObjectPool(
      () => new ConeGeometry(0.15, 0.8, 6),
      20, 40
    );

    this.frostStrikeRing = new ObjectPool(
      () => new RingGeometry(1.0, 1.3, 16),
      10, 20
    );

    // Ascendant effect pools
    this.ascendantLightningBolt = new ObjectPool(
      () => new CylinderGeometry(0.08, 0.08, 1, 6),
      25, 50 // High count for frequent lightning effects
    );

    this.ascendantLightningRing = new ObjectPool(
      () => new RingGeometry(0.8, 1.0, 16),
      15, 30
    );

    this.ascendantChargingArea = new ObjectPool(
      () => this.createAttackAreaGeometry(),
      5, 10
    );

    this.ascendantChargingOrb = new ObjectPool(
      () => new SphereGeometry(0.12, 10, 10),
      10, 20
    );

    this.ascendantForcePulse = new ObjectPool(
      () => new SphereGeometry(1.0, 16, 16),
      8, 16
    );

    // Unit projectile geometry pools
    this.arrowCylinder = new ObjectPool(
      () => new CylinderGeometry(0.02, 0.075, 1.75, 6),
      10, 20
    );

    this.arrowRing = new ObjectPool(
      () => new TorusGeometry(0.125, 0.05, 6, 12),
      15, 30
    );

    this.spearCylinder = new ObjectPool(
      () => new CylinderGeometry(0.08, 0.18, 1.5, 4),
      8, 16
    );

    this.projectileParticle = new ObjectPool(
      () => new SphereGeometry(0.08, 3, 3),
      20, 40
    );

    this.projectileTorus = new ObjectPool(
      () => new TorusGeometry(0.25, 0.06, 3, 6),
      10, 20
    );

    this.projectileSphere = new ObjectPool(
      () => new SphereGeometry(0.05, 3, 3),
      25, 50
    );

    this.projectileCone = new ObjectPool(
      () => new ConeGeometry(0.08, 0.4, 6),
      10, 20
    );

    this.projectilePlane = new ObjectPool(
      () => new PlaneGeometry(1, 0.1),
      5, 10
    );
  }

  private createAttackAreaGeometry(): BufferGeometry {
    const geometry = new BufferGeometry();
    const vertices = [];
    const indices = [];
    
    const segments = 8;
    const attackRange = 2.65; // Default attack range
    
    // Center point
    vertices.push(0, 0.01, 0);
    
    // Create arc vertices
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments - 0.5) * Math.PI * 0.6; // 60 degree arc
      const x = Math.sin(angle) * attackRange;
      const z = Math.cos(angle) * attackRange;
      vertices.push(x, 0.01, z);
    }
    
    // Create triangles for the fan
    for (let i = 0; i < segments; i++) {
      indices.push(0, i + 1, i + 2);
    }
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    
    return geometry;
  }

  public static getInstance(): GeometryPools {
    if (!GeometryPools.instance) {
      GeometryPools.instance = new GeometryPools();
    }
    return GeometryPools.instance;
  }

  public dispose() {
    this.slashMainTorus.dispose();
    this.slashInnerGlow.dispose();
    this.slashOuterGlow.dispose();
    this.slashParticle.dispose();
    this.slashTrailSegment.dispose();
    this.chargingAttackArea.dispose();
    this.chargingRing.dispose();
    this.chargingOrb.dispose();
    this.chargingLine.dispose();
    this.mageFireballSphere.dispose();
    this.mageTrailSegment.dispose();
    this.mageLightningCylinder.dispose();
    this.mageLightningRing.dispose();
    this.reaperMistParticle.dispose();
    this.deathKnightSlashTorus.dispose();
    this.deathKnightSlashParticle.dispose();
    this.deathKnightChargingArea.dispose();
    this.deathKnightChargingRing.dispose();
    this.deathKnightChargingOrb.dispose();
    this.deathGraspTentacle.dispose();
    this.frostStrikeShard.dispose();
    this.frostStrikeRing.dispose();
    this.ascendantLightningBolt.dispose();
    this.ascendantLightningRing.dispose();
    this.ascendantChargingArea.dispose();
    this.ascendantChargingOrb.dispose();
    this.ascendantForcePulse.dispose();

    // Unit projectile geometries
    this.arrowCylinder.dispose();
    this.arrowRing.dispose();
    this.spearCylinder.dispose();
    this.projectileParticle.dispose();
    this.projectileTorus.dispose();
    this.projectileSphere.dispose();
    this.projectileCone.dispose();
    this.projectilePlane.dispose();
  }
}

// Shared material pools
class MaterialPools {
  private static instance: MaterialPools;
  
  // Skeleton slash materials
  public slashMain: ObjectPool<MeshStandardMaterial>;
  public slashInnerGlow: ObjectPool<MeshStandardMaterial>;
  public slashOuterGlow: ObjectPool<MeshStandardMaterial>;
  public slashParticle: ObjectPool<MeshStandardMaterial>;
  public slashTrail: ObjectPool<MeshStandardMaterial>;
  
  // Skeleton charging materials
  public chargingArea: ObjectPool<MeshBasicMaterial>;
  public chargingBorder: ObjectPool<MeshBasicMaterial>;
  public chargingRing: ObjectPool<MeshBasicMaterial>;
  public chargingOrb: ObjectPool<MeshStandardMaterial>;
  public chargingLine: ObjectPool<MeshStandardMaterial>;
  
  // Mage materials
  public mageFireball: ObjectPool<MeshStandardMaterial>;
  public mageTrail: ObjectPool<MeshStandardMaterial>;
  public mageLightning: ObjectPool<MeshStandardMaterial>;
  public mageLightningRing: ObjectPool<MeshBasicMaterial>;

  // Reaper materials
  public reaperMist: ObjectPool<MeshStandardMaterial>;

  // DeathKnight materials
  public deathKnightSlash: ObjectPool<MeshStandardMaterial>;
  public deathKnightSlashParticle: ObjectPool<MeshStandardMaterial>;
  public deathKnightChargingArea: ObjectPool<MeshBasicMaterial>;
  public deathKnightChargingRing: ObjectPool<MeshBasicMaterial>;
  public deathKnightChargingOrb: ObjectPool<MeshStandardMaterial>;
  public deathGrasp: ObjectPool<MeshStandardMaterial>;
  public frostStrike: ObjectPool<MeshStandardMaterial>;
  public frostStrikeRing: ObjectPool<MeshBasicMaterial>;

  // Ascendant materials
  public ascendantLightning: ObjectPool<MeshStandardMaterial>;
  public ascendantLightningRing: ObjectPool<MeshBasicMaterial>;
  public ascendantChargingArea: ObjectPool<MeshBasicMaterial>;
  public ascendantChargingOrb: ObjectPool<MeshStandardMaterial>;
  public ascendantForcePulse: ObjectPool<MeshStandardMaterial>;

  private constructor() {
    // Skeleton slash material pools
    this.slashMain = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#8B0000",
        emissive: "#8B0000",
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: AdditiveBlending
      }),
      5, 10,
      (material) => {
        material.opacity = 0.9;
        material.emissiveIntensity = 1.5;
      }
    );
    
    this.slashInnerGlow = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#A00000",
        emissive: "#A00000",
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: AdditiveBlending
      }),
      5, 10,
      (material) => {
        material.opacity = 0.8;
        material.emissiveIntensity = 1.0;
      }
    );
    
    this.slashOuterGlow = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#6B0000",
        emissive: "#6B0000",
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: AdditiveBlending
      }),
      5, 10,
      (material) => {
        material.opacity = 0.6;
        material.emissiveIntensity = 0.8;
      }
    );
    
    this.slashParticle = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#B00000",
        emissive: "#B00000",
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: AdditiveBlending
      }),
      20, 40,
      (material) => {
        material.opacity = 0.7;
        material.emissiveIntensity = 1.2;
      }
    );
    
    this.slashTrail = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#C00000",
        emissive: "#C00000",
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: AdditiveBlending
      }),
      15, 30,
      (material) => {
        material.opacity = 0.6;
        material.emissiveIntensity = 1.0;
      }
    );

    // Skeleton charging material pools
    this.chargingArea = new ObjectPool(
      () => new MeshBasicMaterial({
        color: "#FF4444",
        transparent: true,
        opacity: 0.4,
        blending: AdditiveBlending,
        side: DoubleSide
      }),
      5, 10,
      (material) => {
        material.opacity = 0.4;
      }
    );
    
    this.chargingBorder = new ObjectPool(
      () => new MeshBasicMaterial({
        color: "#FF0000",
        transparent: true,
        opacity: 0.7,
        blending: AdditiveBlending,
        side: DoubleSide,
        wireframe: true
      }),
      5, 10,
      (material) => {
        material.opacity = 0.7;
      }
    );
    
    this.chargingRing = new ObjectPool(
      () => new MeshBasicMaterial({
        color: "#FF4444",
        transparent: true,
        opacity: 0.5,
        blending: AdditiveBlending
      }),
      10, 20,
      (material) => {
        material.opacity = 0.5;
      }
    );
    
    this.chargingOrb = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#FF3333",
        emissive: "#FF0000",
        emissiveIntensity: 15,
        transparent: true,
        opacity: 0.9
      }),
      10, 20,
      (material) => {
        material.opacity = 0.9;
        material.emissiveIntensity = 15;
      }
    );
    
    this.chargingLine = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#FF3333",
        emissive: "#FF0000",
        emissiveIntensity: 8,
        transparent: true,
        opacity: 0.8
      }),
      20, 40,
      (material) => {
        material.opacity = 0.8;
        material.emissiveIntensity = 8;
      }
    );

    // Mage material pools
    this.mageFireball = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#FF4500",
        emissive: "#FF4500",
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 0.9
      }),
      10, 20,
      (material) => {
        material.opacity = 0.9;
        material.emissiveIntensity = 2.0;
      }
    );
    
    this.mageTrail = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#FF6600",
        emissive: "#FF4500",
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.7,
        blending: AdditiveBlending
      }),
      30, 60,
      (material) => {
        material.opacity = 0.7;
        material.emissiveIntensity = 1.5;
      }
    );
    
    this.mageLightning = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#4444FF",
        emissive: "#4444FF",
        emissiveIntensity: 3.0,
        transparent: true,
        opacity: 0.8
      }),
      15, 30,
      (material) => {
        material.opacity = 0.8;
        material.emissiveIntensity = 3.0;
      }
    );
    
    this.mageLightningRing = new ObjectPool(
      () => new MeshBasicMaterial({
        color: "#6666FF",
        transparent: true,
        opacity: 0.6,
        blending: AdditiveBlending
      }),
      10, 20,
      (material) => {
        material.opacity = 0.6;
      }
    );

    // Reaper material pools
    this.reaperMist = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#a8e6cf",
        emissive: "#a8e6cf",
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.6,
        blending: AdditiveBlending,
        depthWrite: false
      }),
      60, 120,
      (material) => {
        material.opacity = 0.6;
        material.emissiveIntensity = 0.5;
      }
    );

    // DeathKnight material pools
    this.deathKnightSlash = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#4A90E2", // Frost blue
        emissive: "#4A90E2",
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: AdditiveBlending
      }),
      5, 10,
      (material) => {
        material.opacity = 0.9;
        material.emissiveIntensity = 2.0;
      }
    );

    this.deathKnightSlashParticle = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#87CEEB", // Sky blue
        emissive: "#87CEEB",
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: AdditiveBlending
      }),
      20, 40,
      (material) => {
        material.opacity = 0.8;
        material.emissiveIntensity = 1.5;
      }
    );

    this.deathKnightChargingArea = new ObjectPool(
      () => new MeshBasicMaterial({
        color: "#4A90E2",
        transparent: true,
        opacity: 0.4,
        blending: AdditiveBlending,
        side: DoubleSide
      }),
      5, 10,
      (material) => {
        material.opacity = 0.4;
      }
    );

    this.deathKnightChargingRing = new ObjectPool(
      () => new MeshBasicMaterial({
        color: "#87CEEB",
        transparent: true,
        opacity: 0.6,
        blending: AdditiveBlending
      }),
      10, 20,
      (material) => {
        material.opacity = 0.6;
      }
    );

    this.deathKnightChargingOrb = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#4A90E2",
        emissive: "#4A90E2",
        emissiveIntensity: 12,
        transparent: true,
        opacity: 0.9
      }),
      10, 20,
      (material) => {
        material.opacity = 0.9;
        material.emissiveIntensity = 12;
      }
    );

    this.deathGrasp = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#2E4057", // Dark blue-gray
        emissive: "#2E4057",
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.8
      }),
      4, 8, // Reduced from 8,16 to 4,8 for stricter memory control
      (material) => {
        material.opacity = 0.8;
        material.emissiveIntensity = 1.0;
      }
    );

    this.frostStrike = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#B0E0E6", // Powder blue
        emissive: "#B0E0E6",
        emissiveIntensity: 2.5,
        transparent: true,
        opacity: 0.9
      }),
      20, 40,
      (material) => {
        material.opacity = 0.9;
        material.emissiveIntensity = 2.5;
      }
    );

    this.frostStrikeRing = new ObjectPool(
      () => new MeshBasicMaterial({
        color: "#87CEEB",
        transparent: true,
        opacity: 0.7,
        blending: AdditiveBlending
      }),
      10, 20,
      (material) => {
        material.opacity = 0.7;
      }
    );

    // Ascendant material pools
    this.ascendantLightning = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#FFD700", // Gold
        emissive: "#FFD700",
        emissiveIntensity: 3.5,
        transparent: true,
        opacity: 0.9
      }),
      25, 50,
      (material) => {
        material.opacity = 0.9;
        material.emissiveIntensity = 3.5;
      }
    );

    this.ascendantLightningRing = new ObjectPool(
      () => new MeshBasicMaterial({
        color: "#FFA500", // Orange
        transparent: true,
        opacity: 0.8,
        blending: AdditiveBlending
      }),
      15, 30,
      (material) => {
        material.opacity = 0.8;
      }
    );

    this.ascendantChargingArea = new ObjectPool(
      () => new MeshBasicMaterial({
        color: "#FFD700",
        transparent: true,
        opacity: 0.5,
        blending: AdditiveBlending,
        side: DoubleSide
      }),
      5, 10,
      (material) => {
        material.opacity = 0.5;
      }
    );

    this.ascendantChargingOrb = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#FFD700",
        emissive: "#FFD700",
        emissiveIntensity: 18,
        transparent: true,
        opacity: 0.95
      }),
      10, 20,
      (material) => {
        material.opacity = 0.95;
        material.emissiveIntensity = 18;
      }
    );

    this.ascendantForcePulse = new ObjectPool(
      () => new MeshStandardMaterial({
        color: "#FFA500",
        emissive: "#FFA500",
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 0.6,
        blending: AdditiveBlending
      }),
      8, 16,
      (material) => {
        material.opacity = 0.6;
        material.emissiveIntensity = 2.0;
      }
    );
  }

  public static getInstance(): MaterialPools {
    if (!MaterialPools.instance) {
      MaterialPools.instance = new MaterialPools();
    }
    return MaterialPools.instance;
  }

  public dispose() {
    this.slashMain.dispose();
    this.slashInnerGlow.dispose();
    this.slashOuterGlow.dispose();
    this.slashParticle.dispose();
    this.slashTrail.dispose();
    this.chargingArea.dispose();
    this.chargingBorder.dispose();
    this.chargingRing.dispose();
    this.chargingOrb.dispose();
    this.chargingLine.dispose();
    this.mageFireball.dispose();
    this.mageTrail.dispose();
    this.mageLightning.dispose();
    this.mageLightningRing.dispose();
    this.reaperMist.dispose();
    this.deathKnightSlash.dispose();
    this.deathKnightSlashParticle.dispose();
    this.deathKnightChargingArea.dispose();
    this.deathKnightChargingRing.dispose();
    this.deathKnightChargingOrb.dispose();
    this.deathGrasp.dispose();
    this.frostStrike.dispose();
    this.frostStrikeRing.dispose();
    this.ascendantLightning.dispose();
    this.ascendantLightningRing.dispose();
    this.ascendantChargingArea.dispose();
    this.ascendantChargingOrb.dispose();
    this.ascendantForcePulse.dispose();
  }
}

// Export singleton instances
export const geometryPools = GeometryPools.getInstance();
export const materialPools = MaterialPools.getInstance();

// Import shared resources for disposal
import '../Spells/Boneclaw/BoneClawScratch';
import '../Versus/Abomination/CustomAbomination';
import '../Spells/Summon/TotemModel';
// Global shared resource disposal registry
const globalSharedResources: Array<{ dispose: () => void; name: string }> = [];

// Function to register global shared resources for disposal
export const registerGlobalSharedResource = (disposeFn: () => void, name: string) => {
  globalSharedResources.push({ dispose: disposeFn, name });
};

// Dispose all global shared resources
const disposeGlobalSharedResources = () => {
  globalSharedResources.forEach(({ dispose, name }) => {
    try {
      dispose();
      console.log(`✅ Disposed global shared resource: ${name}`);
    } catch (error) {
      console.error(`❌ Error disposing global shared resource ${name}:`, error);
    }
  });
  globalSharedResources.length = 0; // Clear the registry
};

// Cleanup function for when the game shuts down
export const disposeEffectPools = () => {
  try {
    geometryPools.dispose();
    materialPools.dispose();
    disposeGlobalSharedResources();
    console.log('✅ EffectPools and global shared resources disposed successfully');
  } catch (error) {
    console.error('❌ Error disposing EffectPools:', error);
  }
};

// Make disposeEffectPools available globally for cleanup
if (typeof window !== 'undefined') {
  (window as typeof window & { disposeEffectPools?: () => void }).disposeEffectPools = disposeEffectPools;
}