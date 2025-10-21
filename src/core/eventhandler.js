export default function loadEvents(client) {
  client.on("clientReady", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(`[COMMAND ERROR] ${interaction.commandName}`, err);
      if (!interaction.replied) {
        await interaction.reply({ content: "❌ Error executing command.", ephemeral: true });
      }
    }
  });
}
