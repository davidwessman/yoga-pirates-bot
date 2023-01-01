// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits } from "discord.js";
import { addDays } from "date-fns";

import { DISCORD_CLIENT_TOKEN } from "./config.js";
import { getXataClient } from "./xata.js";

// Create a new discord client instance
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// create a new xata client instance
const xata = getXataClient();

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
discordClient.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

// When there is a yoga log message, reply with
discordClient.on(Events.MessageCreate, async (message) => {
  console.log({ message });
  // Get channel
  const channel = await discordClient.channels.fetch(message.channelId);
  const messageContent = message.content.trim();

  // Ignore bot messages
  if (message.author.bot) return;
  // Ignore if not in yoga channel
  if (channel.name.toLowerCase() !== "yoga") return;
  // Ignore if message does not start with ✅
  if (!messageContent.startsWith("✅")) return;

  // This should be "✅" or "✅-3" etc
  const logContent = messageContent.split(" ")[0];

  // When removing ✅ from logContent should have "-3", "-1", "" etc
  const timeShiftNumber = parseInt(logContent.replace("✅", ""));

  const creationDate = new Date(message.createdTimestamp);
  let logDate = creationDate;

  if (!isNaN(timeShiftNumber)) {
    logDate = addDays(logDate, timeShiftNumber);
  }

  const record = await xata.db.log.create({
    id: message.id,
    creationDate: creationDate,
    logDate: logDate,
    description: messageContent.replace(logContent, "").trim(),
    discordUserId: message.author.id,
  });

  console.log({ record });

  message.react("🏴‍☠️");
});

// Log in to Discord with your client's token
discordClient.login(DISCORD_CLIENT_TOKEN);
