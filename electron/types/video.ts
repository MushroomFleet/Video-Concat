export interface VideoFile {
  id: string;
  file: File;
  name: string;
  size: number;
  duration?: number;
  url: string;
}

export interface VideoParameters {
  codec: string;
  profile?: string;
  width: number;
  height: number;
  frameRate: number;
  pixelFormat?: string;
  audioCodec?: string;
  audioSampleRate?: number;
  audioChannels?: number;
  bitrate?: number;
}

export interface ProcessingProgress {
  percent: number;
  phase: 'idle' | 'loading' | 'validating' | 'processing' | 'encoding' | 'complete' | 'error';
  message: string;
  estimatedTimeRemaining?: number;
}

export type ProcessingStatus = 'idle' | 'processing' | 'complete' | 'error';

export interface IVideoProcessor {
  name: string;
  initialize(): Promise<void>;
  concatenate(files: VideoFile[]): Promise<Blob>;
  getProgress(): ProcessingProgress;
  cancel(): void;
  validateCompatibility?(files: VideoFile[]): Promise<boolean>;
}
