const login = require("@dongdev/fca-unofficial");
const rr = [1894458224750392]
const m2m = [836011718819320]
const tst = [2064652814362745]
const fetch = require("node-fetch");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("./fca-config.json", "utf8"));

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
        
        api.listen((err, event) => {
            if (err) {
                console.error("Listen error:", err);
                return;
            }
            
            console.log(event)
            if (event.type=="message" && event.body == config.prefix + "test") {
                api.sendMessage("Successfully Executed.", event.threadID, event.messageID)
            }
        });
    });
}

start()