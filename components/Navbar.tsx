import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import NavItems from './NavItems'
import { MobileDropDown } from './MobileDropDown'
import {SignInButton, UserButton, SignUpButton,SignedOut,SignedIn} from '@clerk/nextjs'
import NavButton from './NavButton';
const Navbar = () => {
  return (
    <nav className="navbar pb-1 pt-1">
        <Link href="/">
            <div className='flex items-center gap-2.5 cursor-pointer'>
            <Image src="/images/LogoGuidy.png" alt="Logo" width={110} height={50}/>
            </div>
        </Link> 
        <div className='flex items-center gap-8'>
            <div className="hidden md:flex">
                <NavItems/>
            </div>
            
            <MobileDropDown />
            
            <SignedOut>{/* shows code if we signed out */}
                  <SignInButton mode="modal">
                      <NavButton className='text-sm px-6 py-2'>
                          Sign In
                      </NavButton>
                  </SignInButton>
          </SignedOut>
            <SignedIn> {/* shows code if we signed in */}
                <UserButton/>
            </SignedIn>
        </div>
    </nav>
  )
}

export default Navbar;