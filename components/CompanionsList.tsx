import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn, getSubjectColor } from "@/lib/utils";
import { Limelight } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

interface CompanionListProps {
    title: string;
    companions?: Companion[];
    classNames?: string;
}

const CompanionsList = ({title, companions, classNames}: CompanionListProps) => {
  return (
    <article className={cn("companion-list", classNames)}>
        <h2 className="text-3xl font-bold">{title}</h2>
        <Table>
  <TableHeader>
    <TableRow>
      <TableHead className="text-lg w-2/3">Lessons</TableHead>
      <TableHead className="text-lg">Subject</TableHead>
      <TableHead className="text-lg text-right">Duration</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {companions?.map(({id, subject,name,topic, duration}, index) => (
      <TableRow key={`${id}-${index}`}>
        <TableCell>
            <Link href={`/companion/${id}`}>
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center size-[72px] rounded-lg max-sm:hidden" 
                        style={{backgroundColor : getSubjectColor(subject)}}>
                        <Image src={`/icons/${subject}.svg`} 
                                    alt={subject} 
                                    height={35} width={35}>
                        </Image>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="font-bold text-2xl">{name}</p>
                        <p className="text-lg ">{topic}</p>
                    </div>
                </div>
            </Link>
        </TableCell>   
        
        <TableCell>
            <div className="subject-badge w-fit max-md:hidden">
                {subject}
            </div>

            <div className="flex items-center rounded-lg justify-center w-fit md:hidden p-2"
             style={{backgroundColor : getSubjectColor(subject)}}>
                <Image src={`/icons/${subject}.svg`}
                 alt={subject}
                  height={18} width={18}>
                </Image>
            </div>

        </TableCell>   

        <TableCell className="flex items-center gap-2 w-full justify-end">
           <p className="tex-2xl">{duration}{" "}
            <span className="max-md:hidden">mins</span>{/*hide word mins for small device and show on large devices */}
           </p>
           <Image src="/icons/clock.svg" alt="minutes" height={14} width={14} className="md:hidden"/>
        </TableCell> 
      
      </TableRow>
    ))}
  </TableBody>
</Table>
    </article>
  )
}

export default CompanionsList;
