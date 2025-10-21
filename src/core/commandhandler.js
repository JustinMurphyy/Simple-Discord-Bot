import fs from "fs";
import path from "path";
import { Collection } from "discord.js";
import { pathToFileURL } from "url";
import EventEmitter from "events";

export class CommandHandler extends EventEmitter {
  constructor(client) {
    super();
    if (!client) throw new Error("Client instance required.");
    this.client = client;

    this.client.commands ||= new Collection();
    this.client.cooldowns ||= new Collection();
    this.client.categories ||= new Collection();
  }

  async loadCommands() {
    const commandsPath = path.join(process.cwd(), "src/commands");
    if (!fs.existsSync(commandsPath)) return this.emit("warn", "Commands folder not found.");

    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

    for (const file of files) {
      try {
        const filePath = path.join(commandsPath, file);
        const cmdImport = await import(pathToFileURL(filePath).href + `?update=${Date.now()}`);
        const cmd = cmdImport.default;

        if (!cmd?.data?.name || typeof cmd.execute !== "function") {
          this.emit("warn", `Invalid command skipped: ${file}`);
          continue;
        }

        cmd.cooldown ||= 3;
        cmd.category ||= "Uncategorized";
        cmd.aliases ||= [];
        cmd.permissions ||= [];
        cmd.ownerOnly ||= false;

        this.client.commands.set(cmd.data.name, cmd);
        if (!this.client.categories.has(cmd.category)) this.client.categories.set(cmd.category, []);
        this.client.categories.get(cmd.category).push(cmd.data.name);

        this.emit("commandLoaded", cmd.data.name, cmd.category);
      } catch (err) {
        console.error(`[COMMAND LOAD ERROR] ${file}`, err);
        this.emit("error", `Failed to load command ${file}`, err);
      }
    }

    this.emit("info", `Total commands loaded: ${this.client.commands.size}`);
  }
}
