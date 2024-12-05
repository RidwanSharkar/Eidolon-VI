   // src/three-extensions.d.ts

   declare module '@react-three/drei' {
    import { Camera, EventDispatcher, MOUSE, TOUCH, Vector3, Material, Color } from 'three';
    import React from 'react';
    import { TextProps as DreiTextProps } from '@react-three/drei';

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

    export interface BillboardProps {
      follow?: boolean;
      lockX?: boolean;
      lockY?: boolean;
      lockZ?: boolean;
      position?: [number, number, number];
      children?: React.ReactNode;
    }

    export interface TextProps extends DreiTextProps {
      children?: React.ReactNode;
      color?: string | Color;
      fontSize?: number;
      maxWidth?: number;
      lineHeight?: number;
      letterSpacing?: number;
      textAlign?: 'left' | 'right' | 'center' | 'justify';
      font?: string;
      anchorX?: number | 'left' | 'center' | 'right';
      anchorY?: number | 'top' | 'center' | 'middle' | 'bottom';
      position?: [number, number, number];
      material?: Material;
      characters?: string;
      outlineWidth?: number;
    }

    export const Text: React.FC<TextProps>;

    export class OrbitControls extends EventDispatcher {
      constructor(object: Camera, domElement?: HTMLElement);
      object: Camera;
      domElement: HTMLElement | Document;
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
      enableKeys: boolean;
      keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string };
      mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE };
      touches: { ONE: TOUCH; TWO: TOUCH };
    }

    export const Billboard: React.ForwardRefExoticComponent<BillboardProps>;
    export const Text: React.ForwardRefExoticComponent<TextProps>;
    export const Text3D: React.ForwardRefExoticComponent<TextProps>;
    export const OrbitControls: React.ForwardRefExoticComponent<OrbitControlsProps>;
  }