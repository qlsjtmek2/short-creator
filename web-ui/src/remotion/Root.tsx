import React from 'react';
import { Composition } from 'remotion';
import { ShortsVideo } from './compositions/ShortsVideo';
import { ShortsCompositionSchema } from './types/schema';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ShortsVideo"
        component={ShortsVideo}
        durationInFrames={300} // Default duration (10 sec)
        fps={30}
        width={1080}
        height={1920}
        schema={ShortsCompositionSchema}
        defaultProps={{
          width: 1080,
          height: 1920,
          fps: 30,
          durationInFrames: 300,
          layers: [],
        }}
      />
    </>
  );
};
