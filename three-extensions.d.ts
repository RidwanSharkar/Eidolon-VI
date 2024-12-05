   // src/three-extensions.d.ts

   declare module '@react-three/drei' {
    import { Camera, EventDispatcher, MOUSE, TOUCH, Vector3 } from 'three';

    export interface OrbitControlsProps {
      makeDefault?: boolean;
      camera?: Camera;
      domElement?: HTMLElement;
      enableDamping?: boolean;
      enablePan?: boolean;
      enableRotate?: boolean;
      enableZoom?: boolean;
      maxAzimuthAngle?: number;
      maxDistance?: number;
      maxPolarAngle?: number;
      maxZoom?: number;
      minAzimuthAngle?: number;
      minDistance?: number;
      minPolarAngle?: number;
      minZoom?: number;
      mouseButtons?: {
        LEFT?: MOUSE | null;
        MIDDLE?: MOUSE | null;
        RIGHT?: MOUSE | null;
      };
      ref?: React.RefObject<OrbitControls>;
    }

    export class OrbitControls extends EventDispatcher {
      constructor(object: Camera, domElement?: HTMLElement);
      
      // Add static property for props
      static defaultProps: OrbitControlsProps;
      props: OrbitControlsProps;

      object: Camera;
      domElement: HTMLElement | Document;

      // Drei-specific properties
      reverseHorizontalOrbit: boolean;
      reverseVerticalOrbit: boolean;
      reverseOrbit: boolean;
      reverseZoom: boolean;
      reverseDragRotate: boolean;
      reverseDragPan: boolean;
      reverseKeys: boolean;
      reverseWheel: boolean;

      // Mouse buttons
      mouseButtons: {
        LEFT?: MOUSE | null;
        MIDDLE?: MOUSE | null;
        RIGHT?: MOUSE | null;
      };

      // Touch fingers
      touches: {
        ONE?: TOUCH | null;
        TWO?: TOUCH | null;
      };

      // All other properties
      enabled: boolean;
      target: Vector3;
      minDistance: number;
      maxDistance: number;
      minZoom: number;
      maxZoom: number;
      minPolarAngle: number;
      maxPolarAngle: number;
      minAzimuthAngle: number;
      maxAzimuthAngle: number;
      enableDamping: boolean;
      dampingFactor: number;
      enableZoom: boolean;
      zoomSpeed: number;
      enableRotate: boolean;
      rotateSpeed: number;
      enablePan: boolean;
      panSpeed: number;
      screenSpacePanning: boolean;
      keyPanSpeed: number;
      autoRotate: boolean;
      autoRotateSpeed: number;
      keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string };
      
      // Methods
      update(): boolean;
      dispose(): void;
      getDistance(): number;
      listenToKeyEvents(domElement: HTMLElement | Window): void;
      saveState(): void;
      reset(): void;
      stopAutoRotate(): void;
    }
  }