import "dotenv/config";
import { Client, Collection, REST } from "discord.js";
import { CommandHandler } from "./src/core/commandhandler.js";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

// --- Config ---
const GUILD_ID = "1071949044630433933"; // your target guild
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // bot application id

// --- Setup Client ---
const client = new Client({
  intents: []
});

// Initialize CommandHandler
const commandHandler = new CommandHandler(client);

// Initialize collections manually
client.commands = new Collection();
client.categories = new Collection();
client.cooldowns = new Collection();

// --- Load commands ---
async function loadCommands() {
  const commandsPath = path.join(process.cwd(), "src/commands");
  if (!fs.existsSync(commandsPath)) return console.warn("[FORCE RELOAD] Commands folder not found.");

  client.commands.clear();
  client.categories.clear();

  const commands = [];
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
  for (const file of files) {
    try {
      const filePath = path.join(commandsPath, file);
      const url = pathToFileURL(filePath).href + `?update=${Date.now()}`;
      const cmdImport = await import(url);
      const cmd = cmdImport.default;

      if (!cmd?.data?.name || typeof cmd.execute !== "function") {
        console.warn(`[FORCE RELOAD] Invalid command skipped: ${file}`);
        continue;
      }

      client.commands.set(cmd.data.name, cmd);
      commands.push(cmd.data.toJSON());
      console.log(`[FORCE RELOAD] Loaded command: ${cmd.data.name}`);
    } catch (err) {
      console.error(`[FORCE RELOAD ERROR] ${file}`, err);
    }
  }

  return commands;
}

// --- Register commands to guild ---
async function registerGuildCommands(commands) {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    await rest.put(
      `/applications/${CLIENT_ID}/guilds/${GUILD_ID}/commands`,
      { body: commands }
    );
    console.log(`✅ Successfully reloaded ${commands.length} commands to guild ${GUILD_ID}`);
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }
}

// --- Run ---
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const commands = await loadCommands();
  await registerGuildCommands(commands);
  process.exit(0);
});

client.login(TOKEN);
