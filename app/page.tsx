import React from 'react'
import { Button } from '@/components/ui/button' 
import CompanionCard from '@/components/CompanionCard'
import CompanionsList from '@/components/CompanionsList'
import CTA from '@/components/CTA'
import { currentUser } from '@clerk/nextjs/server'
import { getAllCompanions, getBookmarkedCompanionIds, getRecentSession, getUserSessionHistory } from '@/lib/actions/companion.actions'
import { getSubjectColor } from '@/lib/utils'


interface SearchParams {
  searchParams: Promise<{
    subject?: string;
  }>
}

const Page = async ({ searchParams }: SearchParams) => {
  const { subject } = await searchParams;
  const recentSessionssCompanions = await getRecentSession(10);

  const companions = await getAllCompanions({
    subject: subject, limit: 3
  });

  const user = await currentUser();
  const bookmarkedIds = user ? await getBookmarkedCompanionIds(user.id) : [];

  return (
    <main>
      <h1>Popular companions</h1>
      
      <section className="home-section">
        {companions.map((companion) => (
             <CompanionCard 
                key={companion.id}
                bookmarked={bookmarkedIds.includes(companion.id)}
                {...companion} 
                color={getSubjectColor(companion.subject)}
             />
        ))}
        {companions.length === 0 && (
             <p className="text-muted-foreground">No companions found. Create one to get started!</p>
        )}
      </section>

      <section className="home-section">
        <CompanionsList 
        title="Recent Sessions"
        companions={recentSessionssCompanions}
        classNames="w-2/3 max-lg:w-full"
        />
        <CTA/>
      </section>

    </main>
  )
} 

export default Page