import Image from 'next/image';
import Link from 'next/link';
import React from 'react'

const CTA = () => {
  return (
    <section className='cta-section'>
        <div className='cta-badge'>
            Start learning your way
        </div>
        <h2>Build and Personaalize Learning Companion</h2>
        <p>pick a name, subject, voice, & personality - and start learning through voice conversation that feel natural and fun.</p>
        <Image src="/images/cta.svg" alt="CTA" height={232} width={362}/>
        <button className='btn-primary'>
            <Image src="/icons/plus.svg" alt="Plus" height={12} width={12}/>
            <Link href="/companion/new">
                <p>Build Companion</p>
            </Link>

        </button>
    </section>
  )
}
export default CTA;