import { AnimationClip, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';
import { ROOT_BONES, stripRootTranslation } from './animationTracks.js';

function makeClip(): AnimationClip {
  const tracks = [
    new VectorKeyframeTrack('Hueso.position', [0, 1], [0, 0, 0, 1, 0, 0]),
    new QuaternionKeyframeTrack('Hueso.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, 1]),
    new VectorKeyframeTrack('Hueso.001.position', [0, 1], [0, 0, 0, 1, 0, 0]),
    new VectorKeyframeTrack('Hueso cuerpo.position', [0, 1], [0, 0, 0, 1, 0, 0]),
    new VectorKeyframeTrack('Hueso cuerpo.scale', [0, 1], [1, 1, 1, 1, 1, 1]),
    new VectorKeyframeTrack('Mano.position', [0, 1], [0, 0, 0, 0.1, 0, 0]),
    new QuaternionKeyframeTrack('Mano.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, 1]),
  ];
  return new AnimationClip('Esqueleto_accion', 1, tracks);
}

describe('stripRootTranslation', () => {
  it('removes exactly the 3 root-bone position tracks', () => {
    const processed = stripRootTranslation(makeClip());
    const names = processed.tracks.map((track) => track.name);

    for (const bone of ROOT_BONES) {
      expect(names).not.toContain(`${bone}.position`);
    }
    expect(names).toHaveLength(4);
  });

  it('keeps quaternion/scale tracks and child-bone position tracks', () => {
    const processed = stripRootTranslation(makeClip());
    const names = processed.tracks.map((track) => track.name);

    expect(names).toContain('Hueso.quaternion');
    expect(names).toContain('Hueso cuerpo.scale');
    expect(names).toContain('Mano.position');
    expect(names).toContain('Mano.quaternion');
  });

  it('does not mutate the original clip', () => {
    const clip = makeClip();
    const originalLength = clip.tracks.length;
    stripRootTranslation(clip);
    expect(clip.tracks).toHaveLength(originalLength);
  });
});
