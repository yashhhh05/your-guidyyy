//creating new companions

import CompanionForm from '@/components/CompanionForm'
import { newCompanionPermissions } from '@/lib/actions/companion.actions';
import { auth } from '@clerk/nextjs/server';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react'
import { Badge } from "@/components/ui/badge"
import LaunchButton from '@/components/LaunchButton';

interface SearchParams {
  searchParams: Promise<{
    type?: string;
  }>
}

const page = async({ searchParams }: SearchParams) => {
  const { type } = await searchParams;
  const isPrivate = type === 'private';

  //this ensures if no userid means not signed in and cant build companion
const {userId} = await auth();
if(!userId){
    redirect("/sign-in");
}

const canCreateCompanion = await newCompanionPermissions(isPrivate);
  
  return (
    <main className='lg:w-1/3 md:w-2/3  items-center justify-center'>

      { canCreateCompanion? <article className='w-full gap-4 flex flex-col'>
        <h1>New Companion Builder</h1>
        <CompanionForm type={type}/>
      </article>:
      <article className='companion-limit'>
        <Image src="/images/limit.svg" alt="Companion limit reached" width={160} height={230}/>
        <Badge variant="secondary" className="bg-cta-gold text-black hover:bg-cta-gold/90 border-0 rounded-full px-3 py-1.5 text-center">
          Upgrade your plan to create more companions
        </Badge>
        <h1>You've Reached Your Limit</h1>
        <p>You've reached your companion limit. Upgrade your plan to create more companions and premium features</p>
        <Link href="/subscription" className='w-full'>
            <LaunchButton>Upgrade Plan</LaunchButton>
        </Link>
      </article>
      }
    </main>
  )
}

export default page