import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { ProcessingProgress as ProgressType } from '@/types/video';

interface ProcessingProgressProps {
  progress: ProgressType;
}

export function ProcessingProgress({ progress }: ProcessingProgressProps) {
  const getIcon = () => {
    switch (progress.phase) {
      case 'complete':
        return <Check className="w-6 h-6 text-accent" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-destructive" />;
      default:
        return <Loader2 className="w-6 h-6 text-primary animate-spin" />;
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (progress.phase === 'idle') {
    return null;
  }

  return (
    <div className="gradient-card rounded-lg p-6 border border-border/50 space-y-4">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-primary/10 p-3 shadow-glow">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">
              {progress.phase === 'complete' ? 'Complete!' : 
               progress.phase === 'error' ? 'Error' :
               'Processing...'}
            </h3>
            <span className="text-sm font-mono text-muted-foreground">
              {progress.percent}%
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {progress.message}
          </p>

          <Progress 
            value={progress.percent} 
            className="h-2"
          />

          {progress.estimatedTimeRemaining && progress.phase !== 'complete' && (
            <p className="text-xs text-muted-foreground mt-2">
              Estimated time remaining: {formatTime(progress.estimatedTimeRemaining)}
            </p>
          )}
        </div>
      </div>

      {progress.phase === 'processing' || progress.phase === 'encoding' ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Using stream copy for lossless concatenation</span>
        </div>
      ) : null}
    </div>
  );
}
