import React from "react";

const LoadingScreen: React.FC = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181818]">
    <div className="flex flex-col items-center gap-6">
      {/* Animated spinner with glow */}
      <div className="relative">
        <span className="block w-20 h-20 rounded-full border-4 border-[#232323] border-t-[#FF8000] animate-spin shadow-[0_0_32px_4px_#FF800088]" />
        {/* Glowing orange dot in the center */}
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FF8000] shadow-[0_0_16px_6px_#FF800088] animate-pulse" />
      </div>
      {/* Animated loading text */}
      <div className="text-[#FF8000] text-xl font-extrabold tracking-wider flex items-center gap-2">
        <span className="animate-bounce">L</span>
        <span className="animate-bounce [animation-delay:0.1s]">o</span>
        <span className="animate-bounce [animation-delay:0.2s]">a</span>
        <span className="animate-bounce [animation-delay:0.3s]">d</span>
        <span className="animate-bounce [animation-delay:0.4s]">i</span>
        <span className="animate-bounce [animation-delay:0.5s]">n</span>
        <span className="animate-bounce [animation-delay:0.6s]">g</span>
        <span className="animate-bounce [animation-delay:0.7s]">.</span>
        <span className="animate-bounce [animation-delay:0.8s]">.</span>
        <span className="animate-bounce [animation-delay:0.9s]">.</span>
      </div>
    </div>
  </div>
);

export default LoadingScreen;
