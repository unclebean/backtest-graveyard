import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps extends React.ComponentProps<"div"> {
  message?: string;
  subMessage?: string;
}

function LoadingSpinner({
  message = "Loading Strategy Data",
  subMessage = "Parsing historical candlestick history & running calculations...",
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex-1 min-h-[calc(100vh-56px)] bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Glassmorphism Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full bg-neutral-950/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl text-center">
        {/* Advanced Spinner Graphic */}
        <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
          {/* Inner pulse */}
          <div className="absolute w-12 h-12 rounded-full bg-indigo-500/15 animate-ping duration-1000" />
          
          {/* Outer track */}
          <div className="absolute inset-0 rounded-full border-4 border-neutral-800/60" />
          
          {/* Glowing animated spinner ring */}
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-indigo-400 border-b-transparent border-l-transparent animate-spin" />
          
          {/* High-tech rotating tech dashes */}
          <div 
            className="absolute inset-2 rounded-full border border-dashed border-violet-500/30 animate-spin" 
            style={{ animationDirection: 'reverse', animationDuration: '6s' }} 
          />

          {/* Loader icon in center */}
          <Loader2 className="w-6 h-6 text-indigo-400 animate-pulse" />
        </div>

        {/* Text Area */}
        <h3 className="text-lg font-semibold text-white tracking-wide mb-2 flex items-center gap-1.5 justify-center">
          {message}
          <span className="inline-flex gap-0.5">
            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" />
          </span>
        </h3>
        
        <p className="text-xs text-neutral-400 leading-relaxed font-mono">
          {subMessage}
        </p>

        {/* Visual progress bar */}
        <div className="w-full h-1 bg-neutral-900 rounded-full mt-6 overflow-hidden border border-white/5">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-full w-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export { LoadingSpinner }
