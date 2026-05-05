"use client";
import React from 'react';
import Link from 'next/link';

interface MobileBookCardProps {
  id: string;
  name: string;
  subject: string;
  topic: string;
  duration: number;
}

const MobileBookCard = ({ id, name, topic }: MobileBookCardProps) => {
  return (
    <div className="group relative w-[190px] h-[254px] rounded-[20px] bg-[#f5f5f5] p-[1.8rem] border-2 border-[#c3c6ce] transition-all duration-500 ease-out overflow-visible hover:border-[#008bf8] hover:shadow-[0_4px_18px_0_rgba(0,0,0,0.25)] flex flex-col mx-auto shrink-0">
      <div className="text-black h-full gap-[0.5em] grid place-content-center text-center">
        <p className="text-[1.5em] font-bold leading-tight">{name}</p>
        <p className="text-[rgb(134,134,134)] text-sm line-clamp-4">{topic}</p>
      </div>
      
      <Link href={`/companion/${id}`} className="absolute left-1/2 bottom-0 w-[80%] -translate-x-1/2 translate-y-[125%] transition-all duration-300 ease-out group-hover:translate-y-[50%] group-hover:opacity-100 opacity-0 z-10">
        <button className="w-full rounded-[1rem] border-none bg-[#008bf8] text-white text-[0.9rem] py-[0.5rem] px-[1rem] cursor-pointer shadow-md font-medium">
          Connect
        </button>
      </Link>
    </div>
  );
};

export default MobileBookCard;
