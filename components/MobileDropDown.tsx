"use client";

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

export function MobileDropDown() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="md:hidden p-0">
            <Menu className="w-8 h-8" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/" className="cursor-pointer w-full">Home</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
             <Link href="/companion" className="cursor-pointer w-full">Companions</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
             <Link href="/my-journey" className="cursor-pointer w-full">My Journey</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
