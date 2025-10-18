// cron.js

// Using 'node-cron' library for scheduling jobs
const cron = require('node-cron');

// --- Configuration ---
// The backend endpoint URL to hit to prevent the server from sleeping.
const backendUrl = 'https://winx-6xpd.onrender.com/'; // Replace with your actual URL

// Cron schedule to run the job.
// NOTE: The original code used '*/14 * * * * *' which is 'every 14 seconds'.
// The original comment said 'every 14 minutes', which is '*/14 * * * *'.
// I will use '*/14 * * * *' (every 14 minutes) as it aligns better with common
// keep-alive strategies to save resources. If you need every 14 seconds, use '*/14 * * * * *'.
const cronSchedule = '*/14 * * * *'; 

// --- Cron Job Definition ---
const keepAliveJob = cron.schedule(cronSchedule, async function() {
    console.log(`[Keep Alive] Pinging server at ${new Date().toLocaleTimeString()}...`);

    try {
        // Use 'fetch' for a cleaner HTTP request (requires modern Node.js or 'node-fetch')
        const response = await fetch(backendUrl);

        if (response.ok) {
            console.log(`[Keep Alive] Server successfully pinged. Status: ${response.status}`);
        } else {
            // Log failed status codes
            console.error(
                `[Keep Alive] Failed to ping server. Status Code: ${response.status}`
            );
        }
    } catch (error) {
        // Log network errors (e.g., DNS failure, connection refused)
        console.error(`[Keep Alive] Error during server ping: ${error.message}`);
    }
}, {
    scheduled: false
});

// --- Export the Cron Job ---
// This job must be started externally using keepAliveJob.start();
module.exports = {
    keepAliveJob,
};
