import { useState, useCallback, useEffect } from 'react';
import { Scissors, Info, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoUploader } from '@/components/VideoUploader';
import { VideoList } from '@/components/VideoList';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { OutputDownloader } from '@/components/OutputDownloader';
import { FFmpegConcatenator } from '@/lib/videoProcessor';
import { toast } from 'sonner';
import type { VideoFile, ProcessingProgress as ProgressType } from '@/types/video';

const Index = () => {
  const [files, setFiles] = useState<VideoFile[]>([]);
  const [processor] = useState(() => new FFmpegConcatenator());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressType>({
    percent: 0,
    phase: 'idle',
    message: 'Ready to process'
  });
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);

  useEffect(() => {
    const initProcessor = async () => {
      try {
        await processor.initialize();
        setIsInitialized(true);
        toast.success('FFmpeg loaded and ready');
      } catch (error) {
        toast.error('Failed to initialize FFmpeg');
        console.error(error);
      }
    };

    initProcessor();
  }, [processor]);

  const handleFilesAdded = useCallback((newFiles: VideoFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    toast.success(`Added ${newFiles.length} file${newFiles.length !== 1 ? 's' : ''}`);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const handleConcatenate = useCallback(async () => {
    if (files.length < 2) {
      toast.error('Please add at least 2 videos to concatenate');
      return;
    }

    if (!isInitialized) {
      toast.error('FFmpeg is still loading, please wait...');
      return;
    }

    // Check total file size
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const totalSizeMB = totalSize / (1024 * 1024);
    
    if (totalSizeMB > 500) {
      toast.error(`Total file size (${totalSizeMB.toFixed(0)}MB) exceeds 500MB browser limit`);
      return;
    }

    setIsProcessing(true);
    setOutputBlob(null);

    // Start progress polling
    const progressInterval = setInterval(() => {
      setProgress(processor.getProgress());
    }, 100);

    try {
      const result = await processor.concatenate(files);
      setOutputBlob(result);
      toast.success('Videos concatenated successfully!');
    } catch (error) {
      toast.error(`Concatenation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(error);
    } finally {
      clearInterval(progressInterval);
      setProgress(processor.getProgress());
      setIsProcessing(false);
    }
  }, [files, processor, isInitialized]);

  const handleClear = useCallback(() => {
    files.forEach(file => URL.revokeObjectURL(file.url));
    setFiles([]);
    setOutputBlob(null);
    setProgress({
      percent: 0,
      phase: 'idle',
      message: 'Ready to process'
    });
    toast.success('Cleared all files');
  }, [files]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 shadow-glow">
                <Scissors className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Video Concatenator
                </h1>
                <p className="text-sm text-muted-foreground">
                  Fast, lossless video merging with FFmpeg.wasm
                </p>
              </div>
            </div>

            {!isInitialized && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Loading FFmpeg...
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="gradient-card rounded-lg p-6 border border-accent/30">
            <div className="flex gap-4">
              <div className="rounded-lg bg-accent/10 p-3 h-fit">
                <Info className="w-5 h-5 text-accent" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  High-Speed Stream Copy Concatenation
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This tool uses FFmpeg's stream copy method for <strong>25-75x faster processing</strong> than re-encoding, 
                  with zero quality loss. For best results, use H.264 MP4 files with matching parameters 
                  (same resolution, frame rate, and codec). Browser processing is 12.5-25x slower than native FFmpeg 
                  but requires no installation.
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                  <span>• Max file size: 500MB total</span>
                  <span>• Supports: MP4 (H.264)</span>
                  <span>• Processing: Client-side (private)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <VideoUploader 
            onFilesAdded={handleFilesAdded}
            disabled={isProcessing}
          />

          {/* Video List */}
          {files.length > 0 && (
            <VideoList
              files={files}
              onRemove={handleRemoveFile}
              disabled={isProcessing}
            />
          )}

          {/* Action Buttons */}
          {files.length > 0 && (
            <div className="flex gap-3">
              <Button
                onClick={handleConcatenate}
                disabled={isProcessing || !isInitialized || files.length < 2}
                className="flex-1 gradient-primary shadow-glow hover:opacity-90 transition-smooth"
                size="lg"
              >
                <Scissors className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : `Concatenate ${files.length} Videos`}
              </Button>

              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isProcessing}
                size="lg"
                className="border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Processing Progress */}
          <ProcessingProgress progress={progress} />

          {/* Output */}
          <OutputDownloader blob={outputBlob} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-sm text-center text-muted-foreground">
            Powered by FFmpeg.wasm • Processing happens entirely in your browser • No uploads to servers
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
