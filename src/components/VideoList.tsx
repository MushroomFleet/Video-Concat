import { X, GripVertical, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VideoFile } from '@/types/video';

interface VideoListProps {
  files: VideoFile[];
  onRemove: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
}

export function VideoList({ files, onRemove, disabled }: VideoListProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Video Queue
        </h3>
        <span className="text-sm text-muted-foreground">
          {files.length} file{files.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2">
        {files.map((file, index) => (
          <div
            key={file.id}
            className="gradient-card rounded-lg p-4 border border-border/50 hover:border-primary/50 transition-smooth"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                
                <div className="rounded bg-primary/10 p-2 flex-shrink-0">
                  <Film className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{index + 1}
                    </span>
                    <p className="font-medium truncate">
                      {file.name}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(file.id)}
                disabled={disabled}
                className="flex-shrink-0 hover:bg-destructive/20 hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
