import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nimaqulzzhzkaelsnaii.supabase.co',
  'sb_publishable_rc-tGI7QE9VoQukqZiuz4A_XFe_wLjr'
);

async function test() {
  const { data, error, count } = await supabase
    .from('image_uploads')
    .select('id', { count: 'exact', head: true });
    
  console.log('Error full object:', JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2));
  console.log('Count:', count);
}

test();
