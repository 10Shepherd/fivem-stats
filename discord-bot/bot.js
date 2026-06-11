/**
 * FiveM Stats Discord Bot
 * Posts live player counts to a Discord channel every hour.
 * Supports multiple servers — posts one embed per active server.
 *
 * Setup:
 *   1. npm install (inside discord-bot/)
 *   2. Copy .env.example to .env and fill in values
 *   3. node bot.js
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
// Optional: comma-separated list of server codes to post. If blank, posts all active servers.
const SERVER_CODES = process.env.SERVER_CODES
  ? process.env.SERVER_CODES.split(",").map((s) => s.trim())
  : [];
const POST_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function fetchActiveServers() {
  const r = await fetch(`${SITE_URL}/api/servers`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Servers API ${r.status}`);
  const servers = await r.json();
  if (!Array.isArray(servers)) throw new Error("Invalid servers response");
  if (SERVER_CODES.length > 0)
    return servers.filter((s) => SERVER_CODES.includes(s.code));
  return servers;
}

async function fetchServerData(code) {
  const r = await fetch(
    `https://frontend.cfx-services.net/api/servers/single/${code}`,
    {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!r.ok) throw new Error(`FiveM API ${r.status} for ${code}`);
  const data = await r.json();
  const sv = data.Data || data;
  return {
    playerCount: (sv.players || []).length,
    maxPlayers: sv.svMaxclients || 32,
    hostname: sv.hostname || code,
  };
}

function statusColor(pct) {
  if (pct >= 80) return 0x3ddc84;
  if (pct >= 40) return 0xf5a623;
  return 0x4a4a4a;
}

async function postUpdate() {
  try {
    const servers = await fetchActiveServers();
    if (servers.length === 0) {
      console.log("[bot] no active servers to post");
      return;
    }

    const channel = await client.channels.fetch(CHANNEL_ID);
    let totalPlayers = 0;

    for (const sv of servers) {
      try {
        const { playerCount, maxPlayers, hostname } = await fetchServerData(
          sv.code,
        );
        totalPlayers += playerCount;
        const fillPct = Math.round((playerCount / maxPlayers) * 100);
        const barFull = Math.round(fillPct / 10);
        const bar = "█".repeat(barFull) + "░".repeat(10 - barFull);

        const embed = new EmbedBuilder()
          .setColor(statusColor(fillPct))
          .setTitle(`${hostname} · Live Stats`)
          .setURL(`${SITE_URL}/?server=${sv.code}`)
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
          .setFooter({ text: `cfx.re/${sv.code} · View full stats` })
          .setTimestamp();

        await channel.send({ embeds: [embed] });
        console.log(`[bot] posted ${sv.code}: ${playerCount}/${maxPlayers}`);
      } catch (err) {
        console.error(`[bot] error for ${sv.code}:`, err.message);
      }
    }

    // Update bot presence with total across all servers
    client.user.setPresence({
      activities: [
        { name: `${totalPlayers} players online`, type: ActivityType.Watching },
      ],
      status: totalPlayers > 0 ? "online" : "idle",
    });
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
