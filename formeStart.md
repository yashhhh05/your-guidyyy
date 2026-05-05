href in companion card - {`/companion/${companion.id}`} leads to the companion session page.

shadcn - table

template literals = strings with superpowers — they let you embed variables, expressions, and even span multiple lines without messy syntax.

buid new companion - leads to /companion/new

shadcn - form

Authentication - clerk

import middleware from clerk

next wrap our app in clerk provider

# Clerk Authentication Implementation

This project uses **Clerk** to handle user authentication, providing a secure and seamless sign-in/sign-up experience. Below is a detailed breakdown of how it's implemented.

## 1. Configuration & Environment Variables

The project connects to Clerk using API keys and defines custom routes for the authentication flow in `.env.local`:

```bash
# Clerk API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Custom Auth Routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

## 2. Global Provider Setup

The entire application is wrapped in the `<ClerkProvider>` within `app/layout.tsx`. This makes the authentication state available to all components.

- **Custom Branding**: The `appearance` prop is used to set the primary brand color (`#fe5933`).
- **Layout Integration**: The `Navbar` is placed inside the provider so it can react to the user's login state.

```typescript
// app/layout.tsx
<ClerkProvider appearance={{variables: {colorPrimary :"#fe5933"}}}>
  <Navbar/>
  {children}
</ClerkProvider>
```

## 3. Middleware & Route Protection

Clerk uses standard Next.js middleware (`middleware.ts`) to intercept requests. By default, `clerkMiddleware()` protects routes, ensuring that only authenticated users can access the application logic.

- **Matcher**: The configuration excludes static assets (images, CSS, JS) from authentication checks while ensuring API routes are always processed.

## 4. Custom Authentication Pages

Instead of using Clerk's hosted pages, the project implements dedicated routes for a consistent look and feel:

- **/sign-in**: Located at `app/sign-in/[[...sign-in]]/page.tsx`, rendering the `<SignIn />` component.
- **/sign-up**: Located at `app/sign-up/[[...sign-up]]/page.tsx`, rendering the `<SignUp />` component.

These pages use "catch-all" segments (`[[...]]`) to allow Clerk to handle sub-paths for two-factor authentication, password resets, etc.

## 5. UI Integration (Navbar)

The `Navbar.tsx` component dynamically adjusts based on whether a user is logged in:

- **`<SignedOut>`**: Displays a "Sign In" button when no user is authenticated.
- **`<SignedIn>`**: Displays the `<UserButton />` (user profile dropdown) once the user logs in.
- **Components Used**:
  - `SignInButton`: A trigger that redirects to the sign-in page.
  - `UserButton`: Allows users to manage their account and sign out.

## 6. Supabase Integration (JWT Templates)

To securely connect Clerk with Supabase, the project uses a custom `accessToken` strategy in `lib/supabase.ts`.

When a user is logged in via Clerk, every request to Supabase includes a short-lived JWT token. This allows Supabase to identify the user and enforce **Row Level Security (RLS)** policies based on the Clerk `user_id`.

```typescript
// lib/supabase.ts
export const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken(); // Fetches token from Clerk
      },
    },
  );
};
```

---

# Clerk Billing & Subscriptions Implementation

The project uses **Clerk Billing** (integrated with Stripe) to manage user plans and enforce feature limits (Direct/Indirect Subscription gating).

## 1. Subscription Page

The subscription management interface is located at `app/subscription/page.tsx`. It utilizes the Clerk pre-built component for simplicity and consistency.

```typescript
// app/subscription/page.tsx
import { PricingTable } from '@clerk/nextjs';

const SubscriptionPage = () => {
  return (
    <main>
      <PricingTable/> { /* This component displays plans configured in Clerk Dashboard */ }
    </main>
  );
};
```

## 2. Plan-Based Permissions (Gating)

Feature access is controlled via server actions using Clerk's `auth().has()` function. This allows the system to check if a user belongs to a specific "Plan" (which corresponds to a product/price in Stripe).

In `lib/actions/companion.actions.ts`, the `newCompanionPermissions` function enforces limits on how many AI companions a user can create:

### Implementation Logic:

1.  **Identity Check**: Fetches the `userId` and `has` helper from Clerk's `auth()`.
2.  **Plan Verification**:
    - **Pro Plan (`pro_companion`)**: Returns `true` immediately (Unlimited).
    - **Free Plan (`free_user`)**: Sets a limit of **30** companions.
    - **Core Plan (`core`)**: Sets a limit of **20** companions.
3.  **Database Count**: Queries the Supabase `companions` table to count existing entries where `author === userId`.
4.  **Enforcement**: Returns `true` only if the current count is less than the plan's limit.

