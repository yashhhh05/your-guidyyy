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
    const{data, error} = await supabase.from("companions").insert({
        ...formData,
        author
    }).select();

    if(error  || !data){
        throw new Error(error?.message || "Failed to create a companion");
    }
    return data[0]; //return newly created companion
}

//to fetch all companions with filtering and pagination
export const getAllCompanions = async({limit=10, page=1, subject, topic}: GetAllCompanions) => {
    const supabase = createSupabaseClient();

    let query = supabase.from("companions").select();

    if (subject && topic) {
  query = query
    .ilike("subject", `%${subject}%`) // search in subject column
    .or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`); // OR search in topic or name columns
    }

    //if only subject is provided
    else if(subject){
        query = query.ilike("subject", `%${subject}%`);
    }
    //if only topic is provided
    else if(topic){
        query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
    }

    //Pagination
    query = query.range((page - 1)*limit, page*limit-1);
    //means if page is 1 then range is 0-8 if page is 2 then range is 9-18
    const {data, error} = await query;
    if(error){
        console.error("Error fetching companions:", error);
        throw new Error(error.message || "Failed to fetch companions");
    }
    return data;
    
    
}