import { Badge } from "@/components/ui/badge"
import Link from 'next/link';
import ToasterAnimation from './ToasterAnimation';
import LaunchButton from './LaunchButton';

const CTA = () => {
  return (
    <section className='cta-section justify-between'>
        <div className='flex flex-col gap-6 items-center'>
            <Badge variant="secondary" className="bg-cta-gold text-black hover:bg-cta-gold/90 border-0 rounded-full px-6 py-2 w-fit text-base">
                Start learning your way
            </Badge>
            <h2 className="text-3xl font-bold leading-tight">Build and Personalize Learning Companion</h2>
            <p className='text-gray-300 text-lg leading-relaxed'>pick a name, subject, voice, & personality - and start learning through voice conversation that feel natural and fun.</p>
        </div>

        <ToasterAnimation />


        <Link href="/companion/new" className='w-full'>
            <LaunchButton>
                Build Companion
            </LaunchButton>
        </Link>
    </section>
  )
}
export default CTA;