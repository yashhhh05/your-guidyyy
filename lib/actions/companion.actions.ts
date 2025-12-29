//** This code can only be executed on server side as we dealing witg db and data mutation
'use server';

//Application logic

import { auth } from "@clerk/nextjs/server"
import { createSupabaseClient } from "../supabase";

//create companion
export const createCompanion = async(formData : CreateCompanion)=>{
    const {userId : author} = await auth(); //access to authenticate user
    const supabase = createSupabaseClient(); // access to database

    //Insert data into database and then get it in data else error
    const{data, error} = await supabase.from("companion").insert({
        ...formData,
        author
    }).select();

    if(error  || !data){
        throw new Error(error?.message || "Failed to create a companion");
    }
    return data[0]; //return newly created companion
}