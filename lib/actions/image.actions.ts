'use server';

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "../supabase";

export const canUploadImage = async () => {
    try {
        const { userId, has } = await auth();
        if (!userId) {
            return false;
        }

        let limit = 5;
        if (has({ plan: "core" })) {
            limit = 25;
        } else if (has({ plan: "pro_companion" })) {
            limit = 18;
        }

        const supabase = createSupabaseClient();
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const { count, error } = await supabase
            .from("image_uploads")
            .select("id", { count: "exact" })
            .eq("user_id", userId)
            .gte("created_at", today.toISOString());

        if (error) {
            console.error("FULL ERROR OBJECT:", JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2));
            return false;
        }

        return (count ?? 0) < limit;
        } catch (e: any) {
        console.error("Exception in canUploadImage:", e.message);
        throw e;
    }
};

export const analyzeImage = async (imageUrl: string) => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("Missing Cloudflare credentials");
  }

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const isAllowed = await canUploadImage();
  if (!isAllowed) {
      throw new Error("Daily image analysis limit reached for your plan.");
  }

  try {
    // 1. Fetch the image to get bytes (add cache-busting timestamp)
    const cacheBuster = `?t=${Date.now()}`;
    const imageResponse = await fetch(imageUrl + cacheBuster);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    // Convert to number array for Cloudflare API input if needed, 
    // but standard LLaVA input usually expects an array of integers (bytes)
    const imageBytes = Array.from(new Uint8Array(imageArrayBuffer));

    // 2. Call Cloudflare Workers AI API
    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/llava-hf/llava-1.5-7b-hf`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageBytes,
          prompt: `You are analyzing an educational image for a tutor-student session. Extract and describe ALL important content clearly and thoroughly.

**For Mathematical Equations:**
- Transcribe each equation using simple terms: "integral", "square root" (or "sqrt"), "derivative", "limit", "summation", "fraction", etc.
- Example: "Evaluate the integral of square root of cos(2x) times sin cubed of 2x dx"
- Identify the type: algebra, calculus, trigonometry, linear algebra, differential equations, etc.
- If it's a problem, state what is being asked (solve, evaluate, prove, simplify, etc.)

**IF Graph is present then For Graphs and Charts:**
- Describe the type: line graph, bar chart, scatter plot, pie chart, function graph, etc.
- Mention axes labels, key points, trends, or patterns shown
- Note any important values, intersections, or features

**For Diagrams:**
- Identify the subject: biology (cell structure, anatomy), chemistry (molecular structure, reactions), physics (circuits, forces), engineering, etc.
- List labeled parts or components
- Describe the main concept being illustrated

**For Text-Based Problems:**
- Transcribe the complete problem statement
- Identify the subject area and type of problem

**For Mixed Content:**
- Describe each element separately but concisely
- Prioritize the most important information

Be specific, accurate, and thorough. Include all key terms, values, and labels visible in the image.`,
          max_tokens: 512,
        }),
      }
    );

    if (!cfResponse.ok) {
        const errorText = await cfResponse.text();
        console.error("Cloudflare AI Error:", errorText);
        throw new Error(`Cloudflare AI API failed: ${cfResponse.status} ${cfResponse.statusText}`);
    }

    const result = await cfResponse.json();
    
    let description = "";
    // Cloudflare response format: { result: { description: "..." } } or similar depending on model
    // For LLaVA it usually returns { result: { response: "..." } }
    if (result.success && result.result && result.result.description) {
        description = result.result.description;
    } else if (result.success && result.result && result.result.response) {
        description = result.result.response;
    } else {
        throw new Error("Invalid response structure from Cloudflare AI");
    }

    // Log the successful analysis
    const supabase = createSupabaseClient();
    await supabase.from("image_uploads").insert({
        user_id: userId,
        image_url: imageUrl,
    });

    return description;

  } catch (error: any) {
    console.error("Image Analysis Error:", error);
    throw new Error(`Image analysis failed: ${error.message}`);
  }
};
