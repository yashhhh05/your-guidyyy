# Image Upload & Analysis Limits Documentation

## Summary
The application restricts the number of context images a user can upload and analyze per day based on their Clerk subscription plan (Free: 5, Pro: 18, Core: 25). The system is entirely stateless and dynamically calculates usage on the fly by querying the `image_uploads` table in Supabase. Limits reset automatically at midnight UTC everyday without the need for any scheduled background jobs (cron jobs).

---

## Detailed Breakdown

### 1. How Usage is Tracked
Every time a user successfully uploads and analyzes an image during the companion creation process, the `analyzeImage` server action logs that event into Supabase.

```typescript
// Inside analyzeImage()
await supabase.from("image_uploads").insert({
    user_id: userId,
    image_url: imageUrl,
    // created_at is automatically set to the current UTC timestamp by Supabase
});
```
This table simply acts as an immutable ledger of every successful image analysis.

### 2. How the Limits are Defined
Before an image analysis occurs, the frontend and backend both call the `canUploadImage()` server action. This function securely evaluates the user's current subscription tier using Clerk's `auth().has` feature:

```typescript
let limit = 5; // Default free tier limit
if (has({ plan: "core" })) {
    limit = 25; // Highest tier
} else if (has({ plan: "pro_companion" })) {
    limit = 18; // Middle tier
}
```

### 3. How Daily Resets Work (The Query)
Instead of having a background job that resets everyone's counter to `0` at midnight, the system simply counts how many records were created *today*.

```typescript
// Create a Date object for right now
const today = new Date();

// Strip away the hours, minutes, and seconds, setting it to exactly midnight UTC
today.setUTCHours(0, 0, 0, 0); 

// Query Supabase for only the records created after midnight today
const { count, error } = await supabase
    .from("image_uploads")
    .select("*", { count: "exact", head: true }) // Fast counting, no data download
    .eq("user_id", userId)
    .gte("created_at", today.toISOString()); // Greater than or equal to midnight
```

**Why this is great:** 
- **Zero Maintenance**: Because it only queries records from the current day (`gte` midnight UTC), yesterday's records naturally fall out of the query scope. The limit "resets" itself magically every day at exactly `00:00:00 UTC`.
- **High Performance**: Using `{ count: "exact", head: true }` tells Supabase to just return a lightweight integer representing the total rows, rather than forcing the server to download all the image URLs and metadata.

### 4. Enforcement and Security
- **Frontend Prevention**: The UI disables the upload area and displays a warning (`Daily image upload limit for your plan reached`) if `canUploadImage()` returns false on page load.
- **Backend Security**: Even if a malicious user bypasses the UI and hits the API endpoint directly, the `analyzeImage()` function executes the check again right before talking to Cloudflare AI. If they are over the limit, it throws an error and rejects the request.

### 5. Row Level Security (RLS)
The `image_uploads` table is protected by a Row Level Security policy in Supabase that extracts the user's Clerk ID from the JWT token:
```sql
USING ( (select auth.jwt() ->> 'sub') = user_id )
```
This guarantees that a user can only ever query and increment their own usage counts, preventing them from viewing or messing with other users' limits.
