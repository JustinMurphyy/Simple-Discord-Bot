import "dotenv/config";
import { Client, Collection, REST, Routes } from "discord.js";
import { CommandHandler } from "./src/core/commandhandler.js";
import loadEvents from "./src/core/eventhandler.js";

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({ intents: [] });

// Setup CommandHandler
const commandHandler = new CommandHandler(client);
client.commands = new Collection();
client.categories = new Collection();
client.cooldowns = new Collection();

// Load commands
await commandHandler.loadCommands();

// Register guild commands
const rest = new REST({ version: "10" }).setToken(TOKEN);
try {
  const commandsArray = client.commands.map(cmd => cmd.data.toJSON());
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commandsArray }
  );
  console.log(`✅ Registered ${commandsArray.length} commands to guild ${GUILD_ID}`);
} catch (err) {
  console.error("❌ Failed to register guild commands:", err);
}

// Load events
loadEvents(client);

// Login
client.login(TOKEN);
