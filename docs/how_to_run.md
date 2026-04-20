# How to Run Rove

Follow these steps to get Rove up and running on your machine.

### 1. Requirements
- **Node.js**: Version 20 or higher.
- **pnpm**: Version 9 or higher.
- **cloudflared**: Installed and available in your system's PATH (for remote access).
- **Ollama**: (Optional) For enabling local AI features.

### 2. Setup
Clone the repository and install the dependencies:
```bash
git clone <repo-url>
cd rove
pnpm install
```

### 3. Configuration
Copy the example configuration files and fill in your details:
```bash
cp .env.example .env
cp rove.config.json.example rove.config.json
```

#### Generating your PIN Hash
Rove uses a secure PIN for authentication. You must generate a bcrypt hash of your chosen PIN and add it to the `.env` file.

Run this command to generate a hash for your PIN:
```bash
cd server && node -e "const b = require('bcrypt'); b.hash('YOUR_NEW_PIN', 10).then(console.log)"
```
*Example for PIN '1234':*
```bash
cd server && node -e "const b = require('bcrypt'); b.hash('1234', 10).then(console.log)"
```

Once you have the hash, update your `.env` file:
```env
PIN_HASH=$2b$10$...your_generated_hash...
JWT_SECRET=...your_random_32_byte_string...
```

### 4. Running the Application
To start Rove in development mode, you need to run both the server and the client.

**Start the Backend Server:**
```bash
pnpm dev:server
```

**Start the Frontend Client:**
```bash
pnpm dev:client
```

### 5. Exposing for Remote Access
To access the app from your phone or a different network, start a Cloudflare Tunnel pointing to the **backend port (4242)**:
```bash
cloudflared tunnel --url http://localhost:4242
```
*Note: Pointing to 4242 ensures that the UI, API, and WebSockets all work correctly through a single URL.*
