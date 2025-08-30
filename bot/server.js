// bot/server.js
/* eslint-disable no-console */
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import {
  sendInviteDM,
  sendAutoServerInvite,
  isUserInGuild,
  ensureBotLoggedIn,
  client,
  createTeamChannel,
  updateTeamChannelPermissions,
  deleteTeamChannel,
} from '../src/bot/bot.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// На Render порт приходит из env PORT. Локально можно задать дефолт.
const PORT = Number(process.env.PORT || 10000);

/* ----------- healthcheck ----------- */
app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'discord-bot' });
});

/* ----------- basic actions ----------- */

// Отправка личного сообщения
app.post('/send-dm', async (req, res) => {
  try {
    const { discordId, message } = req.body || {};
    if (!discordId || !message) {
      return res.status(400).json({ error: 'Missing discordId or message' });
    }
    await sendInviteDM(discordId, message);
    return res.json({ success: true });
  } catch (err) {
    console.error('send-dm error:', err);
    return res.status(500).json({ error: 'Failed to send DM', details: err?.message });
  }
});

// Авто-инвайт на сервер
app.post('/auto-invite', async (req, res) => {
  try {
    const { discordId } = req.body || {};
    if (!discordId) return res.status(400).json({ error: 'Missing discordId' });

    const inGuild = await isUserInGuild(discordId);
    if (!inGuild) {
      await sendAutoServerInvite(discordId);
      return res.json({ invited: true });
    }
    return res.json({ invited: false, reason: 'already_in_guild' });
  } catch (err) {
    console.error('auto-invite error:', err);
    return res.status(500).json({ error: 'Failed to auto-invite', details: err?.message });
  }
});

// Проверка членства на сервере
app.post('/check-server-membership', async (req, res) => {
  try {
    const { discordId } = req.body || {};
    if (!discordId) return res.status(400).json({ error: 'Missing discordId' });

    await ensureBotLoggedIn();
    const inGuild = await isUserInGuild(discordId);
    return res.json({ isMember: inGuild });
  } catch (err) {
    console.error('check membership error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

/* ----------- team channels ----------- */

app.post('/team/create-channel', async (req, res) => {
  try {
    const { teamName, memberDiscordIds, discordId } = req.body || {};
    if (!teamName || !Array.isArray(memberDiscordIds) || !discordId) {
      return res.status(400).json({ error: 'Missing teamName, memberDiscordIds or discordId' });
    }
    const channelUrl = await createTeamChannel(teamName, memberDiscordIds);
    await sendInviteDM(discordId, `📺 Your private team channel is ready!\n\n🔗 ${channelUrl}`);
    return res.json({ success: true, channelUrl });
  } catch (err) {
    console.error('create-channel error:', err);
    return res.status(500).json({ error: 'Channel creation failed', details: err?.message });
  }
});

app.post('/team/update-channel', async (req, res) => {
  try {
    const { channelId, memberDiscordIds } = req.body || {};
    if (!channelId || !Array.isArray(memberDiscordIds)) {
      return res.status(400).json({ error: 'Missing channelId or memberDiscordIds' });
    }
    await updateTeamChannelPermissions(channelId, memberDiscordIds);
    return res.json({ success: true });
  } catch (err) {
    console.error('update-channel error:', err);
    return res.status(500).json({ error: 'Channel update failed', details: err?.message });
  }
});

app.post('/team/delete-channel', async (req, res) => {
  try {
    const { channelId } = req.body || {};
    if (!channelId) return res.status(400).json({ error: 'Missing channelId' });
    await deleteTeamChannel(channelId);
    return res.json({ success: true });
  } catch (err) {
    console.error('delete-channel error:', err);
    return res.status(500).json({ error: 'Channel deletion failed', details: err?.message });
  }
});

/* ----------- start server ----------- */

app.listen(PORT, async () => {
  try {
    await ensureBotLoggedIn();
  } catch (e) {
    console.error('Bot login on start failed:', e?.message || e);
  }
  console.log(`🚀 Discord bot server listening on :${PORT}`);
});

// лог «на всякий случай»
client.on('ready', () => {
  console.log(`🤖 Logged in as ${client.user?.tag}`);
});
