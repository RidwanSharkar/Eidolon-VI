import { useRef, useState, useCallback } from 'react';
import React from 'react';
import { Group, Vector3 } from 'three';

interface TotemState {
  id: string;
  position: Vector3;
  groupRef: React.RefObject<Group>;
}

export function useTotemManager() {
  const [activeTotems, setActiveTotems] = useState<TotemState[]>([]);
  const nextTotemId = useRef(0);

  const createTotem = useCallback((position: Vector3) => {
    const totemId = `totem-${nextTotemId.current++}`;
    
    setActiveTotems(prev => [...prev, {
      id: totemId,
      position: position.clone(),
      groupRef: React.createRef<Group>()
    }]);

    return totemId;
  }, []);

  const removeTotem = useCallback((totemId: string) => {
    setActiveTotems(prev => prev.filter(totem => totem.id !== totemId));
  }, []);

  const getTotemPosition = useCallback((totemId: string): Vector3 | null => {
    const totem = activeTotems.find(t => t.id === totemId);
    if (!totem?.groupRef.current) return null;

    const worldPosition = new Vector3();
    totem.groupRef.current.getWorldPosition(worldPosition);
    return worldPosition;
  }, [activeTotems]);

  return {
    activeTotems,
    createTotem,
    removeTotem,
    getTotemPosition
  };
} 