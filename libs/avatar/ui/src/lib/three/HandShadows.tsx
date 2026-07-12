'use client';

import { useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Group, Mesh, Object3D } from 'three';
import type { HandBones } from './handBonesContext.js';

export interface HandShadowsProps {
  bonesRef: MutableRefObject<HandBones>;
  color?: string;
}

/** Mismo "suelo" que `ShadowBlob` (borde inferior del bot centrado). */
const SHADOW_Y = -2.7;
const scratch = new Vector3();

/**
 * Coloca la elipse de sombra en el suelo justo bajo el hueso: toma la
 * posición **mundial** del hueso, la pasa al espacio local del padre (el
 * grupo del roam) y fija X/Z, dejando Y pegado al suelo (proyección de
 * contacto — ignora la altura de la mano). Si no hay hueso, oculta la sombra.
 */
function placeShadow(mesh: Mesh | null, bone: Object3D | null, parent: Object3D): void {
  if (!mesh) return;
  if (!bone) {
    mesh.visible = false;
    return;
  }
  mesh.visible = true;
  bone.getWorldPosition(scratch);
  parent.worldToLocal(scratch);
  mesh.position.set(scratch.x, SHADOW_Y, scratch.z);
}

/**
 * Sombras de contacto de las dos manos: dos elipses planas y tenues sobre
 * el suelo que **siguen** a cada mano (útil cuando balancean al caminar).
 * Hermano de `ShadowBlob` dentro del grupo del roam; lee los huesos de mano
 * por contexto (`useHandBones`, poblado por `RobotModel`) y los proyecta al
 * suelo cada frame. Las elipses son hijas de este grupo (identidad dentro
 * del roam), así que fijar su posición equivale a coordenadas del roam.
 */
export function HandShadows({ bonesRef, color = '#000000' }: HandShadowsProps) {
  const groupRef = useRef<Group>(null);
  const leftRef = useRef<Mesh>(null);
  const rightRef = useRef<Mesh>(null);

  useFrame(() => {
    const parent = groupRef.current?.parent;
    if (!parent) return;
    placeShadow(leftRef.current, bonesRef.current.left, parent);
    placeShadow(rightRef.current, bonesRef.current.right, parent);
  });

  return (
    <group ref={groupRef}>
      <mesh ref={leftRef} rotation={[-Math.PI / 2, 0, 0]} scale={[0.7, 0.5, 1]} renderOrder={-1}>
        <circleGeometry args={[1, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh ref={rightRef} rotation={[-Math.PI / 2, 0, 0]} scale={[0.7, 0.5, 1]} renderOrder={-1}>
        <circleGeometry args={[1, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  );
}
