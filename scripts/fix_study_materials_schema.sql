-- Fix for issue: invalid input syntax for type uuid: "user_..."
-- Root cause: auth.uid() tries to cast the JWT 'sub' claim to UUID, but Clerk IDs are strings.
-- Solution: Use (auth.jwt() ->> 'sub') to get the user ID as text.

-- 1. Drop existing policies (again, to be safe and clean)
DROP POLICY IF EXISTS "Users can view their own study materials" ON study_materials;
DROP POLICY IF EXISTS "Users can insert their own study materials" ON study_materials;
DROP POLICY IF EXISTS "Users can update their own study materials" ON study_materials;
DROP POLICY IF EXISTS "Users can delete their own study materials" ON study_materials;
DROP POLICY IF EXISTS "Users can manage their own study materials" ON study_materials;

-- 2. Ensure user_id is TEXT (It should be already, but idempotent is good)
ALTER TABLE study_materials
ALTER COLUMN user_id TYPE text USING user_id::text;

-- 3. Enable RLS
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy using robust JWT extraction
-- We extract 'sub' directly from the JWT JSON, avoiding the UUID cast of auth.uid()
CREATE POLICY "Users can manage their own study materials"
ON study_materials
FOR ALL
USING ( (select auth.jwt() ->> 'sub') = user_id )
WITH CHECK ( (select auth.jwt() ->> 'sub') = user_id );
