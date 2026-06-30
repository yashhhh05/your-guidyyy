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
  const hfSpaceUrl = process.env.HF_SPACE_URL || "https://yashhh00-tutor-vision-api.hf.space";

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const isAllowed = await canUploadImage();
  if (!isAllowed) {
      throw new Error("Daily image analysis limit reached for your plan.");
  }

  try {
    console.log("Analyzing image via Hugging Face Space:", hfSpaceUrl);
    const hfResponse = await fetch(`${hfSpaceUrl}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
      }),
    });

    if (!hfResponse.ok) {
        const errorText = await hfResponse.text();
        console.error("Hugging Face API Error:", errorText);
        throw new Error(`Hugging Face Space API failed: ${hfResponse.status} ${hfResponse.statusText}`);
    }

    const result = await hfResponse.json();
    
    if (!result.description) {
        throw new Error("Invalid response structure from Hugging Face Space");
    }

    const description = result.description;

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
