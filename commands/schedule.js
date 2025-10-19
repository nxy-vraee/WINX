const fs = require("fs");
const SCHEDULES_FILE = "./commands/schedules.json";

function loadSchedules() {
    try {
        if (fs.existsSync(SCHEDULES_FILE)) {
            const data = fs.readFileSync(SCHEDULES_FILE, "utf8");
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Error loading schedules file:", error);
    }
    return [];
}

function saveSchedules(schedules) {
    try {
        fs.writeFileSync(
            SCHEDULES_FILE,
            JSON.stringify(schedules, null, 2),
            "utf8",
        );
        return true;
    } catch (error) {
        console.error("Error saving schedule to file:", error);
        return false;
    }
}

let schedules = loadSchedules();

module.exports.config = {
    name: "schedule",
    version: "2.0",
    needAdmin: true,
};

module.exports.run = async function ({ api, event, args }) {
    const subcommand = args[0] ? args[0].toLowerCase() : null;
    const threadID = event.threadID;

    const findMatch = (matchId) => schedules.find((s) => s.id === matchId);

    const formatSchedule = (s) => {
        let output = `[ID: ${s.id}] ${s.team1} vs ${s.team2} (${s.date} @ ${s.time})`;
        if (s.note) {
            output += `\n  📝 Note/Reminder: ${s.note}`;
        }
        output += `\n  Team 1 Members: ${s.members1 && s.members1.length > 0 ? s.members1.join(", ") : "None"}`;
        output += `\n  Team 2 Members: ${s.members2 && s.members2.length > 0 ? s.members2.join(", ") : "None"}`;
        return output;
    };

    switch (subcommand) {
        case "match":
        case "add": {
            const build = "/schedule match <team1> <team2> | <date> <time>";
            if (args.length !== 6 || args[3] !== "|") {
                return api.sendMessage(
                    `Invalid usage. Correct format: ${build}`,
                    threadID,
                );
            }

            const teamName1 = args[1].trim();
            const teamName2 = args[2].trim();
            const date = args[4].trim(); // Format: YYYY-MM-DD
            const time = args[5].trim(); // Format: HH:mm

            const newId = Date.now().toString().slice(-6);
            const newSchedule = {
                id: newId,
                team1: teamName1,
                team2: teamName2,
                date: date,
                time: time,
                members1: [],
                members2: [],
                note: "",
                timestamp: Date.now(),
                createdBy: event.senderID,
                threadID: threadID,
                reminded: false, // Flag for reminder
            };

            schedules.push(newSchedule);

            if (saveSchedules(schedules)) {
                api.sendMessage(
                    `✅ Scheduled Match ID ${newId}:\nTeams: ${teamName1} vs ${teamName2}\nTime: ${date} at ${time}`,
                    threadID,
                );
            } else {
                api.sendMessage(
                    "❌ Failed to save the new schedule.",
                    threadID,
                );
            }
            return;
        }

        case "list": {
            if (schedules.length === 0) {
                return api.sendMessage(
                    "There are no scheduled matches.",
                    threadID,
                );
            }

            const listMessage = schedules.map(formatSchedule).join("\n\n");
            return api.sendMessage(
                `Upcoming Schedules:\n\n${listMessage}`,
                threadID,
            );
        }

        case "delete": {
            if (args.length !== 2) {
                return api.sendMessage(
                    "Invalid usage. Correct format: /schedule delete <matchID>",
                    threadID,
                );
            }

            const matchIdToDelete = args[1];
            const initialLength = schedules.length;
            schedules = schedules.filter((s) => s.id !== matchIdToDelete);

            if (schedules.length < initialLength) {
                if (saveSchedules(schedules)) {
                    return api.sendMessage(
                        `✅ Schedule with ID ${matchIdToDelete} has been deleted.`,
                        threadID,
                    );
                } else {
                    return api.sendMessage(
                        "❌ Failed to save changes after deletion.",
                        threadID,
                    );
                }
            } else {
                return api.sendMessage(
                    `❌ Schedule ID ${matchIdToDelete} not found.`,
                    threadID,
                );
            }
        }

        case "member": {
            const build =
                "/schedule member <add/remove/list> <1/2> <name> <matchID>";

            if (args.length < 4 || (args[1] !== "list" && args.length !== 5)) {
                return api.sendMessage(
                    `Invalid usage. Correct format: ${build}`,
                    threadID,
                );
            }

            const memberAction = args[1].toLowerCase();
            const teamNumber = parseInt(args[2]);
            const matchId = memberAction === "list" ? args[3] : args[4];
            const memberName = memberAction === "list" ? null : args[3].trim();

            if (teamNumber !== 1 && teamNumber !== 2) {
                return api.sendMessage("Team number must be 1 or 2.", threadID);
            }

            const match = findMatch(matchId);
            if (!match) {
                return api.sendMessage(
                    `❌ Schedule ID ${matchId} not found.`,
                    threadID,
                );
            }

            const memberKey = `members${teamNumber}`;
            const teamName = teamNumber === 1 ? match.team1 : match.team2;

            if (memberAction === "list") {
                const memberList = match[memberKey];
                const listOutput =
                    memberList.length > 0
                        ? memberList.join("\n- ")
                        : "No members listed.";
                return api.sendMessage(
                    `Members for ${teamName} (ID: ${matchId}):\n- ${listOutput}`,
                    threadID,
                );
            }

            if (!memberName) {
                return api.sendMessage(
                    "A member name is required for add/remove actions.",
                    threadID,
                );
            }

            if (memberAction === "add") {
                if (!match[memberKey].includes(memberName)) {
                    match[memberKey].push(memberName);
                    if (saveSchedules(schedules)) {
                        return api.sendMessage(
                            `✅ ${memberName} added to ${teamName} (ID: ${matchId}).`,
                            threadID,
                        );
                    }
                } else {
                    return api.sendMessage(
                        `⚠️ ${memberName} is already in ${teamName}.`,
                        threadID,
                    );
                }
            } else if (memberAction === "remove") {
                const index = match[memberKey].indexOf(memberName);
                if (index > -1) {
                    match[memberKey].splice(index, 1);
                    if (saveSchedules(schedules)) {
                        return api.sendMessage(
                            `✅ ${memberName} removed from ${teamName} (ID: ${matchId}).`,
                            threadID,
                        );
                    }
                } else {
                    return api.sendMessage(
                        `⚠️ ${memberName} was not found in ${teamName}.`,
                        threadID,
                    );
                }
            } else {
                return api.sendMessage(
                    `Invalid member action. Use 'add', 'remove', or 'list'.`,
                    threadID,
                );
            }
            return api.sendMessage(
                "❌ Failed to process member action.",
                threadID,
            );
        }

        case "note":
        case "reminder": {
            if (args.length < 3) {
                return api.sendMessage(
                    "Invalid usage. Correct format: /schedule note <matchID> <Your reminder text...>",
                    threadID,
                );
            }

            const matchId = args[1];
            const noteText = args.slice(2).join(" ").trim();

            const match = findMatch(matchId);
            if (!match) {
                return api.sendMessage(
                    `❌ Schedule ID ${matchId} not found.`,
                    threadID,
                );
            }

            match.note = noteText;

            if (saveSchedules(schedules)) {
                return api.sendMessage(
                    `✅ Reminder/Note set for Match ID ${matchId}: "${noteText}"`,
                    threadID,
                );
            } else {
                return api.sendMessage(
                    "❌ Failed to save the note/reminder.",
                    threadID,
                );
            }
        }

        default:
            const helpMessage =
                "Schedule Command Help:\n" +
                "1. Add Match: /schedule match <team1> <team2> | <date> <time>\n" +
                "2. List: /schedule list\n" +
                "3. Delete: /schedule delete <matchID>\n" +
                "4. Member: /schedule member <add/remove/list> <1/2> <name> <matchID> (Name not needed for list)\n" +
                "5. Note/Reminder: /schedule note <matchID> <text...>";
            return api.sendMessage(helpMessage, threadID);
    }
};

// -----------------------------
// 🔔 Background Reminder Checker
// -----------------------------

// This function checks every minute whether a match is starting soon
function startReminderChecker(api) {
    setInterval(() => {
        const now = new Date();
        const currentTime = now.getTime();

        // Reload schedules to ensure we are using up-to-date data
        schedules = loadSchedules();

        for (let match of schedules) {
            if (match.reminded) continue;

            const matchDateTime = new Date(`${match.date} ${match.time}`);

            // If match is within 5 minutes from now, and not yet reminded
            const diffMs = matchDateTime.getTime() - currentTime;

            if (diffMs <= 5 * 60 * 1000 && diffMs > 0) {
                // Compose the reminder message
                const reminderText =
                    `⏰ Reminder: Match [${match.id}] starts soon!\n` +
                    `${match.team1} vs ${match.team2}\n` +
                    `🗓 ${match.date} @ ${match.time}\n` +
                    (match.note ? `📝 Note: ${match.note}` : "");

                api.sendMessage(reminderText, match.threadID);

                // Set reminded flag and save
                match.reminded = true;
                saveSchedules(schedules);
            }
        }
    }, 60 * 1000); // Check every 1 minute
}

// Export reminder starter to be called in your main bot file
module.exports.startReminderChecker = startReminderChecker;
