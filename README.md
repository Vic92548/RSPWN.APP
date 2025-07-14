
# VAPR

**VAPR** is an open-source, gamified social platform for sharing and discovering gaming content.
It features Discord login, post creation with images or videos, reactions, following, XP/leveling, and more!

![VAPR Screenshot](https://vapr.b-cdn.net/vaprgif.gif)
*Screenshot: Main feed and post creation interface.*

---

## 🚀 Features

- **Discord Authentication:** Login with Discord OAuth.
- **Create & Share Posts:** Upload images or videos, add links, and share with the community.
- **Reactions & Interactions:** Like, dislike, skip, and react to posts with emojis.
- **Follow Creators:** Get notified when your favorite creators post new content.
- **XP & Leveling:** Earn experience points for actions and level up your profile.
- **Invite & Referral System:** Invite friends and earn rewards.
- **Discord Integration:** Real-time notifications via Discord webhooks and bots.
- **Modern Tech Stack:** Built with [Deno](https://deno.com/), [MongoDB](https://www.mongodb.com/), and [BunnyCDN](https://bunny.net/).

---

## 🛠️ Getting Started

### 1. Prerequisites

- [Deno](https://deno.com/manual/getting_started/installation)
- [MongoDB](https://www.mongodb.com/) database
- [Discord Developer Application](https://discord.com/developers/applications) (for OAuth)
- [BunnyCDN](https://bunny.net/) account (for media hosting)

### 2. Clone the Repository

```bash
git clone https://github.com/yourusername/VAPR.git
cd VAPR
```

### 3. Environment Variables

Create a `.env` file in the project root with the following variables:

```
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster-url>/<dbname>
DISCORD_ClientID=your_discord_client_id
DISCORD_ClientSecret=your_discord_client_secret
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_BOT_VAPR=your_discord_bot_vapr_token
DOMAIN=localhost:8080
BUNNY_CDN_ACCESSKEY=your_bunnycdn_accesskey
BUNNY_CDN_STORAGE_URL=your_bunnycdn_storage_url
BUNNY_CDN_LIBRARY_ID=your_bunnycdn_library_id
BUNNY_CDN_VIDEO_API_KEY=your_bunnycdn_video_api_key
```

### 4. Build Frontend Assets

```bash
deno run --allow-read --allow-write build.js
```

### 5. Start the Server

```bash
deno run --allow-net --allow-read --allow-env server.js
```

Visit [http://localhost:8080](http://localhost:8080) in your browser.

---

## 💡 Usage

- **Register/Login:** Use Discord OAuth to register or log in.
- **Create Posts:** Share images or videos, add links.
- **Interact:** Like, dislike, skip, or react to posts.
- **Follow:** Follow creators and get notified of new posts.
- **XP & Levels:** Earn XP for actions, level up your profile.
- **Invite Friends:** Use the referral system to invite friends and earn rewards.

---

## 🚀 Deployment

VAPR is set up for deployment on [Deno Deploy](https://deno.com/deploy):

1. Push your code to GitHub and connect the repository to Deno Deploy.
2. Configure environment variables in the Deno Deploy dashboard.
3. The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) for automated deployment on pushes to the `main` branch.
4. Optionally, deploy on any server that supports Deno, as long as the necessary environment variables are set.

---

## 🤝 Contributing

Contributions are welcome! To get started:

- Open issues for bugs, feature requests, or questions.
- Submit pull requests for improvements or fixes.
- See `CONTRIBUTING.md` for more detailed guidelines (or create one if it doesn't exist).

---

## 📄 License

VAPR is open source, released under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- [Deno](https://deno.com/)
- [MongoDB](https://www.mongodb.com/)
- [BunnyCDN](https://bunny.net/)
- [Discord](https://discord.com/)

Thanks to all contributors and the open source community!

---

## 📬 Contact

- Join our Discord: [https://discord.gg/vtsnj3zphd](https://discord.gg/vtsnj3zphd)
- For questions or support, open an issue or reach out via Discord. 