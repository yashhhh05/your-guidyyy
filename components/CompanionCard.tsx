"use client";
import { addBookmark, removeBookmark } from '@/lib/actions/companion.actions';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TranscriptModal } from './TranscriptModal';
import { getSubjectColor } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Badge } from "@/components/ui/badge"
import LaunchButton from './LaunchButton';

interface CompanionCardProps {
    id:string,
    name:string,
    subject:string,
    topic:string,
    voice:string,
    style:string,
    duration:number,
    bookmarked:boolean,
    color:string,
}

const CompanionCard = ({id, name, subject, topic, duration, color, bookmarked}: CompanionCardProps) => {
   const pathname = usePathname();
  const handleBookmark = async () => {
    if (bookmarked) {
      await removeBookmark(id, pathname);
    } else {
      await addBookmark(id, pathname);
    }
  };

    return (
    <motion.article 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className='companion-card relative overflow-hidden group/card transition-all duration-500' 
    style={{background : color}}>
        
        {/* Background Animation Elements */}
        <div className="absolute top-0 right-0 w-[20%] h-[20%] bg-white/20 rounded-[0_15px_0_100%] transition-all duration-500 group-hover/card:w-full group-hover/card:h-full group-hover/card:rounded-[15px] z-0" />
        <div className="absolute bottom-0 left-0 w-[20%] h-[20%] bg-white/20 rounded-[0_100%_0_15px] transition-all duration-500 group-hover/card:w-full group-hover/card:h-full group-hover/card:rounded-[15px] z-0" />

        <div className='flex justify-between items-center relative z-10'>
            <Badge variant="secondary" className="bg-black hover:bg-black/90 text-white border-0 text-xs font-medium px-3 py-1 pointer-events-none">
                {subject}
            </Badge>
            <div className='flex items-center gap-3'>
               <TranscriptModal companionId={id} name={name} />
              <button 
              className="overflow-x-visible relative w-10 h-10 overflow-y-clip group text-center cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                handleBookmark();
              }}>
                <div
                    className="flex justify-center items-center w-10 h-10 rounded-full bg-[#009087] transition-all duration-300 absolute top-0 group-hover:scale-[.60] group-hover:origin-top text-white"
                >
                    <Image 
                        src={bookmarked ? "/icons/bookmark-filled.svg" : "/icons/bookmark.svg"} 
                        alt="bookmark" 
                        width={15} 
                        height={15} 
                        className={bookmarked ? "" : "invert brightness-0"}
                    />
                </div>
                <div
                    className="absolute font-bold -bottom-10 left-1/2 text-xs text-center text-black whitespace-nowrap transition-all duration-300 transform -translate-x-1/2 group-hover:bottom-0"
                >
                    {bookmarked ? "Saved" : "Save"}
                </div>
               </button>
            </div>
        </div>
        <div className="relative z-10 w-full">
            <h2 className='text-2xl font-bold'>{name}</h2>
            <p className='text-sm my-3'>{topic}</p>
            <div className='flex items-center gap-2 my-3'>
                <Image src="/icons/clock.svg" alt="clock" height={13.5} width={13.5}></Image>
                <p className='text-sm'>{duration} minutes</p>
            </div>

             {/*pointing to dynamic route means detail for that id */}
            <Link href={`/companion/${id}`} className='w-full cursor-pointer'>
                <LaunchButton>
                    Launch Lesson
                </LaunchButton>
            </Link>
            

        </div>
    </motion.article>
  )
}

export default CompanionCard