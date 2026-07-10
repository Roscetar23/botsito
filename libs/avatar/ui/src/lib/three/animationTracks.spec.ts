import { AnimationClip, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';
import { ROOT_BONES, stripRootMotion } from './animationTracks.js';

function makeClip(): AnimationClip {
  const tracks = [
    // Manos (huesos raíz `Hueso`/`Hueso.001`): se quita position/scale, se conserva quaternion.
    new VectorKeyframeTrack('Hueso.position', [0, 1], [0, 0, 0, 1, 0, 0]),
    new QuaternionKeyframeTrack('Hueso.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, 1]),
    new VectorKeyframeTrack('Hueso.scale', [0, 1], [1, 1, 1, 1, 1, 1]),
    new VectorKeyframeTrack('Hueso.001.position', [0, 1], [0, 0, 0, 1, 0, 0]),
    new QuaternionKeyframeTrack('Hueso.001.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, 1]),
    new VectorKeyframeTrack('Hueso.001.scale', [0, 1], [1, 1, 1, 1, 1, 1]),
    // Cuerpo (`Hueso cuerpo`): se quita position/scale/quaternion por completo.
    new VectorKeyframeTrack('Hueso cuerpo.position', [0, 1], [0, 0, 0, 1, 0, 0]),
    new QuaternionKeyframeTrack('Hueso cuerpo.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, 1]),
    new VectorKeyframeTrack('Hueso cuerpo.scale', [0, 1], [1, 1, 1, 1, 1, 1]),
    // Hueso hijo del cuerpo: se conserva íntegro (mueve partes localmente).
    new VectorKeyframeTrack('Hueso cuerpo.001.position', [0, 1], [0, 0, 0, 0.1, 0, 0]),
    new QuaternionKeyframeTrack('Hueso cuerpo.001.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, 1]),
  ];
  return new AnimationClip('Esqueleto_accion', 1, tracks);
}

describe('stripRootMotion', () => {
  it('removes exactly the 7 unwanted body/root tracks', () => {
    const processed = stripRootMotion(makeClip());
    const names = processed.tracks.map((track) => track.name);

    const removed = [
      'Hueso.position',
      'Hueso.scale',
      'Hueso.001.position',
      'Hueso.001.scale',
      'Hueso cuerpo.position',
      'Hueso cuerpo.scale',
      'Hueso cuerpo.quaternion',
    ];
    for (const trackName of removed) {
      expect(names).not.toContain(trackName);
    }
    expect(names).toHaveLength(4);
  });

  it('keeps hand rotation and child-bone tracks', () => {
    const processed = stripRootMotion(makeClip());
    const names = processed.tracks.map((track) => track.name);

    expect(names).toContain('Hueso.quaternion');
    expect(names).toContain('Hueso.001.quaternion');
    expect(names).toContain('Hueso cuerpo.001.position');
    expect(names).toContain('Hueso cuerpo.001.quaternion');
  });

  it('covers the 3 documented root bones', () => {
    expect(ROOT_BONES).toEqual(['Hueso', 'Hueso.001', 'Hueso cuerpo']);
  });

  it('does not mutate the original clip', () => {
    const clip = makeClip();
    const originalLength = clip.tracks.length;
    stripRootMotion(clip);
    expect(clip.tracks).toHaveLength(originalLength);
  });
});
