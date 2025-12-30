//** This code can only be executed on server side as we dealing witg db and data mutation
'use server';

//Application logic

import { auth } from "@clerk/nextjs/server"
import { createSupabaseClient } from "../supabase";
import { z } from "zod";

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
    
    //once we havev query we can fetch data form db based on that query
    const {data : companions, error} = await query;

    if(error){
        throw new Error(error.message);
    }
    
    //companions is the new name of data
    return companions;
}

//to fetch single companion by id
export const getCompanion = async(id : string) => {
    const isValid = z.string().uuid().safeParse(id);

    if (!isValid.success) {
        return null;
    }

    const supabase = createSupabaseClient(); //getting access to database supabase
    const {data, error} = 
    await supabase.from("companions")
    .select()
    .eq("id", id)
    .single();
    //select() is used to fetch data from database
    //eq("id", id) is used to fetch data with specific id
    //single() is used to fetch single data
    if(error){
        throw new Error(error.message);
    }
    return data;
}   
