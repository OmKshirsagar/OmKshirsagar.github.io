import { type MutableRefObject } from 'react';
import type { SceneState } from './lib/state';
import WorldEnvironment from './WorldEnvironment';
import Scene01Globe from './scenes/Scene01Globe';
import SceneMumbai from './scenes/SceneMumbai';
import SceneJaiHind from './scenes/SceneJaiHind';
import SceneLibrary from './scenes/SceneLibrary';
import SceneDeloitte from './scenes/SceneDeloitte';
import SceneTraining from './scenes/SceneTraining';
import SceneWarRoom from './scenes/SceneWarRoom';
import SceneOffice from './scenes/SceneOffice';

interface Props {
  stateRef: MutableRefObject<SceneState>;
}

/**
 * Stage = the persistent world for the full descent:
 *   Scene01Globe  — photoreal Earth opener (gated by globeVisible)
 *   SceneMumbai   — voxel clouds + skyline + mountains + ocean (clouds/cityVisible)
 *   SceneJaiHind  — voxel college + Om walk (collegeVisible / characterOpacity)
 * WorldEnvironment lerps background/fog/lights from space -> golden dusk.
 */
export default function Stage({ stateRef }: Props) {
  return (
    <>
      <WorldEnvironment stateRef={stateRef} />
      <Scene01Globe stateRef={stateRef} />
      <SceneMumbai stateRef={stateRef} />
      <SceneJaiHind stateRef={stateRef} />
      <SceneLibrary stateRef={stateRef} />
      <SceneDeloitte stateRef={stateRef} />
      <SceneTraining stateRef={stateRef} />
      <SceneWarRoom stateRef={stateRef} />
      <SceneOffice stateRef={stateRef} />
    </>
  );
}
