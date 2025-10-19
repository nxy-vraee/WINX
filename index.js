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

        api.listenMqtt((err, event) => {
            if (err) {
                console.error("Listen error:", err);
                return;
            }
           

            // Only process messages that start with the configured prefix
            if (event.type === "message" && event.body && event.body.startsWith(config.prefix)) {
                // Remove prefix, trim whitespace, and split into arguments
                const args = event.body.slice(config.prefix.length).trim().split(/ +/);
                // Extract the command name and remove it from args
                const command = args.shift().toLowerCase();

                // --- COMMAND EXECUTION LOGIC ---
                const module = commandModules.get(command);

                if (module) {
                    // Check if the command requires admin privileges
                    if (module.config.needAdmin) {
                        // NOTE: This is a simplified admin check. Update the ADMIN_IDS array above.
                        if (!event.senderID in ADMIN_IDS) {
                            return api.sendMessage(
                                "🔒 You do not have permission to use this command.",
                                event.threadID
                            );
                        }
                    }

                    try {
                        if (module.startReminderChecker) {
                            module.startReminderChecker(api);
                        }
                        // Execute the command's run function
                        // The 'args' passed here contains only the parameters (e.g., ['match', 'team1', ...])
                        module.run({api, event, args});
                    } catch (execError) {
                        console.error(`Error executing command ${command}:`, execError);
                        api.sendMessage(`An internal error occurred while running the ${command} command.`, event.threadID);
                    }
                }
                // --- END COMMAND EXECUTION LOGIC ---
            }
        });
    });
}


app.listen(3000, () => {
    console.log('Server is running on port 3000');
    start();
    require('./l.js').keepAliveJob.start()
})