```typescript
// lib/actions/companion.actions.ts snippet
export const newCompanionPermissions = async () => {
  const { userId, has } = await auth();

  if (has({ plan: "pro_companion" })) return true;

  let limit = has({ plan: "free_user" }) ? 30 : has({ plan: "core" }) ? 20 : 0;

  const { count } = await supabase
    .from("companions")
    .select("id", { count: "exact", head: true })
    .eq("author", userId);

  return (count ?? 0) < limit;
};
```

## 3. Stripe Integration

The actual payment processing is handled by **Stripe**, but it is managed entirely through the **Clerk Dashboard**:

- **Syncing**: Clerk automatically syncs customers and subscriptions with Stripe.
- **Webhooks**: Clerk handles subscription lifecycle events (creation, cancellation, payment failure) and updates the user's `privateMetadata` or `publicMetadata`, which the `auth().has()` function then reads.
- **Configuration**: Products and Prices are defined in Stripe and then mapped to "Plans" in the Clerk Billing settings.

## 4. Customization

The billing experience can be customized in two ways:

- **Clerk Dashboard**: You can style the Pricing Table, add features lists, and toggle between monthly/yearly billing.
- **Component Props**: The `<PricingTable />` component accepts internal styling props to match the application's theme, similar to how the `ClerkProvider` uses the `appearance` variable.

---

# Supabase Integration & Security (RLS)

This project uses **Supabase** for database storage. Authentication is linked via Clerk, and security is enforced directly at the database level using **Row Level Security (RLS)**.

## 1. How Clerk and Supabase Work Together

When a user logs in, Clerk provides an **Access Token (JWT)**. This token is passed to Supabase in every request via the `createSupabaseClient` (defined in `lib/supabase.ts`).

Inside Supabase, the `auth.uid()` function automatically extracts the user's unique ID from this token. This allows the database to know exactly who is making a request without relying on client-side logic.

## 2. Row Level Security (RLS) & Policies

### What is RLS?

RLS is like a firewall for your database tables. Instead of giving a user access to a whole table, RLS checks every single row to see if the user is allowed to interact with it.

### What are Policies?

Policies are the SQL rules that define access. We use them to control:

- **SELECT**: Who can see the data.
- **INSERT**: Who can add new data.
- **UPDATE**: Who can change existing data.
- **DELETE**: Who can remove data.

### Example: The `companions` Table

- **SELECT Policy**: `(private = false) OR (author = auth.uid())`
  - _Logic_: Anyone can see "Public" companions, but "Private" companions are only visible to the person who created them.
- **INSERT Policy**: `auth.uid() = author`
  - _Logic_: A user can only create a companion if they set themselves as the author.
- **DELETE Policy**: `auth.uid() = author`
  - _Logic_: Only the creator can delete their companion.

## 3. Saving Transcripts (Multi-User Isolation)

The system handles multiple users interacting with the same companion by using the `session_history` table.

### How it works:

When a chat ends, the `addToSessionHistory` action is called:

1. It takes the `companionId`.
2. It captures the `userId` from Clerk.
3. It saves the `transcript` (messages) into a new row.

### Why is this secure?

Even if 1,000 users chat with "AI Math Tutor" (ID: 123), their conversations are stored in separate rows in `session_history`.

- Each row has a unique `user_id`.
- An RLS policy on `session_history` ensures that:
  `SELECT * FROM session_history WHERE user_id = auth.uid()`
- This means User A can **never** see the transcript of User B, even if they are talking to the same companion.

## 4. Fetching Logic (Server Actions)

The project uses specialized functions in `lib/actions/companion.actions.ts` to retrieve data:

- **Fetching a Single Companion (`getCompanion`)**:
  - Uses `.eq("id", id).single()` to find a specific record.
  - Used on the chat page to load the AI's personality and voice settings.
- **Discovery / Public List (`getAllCompanions`)**:
  - Specifically filters for `.eq("private", false)`.
  - This ensures that users only see companions meant for the public on the dashboard.
- **User's Own Companions (`getUserCompanions`)**:
  - Filters for `.eq("author", userId)`.
  - Used on the "My Journey" or Profile page to show what the user has built.

## 5. Database Tables Summary

| Table             | Purpose                    | Main Columns                                                 |
| :---------------- | :------------------------- | :----------------------------------------------------------- |
| `companions`      | AI Personality Definitions | `id`, `author`, `name`, `subject`, `private`, `instructions` |
| `session_history` | User Chat Transcripts      | `id`, `user_id`, `companion_id`, `transcript`, `created_at`  |
| `bookmark`        | User Saved Items           | `user_id`, `companion_id`                                    |
