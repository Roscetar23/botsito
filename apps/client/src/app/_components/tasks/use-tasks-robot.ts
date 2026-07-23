'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { Task, TaskStatus } from '@asistente/tasks-model';
import type { AvatarState } from '@asistente/avatar-model';
import { taskNeedsAdvance } from './task-status';
import { REST_TARGET, targetFromRect } from './robot-target';
import type { PressHand, RobotTarget } from './robot-target';

// Mismo timing que `calendar/use-robot-choreography.ts` (ver ahí el porqué).
const TRAVEL_MS = 520;
const PRESS_MS = 180;
const REST_EASE_SLOW = 0.8;

export interface UseTasksRobotResult {
  boardRef: RefObject<HTMLElement | null>;
  robotTarget: RobotTarget;
  pressTrigger?: number;
  pressHand: PressHand;
  easeSpeed?: number;
  robotState: AvatarState;
}

/**
 * Detecta la primera tarea cuyo progreso va por delante de su columna y
 * hace que el robot viaje hasta su card, la "toque" y la mueva a la columna
 * que le corresponde (vía `advance`, provisto por el llamador). Solo hacia
 * adelante: nunca retrocede una card, para no pelear con el arrastre manual.
 *
 * `busyRef` evita solapar coreografías; al terminar una (o si `reducedMotion`
 * resuelve sin animar), el cambio de `tasks` que trae el refetch reejecuta
 * el efecto y coge la siguiente tarea atrasada, hasta que no quede ninguna.
 * Los timers en curso NO se cancelan por re-renders ajenos (p. ej. arrastrar
 * otra card a mano mientras el robot viaja): se dejan resolver solos y así
 * `busyRef` siempre se libera; solo se limpian de verdad al desmontar.
 */
export function useTasksRobot(
  tasks: Task[],
  advance: (taskId: string, toStatus: TaskStatus) => Promise<void>,
): UseTasksRobotResult {
  const boardRef = useRef<HTMLElement>(null);
  const reducedMotion = Boolean(useReducedMotion());
  const busyRef = useRef(false);
  const timersRef = useRef<{ press?: ReturnType<typeof setTimeout>; resolve?: ReturnType<typeof setTimeout> }>({});

  const [robotTarget, setRobotTarget] = useState<RobotTarget>(REST_TARGET);
  const [pressTrigger, setPressTrigger] = useState<number>();
  const [pressHand, setPressHand] = useState<PressHand>('right');
  const [easeSpeed, setEaseSpeed] = useState<number>();
  const [robotState, setRobotState] = useState<AvatarState>('idle');

  // Limpieza real de timers: solo al desmontar (no en cada re-render), para
  // no cortar en seco una coreografía en curso por un cambio de `tasks`
  // ajeno (ver comentario de arriba).
  useEffect(() => {
    return () => {
      if (timersRef.current.press) clearTimeout(timersRef.current.press);
      if (timersRef.current.resolve) clearTimeout(timersRef.current.resolve);
    };
  }, []);

  useEffect(() => {
    if (busyRef.current) return; // coreografía en curso: no reiniciar

    const task = tasks.find((item) => taskNeedsAdvance(item) !== null);
    if (!task) return;
    const toStatus = taskNeedsAdvance(task);
    if (!toStatus) return;

    if (reducedMotion) {
      void advance(task.id, toStatus);
      return;
    }

    const el = boardRef.current?.querySelector(`[data-task-id="${task.id}"]`);
    if (!el) {
      busyRef.current = true;
      void advance(task.id, toStatus).finally(() => {
        busyRef.current = false;
      });
      return;
    }

    busyRef.current = true;
    const cardRect = el.getBoundingClientRect();
    const boardRect = boardRef.current?.getBoundingClientRect() ?? null;
    const target = targetFromRect(cardRect, boardRect);

    setEaseSpeed(undefined);
    setRobotTarget(target);
    setPressHand(target.x < 0 ? 'left' : 'right');
    setRobotState('notify');

    timersRef.current.press = setTimeout(() => {
      setPressTrigger((n) => (n ?? 0) + 1);
      timersRef.current.resolve = setTimeout(() => {
        void advance(task.id, toStatus).finally(() => {
          setRobotTarget(REST_TARGET);
          setEaseSpeed(REST_EASE_SLOW);
          setRobotState('idle');
          busyRef.current = false;
        });
      }, PRESS_MS);
    }, TRAVEL_MS);
  }, [tasks, advance, reducedMotion]);

  return { boardRef, robotTarget, pressTrigger, pressHand, easeSpeed, robotState };
}
