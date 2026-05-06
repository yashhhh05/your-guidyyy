import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nimaqulzzhzkaelsnaii.supabase.co',
  'sb_publishable_rc-tGI7QE9VoQukqZiuz4A_XFe_wLjr'
);

async function test() {
  const { data, error } = await supabase.from('image_uploads').select('*').limit(1);
  console.log('Error:', error);
}

test();
