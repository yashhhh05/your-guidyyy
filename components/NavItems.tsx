'use client';

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils';
{/*array of different objects we wanna map on */} 
const navItems = [{label : "Home", href : "/"},
                {label : "Companions",     href : "/companion"}, 
                {label : "My journey", href : "my-journey"},]
const NavItems = () => {

   //to know the glance of current page means points to what page currently on 
  const pathname = usePathname()
  
  return (
    <nav className='flex items-center gap-4'>
       {navItems.map((item) => (
        <Link key={item.href} href={item.href} className={cn(pathname === item.href && 'text-primary font-semibold')}>
            {item.label}
        </Link>
       ))}
    </nav>
  )
}

export default NavItems