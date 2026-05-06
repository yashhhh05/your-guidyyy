-- Table to track image uploads and enforce daily limits
CREATE TABLE IF NOT EXISTS public.image_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.image_uploads ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read only their own uploads
CREATE POLICY "Users can view their own image uploads" 
ON public.image_uploads
FOR SELECT 
USING (auth.uid()::text = user_id);

-- Policy to allow users to insert their own uploads
CREATE POLICY "Users can insert their own image uploads" 
ON public.image_uploads
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Add index on user_id and created_at to make the daily count query fast
CREATE INDEX IF NOT EXISTS idx_image_uploads_user_date 
ON public.image_uploads(user_id, created_at);
