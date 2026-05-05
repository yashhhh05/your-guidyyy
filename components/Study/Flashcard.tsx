"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  question: string;
  answer: string;
}

export const Flashcard = ({ question, answer }: FlashcardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFlip = () => {
    if (!isAnimating) {
        setIsFlipped(!isFlipped);
        setIsAnimating(true);
    }
  };

  return (
    <div 
        className="w-full h-[350px] cursor-pointer group perspective-[1000px]"
        onClick={handleFlip}
    >
      <motion.div
        className="relative w-full h-full text-center transition-all duration-500 preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        onAnimationComplete={() => setIsAnimating(false)}
      >
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-xl flex flex-col items-center justify-center p-8 text-slate-800 hover:shadow-2xl transition-shadow bg-[url('/noise.png')]">
            <div className="bg-indigo-100 p-3 rounded-full mb-6 text-indigo-600">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-4 text-slate-700">Question</h3>
            <p className="text-lg font-medium leading-relaxed">{question}</p>
            <div className="absolute bottom-6 text-sm text-muted-foreground font-medium flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Click to flip <span className="text-indigo-400">↩</span>
            </div>
        </div>

        {/* Back */}
        <div 
            className="absolute w-full h-full backface-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col items-center justify-center p-8 text-white"
            style={{ transform: "rotateY(180deg)" }}
        >
             <div className="bg-emerald-500/20 p-3 rounded-full mb-6 text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <h3 className="font-bold mb-4 text-emerald-400 uppercase tracking-widest text-xs">Answer</h3>
             <p className="text-lg font-medium text-slate-100 leading-relaxed">{answer}</p>
        </div>
      </motion.div>
    </div>
  );
};
