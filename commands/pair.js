const axios = require("axios");

module.exports.config = {
  name: "pair",
  version: "1.1.0",
  author: "Monsterwith and Liane Cagara",
  description: "Pair with a random person in the group",
  usage: "[quoted]",
  category: "Fun",
  noPrefix: false,
  needAdmin: false,
};

module.exports.run = async function ({ api, event, args, Users }) {
  const threadID = event.threadID;
  const senderID = event.senderID;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const members = threadInfo.participantIDs.filter(id => id !== senderID);

    if (members.length === 0) {
      return api.sendMessage("There are no other members in the group ☹💕😢", threadID);
    }

    const randomPartnerID = members[Math.floor(Math.random() * members.length)];

    const userInfo1 = await api.getUserInfo(senderID);
    const userInfo2 = await api.getUserInfo(randomPartnerID);
    const name1 = userInfo1[senderID]?.name || "Unknown";
    const name2 = userInfo2[randomPartnerID]?.name || "Unknown";

    const lovePercent = Math.floor(Math.random() * 36) + 65;
    const compatibilityPercent = Math.floor(Math.random() * 36) + 65;

    const avatarUrl1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;
    const avatarUrl2 = `https://graph.facebook.com/${randomPartnerID}/picture?width=512&height=512`;

    const useQuoted = args[0] === "quoted";

    const makeQuoteImage = async (url, name, quote) => {
      if (!useQuoted) {
        const res = await axios.get(url, { responseType: "stream" });
        return res.data;
      }

      const res = await axios.get("https://api.popcat.xyz/quote", {
        params: {
          image: url,
          name: name,
          text: quote,
          font: "Poppins-Bold"
        },
        responseType: "stream"
      });

      return res.data;
    };

    const img1 = await makeQuoteImage(avatarUrl1, name1, `I love you ${name2}!`);
    const img2 = await makeQuoteImage(avatarUrl2, name2, `I love you ${name1}!`);

    const msg = `💘 Everyone congratulates the new husband and wife:

❤ ${name1} 
        💕 
❤ ${name2}

❤️ Love percentage: ${lovePercent}% 
💞 Compatibility ratio: ${compatibilityPercent}% 

🎉 Congratulations 💝`;

    api.sendMessage({ body: msg }, threadID);
  } catch (error) {
    console.error("Pair command error:", error);
    return api.sendMessage("❌ Something went wrong. Please try again later.", threadID);
  }
};
