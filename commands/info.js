module.exports.config = {
  name: "info",
  version: "1.0",
  needAdmin: false,
  hasSubCommand: true,
  usages: "/info hero <hero name>",
  // The main name is 'info', but we want a sub-command 'hero'
};

module.exports.run = async function({ api, event, args }) {
  const fetch = require('node-fetch'); // Use 'node-fetch' if global 'fetch' isn't available

  // Check for the sub-command "hero"
  const subCommand = args[0] ? args[0].toLowerCase() : '';
  if (subCommand !== 'hero') {
      return api.sendMessage(
          "Invalid sub-command. Please use: /info hero <hero name>",
          event.threadID,
          event.messageID
      );
  }

  // Get the hero name (remaining arguments)
  const heroName = args.slice(1).join(" ");
  if (!heroName) {
      return api.sendMessage(
          "Please provide the name of the Mobile Legends hero (e.g., /info hero Freya).",
          event.threadID,
          event.messageID
      );
  }

  // Replace spaces with correct encoding for the URL and API
  const encodedHeroName = encodeURIComponent(heroName);
  const apiUrl = `https://kaiz-apis.gleeze.com/api/mlbb-heroes?name=${encodedHeroName}&apikey=c45bdeef-df78-4d88-ac0e-b5227e7b3ed0`;

  // Send a typing indicator
  api.sendMessage(`🔍 Searching for ${heroName} info...`, event.threadID);

  try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
          throw new Error(`API call failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check for the successful response structure
      if (data && data.response && data.response.heroName) {
          const hero = data.response;

          // 7. Format the detailed response message
          const replyMessage = `
✨ ${hero.heroName} (${hero.alias})
──────────────────────
Role/Specialty: ${hero.role} / ${hero.specialty}
Recommended Lane: ${hero.laneRecommend}
Price: ${hero.price}
Release Date: ${hero.releaseDate}
Damage Type: ${hero.damageType}
Attack Type: ${hero.basicAttackType}

Lore & Info:
Gender: ${hero.gender}
Species: ${hero.species}
Affiliation: ${hero.affiliation}
Weapons: ${hero.weapons}
Abilities: ${hero.abilities}

Stats (1-10):
Durability: ${hero.durability}
Offense: ${hero.offense}
Control Effects: ${hero.controlEffects}
Difficulty: ${hero.difficulty}
          `.trim();

          // Send the reply, including the thumbnail if available (optional: send as an attachment)
          if (hero.thumbnail) {
              // To send the thumbnail as a link (easier to implement)
              api.sendMessage(
                  `${replyMessage}\n\nThumbnail: ${hero.thumbnail}`,
                  event.threadID,
                  event.messageID
              );

              // If the bot supports sending image attachments from URLs, uncomment this section:
              /*
              const imageResponse = await fetch(hero.thumbnail);
              const imageBuffer = await imageResponse.buffer();

              api.sendMessage(
                  {
                      body: replyMessage,
                      attachment: [imageBuffer] // Requires the framework's attachment method
                  },
                  event.threadID,
                  event.messageID
              );
              */
          } else {
              api.sendMessage(replyMessage, event.threadID, event.messageID);
          }

      } else if (data && data.response && data.response.error) {
           // Handle specific API error message if a hero is not found
          api.sendMessage(
              `[Error] Hero **${heroName}** not found. Please check the spelling.`,
              event.threadID,
              event.messageID
          );
      } else {
          // General structure failure
          api.sendMessage(
              `An unknown error occurred while processing the information for **${heroName}**.`,
              event.threadID,
              event.messageID
          );
      }

  } catch (error) {
      console.error("MLBB Hero Info command failed:", error);
      api.sendMessage(
          `A critical error occurred: ${error.message}. The external API might be unreachable.`,
          event.threadID,
          event.messageID
      );
  }
};