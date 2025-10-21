export default {
  once: false, // Runs on every interaction

  /**
   * Handles all interactions
   * @param {import('discord.js').Interaction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    // Only handle slash commands
    if (!interaction.isChatInputCommand()) return;

    const commandName = interaction.commandName;

    // Access CommandHandler instance
    const commandHandler = client.commandHandlerInstance;
    if (!commandHandler) return console.error("[❌] CommandHandler instance not found.");

    // Execute command
    const errorMsg = await commandHandler.executeCommand(commandName, interaction);

    // Optionally, handle error messages returned
    if (errorMsg && !interaction.replied) {
      await interaction.reply({ content: errorMsg, ephemeral: true }).catch(console.error);
    }
  }
};
