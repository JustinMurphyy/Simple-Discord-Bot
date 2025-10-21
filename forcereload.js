import "dotenv/config";
import { Client, Collection } from "discord.js";
import { CommandHandler } from "./src/core/commandHandler.js";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

// --- Setup Client ---
const client = new Client({
  intents: [] // adjust if needed
});

// Initialize CommandHandler
const commandHandler = new CommandHandler(client);

// Initialize command collections manually
client.commands = new Collection();
client.categories = new Collection();
client.cooldowns = new Collection();

/**
 * Force reload all commands
 */
async function forceReloadCommands() {
  const commandsPath = path.join(process.cwd(), "src/commands");
  if (!fs.existsSync(commandsPath)) {
    console.warn("[FORCE RELOAD] Commands folder not found.");
    return;
  }

  // Clear previous commands
  client.commands.clear();
  client.categories.clear();
  client.cooldowns.clear();

  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
  for (const file of files) {
    try {
      const filePath = path.join(commandsPath, file);
      const url = pathToFileURL(filePath).href + `?update=${Date.now()}`; // force reload
      const cmdImport = await import(url);
      const cmd = cmdImport.default;

      if (!cmd?.data?.name || typeof cmd.execute !== "function") {
        console.warn(`[FORCE RELOAD] Invalid command skipped: ${file}`);
        continue;
      }

      cmd.cooldown ||= 3;
      cmd.category ||= "Uncategorized";
      cmd.aliases ||= [];
      cmd.permissions ||= [];
      cmd.ownerOnly ||= false;

      client.commands.set(cmd.data.name, cmd);
      if (!client.categories.has(cmd.category)) client.categories.set(cmd.category, []);
      client.categories.get(cmd.category).push(cmd.data.name);

      console.log(`[FORCE RELOAD] Loaded command: ${cmd.data.name}`);
    } catch (err) {
      console.error(`[FORCE RELOAD ERROR] ${file}`, err);
    }
  }

  console.log(`[FORCE RELOAD] Total commands loaded: ${client.commands.size}`);
}

// --- Login & reload ---
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await forceReloadCommands();
  console.log("✅ Commands force-reloaded successfully!");
  process.exit(0); // Exit after reloading
});

client.login(process.env.TOKEN);
