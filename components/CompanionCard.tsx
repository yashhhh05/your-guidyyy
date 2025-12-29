import React from 'react'
import Image from 'next/image';
import Link from 'next/link';
{/*tsx inferface as we know what it will get always */}
interface CompanionCardProps {
    id: string;
    name: string;
    subject: string;
    topic: string;
    duration: number;
    color: string;
}

{/* Accept the props */}
const CompanionCard = ({id, name, subject, topic, duration, color}: CompanionCardProps) => {
  return (
    <article className='companion-card' style={{backgroundColor : color}}>
        <div className='flex justify-between items-center'>
            <div className='subject-badge'>
                {subject}
            </div>
            <button className='companion-bookmark'>
                <Image src="/icons/bookmark.svg" alt="bookmark" height={12.5} width={15}></Image>
            </button>
        </div>
        <div>
            <h2 className='text-2xl font-bold'>{name}</h2>
            <p className='text-sm my-3'>{topic}</p>
            <div className='flex items-center gap-2 my-3'>
                <Image src="/icons/clock.svg" alt="clock" height={13.5} width={13.5}></Image>
                <p className='text-sm'>{duration} minutes</p>
            </div>

             {/*pointing to dynamic route means detail for that id */}
            <Link href={`/companion/${id}`} className='w-full cursor-pointer'>
            <button className='btn-primary w-full justify-center'>
                Launch Lesson
            </button>
            </Link>
            

        </div>
    </article>
  )
}

export default CompanionCard