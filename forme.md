# Project Documentation

## Backend Connection

This project uses **Supabase** as the backend database and **Clerk** for authentication.

### Connection Logic

The connection is established in \`lib/supabase.ts\` using the \`createSupabaseClient\` function.

- It uses the standard \`@supabase/supabase-js\` library.
- It integrates with Clerk by passing a custom \`accessToken\` function.
- When Supabase requests an access token, it calls \`auth().getToken()\` from Clerk. This ensures that all requests to Supabase are authenticated with the user's Clerk session, allowing Row Level Security (RLS) policies in Supabase to work correctly based on the user's identity.

```typescript
export const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken();
      },
    },
  );
};
```

---

## Database Tables

Based on the server actions in \`lib/actions/companion.actions.ts\`, the project interacts with the following Supabase tables:

### 1. \`companions\`

Stores the AI companion definitions created by users.

- **Columns (Inferred):**
  - \`id\`: UUID (Primary Key)
  - \`author\`: String (User ID from Clerk)
  - \`name\`: String (Name of the companion)
  - \`subject\`: String (Subject category, e.g., "maths", "history")
  - \`topic\`: String (Specific topic)
  - \`voice\`: String (Voice configuration)
  - \`style\`: String (Conversation style)
  - \`duration\`: Number
  - \`created_at\`: Timestamp (Implied by ordering logic)

### 2. \`session_history\`

Stores the interaction history between users and companions.

- **Columns (Inferred):**
  - \`id\`: UUID (Primary Key, implied)
  - \`companion_id\`: UUID (Foreign Key linking to \`companions\`)
  - \`user_id\`: String (User ID from Clerk)
  - \`transcript\`: JSON/Array (Stores the chat messages)
  - \`created_at\`: Timestamp

### 3. \`bookmark\`

Stores user bookmarks for companions.

- **Columns (Inferred):**
  - \`companion_id\`: UUID (Foreign Key linking to \`companions\`)
  - \`user_id\`: String (User ID from Clerk)

---

## Feature Implementation & Data Flow

This section details how different files interact to create these functionalities and how data flows through the system.

### 1. Dashboard (`app/page.tsx`)

This is the main entry point where users discover companions.

- **Goal:** Display "Popular Companions" and "Trending/Recent" sessions.
- **Key Functions Used:**
  - \`getPopularCompanions({ limit: 3 })\`: Fetches top 3 companions based on session count.
  - \`getRecentSession(8, page)\`: Fetches the user's recent interaction history to show "Trending Companions".
  - \`getBookmarkedCompanionIds(userId)\`: Fetches IDs to show bookmark status on cards.
- **How it works:**
  1.  The page loads and calls these server actions in parallel.
  2.  Data is passed to \`CompanionCard\` and \`CompanionsList\` components for rendering.
- **Dependencies:**
  - **Affected By:** The content here is directly updated by interactions in the **Chat Interface** (which creates sessions) and **Bookmarking** actions. If a user chats with a companion, it appears here.

### 2. Companion Creation (`components/CompanionForm.tsx`)

- **Goal:** Allow users to define a new AI companion.
- **Key Functions Used:**
  - \`createCompanion(values)\`: The server action handling the DB insert.
- **How it works:**
  1.  Uses \`react-hook-form\` and \`zod\` for frontend validation.
  2.  On specific submission, calls \`createCompanion\`.
  3.  Redirects to \`app/companion/[id]/page.tsx\` on success.
- **Dependencies:**
  - **Affects:** Successfully creating a companion adds a row to `companions`, making it immediately searchable via \`getAllCompanions\` and potentially appearing in "Popular" lists once people start using it.

### 3. Chat Interface (`app/companion/[id]/page.tsx` & `components/CompanioComponent.tsx`)

This is the core interactive feature.

- **Goal:** Facilitate voice/text conversation with the AI.
- **Key Functions Used:**
  - \`getCompanion(id)\`: Loads the companion's configuration (voice, style, system prompt context) to initialize the Vapi assistant.
  - \`addToSessionHistory(companionId, messages)\`: Saves the transcript when the call ends.
- **How it works:**
  1.  **Page Load (`page.tsx`)**: Fetches companion details using \`getCompanion\`. If not found, redirects.
  2.  **Interaction (`CompanioComponent.tsx`)**:
      - Initializes Vapi SDK with \`configureAssistant\`.
      - Manages real-time state (`callStatus`, `messages`).
      - Listeners capture transcriptions.
  3.  **Completion**: When the call ends (`onCallEnd`), it triggers \`addToSessionHistory\` to save the conversation to Supabase.
- **Dependencies:**
  - **Affects:** calling \`addToSessionHistory\` adds a row to \`session_history\`.
  - **Impact:** This single action updates the **Popularity** metric (used in Dashboard) and the **Recent Sessions** list. It feeds the data loop for the entire application's discovery features.

### 4. Bookmarking (`components/CompanionCard.tsx`)

- **Goal:** Save companions for quick access.
- **Key Functions Used:**
  - \`addBookmark(id, path)\`
  - \`removeBookmark(id, path)\`
- **How it works:**
  - User clicks the bookmark icon on a card.
  - The component calls the server action, which updates the \`bookmark\` table.
  - \`revalidatePath\` is called server-side to refresh the UI immediately without a full reload.
- **Dependencies:**
  - **Affects:** The `getBookmarkedCompanions` list (on profile) and the visual state of cards on the Dashboard.

---

## Functions Detail (`lib/actions/companion.actions.ts`)

This file contains **Server Actions** used to interact with the database. These functions run on the server.

### Core Companion Operations

#### \`createCompanion(formData: CreateCompanion)\`

- **Purpose:** Creates a new AI companion.
- **Logic:**
  1.  Gets the current \`userId\` (author) from Clerk.
  2.  Initializes Supabase client.
  3.  Inserts a new row into the \`companions\` table with the provided form data and author ID.
  4.  Returns the created companion data.

#### \`getAllCompanions({ limit, page, subject, topic })\`

- **Purpose:** Fetches a list of companions with optional filtering and pagination.
- **Logic:**
  1.  Starts a query on the \`companions\` table.
  2.  Applies filters:
      - If \`subject\` is provided: Filters by \`subject\` column (case-insensitive partial match).
      - If \`topic\` is provided: Filters by \`topic\` OR \`name\` columns (case-insensitive partial match).
  3.  Applies pagination using \`range()\` based on \`page\` and \`limit\`.
  4.  Returns the list of companions.

#### \`getCompanion(id: string)\`

- **Purpose:** Fetches a single companion's details.
- **Logic:**
  1.  Validates the \`id\` is a valid UUID using Zod.
  2.  Queries \`companions\` table for a row with the matching \`id\`.
  3.  Returns the single companion record.

#### \`deleteCompanion(companionId: string)\`

- **Purpose:** Deletes a specific companion.
- **Logic:**
  1.  Checks authentication.
  2.  Deletes the row from \`companions\` where \`id\` matches AND \`author\` matches the current user.
  3.  Revalidates paths to refresh UI.

### Session & History

#### \`addToSessionHistory(companionId, messages)\`

- **Purpose:** Saves a chat transcript to the history.
- **Logic:**
  1.  Gets current \`userId\`.
  2.  Inserts a new row into \`session_history\` with \`companion_id\`, \`user_id\`, and the \`transcript\` (messages).

#### \`getCompanionSessions(companionId)\`

- **Purpose:** Gets all session history for a specific companion for the current user.
- **Logic:**
  1.  Queries \`session_history\`.
  2.  Filters by \`companion_id\` and \`user_id\`.
  3.  Orders by \`created_at\` descending.

#### \`getRecentSession(limit, page)\`

- **Purpose:** Fetches unique recent interactions for the dashboard.
- **Logic:**
  1.  Queries \`session_history\` and joins with \`companions\`.
  2.  Fetches a larger batch (5x limit) to allow for deduplication.
  3.  **Deduplication Logic:** Iterates through results and picks only unique companions (one session per companion type) that haven't been seen yet in this batch.
  4.  Slices the result for pagination and returns unique companions.

#### \`getUserSessionHistory(userId, limit, page)\`

- **Purpose:** Similar to \`getRecentSession\` but strictly for a specific user ID.
- **Logic:**
  1.  Queries \`session_history\` filtered by \`user_id\`.
  2.  Joins with \`companions\`.
  3.  Deduplicates to show unique companions interacted with.

### User Data & Permissions

#### \`getUserCompanions(userId, limit, page)\`

- **Purpose:** Fetches companions created by a specific user (e.g., for profile page).
- **Logic:**
  1.  Queries \`companions\` table.
  2.  Filters where \`author\` equals \`userId\`.
  3.  Applies pagination.

#### \`newCompanionPermissions()\`

- **Purpose:** Checks if a user is allowed to create a new companion based on their plan.
- **Logic:**
  1.  Check's user's plan using Clerk's \`has\` function.
  2.  Sets a limit based on plan (e.g., Free: 30, Core: 20, Pro: Unlimited).
  3.  Queries \`companions\` table to count how many companions the user has already created.
  4.  Returns \`true\` if count < limit, \`false\` otherwise.

#### \`getPopularCompanions({ limit })\`

- **Purpose:** Fetches popular companions based on session count.
- **Logic:**
  1.  Queries \`companions\` and joins \`session_history\` getting a count.
  2.  **In-Memory Sort:** Maps the data to extract the count and sorts companions by \`sessionCount\` descending.
  3.  Deduplicates by name to ensure variety.
  4.  Returns the top N companions.

### Bookmarking

#### \`addBookmark(companionId, path)\` / \`removeBookmark(companionId, path)\`

- **Purpose:** Adds or removes a bookmark for a companion.
- **Logic:** Insters or deletes a row in the \`bookmark\` table linking \`companion_id\` and \`user_id\`. Revalidates the calling path.

#### \`getBookmarkedCompanions(userId, limit, page)\`

- **Purpose:** Fetches all companions that a user has bookmarked.
- **Logic:**
  1.  Queries \`bookmark\` table.
  2.  Joins with \`companions\` data.
  3.  Filters by \`user_id\`.
  4.  Extracts and returns the companion details.
