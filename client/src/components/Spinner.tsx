
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface SpinnerProps {
  className?: string;
  text?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className, text = "Processing..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all">
      <div className={cn("flex flex-col items-center justify-center space-y-4 p-4", className)}>
        <div className="relative flex items-center justify-center">
           {/* Outer glow/ring for extra visual polish */}
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          
          <Loader2 className="h-12 w-12 animate-spin text-primary transition-colors" />
        </div>
        <p className="text-lg font-medium text-foreground/80 animate-pulse">
          {text}
        </p>
      </div>
    </div>
  );
};

export default Spinner;
