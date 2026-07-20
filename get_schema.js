const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try {
    const res = await axios.get(url, {
      headers: { Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY }
    });
    const definitions = res.data.definitions;
    if (definitions && definitions.orders) {
      console.log(Object.keys(definitions.orders.properties));
    } else {
      console.log("No orders definition found");
    }
  } catch(e) { console.error(e.message); }
}
check();
