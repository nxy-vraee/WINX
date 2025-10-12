const login = require("@dongdev/fca-unofficial");
const rr = [1894458224750392]
const m2m = [836011718819320]
const tst = [2064652814362745]
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("./fca-config.json", "utf8"));
login(JSON.parse(fs.readFileSync("./cookies.json", "utf8")), (err, api) => {
    if (err) return console.error(err);
    if (!config.thread_with_admins) {
        api.createNewGroup(config.admins, "NV_TESTING", (err, threadInfo) => {
            if (err) return console.error(err);
            config.thread_with_admins = threadInfo
            fs.writeFileSync("./fca-config.json", JSON.stringify(config, null, 2))
             api.sendMessage("BOT - ONLINE!", config.thread_with_admins)
        })
    } else {
        api.sendMessage("BOT - ONLINE!", config.thread_with_admins)
    }
   
})