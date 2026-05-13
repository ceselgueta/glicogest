import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: { timeout: 10000 },
});

export const preferenceApi = new Preference(client);
export const paymentApi = new Payment(client);
export { client as mpClient };
