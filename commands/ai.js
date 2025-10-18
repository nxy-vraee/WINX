module.exports.config = {
  name: "ai",
  version: "1.0",
  needAdmin: false
};

module.exports.run = async function({ api, event, args }) {
  // 1. Check for user message
  const userMessage = args.join(" ");
  if (!userMessage) {
      return api.sendMessage(
          "Please provide a question or prompt for the AI.",
          event.threadID,
          event.messageID
      );
  }

  // 2. Start typing indicator to show the bot is working
  

  try {
      // 3. Construct the API URL
      const apiUrl = `https://kaiz-apis.gleeze.com/api/gpt-4o-pro?ask=${encodeURIComponent(userMessage)}&uid=${event.senderID}&imageUrl=&apikey=c45bdeef-df78-4d88-ac0e-b5227e7b3ed0`;

      // 4. Fetch data from the external API
      const response = await fetch(apiUrl);

      // Check for HTTP errors (e.g., 404, 500)
      if (!response.ok) {
          throw new Error(`API returned status ${response.status}: ${response.statusText}`);
      }

      // 5. Parse the JSON response
      const data = await response.json();

      // 6. Check if the response contains the 'response' field
      if (data && data.response) {
          // Success: Send the AI's reply back to the user
          api.sendMessage(
              data.response, // This is the content: "Hi there! 👋 How can I help you today?"
              event.threadID, 
              event.messageID
          );
      } else {
          // Error: API call was successful but the JSON was not in the expected format
          const errorMsg = data.error || "The AI service returned an unexpected or empty response.";
          api.sendMessage(
              `[AI Error] ${errorMsg}`,
              event.threadID,
              event.messageID
          );
      }

  } catch (error) {
      // Handle network errors or issues during the fetch/parsing process
      console.error("AI command failed:", error);
      api.sendMessage(
          `An error occurred while communicating with the AI service. Details: ${error.message}`,
          event.threadID,
          event.messageID
      );
  }
};