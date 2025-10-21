import pkg from "discord.js";
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, version: djsVersion } = pkg;
import os from "os";
import { readFileSync } from "fs";
import path from "path";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Displays the ultimate bot diagnostics and system metrics"),

  async execute(interaction, client) {
    try {
      // Defer initial reply
      await interaction.deferReply();

      // Build embed
      const embed = buildDiagnosticsEmbed(client);

      // Add refresh button
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("refresh_ping")
          .setLabel("🔄 Refresh")
          .setStyle(ButtonStyle.Primary)
      );

      const msg = await interaction.editReply({ embeds: [embed], components: [row] });

      // Button collector
      const collector = msg.createMessageComponentCollector({ time: 15000 });
      collector.on("collect", async i => {
        if (i.user.id !== interaction.user.id) return; // only original user
        await i.deferUpdate();
        const updatedEmbed = buildDiagnosticsEmbed(client);
        await i.editReply({ embeds: [updatedEmbed] });
      });

    } catch (error) {
      console.error("[ULTIMATE PING ERROR]", error);
      if (!interaction.replied) await interaction.reply({ content: "❌ An error occurred.", ephemeral: true });
      else await interaction.editReply({ content: "❌ An error occurred.", embeds: [] });
    }
  }
};

// ---------------- Helper Function ---------------- //
function buildDiagnosticsEmbed(client) {
  // System and bot metrics
  const memoryUsage = process.memoryUsage();
  const uptime = msToHMS(client.uptime);
  const guildCount = client.guilds.cache.size;
  const userCount = client.users.cache.size;
  const channelCount = client.channels.cache.size;

  const roleCount = client.guilds.cache.reduce((acc, g) => acc + (g.roles?.cache?.size ?? 0), 0);
  const emojiCount = client.guilds.cache.reduce((acc, g) => acc + (g.emojis?.cache?.size ?? 0), 0);
  const boosts = client.guilds.cache.reduce((acc, g) => acc + (g.premiumSubscriptionCount ?? 0), 0);

  const cpus = os.cpus();
  const cpuModel = cpus[0].model;
  const cpuCores = cpus.length;
  const cpuLoad = getCpuLoad();

  const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(2);
  const freeMemMB = (os.freemem() / 1024 / 1024).toFixed(2);

  // Bot version from package.json
  let pkgVersion = "unknown";
  try {
    const pkgJSON = JSON.parse(readFileSync(path.resolve("./package.json"), "utf-8"));
    pkgVersion = pkgJSON.version || "unknown";
  } catch {}

  const shardInfo = client.shard ? `Shard ${client.shard.ids[0] + 1}/${client.shard.count}` : "No Shards";

  const embed = new EmbedBuilder()
    .setTitle("🏓 Royal Music Security | Ultimate Diagnostics")
    .setColor("#1abc9c")
    .addFields(
      { name: "Bot Ping", value: `${Math.round(client.ws.ping)}ms`, inline: true },
      { name: "Uptime", value: uptime, inline: true },
      { name: "Guilds", value: `${guildCount}`, inline: true },
      { name: "Users", value: `${userCount}`, inline: true },
      { name: "Channels", value: `${channelCount}`, inline: true },
      { name: "Roles", value: `${roleCount}`, inline: true },
      { name: "Emojis", value: `${emojiCount}`, inline: true },
      { name: "Boosts", value: `${boosts}`, inline: true },
      { name: "Memory (RSS)", value: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`, inline: true },
      { name: "System Memory", value: `Free: ${freeMemMB} MB / Total: ${totalMemMB} MB`, inline: true },
      { name: "CPU", value: `${cpuModel} (${cpuCores} cores)`, inline: true },
      { name: "CPU Load", value: `${cpuLoad}%`, inline: true },
      { name: "Node.js", value: process.version, inline: true },
      { name: "Discord.js", value: `v${djsVersion}`, inline: true },
      { name: "Bot Version", value: pkgVersion, inline: true },
      { name: "Platform", value: `${os.platform()} (${os.arch()})`, inline: true },
      { name: "Shard Info", value: shardInfo, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: "Royal Music Security" });

  return embed;
}

// ---------------- Utility Functions ---------------- //
function msToHMS(ms) {
  let seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function getCpuLoad() {
  const cpus = os.cpus();
  let total = 0;
  cpus.forEach(cpu => {
    const times = cpu.times;
    total += (1 - times.idle / (times.user + times.nice + times.sys + times.idle + times.irq)) * 100;
  });
  return (total / cpus.length).toFixed(2);
}
