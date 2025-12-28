import React from 'react'
import { Button } from '@/components/ui/button' 
import CompanionCard from '@/components/CompanionCard'
import CompanionsList from '@/components/CompanionsList'
import CTA from '@/components/CTA'
import { recentSessions } from '@/constants'
const Page = () => {
  return (
    <main>
      <h1>Popular companions</h1>
      
      <section className="home-section">
        {/* Pass the props to CompanionCards */}
        <CompanionCard id="123" 
        name="Neura the brain explorer" 
        subject="Science" 
        topic="Neural Network" 
        duration={45} 
        color="#B19CD9"/>

        <CompanionCard id="456" 
        name="Counsty the number wizard" 
        subject="Math" 
        topic="Number Theory" 
        duration={30} 
        color="#ADD8E6"/>

        <CompanionCard id="789" 
        name="Verba the vocabulary builder" 
        subject="English" 
        topic="Vocabulary" 
        duration={30} 
        color="#FFB6C1"/>   
      </section>

      <section className="home-section">
        <CompanionsList 
        title="Recent Sessions"
        companions={recentSessions}
        classNames="w-2/3 max-lg:w-full"
        />
        <CTA/>
      </section>

     

    </main>
  )
} 

export default Page