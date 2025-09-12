const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Read the database at startup
let database = [];
try {
  database = JSON.parse(fs.readFileSync('./database/database.json'));
} catch (error) {
  console.error("Failed to read database.json:", error.message);
}

// Utility function to generate random numeric ID
function randomId(length) {
  const chars = '1234567890';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Register user
app.post("/api/reg", async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    if (!username || !password || !displayName) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Check for existing user
    const existingUser = database.find(u => u.username === username);
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = randomId(10);
    const cookieID = randomId(23);

    const newUser = {
      username,
      password: hashedPassword,
      displayName,
      clan: 0,
      character: [],
      id,
      bank: {
        money: 0,
        volleyball: 0
      },
      cookieID
    };

    database.push(newUser);
    fs.writeFileSync('./database/database.json', JSON.stringify(database, null, 2));

    res.json({ message: "User registered successfully", id });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
});

// Login user
app.post("/api/login", async (req, res) => {
  try {
    const { cookieID, username, password } = req.body;

    const user = database.find(u =>
      (username && password && u.username === username) ||
      (cookieID && u.cookieID === cookieID)
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Password check
    if (username && password) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
    }

    // Refresh cookie ID
    user.cookieID = randomId(23);
    fs.writeFileSync('./database/database.json', JSON.stringify(database, null, 2));

    res.json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// Get patch notes
app.post("/api/checkPatchNote", (req, res) => {
  try {
    const patchNote = JSON.parse(fs.readFileSync('./database/patchnote.json'));
    res.json(patchNote);
  } catch (error) {
    res.status(500).json({ message: "Failed to load patch notes", error: error.message });
  }
});

// Download patch file
app.post("/api/download", (req, res) => {
  try {
    const { patchNoteId } = req.body;
    const patchNote = JSON.parse(fs.readFileSync('./database/patchnote.json'));

    if (patchNote.patchNoteId === patchNoteId && patchNote.file) {
      const filePath = path.resolve(patchNote.file);
      if (fs.existsSync(filePath)) {
        return res.download(filePath);
      } else {
        return res.status(404).json({ message: "Patch file not found" });
      }
    } else {
      res.status(400).json({ message: "Invalid patch note ID" });
    }
  } catch (error) {
    res.status(500).json({ message: "Download failed", error: error.message });
  }
});

// Root route with Cloudflare IP headers
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Xavia Legacy API",
    ipaddress: req.ip,
    country: req.headers["cf-ipcountry"] || "Unknown",
    region: req.headers["cf-region"] || "Unknown",
    city: req.headers["cf-city"] || "Unknown",
    timezone: req.headers["cf-timezone"] || "Unknown",
    latitude: req.headers["cf-latitude"] || "Unknown",
  });
});
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "/database/index.html"));
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
