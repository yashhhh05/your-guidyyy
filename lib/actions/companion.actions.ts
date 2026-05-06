//** This code can only be executed on server side as we dealing witg db and data mutation
'use server';

//Application logic

import { auth, currentUser } from "@clerk/nextjs/server"
import { createSupabaseClient } from "../supabase";
import { z } from "zod";
import { revalidatePath } from "next/cache";

//create companion
export const createCompanion = async(formData : CreateCompanion)=>{
    const {userId : author} = await auth(); //access to authenticate user
    const supabase = createSupabaseClient(); // access to database

    const canCreate = await newCompanionPermissions(formData.private || false);
    if (!canCreate) {
        throw new Error("Companion limit reached for your current plan");
    }

    //Insert data into database and then get it in data else error
    const{data, error} = await supabase.from("companions").insert({
        ...formData,
        author
    }).select();

    if(error  || !data){
        throw new Error(error?.message || "Failed to create a companion");
    }

    revalidatePath("/companion");
    revalidatePath("/my-journey");
    
    return data[0]; //return newly created companion
}

//to fetch all companions with filtering and pagination
export const getAllCompanions = async({limit=10, page=1, subject, topic}: GetAllCompanions) => {
    const supabase = createSupabaseClient();

    let query = supabase.from("companions").select("*", { count: "exact" }).eq("private", false); // Filter out private companions

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
    const {data : companions, error, count} = await query;

    if(error){
        throw new Error(error.message);
    }
    
    //companions is the new name of data
    return { data: companions, count: count ?? 0 };
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

export const addToSessionHistory = async(companionId : string, messages: SavedMessage[])=>{
    const {userId } = await auth();
    const supabase = createSupabaseClient();
    const {data, error} = await supabase.from("session_history").insert({
        companion_id : companionId,
        user_id : userId,
        transcript: messages // Adding transcript to the insert
    }).select();

    if(error){
        throw new Error(error.message);
    }
    return data[0];
}

export const getCompanionSessions = async (companionId: string) => {
  const { userId } = await auth();
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from("session_history")
    .select("*")
    .eq("companion_id", companionId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const getRecentSession = async (limit = 8, page = 1) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("session_history")
    .select(`companion_id, companions(*)`)
    .order("created_at", { ascending: false })
    .limit(limit * page * 5); // Fetch enough to cover unique filtering

  if (error) {
    throw new Error(error.message);
  }

  // Filter for unique companions
  const uniqueCompanionIds = new Set();
  const uniqueNames = new Set();
  const uniqueCompanions = [];

  for (const item of data) {
    // Check if companion exists and has metadata
    if (item.companions && !uniqueCompanionIds.has(item.companion_id)) {
      const companion = Array.isArray(item.companions) ? item.companions[0] : item.companions;
      
      if (companion && !uniqueNames.has(companion.name)) {
        uniqueCompanionIds.add(item.companion_id);
        uniqueNames.add(companion.name);
        uniqueCompanions.push(companion);
      }
    }
  }

  // Pagination logic
  const start = (page - 1) * limit;
  const end = start + limit + 1; // Fetch one extra to check for next page
  
  return uniqueCompanions.slice(start, end);
};

// Fetch companions sorted by popularity (session count)
export const getPopularCompanions = async ({ limit = 3 } = {}) => {
  const supabase = createSupabaseClient();
  
  // Fetch companions and the count of their sessions
  // Note: This relies on fetching all companions and sorting in memory.
  // For larger datasets, this should be an RPC or a materialized view.
  const { data, error } = await supabase
    .from("companions")
    .select(`*, session_history(count)`);

  if (error) {
    throw new Error(error.message);
  }

  // Sort by session count descending
  const sortedCompanions = data
    .map(companion => ({
        ...companion,
        sessionCount: companion.session_history ? companion.session_history[0].count : 0
    }))
    .sort((a, b) => b.sessionCount - a.sessionCount);

  // Dedupe by name to ensure variety in popular list
  const uniqueNames = new Set();
  const uniquePopularCompanions = [];

  for (const companion of sortedCompanions) {
      if (!uniqueNames.has(companion.name)) {
          uniqueNames.add(companion.name);
          uniquePopularCompanions.push(companion);
          if (uniquePopularCompanions.length >= limit) break;
      }
  }

  return uniquePopularCompanions;
};

export const getUserSessionHistory = async (userId: string, limit = 8, page = 1) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("session_history")
    .select(`id, companion_id, companions(*)`)
    .eq("user_id", userId) //only get data when user_id matches
    .order("created_at", { ascending: false })
    .limit(limit * page * 5); // Fetch more to ensure we have enough unique ones

  if (error) {
    throw new Error(error.message);
  }

  // Filter for unique companions
  const uniqueCompanionIds = new Set();
  const uniqueCompanions = [];

  for (const item of data) {
    // Check if companion exists and hasn't been added yet
    if (item.companions && !uniqueCompanionIds.has(item.companion_id)) {
      uniqueCompanionIds.add(item.companion_id);
      uniqueCompanions.push({ ...item.companions, last_session_id: item.id });
    }
  }

  // Pagination
  const start = (page - 1) * limit;
  const end = start + limit + 1; // Fetch one extra to check for next page

  return uniqueCompanions.slice(start, end);
};

//getting companions user has created to display on profile
export const getUserCompanions = async(userId : string, limit=8, page=1)=>{
    const supabase = createSupabaseClient();
    const {data, error} = await supabase.from("companions")
    .select()
    .eq("author", userId) //only get data when user_id matches
    .limit(limit * page * 5);

    if(error){
        throw new Error(error.message);
    }
    
    // Filter for unique companions (safety check)
    const uniqueCompanionIds = new Set();
    const uniqueCompanions = [];

    for (const item of data) {
        if (!uniqueCompanionIds.has(item.id)) {
            uniqueCompanionIds.add(item.id);
            uniqueCompanions.push(item);
        }
    }

    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit + 1; // Fetch one extra to check for next page

    return uniqueCompanions.slice(start, end);
}

//getting private companions user has created
export const getUserPrivateCompanions = async(userId : string, limit=6, page=1)=>{
    const supabase = createSupabaseClient();
    const {data, error} = await supabase.from("companions")
    .select()
    .eq("author", userId) 
    .eq("private", true)
    .limit(limit * page * 5);

    if(error){
        throw new Error(error.message);
    }
    
    // Filter for unique companions (safety check)
    const uniqueCompanionIds = new Set();
    const uniqueCompanions = [];

    for (const item of data) {
        if (!uniqueCompanionIds.has(item.id)) {
            uniqueCompanionIds.add(item.id);
            uniqueCompanions.push(item);
        }
    }

    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit + 1; // Fetch one extra to check for next page

    return uniqueCompanions.slice(start, end);
}


// implementing new server function
// that will check subscription plan and permissions

export const newCompanionPermissions = async (isPrivate: boolean = false) => {
  const { userId, has } = await auth();
  const supabase = createSupabaseClient();

  // Define limits
  let publicLimit = 15;
  let privateLimit = 8;

  if (has({ plan: "core" })) {
    return true; // unlimited companions
  } else if (has({ plan: "pro_companion" })) {
    publicLimit = 20;
    privateLimit = 15;
  }

  const limit = isPrivate ? privateLimit : publicLimit;

  // Query with count only
  const { count, error } = await supabase
    .from("companions")
    .select("id", { count: "exact", head: true }) // head:true avoids fetching rows
    .eq("author", userId)
    .eq("private", isPrivate);

  if (error) throw new Error(error.message);

  return (count ?? 0) < limit;
};



// Bookmarks
export const addBookmark = async (companionId: string, path: string) => {
  const { userId } = await auth();
  if (!userId) return;
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("bookmark").insert({
    companion_id: companionId,
    user_id: userId,
  });
  if (error) {
    throw new Error(error.message);
  }
  // Revalidate the path to force a re-render of the page
  // this is to update the page without refreshing
  revalidatePath(path);
  return data;
};

export const removeBookmark = async (companionId: string, path: string) => {
  const { userId } = await auth();
  if (!userId) return;
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("bookmark")
    .delete()
    .eq("companion_id", companionId)
    .eq("user_id", userId);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath(path);
  return data;
};

// It's almost the same as getUserCompanions, but it's for the bookmarked companions
export const getBookmarkedCompanions = async (userId: string, limit = 8, page = 1) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("bookmark")
    .select(`companions:companion_id (*)`) // Notice the (*) to get all the companion data
    .eq("user_id", userId)
    .limit(limit * page * 5);

  if (error) {
    throw new Error(error.message);
  }

  // Filter for unique companions & flatten
  const uniqueCompanionIds = new Set();
  const uniqueCompanions = [];

  for (const item of data) {
    const companion = Array.isArray(item.companions) ? item.companions[0] : item.companions;
    if (companion && !uniqueCompanionIds.has(companion.id)) {
      uniqueCompanionIds.add(companion.id);
      uniqueCompanions.push(companion);
    }
  }

  // Pagination
  const start = (page - 1) * limit;
  const end = start + limit + 1; // Fetch one extra to check for next page

  return uniqueCompanions.slice(start, end);
};

