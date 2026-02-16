"use client";

import { deleteCompanion, deleteSessionHistory, removeBookmark } from "@/lib/actions/companion.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn, getSubjectColor } from "@/lib/utils";
import { Button } from "./ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DeleteDialog } from "./DeleteDialog";
import { ListPagination } from "./ListPagination";

interface CompanionListProps {
    title: string;
    companions?: Companion[];
    classNames?: string;
    page?: number;
    allowPagination?: boolean;
    type?: 'session' | 'created' | 'bookmark';
}

const CompanionsList = ({title, companions, classNames, page = 1, allowPagination = false, type}: CompanionListProps) => {
  const displayCompanions = allowPagination && companions ? companions.slice(0, 8) : companions;
  const hasNextPage = allowPagination && companions && companions.length > 8;
  const pathname = usePathname();

  const handleDelete = async (id: string) => {
        try {
            if (type === 'session') {
                await deleteSessionHistory(id);
            } else if (type === 'created') {
                await deleteCompanion(id);
            } else if (type === 'bookmark') {
                await removeBookmark(id, pathname);
            }
        } catch (error) {
            console.error("Failed to delete:", error);
        }
  }

  const getDeleteDescription = () => {
      if (type === 'session') return "This will remove the session history for this companion.";
      if (type === 'created') return "This will permanently delete this companion for everyone. This action cannot be undone.";
      if (type === 'bookmark') return "This will remove the companion from your bookmarks.";
      return "Are you sure you want to delete this?";
  }

  return (
    <article className={cn("companion-list", classNames)}>
        <h2 className="text-3xl font-bold">{title}</h2>
        {(displayCompanions && displayCompanions.length > 0) ? (
           <>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="text-lg w-2/3">Lessons</TableHead>
                <TableHead className="text-lg">Subject</TableHead>
                <TableHead className="text-lg text-right">Duration</TableHead>
                {type && <TableHead className="text-lg text-right">
                    <span className="bg-red-200 rounded-lg px-2 py-1">Delete</span>
                </TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {displayCompanions?.map(({id, subject,name,topic, duration}, index) => (
                <TableRow key={`${id}-${index}`}>
                    <TableCell>
                        <Link href={`/companion/${id}`}>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center size-[72px] rounded-lg max-sm:hidden" 
                                    style={{background : getSubjectColor(subject)}}>
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
                        style={{background : getSubjectColor(subject)}}>
                            <Image src={`/icons/${subject}.svg`}
                            alt={subject}
                            height={18} width={18}>
                            </Image>
                        </div>

                    </TableCell>   

                    <TableCell className="text-right">
                    <div className="flex items-center gap-2 w-full justify-end">
                        <p className="text-lg">{duration}{" "}
                        <span className="max-md:hidden">mins</span>
                        </p>
                        <Image src="/icons/clock.svg" alt="minutes" height={14} width={14} className="md:hidden"/>
                    </div>
                    </TableCell> 

                    {type && (
                        <TableCell className="text-right">
                            <div onClick={(e) => e.stopPropagation()}>
                            <DeleteDialog 
                                onConfirm={() => handleDelete(id)}
                                description={getDeleteDescription()}
                            >
                                <button 
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                    title="Delete"
                                >
                                    <Image 
                                        src="/icons/544161-removebg-preview.png" 
                                        alt="delete" 
                                        width={20} 
                                        height={20}
                                        className="opacity-70 hover:opacity-100"
                                    />
                                </button>
                            </DeleteDialog>
                            </div>
                        </TableCell>
                    )}
                
                </TableRow>
                ))}
            </TableBody>
            </Table>
            {allowPagination && (
                <div className="mt-4">
                    <ListPagination page={page} hasNextPage={!!hasNextPage} />
                </div>
            )}
           </>
        ) : (
            <div className="flex w-full justify-center items-center p-4">
                <p className="text-gray-500 font-medium">No companion here</p>
            </div>
        )}
    </article>
  )
}

export default CompanionsList;
