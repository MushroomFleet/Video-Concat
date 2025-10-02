import { useCallback } from 'react';
import { Upload, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VideoFile } from '@/types/video';

interface VideoUploaderProps {
  onFilesAdded: (files: VideoFile[]) => void;
  disabled?: boolean;
}

export function VideoUploader({ onFilesAdded, disabled }: VideoUploaderProps) {
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const videoFiles: VideoFile[] = Array.from(fileList).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file)
    }));

    onFilesAdded(videoFiles);
    e.target.value = ''; // Reset input
  }, [onFilesAdded]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const fileList = e.dataTransfer.files;
    if (!fileList) return;

    const videoFiles: VideoFile[] = Array.from(fileList)
      .filter(file => file.type.startsWith('video/'))
      .map((file, index) => ({
        id: `${Date.now()}-${index}`,
        file,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file)
      }));

    if (videoFiles.length > 0) {
      onFilesAdded(videoFiles);
    }
  }, [onFilesAdded]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-dashed border-border overflow-hidden transition-smooth",
        "hover:border-primary hover:shadow-glow",
        disabled && "opacity-50 pointer-events-none"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="gradient-card p-12">
        <input
          type="file"
          id="video-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept="video/mp4,video/quicktime"
          multiple
          onChange={handleFileChange}
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-primary/10 p-6 shadow-glow">
            <Video className="w-12 h-12 text-primary" />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Drop video files here
            </h3>
            <p className="text-muted-foreground mb-4">
              or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supports MP4 files • H.264 codec recommended for best performance
            </p>
          </div>

          <div className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary/20 border border-primary/30">
            <Upload className="w-4 h-4 text-primary-glow" />
            <span className="text-sm font-medium text-foreground">
              Select Files
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
