const login = require("@dongdev/fca-unofficial");
const rr = [1894458224750392]
const m2m = [836011718819320]
const tst = [2064652814362745]
const fetch = require("node-fetch");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("./fca-config.json", "utf8"));

async function start() {
   
    login(JSON.parse(fs.readFileSync("./appstate.json", "utf8")), (err, api) => {
        api.listenMqtt((err, event) => {
            if (err) return console.error(err);
            console.log(event)
            if (event.type=="message" && event.body == config.prefix + "test") {
                api.sendMessage("Successfully Executed.", event.threadID, event.messageID)
            }
            
    })
})
}

start()