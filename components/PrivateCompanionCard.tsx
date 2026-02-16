"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSubjectColor, cn } from "@/lib/utils";
import LaunchButton from "./LaunchButton";
import styles from "./BookCard.module.css";
import { Badge } from "@/components/ui/badge";

interface PrivateCompanionCardProps {
  id: string;
  name: string;
  subject: string;
  topic: string;
  image_url?: string;
}

const PrivateCompanionCard = ({ id, name, subject, topic, image_url }: PrivateCompanionCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div 
      className={cn(styles.book, isFlipped && styles.flipped)} 
      onClick={handleCardClick}
      title="Click to flip"
    >
      {/* Inner Content (Back/Inside) - Same as BookCard */}
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

      {/* Cover (Front) - Usage Uploaded Image if available */}
      <div 
        className={styles.cover}
        style={{ backgroundColor: "#fdfdfd", padding: 0, overflow: 'hidden' }} 
      >
        {image_url ? (
            <div className="flex flex-col h-full w-full">
                {/* Image Section - Top 60% */}
                <div className="relative w-full h-[60%] shrink-0">
                    <Image 
                        src={image_url} 
                        alt={name} 
                        fill 
                        className="object-cover"
                    />
                </div>
                
                {/* Details Section - Bottom 40% */}
                <div className="flex flex-col items-center justify-center p-4 h-[40%] bg-white w-full border-t border-gray-100">
                     <h3 className="text-lg font-bold text-gray-800 text-center mb-2 line-clamp-2 leading-tight">
                        {name}
                    </h3>
                    <Badge variant="outline" className="border-gray-200 text-gray-600 bg-gray-50">
                        {subject}
                    </Badge>
                </div>
            </div>
        ) : (
            // Fallback to standard look if no image
            <div className="flex flex-col items-center justify-center h-full w-full p-4">
                <div 
                className="p-4 rounded-full mb-4 shadow-sm flex items-center justify-center"
                style={{ background: getSubjectColor(subject) }} 
                >
                    <Image 
                        src={`/icons/${subject}.svg`}
                        alt={subject}
                        width={40}
                        height={40}
                        className="w-10 h-10 drop-shadow-sm invert opacity-90" 
                    />
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center px-4">
                {name}
                </h3>
                <Badge variant="outline" className="mt-3 border-gray-300 text-gray-600 bg-white/50 backdrop-blur-sm">
                    {subject}
                </Badge>
            </div>
        )}
      </div>
    </div>
  );
};

export default PrivateCompanionCard;
