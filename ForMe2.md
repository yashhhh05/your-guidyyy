# Image Context Feature Documentation

This document details the step-by-step implementation of the "Image Context" feature, which allows users to upload an image when creating a private companion. The AI then analyzes this image, and the description is used to provide context for the companion's conversations.

## 1. Dependencies & Installation

To enable file uploads, we utilized **UploadThing**.

**Installation Command:**

```bash
npm install uploadthing @uploadthing/react
```

## 2. Environment Configuration

The application requires API keys to interact with UploadThing and Cloudflare. These must be added to your `.env.local` file.

### Required Variables:

- `UPLOADTHING_TOKEN`: The main API token for UploadThing (often same as Secret Key).
- `UPLOADTHING_SECRET`: Secret key from your UploadThing project dashboard (Legacy but good to have).
- `UPLOADTHING_APP_ID`: App ID from your UploadThing project dashboard.
- `CLOUDFLARE_API_TOKEN`: API token from Cloudflare with Workers AI permissions.
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID.

**Note:** Without these keys, image uploads and analysis will fail.

### How to Retrieve Keys

#### A. UploadThing (File Uploads)

1.  Go to [uploadthing.com](https://uploadthing.com/) and sign in.
2.  Select your app.
3.  On the dashboard sidebar, click on **API Keys**.
4.  **Important:** Copy the full **API Key** string (it starts with `eyJ...`). Do NOT copy just the "Secret Key" (`sk_live...`).
5.  This long string is your `UPLOADTHING_TOKEN`.

#### B. Cloudflare (AI Image Analysis)

1.  **Account ID**:
    - Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
    - Select your account.
    - Your **Account ID** is usually displayed in the URL (alphanumeric string) or on the right sidebar of the overview page.
2.  **API Token**:
    - Go to **AI** > **Workers AI** in the sidebar.
    - Look for a button or link to **"Get API Token"** or go to strictly to [User Profile > API Tokens](https://dash.cloudflare.com/profile/api-tokens).
    - Create a Custom Token with the following permissions:
      - **Account** > **Workers AI** > **Read**
    - Copy the generated token.

## 3. Backend Configuration: UploadThing

We set up the necessary API routes and configuration for UploadThing to handle requests.

### A. Core Configuration (`app/api/uploadthing/core.ts`)

defined the file router and permissions.

- Created an `imageUploader` endpoint.
- Set max file size to 4MB and max file count to 1.
- Implemented middleware to authenticate users via Clerk (`auth()`).

### B. API Route (`app/api/uploadthing/route.ts`)

Exposed the Next.js API route to handle file upload requests using `createRouteHandler`.

### C. Client Utilities (`utils/uploadthing.ts`)

Generated helper components (`UploadButton`, `UploadDropzone`) to use UploadThing in our React components.

```typescript
import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
```

## 4. Database Schema Updates

We updated the Supabase `companions` table to support private companions and store image analysis data.

**New Columns Added:**

- `private` (boolean): Defaults to `false`. Determines if the companion is visible publicly.
- `image_description` (text): Stores the AI-generated description of the uploaded image.

## 5. Image Analysis Service (`lib/actions/image.actions.ts`)

We implemented a server-side action to analyze the uploaded image using **Cloudflare Workers AI**.

- **Function:** `analyzeImage(imageUrl: string)`
- **Model:** `@cf/llava-hf/llava-1.5-7b-hf` (A vision-language model).
- **Process:**
  1.  Fetches the image from the provided URL (from UploadThing).
  2.  Converts the image to a standardized integer array.
  3.  Sends a request to Cloudflare's API with the prompt: _"Describe this image in detail, focusing on the main subject and context."_
  4.  Returns the generated text description.

## 6. Server Actions (`lib/actions/companion.actions.ts`)

We updated the core companion management functions to handle the new data.

### A. `createCompanion`

- Updated to accept and store `private` and `image_description` fields from the form data.

### B. `getAllCompanions`

- Added a filter `.eq("private", false)` to ensure private companions do not clutter the public dashboard.

## 7. Frontend Implementation

### A. Route Handling (`app/companion/new/page.tsx`)

- Added logic to read the `type` search parameter.
- If `?type=private` is present, it passes this prop to the form to enable specific UI elements.

### B. Companion Form (`components/CompanionForm.tsx`)

- **Conditional Rendering:** Use the `type` prop to show the `UploadButton` only for private companions.
- **Image Upload Flow:**
  1.  User uploads image via `UploadButton`.
  2.  `onClientUploadComplete` callback receives the file URL.
  3.  Triggers `analyzeImage(url)` immediately.
  4.  Displays a loading state while analyzing.
  5.  Upon completion, sets the hidden form field `image_description` with the result and displays it to the user.

## 8. Context Injection (The Core Logic)

The final step connects the stored image description to the live conversation, giving the AI "eyes".

### A. Vapi Configuration (`lib/utils.ts`)

- Modified `configureAssistant` to accept an optional `image_description` argument.
- **System Prompt Injection:**
  Dynamicallly appends the context to the system instruction if a description exists:

  ```typescript
  ${image_description ? `\nYou have been provided with an image context: ${image_description}. Use this context to inform your teaching.\n` : ""}
  ```

### B. Component Integration (`components/CompanioComponent.tsx`)

- Updated the component to receive `image_description` as a prop.
- Passed this description into the `configureAssistant` function when initializing the Vapi call:

  ```typescript
  vapi.start(
    configureAssistant(voice, style, image_description),
    assistantOverrides,
  );
  ```

This completes the pipeline: **Upload -> Analyze -> Store -> Inject -> Converse.**
