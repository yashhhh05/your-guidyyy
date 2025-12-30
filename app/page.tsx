import React from 'react'
import { Button } from '@/components/ui/button' 
import CompanionCard from '@/components/CompanionCard'
import CompanionsList from '@/components/CompanionsList'
import CTA from '@/components/CTA'
import { getAllCompanions } from '@/lib/actions/companion.actions'
import { getSubjectColor } from '@/lib/utils'

const Page = async () => {
  const companions = await getAllCompanions({});

  return (
    <main>
      <h1>Popular companions</h1>
      
      <section className="home-section">
        {companions.slice(0, 3).map((companion) => (
             <CompanionCard 
                key={companion.id}
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
        companions={companions}
        classNames="w-2/3 max-lg:w-full"
        />
        <CTA/>
      </section>

    </main>
  )
} 

export default Page