import { Download, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';

interface OutputDownloaderProps {
  blob: Blob | null;
  filename?: string;
}

export function OutputDownloader({ blob, filename = 'concatenated-video.mp4' }: OutputDownloaderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (blob) {
      // Revoke previous URL to prevent memory leaks
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
      }
      
      urlRef.current = URL.createObjectURL(blob);
      
      if (videoRef.current) {
        videoRef.current.src = urlRef.current;
      }
    }

    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
      }
    };
  }, [blob]);

  const handleDownload = () => {
    if (!blob || !urlRef.current) return;

    const a = document.createElement('a');
    a.href = urlRef.current;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!blob) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="gradient-card rounded-lg p-6 border border-primary/50 space-y-4 shadow-elegant">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">
            Output Ready
          </h3>
          <p className="text-sm text-muted-foreground">
            {formatFileSize(blob.size)} • {filename}
          </p>
        </div>
      </div>

      <video
        ref={videoRef}
        controls
        className="w-full rounded-lg bg-black"
        style={{ maxHeight: '400px' }}
      >
        Your browser does not support video playback.
      </video>

      <div className="flex gap-3">
        <Button
          onClick={handleDownload}
          className="flex-1 gradient-primary shadow-glow hover:opacity-90 transition-smooth"
          size="lg"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Video
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => videoRef.current?.play()}
          className="border-primary/30 hover:bg-primary/10"
        >
          <Play className="w-4 h-4 mr-2" />
          Preview
        </Button>
      </div>
    </div>
  );
}
