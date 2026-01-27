"use client";

import React, { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formUrlQuery, removeKeysFromUrlQuery } from '@jsmastery/utils';

const SearchInput = () => {
    //must have access to url to update search params,url based on input
    const pathname = usePathname();
    //access to router for navigation
    const router = useRouter();
    const searchParams = useSearchParams();
    const query = searchParams.get("topic")  || "";

    const [searchQuery, setSearchQuery] = useState("");

    useEffect(()=>{

        //Adding delay or Debounce to avoide making calls to db and api for each keypress/stroke
        const delayDebouncefn = setTimeout(()=>{
            //callback fn

            if(searchQuery){
            //form new url
            const newUrl = formUrlQuery({
                params : searchParams.toString(), //existing params 
                key : "topic", //key you wanna update
                value : searchQuery, //with what value
            })
            //redirect to new url
            router.push(newUrl,{scroll : false}); 

        }else{
            if(pathname === "/companion"){
                //if nothing to search then remove keys form url query
                const newUrl = removeKeysFromUrlQuery({
                    params : searchParams.toString(),
                    keysToRemove : ["topic"]
                })
                //redirect to new url
                router.push(newUrl,{scroll : false});
            }
        }
        },500)
    },[searchQuery]);

  return (
    <div className='relative border border-black rounded-lg items-center flex gap-2 px-2 py-1 h-fit'>
        <Image src="/icons/search.svg" alt="search" width={15} height={15}/>
        <input 
            placeholder='Search companions'
            value={searchQuery}
            className='outline-none'
            onChange={(e)=>setSearchQuery(e.target.value)}
        />
    </div>
  )
}

export default SearchInput