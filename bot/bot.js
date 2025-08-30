// bot/bot.js
import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  ChannelType,
} from 'discord.js';

// Инициализация клиента Discord
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,   // для проверки членства
    GatewayIntentBits.DirectMessages, // для отправки DM
  ],
  partials: [Partials.Channel],       // чтобы DM-каналы работали
});

let botStarted = false;

/** Гарантируем логин бота (лениво, один раз) */
export async function ensureBotLoggedIn() {
  if (botStarted) return;

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error('DISCORD_BOT_TOKEN is missing (env var not found).');
  }

  try {
    await client.login(token);
    botStarted = true;
    console.log('✅ Bot logged in');
  } catch (err) {
    console.error('❌ Failed to log in bot:', err);
    throw err;
  }
}

/** Отправка личного сообщения пользователю */
export async function sendInviteDM(discordId, messageText) {
  await ensureBotLoggedIn();
  try {
    const user = await client.users.fetch(discordId);
    if (!user) throw new Error('User not found');
    await user.send(messageText);
    console.log(`📩 DM sent to ${user.tag || discordId}`);
  } catch (err) {
    console.error(`❌ Failed to send DM to ${discordId}:`, err);
    throw err;
  }
}

/** Проверка, состоит ли пользователь в гильдии */
export async function isUserInGuild(discordId) {
  await ensureBotLoggedIn();

  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) throw new Error('DISCORD_GUILD_ID env is missing');

  const guild = await client.guilds.fetch(guildId);
  try {
    await guild.members.fetch(discordId);
    return true;
  } catch {
    return false;
  }
}

/** Авто-инвайт на сервер через одноразовую ссылку в DM */
export async function sendAutoServerInvite(discordId) {
  await ensureBotLoggedIn();

  const guildId = process.env.DISCORD_GUILD_ID;
  const inviteChannelId = process.env.DISCORD_INVITE_CHANNEL_ID;
  if (!guildId || !inviteChannelId) {
    throw new Error('DISCORD_GUILD_ID or DISCORD_INVITE_CHANNEL_ID is missing');
  }

  const guild = await client.guilds.fetch(guildId);
  const channel = await guild.channels.fetch(inviteChannelId);

  const invite = await channel.createInvite({
    maxUses: 1,
    unique: true,
    maxAge: 86400, // 1 день
    reason: `Auto invite for ${discordId}`,
  });

  const user = await client.users.fetch(discordId);
  const message = `📨 You are invited to the server **${guild.name}**.\n\n🔗 ${invite.url}`;
  await user.send(message);
  console.log(`📨 Auto-invite sent to ${user.tag || discordId}`);
}

/** Создать приватный командный канал */
export async function createTeamChannel(teamName, memberDiscordIds) {
  await ensureBotLoggedIn();

  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) throw new Error('DISCORD_GUILD_ID env is missing');

  const guild = await client.guilds.fetch(guildId);
  await guild.roles.fetch(); // прогреваем кэш ролей
  const everyone = guild.roles.cache.get(guild.id);
  if (!everyone) throw new Error('Unable to retrieve @everyone role');

  const botUser = client.user;

  // Разрешаем доступ только тем, кто уже в сервере
  const validMembers = [];
  for (const id of memberDiscordIds || []) {
    try {
      const member = await guild.members.fetch(id);
      if (member) validMembers.push(id);
    } catch {
      console.warn(`⚠️ User ${id} is not in the server — skipping.`);
    }
  }

  const permissionOverwrites = [
    {
      id: everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
    {
      id: botUser.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ManageRoles,
      ],
    },
    ...validMembers.map((id) => ({
      id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
      ],
    })),
  ];

  const channel = await guild.channels.create({
    name: teamName.toLowerCase().replace(/\s+/g, '-'),
    type: ChannelType.GuildText,
    parent: process.env.DISCORD_CATEGORY_ID || undefined,
    permissionOverwrites,
  });

  console.log(`📺 Created channel ${channel.name} with ID ${channel.id}`);
  return `https://discord.com/channels/${guild.id}/${channel.id}`;
}

/** Обновить права канала под текущих участников */
export async function updateTeamChannelPermissions(channelId, memberDiscordIds) {
  await ensureBotLoggedIn();

  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) throw new Error('DISCORD_GUILD_ID env is missing');

  const channel = await client.channels.fetch(channelId);
  const guild = await client.guilds.fetch(guildId);
  await guild.roles.fetch();
  const everyone = guild.roles.cache.get(guild.id);
  const botUser = client.user;

  if (!channel || !everyone) throw new Error('Channel or @everyone role not found');

  // Оставляем только тех, кто в сервере
  const validMembers = [];
  for (const id of memberDiscordIds || []) {
    try {
      const member = await guild.members.fetch(id);
      if (member) validMembers.push(id);
    } catch {
      console.warn(`⚠️ User ${id} is not in the server — skipping.`);
    }
  }

  await channel.permissionOverwrites.set([
    {
      id: everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
    {
      id: botUser.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ManageRoles,
      ],
    },
    ...validMembers.map((id) => ({
      id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
      ],
    })),
  ]);

  console.log(`🔄 Updated permissions for channel ${channel.id}`);
}

/** Удалить командный канал */
export async function deleteTeamChannel(channelId) {
  await ensureBotLoggedIn();
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (channel) {
    await channel.delete();
    console.log(`🗑️ Deleted channel: ${channel.name}`);
  }
}

// Логи при готовности
client.on('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  console.log('📋 Servers:');
  client.guilds.cache.forEach((g) =>
    console.log(`- ${g.name} (${g.id})`)
  );
});
