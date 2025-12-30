//creating new companions

import CompanionForm from '@/components/CompanionForm'
import { newCompanionPermissions } from '@/lib/actions/companion.actions';
import { auth } from '@clerk/nextjs/server';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react'

const page = async() => {

  //this ensures if no userid means not signed in and cant build companion
const {userId} = await auth();
if(!userId){
    redirect("/sign-in");
}

const canCreateCompanion = await newCompanionPermissions();
  
  return (
    <main className='min-lg:w-1/3 min-md:w-2/3  items-center justify-center'>

      { canCreateCompanion? <article className='w-full gap-4 flex flex-col'>
        <h1>New Companion Builder</h1>
        <CompanionForm/>
      </article>:
      <article className='companion-limit'>
        <Image src="/images/limit.svg" alt="Companion limit reached" width={160} height={230}/>
        <div className='cta-badge'>
          Upgrade your plan to create more companions
        </div>
        <h1>Ypu've Reached Your Limit</h1>
        <p>Ypu've reached your companion limit. Upgrade your plan to create more companions and premium features</p>
        <Link href="/subscription" className='btn-primary w-full justify-center'>Upgrade Plan</Link>
      </article>
      }
    </main>
  )
}

export default page