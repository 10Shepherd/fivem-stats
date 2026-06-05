/**
 * NoPixel Stats Discord Bot
 * Posts live player count to a Discord channel every hour
 *
 * Setup:
 *   1. npm install (inside discord-bot/)
 *   2. Copy .env.example to .env and fill in values
 *   3. node bot.js
 *
 * Host free on: Railway, Render, or Oracle Cloud Free Tier
 */

require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActivityType,
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const SITE_URL = process.env.SITE_URL || "https://fivem-stats.vercel.app";
const SERVER_CODE = "3lamjz";
const FIVEM_API = `https://frontend.cfx-services.net/api/servers/single/${SERVER_CODE}`;
const POST_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function fetchServerData() {
  const r = await fetch(FIVEM_API, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`FiveM API ${r.status}`);
  const data = await r.json();
  const sv = data.Data || data;
  return {
    playerCount: (sv.players || []).length,
    maxPlayers: sv.svMaxclients || 32,
    hostname: sv.hostname || "NoPixel Whitelisted",
  };
}

function statusColor(pct) {
  if (pct >= 80) return 0x3ddc84; // green — busy
  if (pct >= 40) return 0xf5a623; // orange — moderate
  return 0x4a4a4a; // grey — quiet
}

async function postUpdate() {
  try {
    const { playerCount, maxPlayers, hostname } = await fetchServerData();
    const fillPct = Math.round((playerCount / maxPlayers) * 100);
    const barFull = Math.round(fillPct / 10);
    const bar = "█".repeat(barFull) + "░".repeat(10 - barFull);

    const embed = new EmbedBuilder()
      .setColor(statusColor(fillPct))
      .setTitle("NoPixel Whitelisted · Live Stats")
      .setURL(SITE_URL)
      .addFields(
        {
          name: "Players Online",
          value: `**${playerCount}** / ${maxPlayers}`,
          inline: true,
        },
        { name: "Capacity", value: `**${fillPct}%**`, inline: true },
        {
          name: "Status",
          value: playerCount > 0 ? "🟢 Online" : "🔴 Offline",
          inline: true,
        },
        { name: "Capacity Bar", value: `\`${bar}\` ${fillPct}%` },
      )
      .setFooter({ text: `cfx.re · ${SERVER_CODE} · View full stats` })
      .setTimestamp();

    const channel = await client.channels.fetch(CHANNEL_ID);
    await channel.send({ embeds: [embed] });

    // Update bot presence
    client.user.setPresence({
      activities: [
        {
          name: `${playerCount}/${maxPlayers} players`,
          type: ActivityType.Watching,
        },
      ],
      status: playerCount > 0 ? "online" : "idle",
    });

    console.log(`[bot] posted: ${playerCount}/${maxPlayers} players`);
  } catch (err) {
    console.error("[bot] error:", err.message);
  }
}

client.once("ready", () => {
  console.log(`[bot] logged in as ${client.user.tag}`);
  postUpdate();
  setInterval(postUpdate, POST_INTERVAL_MS);
});

client.login(TOKEN);
