const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');
const ffprobePath = require('@ffprobe-installer/ffprobe');
import { ipcMain, app } from 'electron';
import { promises as fs } from 'fs';
import { join } from 'path';
import type { ProcessingProgress, VideoParameters } from '../types/video';

interface VideoInfo {
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
  duration: number;
}

export class ElectronVideoProcessor {
  private progress: ProcessingProgress = {
    percent: 0,
    phase: 'idle',
    message: 'Ready to process'
  };
  private isProcessing = false;
  private currentCommand: any = null;

  constructor() {
    // Configure FFmpeg paths (handle both development and packaged app)
    const isDev = process.env.NODE_ENV === 'development';
    const ffmpegBinaryPath = isDev 
      ? ffmpegPath.path 
      : ffmpegPath.path.replace('app.asar', 'app.asar.unpacked');
    const ffprobeBinaryPath = isDev 
      ? ffprobePath.path 
      : ffprobePath.path.replace('app.asar', 'app.asar.unpacked');

    ffmpeg.setFfmpegPath(ffmpegBinaryPath);
    ffmpeg.setFfprobePath(ffprobeBinaryPath);

    this.setupIPC();
  }

  private setupIPC() {
    // Video concatenation handler
    ipcMain.handle('video:concatenate', async (event, { inputPaths, outputPath }) => {
      try {
        await this.concatenate(inputPaths, outputPath, (progress) => {
          event.sender.send('video:progress', progress);
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    // Compatibility validation handler
    ipcMain.handle('video:validateCompatibility', async (event, inputPaths) => {
      try {
        const result = await this.validateCompatibility(inputPaths);
        return { success: true, compatible: result.compatible, issues: result.issues };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    // Cancel operation handler
    ipcMain.handle('video:cancel', () => {
      this.cancel();
      return { success: true };
    });
  }

  async concatenate(
    inputPaths: string[],
    outputPath: string,
    progressCallback: (progress: ProcessingProgress) => void
  ): Promise<void> {
    if (this.isProcessing) {
      throw new Error('Already processing another video');
    }

    if (inputPaths.length === 0) {
      throw new Error('No input files provided');
    }

    this.isProcessing = true;
    this.updateProgress(0, 'validating', 'Validating input files...', progressCallback);

    try {
      // Validate compatibility
      const compatibility = await this.validateCompatibility(inputPaths);
      
      if (compatibility.compatible) {
        this.updateProgress(20, 'processing', 'Using stream copy (fast concatenation)...', progressCallback);
        await this.concatenateStreamCopy(inputPaths, outputPath, progressCallback);
      } else {
        this.updateProgress(20, 'processing', 'Re-encoding required due to parameter mismatch...', progressCallback);
        await this.concatenateReencode(inputPaths, outputPath, progressCallback);
      }

      this.updateProgress(100, 'complete', 'Concatenation complete!', progressCallback);
    } catch (error) {
      this.updateProgress(0, 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, progressCallback);
      throw error;
    } finally {
      this.isProcessing = false;
      this.currentCommand = null;
    }
  }

  private async concatenateStreamCopy(
    inputPaths: string[],
    outputPath: string,
    progressCallback: (progress: ProcessingProgress) => void
  ): Promise<void> {
    const tempDir = app.getPath('temp');
    const listPath = join(tempDir, `concat_list_${Date.now()}.txt`);
    
    try {
      // Create concat list file
      const fileList = inputPaths
        .map(path => `file '${path.replace(/'/g, "\\'")}'`)
        .join('\n');
      
      await fs.writeFile(listPath, fileList);
      this.updateProgress(30, 'processing', 'Created concatenation list...', progressCallback);

      return new Promise((resolve, reject) => {
        this.currentCommand = ffmpeg()
          .input(listPath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions(['-c', 'copy'])
          .on('progress', (progress: any) => {
            const percent = Math.min(Math.round(30 + (progress.percent || 0) * 0.65), 95);
            this.updateProgress(
              percent,
              'encoding',
              `Stream copying... ${this.formatTime(progress.timemark || '0')}`
            , progressCallback);
          })
          .on('end', async () => {
            try {
              await fs.unlink(listPath);
            } catch (e) {
              // Ignore cleanup errors
            }
            resolve();
          })
          .on('error', async (err: any) => {
            try {
              await fs.unlink(listPath);
            } catch (e) {
              // Ignore cleanup errors
            }
            reject(err);
          })
          .save(outputPath);
      });
    } catch (error) {
      // Cleanup on error
      try {
        await fs.unlink(listPath);
      } catch (e) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  private async concatenateReencode(
    inputPaths: string[],
    outputPath: string,
    progressCallback: (progress: ProcessingProgress) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg();

      // Add all inputs
      inputPaths.forEach(inputPath => {
        command = command.input(inputPath);
      });

      // Build filter complex for concatenation
      const filterInputs = inputPaths.map((_, i) => `[${i}:v][${i}:a]`).join('');
      const filterComplex = `${filterInputs}concat=n=${inputPaths.length}:v=1:a=1[outv][outa]`;

      this.currentCommand = command
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '[outv]',
          '-map', '[outa]',
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-c:a', 'aac',
          '-b:a', '192k'
        ])
        .on('progress', (progress: any) => {
          const percent = Math.min(Math.round(30 + (progress.percent || 0) * 0.65), 95);
          this.updateProgress(
            percent,
            'encoding',
            `Re-encoding... ${this.formatTime(progress.timemark || '0')}`
          , progressCallback);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (err: any) => {
          reject(err);
        })
        .save(outputPath);
    });
  }

  async validateCompatibility(inputPaths: string[]): Promise<{ compatible: boolean; issues: string[] }> {
    try {
      const videoInfos = await Promise.all(
        inputPaths.map(path => this.getVideoInfo(path))
      );

      const reference = videoInfos[0];
      const issues: string[] = [];

      for (let i = 1; i < videoInfos.length; i++) {
        const current = videoInfos[i];
        
        if (current.codec !== reference.codec) {
          issues.push(`File ${i + 1}: Codec mismatch (${current.codec} vs ${reference.codec})`);
        }
        if (current.width !== reference.width || current.height !== reference.height) {
          issues.push(`File ${i + 1}: Resolution mismatch (${current.width}x${current.height} vs ${reference.width}x${reference.height})`);
        }
        if (Math.abs(current.frameRate - reference.frameRate) > 0.01) {
          issues.push(`File ${i + 1}: Frame rate mismatch (${current.frameRate} vs ${reference.frameRate})`);
        }
        if (current.audioCodec !== reference.audioCodec) {
          issues.push(`File ${i + 1}: Audio codec mismatch (${current.audioCodec} vs ${reference.audioCodec})`);
        }
      }

      return {
        compatible: issues.length === 0,
        issues
      };
    } catch (error) {
      return {
        compatible: false,
        issues: [`Error validating files: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  private async getVideoInfo(filePath: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
        const audioStream = metadata.streams.find((s: any) => s.codec_type === 'audio');

        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        const info: VideoInfo = {
          codec: videoStream.codec_name || 'unknown',
          profile: videoStream.profile,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          frameRate: this.parseFrameRate(videoStream.r_frame_rate || '0/1'),
          pixelFormat: videoStream.pix_fmt,
          audioCodec: audioStream?.codec_name,
          audioSampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate.toString()) : undefined,
          audioChannels: audioStream?.channels,
          bitrate: parseInt((videoStream.bit_rate || '0').toString()),
          duration: parseFloat(metadata.format.duration || '0')
        };

        resolve(info);
      });
    });
  }

  private parseFrameRate(frameRateStr: string): number {
    const parts = frameRateStr.split('/');
    if (parts.length === 2) {
      const num = parseInt(parts[0]);
      const den = parseInt(parts[1]);
      return den !== 0 ? num / den : 0;
    }
    return parseFloat(frameRateStr) || 0;
  }

  cancel(): void {
    if (this.currentCommand) {
      this.currentCommand.kill('SIGKILL');
      this.currentCommand = null;
    }
    this.updateProgress(0, 'idle', 'Cancelled');
    this.isProcessing = false;
  }

  private updateProgress(
    percent: number, 
    phase: ProcessingProgress['phase'], 
    message: string,
    callback?: (progress: ProcessingProgress) => void
  ) {
    this.progress = {
      percent,
      phase,
      message
    };
    
    if (callback) {
      callback(this.progress);
    }
  }

  private formatTime(timeStr: string): string {
    // Convert FFmpeg time format to readable format
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const seconds = Math.floor(parseFloat(parts[2]));
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
    return timeStr;
  }
}
