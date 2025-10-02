import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { VideoFile, ProcessingProgress, IVideoProcessor } from '@/types/video';

export class FFmpegConcatenator implements IVideoProcessor {
  name = 'FFmpeg.wasm Browser Processor';
  private ffmpeg: FFmpeg | null = null;
  private progress: ProcessingProgress = {
    percent: 0,
    phase: 'idle',
    message: 'Ready to process'
  };
  private startTime: number = 0;
  private totalDuration: number = 0;

  async initialize(): Promise<void> {
    if (this.ffmpeg) return;

    this.updateProgress(5, 'loading', 'Loading FFmpeg core...');
    
    this.ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    
    this.ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });
    
    this.ffmpeg.on('progress', ({ progress, time }) => {
      // FFmpeg progress is 0-1
      const percent = Math.min(Math.round(progress * 100), 99);
      this.updateProgress(
        percent, 
        'encoding', 
        `Processing video... ${this.formatTime(time / 1000000)}`
      );
    });
    
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    this.updateProgress(10, 'idle', 'FFmpeg loaded and ready');
  }

  async concatenate(files: VideoFile[]): Promise<Blob> {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not initialized');
    }

    if (files.length === 0) {
      throw new Error('No files provided');
    }

    if (files.length === 1) {
      // Single file, just return it
      return files[0].file;
    }

    this.startTime = Date.now();
    this.totalDuration = files.reduce((sum, f) => sum + (f.duration || 15), 0);

    try {
      this.updateProgress(15, 'validating', 'Writing files to virtual filesystem...');

      // Write files to virtual filesystem
      for (let i = 0; i < files.length; i++) {
        await this.ffmpeg.writeFile(
          `video${i}.mp4`,
          await fetchFile(files[i].file)
        );
        this.updateProgress(
          15 + (i + 1) * (30 / files.length),
          'validating',
          `Loaded ${i + 1}/${files.length} files`
        );
      }

      this.updateProgress(50, 'processing', 'Creating concatenation list...');

      // Create concat list file
      const fileList = files
        .map((_, i) => `file 'video${i}.mp4'`)
        .join('\n');
      await this.ffmpeg.writeFile('list.txt', fileList);

      this.updateProgress(55, 'encoding', 'Concatenating videos (stream copy)...');

      // Execute concat with stream copy (no re-encoding)
      // This is 25-75x faster than re-encoding
      await this.ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'list.txt',
        '-c', 'copy',
        '-y',
        'output.mp4'
      ]);

      this.updateProgress(95, 'processing', 'Reading output file...');

      // Read output
      const data = await this.ffmpeg.readFile('output.mp4') as Uint8Array;

      this.updateProgress(98, 'processing', 'Cleaning up...');

      // Cleanup virtual filesystem
      for (let i = 0; i < files.length; i++) {
        await this.ffmpeg.deleteFile(`video${i}.mp4`);
      }
      await this.ffmpeg.deleteFile('list.txt');
      await this.ffmpeg.deleteFile('output.mp4');

      this.updateProgress(100, 'complete', 'Concatenation complete!');

      return new Blob([data.buffer], { type: 'video/mp4' });
    } catch (error) {
      this.updateProgress(0, 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  getProgress(): ProcessingProgress {
    return this.progress;
  }

  cancel(): void {
    // FFmpeg.wasm doesn't support clean cancellation
    // Would need to terminate worker in production
    this.updateProgress(0, 'idle', 'Cancelled');
  }

  private updateProgress(percent: number, phase: ProcessingProgress['phase'], message: string) {
    const elapsed = Date.now() - this.startTime;
    let estimatedTimeRemaining: number | undefined;

    if (percent > 0 && percent < 100) {
      const totalEstimated = (elapsed / percent) * 100;
      estimatedTimeRemaining = Math.round((totalEstimated - elapsed) / 1000);
    }

    this.progress = {
      percent,
      phase,
      message,
      estimatedTimeRemaining
    };
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
