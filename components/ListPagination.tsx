"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { usePathname, useSearchParams } from "next/navigation";

interface ListPaginationProps {
    page: number;
    hasNextPage: boolean;
}

export function ListPagination({ page, hasNextPage }: ListPaginationProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href={createPageURL(page > 1 ? page - 1 : 1)}
                        aria-disabled={page <= 1}
                        className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
                    />
                </PaginationItem>
                
                {/* Previous Page Number if available */}
                {page > 1 && (
                    <PaginationItem>
                        <PaginationLink href={createPageURL(page - 1)}>
                            {page - 1}
                        </PaginationLink>
                    </PaginationItem>
                )}

                {/* Current Page */}
                <PaginationItem>
                    <PaginationLink href="#" isActive onClick={(e) => e.preventDefault()}>
                        {page}
                    </PaginationLink>
                </PaginationItem>

                {/* Next Page Number if available */}
                {hasNextPage && (
                    <PaginationItem>
                        <PaginationLink href={createPageURL(page + 1)}>
                            {page + 1}
                        </PaginationLink>
                    </PaginationItem>
                )}

                {/* Ellipsis to suggest more pages if we have a next page */}
                {hasNextPage && (
                    <PaginationItem>
                         <PaginationEllipsis />
                    </PaginationItem>
                )}

                <PaginationItem>
                    <PaginationNext
                        href={createPageURL(page + 1)}
                        aria-disabled={!hasNextPage}
                        className={!hasNextPage ? "pointer-events-none opacity-50" : undefined}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    )
}
