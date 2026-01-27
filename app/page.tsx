import React from 'react'
import { Button } from '@/components/ui/button' 
import CompanionCard from '@/components/CompanionCard'
import CompanionsList from '@/components/CompanionsList'
import CTA from '@/components/CTA'
import { currentUser } from '@clerk/nextjs/server'
import { getAllCompanions, getBookmarkedCompanionIds, getPopularCompanions, getRecentSession, getUserSessionHistory } from '@/lib/actions/companion.actions'
import { getSubjectColor } from '@/lib/utils'


interface SearchParams {
  searchParams: Promise<{
    subject?: string;
    page?: string;
  }>
}

const Page = async ({ searchParams }: SearchParams) => {
  const { subject, page } = await searchParams;
  const pageNumber = page ? parseInt(page) : 1;
  const recentSessionssCompanions = await getRecentSession(8, pageNumber);

  const companions = await getPopularCompanions({
    limit: 3
  });

  const user = await currentUser();
  const bookmarkedIds = user ? await getBookmarkedCompanionIds(user.id) : [];

  return (
    <main className='pt-3'>
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
        title="Trending Companions"
        companions={recentSessionssCompanions}
        classNames="w-2/3 max-lg:w-full"
        page={pageNumber}
        allowPagination={true}
        />
        <CTA/>
      </section>

    </main>
  )
} 

export default Page