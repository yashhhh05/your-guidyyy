"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSubjectColor, cn } from "@/lib/utils";
import LaunchButton from "./LaunchButton";
import styles from "./BookCard.module.css";
import { Badge } from "@/components/ui/badge";

interface BookCardProps {
  id: string;
  name: string;
  subject: string;
  topic: string;
  duration: number;
}

const BookCard = ({ id, name, subject, topic, duration }: BookCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Toggle flip on click for touch devices where hover is tricky
  // On desktop, hover works via CSS, but clicking will also toggle if needed, 
  // though typically we want click to just be a fallback or "focus". 
  // Actually, for consistency, let's make the cover clickable to flip on mobile.
  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div 
      className={cn(styles.book, isFlipped && styles.flipped)} 
      onClick={handleCardClick}
      title="Click to flip (Mobile)"
    >
      {/* Inner Content (Behind Cover) */}
      <div className={styles.content}>
        <div className="flex flex-col gap-2 w-full">
          <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Topic</h4>
          <p className="text-sm font-medium text-gray-800 leading-relaxed text-center line-clamp-4">
            {topic}
          </p>
        </div>
        
        <div className="mt-4">
          <Link href={`/companion/${id}`} onClick={(e) => e.stopPropagation()}>
             <LaunchButton className="text-xs font-bold py-2 px-6 h-auto bg-black text-white hover:bg-gray-800 shadow-md transition-transform hover:scale-105">
               Start Session
             </LaunchButton>
          </Link>
        </div>
      </div>

      {/* Cover (Front) */}
      <div 
        className={styles.cover}
        style={{ backgroundColor: "#fdfdfd" }} // Simple light background
      >
        <div 
          className="p-4 rounded-full mb-4 shadow-sm flex items-center justify-center"
          style={{ background: getSubjectColor(subject) }} // Gradient on icon container
        >
             <Image 
                src={`/icons/${subject}.svg`}
                alt={subject}
                width={40}
                height={40}
                className="w-10 h-10 drop-shadow-sm invert opacity-90" // Invert for better contrast on colorful gradients
              />
        </div>
        <h3 className="text-xl font-bold text-gray-800 text-center px-4">
          {name}
        </h3>
        <Badge variant="outline" className="mt-3 border-gray-300 text-gray-600 bg-white/50 backdrop-blur-sm">
            {subject}
        </Badge>
      </div>
    </div>
  );
};

export default BookCard;
