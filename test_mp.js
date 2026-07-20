const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({ accessToken: "TEST-8730999516641619-070802-dc90e6a8e52e4fb803d35ef2e4df8e1c-164478796" });
const preference = new Preference(client);

async function test() {
  try {
    const res = await preference.create({
      body: {
        items: [{ id: "test", title: "test", quantity: 1, unit_price: 10, currency_id: "BRL" }],
        payer: { email: "test@test.com" }
      }
    });
    console.log("Success:", res.id);
  } catch (e) {
    console.error("Failed:", e.message);
  }
}
test();
