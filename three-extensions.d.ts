   // src/three-extensions.d.ts

   declare module 'three/examples/jsm/controls/OrbitControls' {
    import { Camera, EventDispatcher, Vector3 } from 'three';

    export class OrbitControls extends EventDispatcher {
      constructor(object: Camera, domElement?: HTMLElement);

      object: Camera;
      domElement: HTMLElement | Document;

      // Additional properties from @react-three/drei
      screenSpacePanning: boolean;
      keyPanSpeed: number;
      zoomToCursor: boolean;
      reverseOrbit: boolean;

      // Existing properties
      minDistance: number;
      maxDistance: number;
      minZoom: number;
      maxZoom: number;
      minPolarAngle: number;
      maxPolarAngle: number;
      minAzimuthAngle: number;
      maxAzimuthAngle: number;
      enabled: boolean;
      enableZoom: boolean;
      enableRotate: boolean;
      enablePan: boolean;
      enableDamping: boolean;
      autoRotate: boolean;
      autoRotateSpeed: number;
      rotateSpeed: number;
      target: Vector3;
      target0: Vector3;
      position0: Vector3;
      zoom0: number;
      dampingFactor: number;
      zoomSpeed: number;
      panSpeed: number;

      // Methods
      update(): boolean;
      dispose(): void;
      getDistance(): number;
      listenToKeyEvents(domElement: HTMLElement | Window): void;
      saveState(): void;
      reset(): void;
    }

    export default OrbitControls;
  }