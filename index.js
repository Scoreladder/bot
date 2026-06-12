// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, GuildEmoji } = require('discord.js');
const { token, owners } = require('./config.json');
const { inspect } = require('util');

// Create a new client instance
const client = new Client({ intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildExpressions
    ] });



// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    if (message.channelId === "1512223214984757338" && message.author.id !== client.user.id) {
        await message.delete().catch(() => {});
        return;
    }

    if (message.author.id === "1196149164409639065" && message.content.toLowerCase().includes("bruh")) {
        await message.react("😂");
        await message.forward(message.guild.channels.cache.get("1512223214984757338"));
    }

    if (message.content === "!close") {
        const channel = message.channel;

        if (channel.parentId === "1514988512582045907")

        // Make sure it's a thread (forum posts = threads)
        if (!channel.isThread()) return;

        try {
            await message.react("☑️")
            await channel.setArchived(true);   // "closes" the forum post
        } catch (err) {
            console.error(err);
            message.reply("Failed to close the thread.");
        }
    }

    

    if (message.content.startsWith('!eval')) {
        if (!owners.includes(message.author.id)) {
            const reply = await message.reply('This command is strictly for the bot owner(s).');
            // 3 seconds later, delete the message and the reply
            setTimeout(() => {
                message.delete().catch(() => {});
                reply.delete().catch(() => {});
            }, 3000);
            return;
        }
        
        await message.react("<a:loading:1512087895824138300>");

        const codeArg = message.content.slice(5).trim();
        const originalLog = console.log;

        try {
            // Capture console.log output
            const logs = [];

            console.log = (...args) => {
                logs.push(
                    args.map(arg =>
                        typeof arg === "string"
                            ? arg
                            : inspect(arg, { depth: 2 })
                    ).join(" ")
                );
            };

            let fullOutput = codeArg.includes("--full");

            const code = codeArg.replaceAll("--full", ""); // Remove --full flag if present

            let evaled = eval(code);

            if (evaled instanceof Promise) {
                evaled = await evaled.catch(err => {
                    throw new Error(`Promise rejected: ${err}`);
                });
            }

            // Restore console.log
            console.log = originalLog;

            // If nothing was logged, fall back to the return value
            let result = "";

            if (logs.length > 0) {
                result = logs.join("\n");
            }
            
            if (!result && fullOutput) {
                result = typeof evaled === "string" ? evaled : inspect(evaled, { depth: 2 });
            }

            // Hide token
            if (client.token) {
                result = result.replaceAll(client.token, "REDACTED_TOKEN");
            }
            

            // Discord length limit
            if (result.length > 500) {
                result = result.slice(0, 1900) + "\n... (truncated)";
            }
            if (result.length > 0) {
                await message.reply(`\`\`\`js\n${result}\n\`\`\``);
            }
            
            await message.reactions.removeAll();
            await message.react("✅");
        } catch (error) {
            console.log = originalLog; // Ensure restoration on error

            let errStr = error.toString();
            if (client.token) {
                errStr = errStr.replaceAll(client.token, "REDACTED_TOKEN");
            }

            await message.reply(
                `❌ **Error:**\n\`\`\`js\n${errStr}\n\`\`\``
            );
            await message.reactions.removeAll();
            await message.react("❌");
        }
    }
});

// Log in to Discord with your client's token
client.login(token);