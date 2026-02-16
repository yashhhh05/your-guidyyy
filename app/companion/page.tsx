import CompanionCard from "@/components/CompanionCard";
import SearchInput from "@/components/SearchInput";
import { getAllCompanions, getBookmarkedCompanionIds } from "@/lib/actions/companion.actions";
import { getSubjectColor } from "@/lib/utils";
import SubjectFilter from "@/components/SubjectFilter";
import { currentUser } from "@clerk/nextjs/server";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

{/*Companions Libraby - All companions */}

//How searchParam works - object 
interface SearchParams {
  searchParams: Promise<{
    subject?: string;
    topic?: string;
    page?: string;
  }>
}

//How searchParam works - object
const Page = async ({ searchParams }: SearchParams) => {
  //  Accept those params and pass it to the function
  const { subject, topic, page } = await searchParams;
  const pageNumber = page ? parseInt(page) : 1;
  const limit = 9;

    //fetch companions for that subject and topic
  const { data: companions, count } = await getAllCompanions({
    subject: subject,
    topic: topic,
    page: pageNumber,
    limit: limit
  });
  
  const user = await currentUser();
  const bookmarkedIds = user ? await getBookmarkedCompanionIds(user.id) : [];
  
  const totalPages = count ? Math.ceil(count / limit) : 0;

  console.log(companions);


  return (
   <main>
      <section className="flex justify-between gap-4 max-sm:flex-col">
          <h1>Companions Library</h1>
          <div className="flex gap-4">
              <SearchInput/>
              <SubjectFilter/>
          </div>
      </section>

      <section className="companions-grid">
          {companions && companions.length > 0 ? (
            companions.map((companion: any) => (
              <CompanionCard key={companion.id} {...companion}
              color={getSubjectColor(companion.subject)}
              bookmarked={bookmarkedIds.includes(companion.id)}
              />
            ))
          ) : (
            <div className="w-full col-span-full flex justify-center items-center mt-10">
              <p className="text-xl font-semibold text-gray-500">No companion found</p>
            </div>
          )}
      </section>

      {totalPages > 1 && (
        <div className="py-10">
          <Pagination>
            <PaginationContent>
              {pageNumber > 1 && (
                <PaginationItem>
                  <PaginationPrevious href={`/companion?page=${pageNumber - 1}${subject ? `&subject=${subject}` : ''}${topic ? `&topic=${topic}` : ''}`} />
                </PaginationItem>
              )}
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink 
                    href={`/companion?page=${i + 1}${subject ? `&subject=${subject}` : ''}${topic ? `&topic=${topic}` : ''}`}
                    isActive={pageNumber === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {pageNumber < totalPages && (
                <PaginationItem>
                  <PaginationNext href={`/companion?page=${pageNumber + 1}${subject ? `&subject=${subject}` : ''}${topic ? `&topic=${topic}` : ''}`} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}

   </main>
  );
};

export default Page;