"use client";
import React from 'react';
import { motion } from 'framer-motion';

interface LaunchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string; // allow overrides
}

const LaunchButton = ({ children, className = "", ...props }: LaunchButtonProps) => {
  return (
    <motion.button 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative inline-block overflow-hidden z-10 w-full text-base md:text-lg cursor-pointer rounded-lg bg-[#e8e8e8] border border-[#e8e8e8] shadow-md text-[#090909] py-[0.5em] px-[1.2em] md:py-[0.7em] md:px-[1.7em] transition-all duration-200 ease-in group hover:text-white hover:border-[#009087] active:text-[#666] active:shadow-sm touch-manipulation ${className}`}
      {...props as any} // Cast to any to avoid motion/HTML button props conflict if strict
    >
        <span className="relative z-10 flex items-center justify-center gap-2">
            {children}
        </span>
        <span className="absolute left-1/2 top-full w-[140%] h-[180%] -translate-x-1/2 scale-x-125 bg-black/5 rounded-[50%] transition-all duration-500 delay-100 ease-[cubic-bezier(0.55,0,0.1,1)] z-[-1] group-hover:-top-[35%] group-hover:bg-[#009087] group-hover:scale-y-130 group-hover:scale-x-80" />
        <span className="absolute left-[55%] top-[180%] w-[160%] h-[190%] -translate-x-1/2 scale-x-145 bg-[#009087] rounded-[50%] transition-all duration-500 delay-100 ease-[cubic-bezier(0.55,0,0.1,1)] z-[-1] group-hover:-top-[45%] group-hover:bg-[#009087] group-hover:scale-y-130 group-hover:scale-x-80" />
    </motion.button>
  );
};

export default LaunchButton;
