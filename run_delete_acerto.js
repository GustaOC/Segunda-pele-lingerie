import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase
    .from('promoter_acertos')
    .delete()
    .eq('period', '15/07/2026 a 21/07/2026');
    
  if (error) {
    console.error("Error deleting:", error);
  } else {
    console.log("Deleted acerto for period 15/07/2026 a 21/07/2026 successfully.");
  }
}
main();
