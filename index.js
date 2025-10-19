const login = require("@dongdev/fca-unofficial");
const fetch = require("node-fetch");
const fs = require("fs");
const e = require("express");
const commands = fs.readdirSync("./commands");
const config = JSON.parse(fs.readFileSync("./fca-config.json", "utf8"));

// Map to store command modules, keyed by their name (e.g., "schedule")
const commandModules = new Map();

// Placeholder for bot owner/admin UIDs (update these with your actual IDs)
const ADMIN_IDS = ["100006664923252"];
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running!');
})

async function start() {
    const loginOptions = {
        listenEvents: true,
        updatePresence: true,
        selfListen: false,
        forceLogin: true,
        online: true,
        autoMarkDelivery: false,
        autoMarkRead: false,
        listenTyping: false,
        proxy: null,
        autoReconnect: false
    };

    login(JSON.parse(fs.readFileSync("./appstate.json", "utf8")), loginOptions, (err, api) => {
        if (err) {
            console.error("Login error:", err);
            return;
        }

        console.log("Bot is now listening for messages...");

        // --- COMMAND LOADING LOGIC ---
        for (const file of commands) {
            if (file.endsWith(".js")) {
                try {
                    // Dynamically require the command file
                    const module = require(`./commands/${file}`);

                    // Check if the module has the necessary config and run function
                    if (module.config && module.config.name && typeof module.run === 'function') {
                        const commandName = module.config.name.toLowerCase();
                        commandModules.set(commandName, module);
                        console.log(`✅ Command loaded: ${commandName}`);
                    } else {
                        console.warn(`Command file ${file} is missing config or run function.`);
                    }
                } catch (e) {
                    console.error(`❌ Failed to load command ${file}:`, e);
                }
            }
        }
        // --- END COMMAND LOADING LOGIC ---

        api.listenMqtt(async (err, event) => {
            if (err) {
                console.error("Listen error:", err);
                return;
            }

           

            // ✅ Welcome new participants
            if (event.type === "event" && event.logMessageType === "log:subscribe") {
                try {
                    const threadInfo = await api.getThreadInfo(event.threadID);
                    const addedParticipants = event.logMessageData.addedParticipants;

                    const mentions = {}
                    mentions[event.logMessageData.addedParticipants[0].userFbId] = event.logMessageData.addedParticipants[0].fullName
                    

                    const names = addedParticipants.map(p => p.fullName).join(", ");
                    const message = `👋 Welcome to ${threadInfo.threadName}, ${names}!`;

                    api.sendMessage({ body: message, mentions }, event.threadID);
                } catch (e) {
                    console.error("❌ Failed to send welcome message:", e);
                }
            }

            // ✅ Command handler
            if (event.type === "message" && event.body && event.body.startsWith(config.prefix)) {
                const args = event.body.slice(config.prefix.length).trim().split(/ +/);
                const command = args.shift().toLowerCase();

                const module = commandModules.get(command);

                if (module) {
                    if (module.config.needAdmin && !ADMIN_IDS.includes(event.senderID)) {
                        return api.sendMessage("🔒 You do not have permission to use this command.", event.threadID);
                    }

                    try {
                        if (module.startReminderChecker) {
                            module.startReminderChecker(api);
                        }
                        module.run({ api, event, args });
                    } catch (execError) {
                        console.error(`Error executing command ${command}:`, execError);
                        api.sendMessage(`An internal error occurred while running the ${command} command.`, event.threadID);
                    }
                }
            }
        });
    });
}


app.listen(3000, () => {
    console.log('Server is running on port 3000');
    start();
    require('./l.js').keepAliveJob.start()
})