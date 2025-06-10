import { Telegraf } from 'telegraf';
import axios from 'axios';
import FormData from 'form-data';

const bot = new Telegraf(process.env.BOT_TOKEN);
const secretMode = new Set();

bot.start(ctx => ctx.reply("Send a file or URL, or use /secret & /shorten"));

bot.command('secret', ctx => {
  secretMode.add(ctx.from.id);
  ctx.reply("🔐 Secret mode enabled for next upload.");
});

bot.command('shorten', async ctx => {
  const url = ctx.message.text.split(' ')[1];
  if (!url) return ctx.reply("Usage: /shorten <url>");
  const { data } = await axios.post('https://envs.sh', new URLSearchParams({ shorten: url }));
  ctx.reply(`🔗 Shortened:\n${data}`);
});

const doUpload = async (form, ctx) => {
  if (secretMode.has(ctx.from.id)) {
    form.append('secret', '');
    secretMode.delete(ctx.from.id);
  }
  const { data } = await axios.post('https://envs.sh', form, {
    headers: form.getHeaders?.()
  });
  ctx.reply(`✅ Uploaded:\n${data}`);
};

bot.on('text', async ctx => {
  const url = ctx.message.text.trim();
  if (!/^https?:\/\//.test(url)) return;
  const form = new URLSearchParams({ url });
  if (secretMode.has(ctx.from.id)) {
    form.append('secret', '');
    secretMode.delete(ctx.from.id);
  }
  const { data } = await axios.post('https://envs.sh', form);
  ctx.reply(`📤 Uploaded:\n${data}`);
});

bot.on(['photo', 'document'], async ctx => {
  const file = ctx.message.document || ctx.message.photo.pop();
  const link = await ctx.telegram.getFileLink(file.file_id);
  const res = await fetch(link.href);
  const buffer = Buffer.from(await res.arrayBuffer());
  const form = new FormData();
  form.append('file', buffer, file.file_name || 'upload');
  doUpload(form, ctx);
});

export default bot;
