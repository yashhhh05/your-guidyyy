'use server';

import { createSupabaseClient } from "../supabase";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Generate Study Materials (Summary or Flashcards) from a past session transcript
export const generateStudyNotes = async (sessionId: string, type: 'summary' | 'flashcard') => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const supabase = createSupabaseClient();

    // 1. Fetch Session Transcript
    const { data: sessionData, error: sessionError } = await supabase
        .from("session_history")
        .select("transcript, companion_id")
        .eq("id", sessionId)
        .single();

    if (sessionError || !sessionData) {
        throw new Error("Session not found");
    }

    const { transcript, companion_id } = sessionData;

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
        throw new Error("No transcript found for this session.");
    }

    // Convert transcript to a readable string for AI
    // Convert transcript to a readable string for AI, filtering out very short messages
    const conversationText = transcript
        .filter((msg: any) => msg.content && msg.content.length > 5) // Filter out "hi", "ok", etc.
        .map((msg: any) => `${msg.role}: ${msg.content}`)
        .join("\n");

    // 2. Prepare AI Prompt
    const systemInstruction = `You are an expert tutor creating study materials. 
    Your goal is to extract EDUCATIONAL CONCEPTS and key learnings from the conversation.
    
    CRITICAL RULES:
    1. IGNORE entirely any conversational pleasantries ("Hello", "How are you", "Thanks", "Goodbye").
    2. IGNORE any meta-discussion about the AI itself, the session status, or who started the chat.
    3. Focus ONLY on the factual subject matter discussed (e.g., Code, History, Science, Math, Economics).
    4. If the conversation contains NO educational content (e.g. just greetings), return an empty array for notes.
    5. Summaries should be concise, high-value bullet points suitable for an exam review.
    6. Flashcards should test the core concepts discussed. Do NOT ask "What did the user say?" or "Who is the assistant?".
    `;

    let prompt = "";
    if (type === 'summary') {
        prompt = `${systemInstruction}
        
        Task: Summarize the following session into 5-8 concise, high-value bullet points.
        If there is not enough content for 5 points, provide as many as possible (but at least 1).
        Return ONLY a JSON object with a key 'notes' containing an array of strings.
        Example: { "notes": ["The mitochondria is the powerhouse of the cell.", "Photosynthesis requires sunlight, water, and CO2."] }
        
        Session Transcript:
        ${conversationText}`;
    } else {
        prompt = `${systemInstruction}
        
        Task: Create UP TO 5 effective flashcards from the following session.
        If there is not enough content for 5 cards, provide FEWER (e.g. 1, 2, or 3). 
        If there is NO educational content, return an empty array.
        Return ONLY a JSON object with a key 'notes' containing an array of objects with 'question' and 'answer' keys.
        Example: { "notes": [{"question": "What is the capital of France?", "answer": "Paris"}] }
        
        Session Transcript:
        ${conversationText}`;
    }

    // 3. Call Groq
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that outputs JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const text = completion.choices[0]?.message?.content || "{}";
        
        // Clean up markdown code blocks if they somehow exist, though json_object mode usually avoids this
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        const json = JSON.parse(cleanedText);
        const parsedContent = json.notes || json.summary || json.flashcards || json; 

        // Check if content is empty (AI followed instructions to return empty array)
        if (!parsedContent || (Array.isArray(parsedContent) && parsedContent.length === 0)) {
            return { success: false, error: "NO_CONTENT" };
        }

        // 4. Save to Database (New Table: study_materials)
        const { data: note, error: insertError } = await supabase
            .from("study_materials")
            .insert({
                session_id: sessionId,
                companion_id: companion_id,
                user_id: userId,
                title: type === 'summary' ? "Session Summary" : "Flashcards",
                content: parsedContent,
                type: type
            })
            .select()
            .single();
        
        if (insertError) {
            console.error("Database Insert Error:", insertError);
            return { success: false, error: "DB_ERROR" };
        }

        return { success: true, data: note };

    } catch (error: any) {
        console.error("AI Generation Error:", error);
        return { success: false, error: "AI_ERROR" };
    }
};

// Fetch Notes for a specific session
export const getSessionNotes = async (sessionId: string) => {
    const { userId } = await auth();
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", userId);

    if (error) throw new Error(error.message);
    return data;
}

// Fetch All Notes for a User (Optional, for "My Journey" hub)
export const getAllStudyNotes = async () => {
    const { userId } = await auth();
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
        .from("study_materials")
        .select("*, session:session_history(create_at)") 
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}
