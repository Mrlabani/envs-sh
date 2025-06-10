import bot from '../bot.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
    } catch (e) {
      console.error('Webhook error:', e);
    }
    return res.status(200).send('OK');
  }
  res.status(405).send('Method Not Allowed');
}
