
import CompanionsList from '@/components/CompanionsList';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getBookmarkedCompanions, getUserCompanions, getUserPrivateCompanions, getUserSessionHistory } from '@/lib/actions/companion.actions';
import { currentUser } from '@clerk/nextjs/server';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LaunchButton from '@/components/LaunchButton';
import PrivateCompanionCard from '@/components/PrivateCompanionCard';
import { ListPagination } from '@/components/ListPagination';


interface SearchParams {
  searchParams: Promise<{
    page?: string;
  }>
}

const MyJourneyPage = async ({ searchParams }: SearchParams) => {
const { page } = await searchParams;
      const pageNumber = page ? parseInt(page) : 1;
      const user = await currentUser();
      if(!user){
         redirect("/sign-in");
      }

      const companions = await getUserCompanions(user.id, 8, pageNumber); //gets how many companions user has created
      const privateCompanions = await getUserPrivateCompanions(user.id, 3, pageNumber); // Fetch private companions with limit 3
      console.log("--- Debug: Private Companions Data ---");
      console.log(JSON.stringify(privateCompanions, null, 2));

      // Pagination Logic for Private Companions
      const displayPrivateCompanions = privateCompanions.slice(0, 3);
      const hasNextPagePrivate = privateCompanions.length > 3;

      const sessionHistory = await getUserSessionHistory(user.id, 8, pageNumber); //gets how many sessions user has done
      const bookmarkedCompanions = await getBookmarkedCompanions(user.id, 8, pageNumber);


  return (
    <main className='lg:w-3/4'>
      <section className='flex justify-between gap-4 max-sm:flex-col items-center'>
        <div className='flex justify-between gap-4 max-sm:flex-col items-center'>
          <Image src={user.imageUrl} alt="User" width={110} height={110} className='rounded-lg'/>
            <div className='flex flex-col gap-2'>
                <h1 className='font-bold text-2xl'>
                  {user.firstName} {user.lastName}
                </h1>
                <p className='text-sm text-muted-foreground'>{user.emailAddresses[0].emailAddress}</p>
            </div>
        </div>
        <div className='flex gap-4'>
          <div className='border border-black rounded-lg p-3 gap-2 flex flex-col h-fit shadow-lg'>
              <div className='flex gap-2 items-center'>
                  <Image src="/icons/check.svg" alt="checkmark" width={22} height={22}/>
                  <p className='text-2xl font-bold'>{sessionHistory.length}</p>
              </div>
              <div >Lessons completed</div>
          </div>
        </div>
           <div className='border border-black rounded-lg p-3 gap-2 flex flex-col h-fit shadow-lg'>
              <div className='flex gap-2 items-center'>
                  <Image src="/icons/cap.svg" alt="cap" width={22} height={22}/>
                  <p className='text-2xl font-bold'>{companions.length + privateCompanions.length}</p>
              </div>
              <div >Companions created</div>
          </div>
      </section>
      
      <section className="flex justify-start my-4 max-sm:justify-center">
        <Link href="/companion/new?type=private">
            <LaunchButton className="bg-white text-black  border-black shadow-xl">
                Create Private Companion
            </LaunchButton>
        </Link>
      </section>

      <Accordion
        type="multiple"
        defaultValue={["private"]} 
      >
        {/* Private Companions Section */}
        <AccordionItem value="private">
             <AccordionTrigger className="text-2xl font-bold">
            My Private Companions {`(${displayPrivateCompanions.length})`}
          </AccordionTrigger>
          <AccordionContent>
                {displayPrivateCompanions.length > 0 ? (
                    <>
                    <div className="flex flex-wrap justify-center gap-8 p-4">
                        {displayPrivateCompanions.map((companion: any) => (
                            <div key={companion.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <PrivateCompanionCard
                                    id={companion.id}
                                    name={companion.name}
                                    subject={companion.subject}
                                    topic={companion.topic}
                                    image_url={companion.image_url} // Pass image url
                                />
                            </div>
                        ))}
                    </div>
                     <div className="mt-4">
                        <ListPagination page={pageNumber} hasNextPage={hasNextPagePrivate} />
                    </div>
                    </>
                ) : (
                    <div className="text-center p-8 text-muted-foreground">
                        You haven't created any private companions yet.
                    </div>
                )}
          </AccordionContent>
        </AccordionItem>

          <AccordionItem value="bookmarks">
          <AccordionTrigger className="text-2xl font-bold">
            Bookmarked Companions {`(${bookmarkedCompanions.length})`}
          </AccordionTrigger>
          <AccordionContent>
            <CompanionsList
              companions={bookmarkedCompanions}
              title="Bookmarked Companions"
              page={pageNumber}
              allowPagination={true}
              type="bookmark"
            />
           </AccordionContent>
          </AccordionItem>

        <AccordionItem value="recent">
          <AccordionTrigger className='text-2xl font-bold'>Recent Sessions</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-balance">
              <CompanionsList 
                title="Recent Sessions"
                companions={sessionHistory}
                page={pageNumber}
                allowPagination={true}
                type="session"
              />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='companions'>
            <AccordionTrigger className='text-2xl font-bold'>
                My Public Companions {`(${companions.length})`}
            </AccordionTrigger>
            <AccordionContent>
              <CompanionsList 
                title="My Companions"
                companions={companions}
                page={pageNumber}
                allowPagination={true}
                type="created"
              />
            </AccordionContent>
        </AccordionItem>
      </Accordion>
        

    </main>
  );
};

export default MyJourneyPage;