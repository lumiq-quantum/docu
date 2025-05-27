import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 24, className }: LoadingSpinnerProps) {
  return (
    <Loader2
      style={{ width: size, height: size }}
      className={cn('animate-spin text-primary', className)}
    />
  );
}

export function FullPageLoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/50 z-50">
      <LoadingSpinner size={48} />
    </div>
  );
}