export const getBookmarkedCompanionIds = async (userId: string) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("bookmark")
    .select("companion_id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return data.map((bookmark) => bookmark.companion_id);
};

// Delete session history for a specific companion
export const deleteSessionHistory = async (companionId: string) => {
  const user = await currentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("session_history")
    .delete()
    .eq("user_id", user.id)
    .eq("companion_id", companionId);

  if (error) {
    console.error("Error deleting session history:", error);
    throw new Error(error.message);
  }

  revalidatePath("/my-journey");
  revalidatePath("/");
};

// Delete a companion created by the user
export const deleteCompanion = async (companionId: string) => {
  const user = await currentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = createSupabaseClient();
  
  // First, verify the user is the author
  const { data: companion, error: fetchError } = await supabase
    .from("companions")
    .select("author")
    .eq("id", companionId)
    .single();
    
  if (fetchError || !companion) {
    throw new Error("Companion not found or error fetching companion");
  }
    
  if (companion.author !== user.id) {
    throw new Error("Unauthorized: Only the author can delete this companion");
  }

  // Delete bookmarks related to this companion
  const { error: bookmarkError } = await supabase
    .from("bookmark")
    .delete()
    .eq("companion_id", companionId);

  if (bookmarkError) {
     console.error("Error deleting bookmarks for companion:", bookmarkError);
  }

  // Delete session history related to this companion
  const { error: sessionError } = await supabase
    .from("session_history")
    .delete()
    .eq("companion_id", companionId);

  if (sessionError) {
     console.error("Error deleting session history for companion:", sessionError);
  }

  const { error } = await supabase
    .from("companions")
    .delete()
    .eq("id", companionId)
    .eq("author", user.id); // Ensure only the author can delete

  if (error) {
    console.error("Error deleting companion:", error);
    throw new Error(error.message);
  }

  revalidatePath("/my-journey");
  revalidatePath("/");
};