import CompanionCard from "@/components/CompanionCard";
import SearchInput from "@/components/SearchInput";
import { getAllCompanions } from "@/lib/actions/companion.actions";
import { getSubjectColor } from "@/lib/utils";
import SubjectFilter from "@/components/SubjectFilter";

{/*Companions Libraby - All companions */}

//How searchParam works - object 
interface SearchParams {
  searchParams: Promise<{
    subject?: string;
  }>
}

//How searchParam works - object
const Page = async ({ searchParams }: SearchParams) => {
  //  Accept those params and pass it to the function
  const { subject } = await searchParams;

    //fetch companions for that subject and topic
  const companions = await getAllCompanions({
    subject: subject
  });
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
          {companions.map((companion) => (
              <CompanionCard key={companion.id} {...companion}
              color={getSubjectColor(companion.subject)}
              />
          ))}
      </section>

   </main>
  );
};

export default Page;