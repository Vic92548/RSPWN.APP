# VAPR

**The Gamer's Social Network** - Share your content, grow your audience, and vibe with an amazing community.

[![Discord](https://img.shields.io/discord/1226141081964515449?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/vtsnj3zphd)
[![Live Demo](https://img.shields.io/badge/demo-vapr.club-brightgreen)](https://vapr.club)
[![Users](https://img.shields.io/badge/dynamic/json?color=4ecdc4&label=Users&query=$.count&url=https%3A%2F%2Fvapr.club%2Fapi%2Fuser-count)](https://vapr.club)
[![Powered by BunnyCDN](https://img.shields.io/badge/Powered%20by-BunnyCDN-orange)](https://bunny.net?ref=fy57v3kedf)

---

## ✨ What is VAPR?

VAPR is a fun, gamified platform where creators share content through a swipe-based interface (like Tinder, but for content!). Level up, unlock backgrounds, and track your growth with detailed analytics.

### Key Features
- 🎮 **Swipe to Discover** - Like, pass, or skip content
- 📊 **Creator Analytics** - Track views, engagement, and growth
- 🎯 **Level System** - Earn XP and unlock rewards
- 🔔 **Follow & Notifications** - Never miss content from your favorites
- 🎨 **Customizable Profiles** - Unlock exclusive backgrounds
- 🔗 **Discord Login** - One-click authentication

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB database
- Discord app (for login)
- [BunnyCDN](https://bunny.net?ref=fy57v3kedf) account (for media storage)

### Setup

1. **Clone & Install**
```bash
git clone https://github.com/Vic92548/VAPR.git
cd VAPR
npm install
```

2. **Configure Environment**
   Create a `.env` file with these essentials:
```env
# Server
PORT=8080
BASE_URL=http://localhost:8080

# Database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database

# Discord OAuth
DISCORD_ClientID=your_discord_client_id
DISCORD_ClientSecret=your_discord_client_secret

# BunnyCDN
BUNNY_CDN_ACCESSKEY=your_bunnycdn_key
BUNNY_CDN_STORAGE_URL=https://storage.bunnycdn.com/your-zone/
BUNNY_CDN_HOSTNAME=your-zone.b-cdn.net
BUNNY_CDN_LIBRARY_ID=your_video_library_id
BUNNY_CDN_VIDEO_API_KEY=your_video_api_key
```

3. **Build & Run**
```bash
node build.js
npm start
```

Visit http://localhost:8080 and start vibing! 🎉

---

## 💡 How It Works

### For Users
1. **Login with Discord** - No passwords needed
2. **Swipe through content** - Right = Like, Left = Pass, Up = Skip
3. **React with emojis** - Show creators how you feel
4. **Level up** - Every action earns XP
5. **Unlock backgrounds** - Customize your profile as you grow

### For Creators
1. **Post content** - Images or videos up to 50MB
2. **Add links** - Promote your projects
3. **Track performance** - Real-time analytics
4. **Grow followers** - Build your community
5. **Get notifications** - Know when people engage

---

## 🛠️ Tech Stack

- **Backend:** Node.js + Express + MongoDB
- **Frontend:** Vanilla JS with glass morphism UI
- **Auth:** Discord OAuth
- **Storage:** [BunnyCDN](https://bunny.net?ref=fy57v3kedf)
- **Analytics:** Chart.js

---

## 🤝 Contributing

We'd love your help! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Join our [Discord](https://discord.gg/vtsnj3zphd)

---

## 📄 License

Open source under the [VAPR License](LICENSE.md)

---

<p align="center">
  <b>Join the community:</b><br>
  <a href="https://vapr.club">vapr.club</a> • 
  <a href="https://discord.gg/vtsnj3zphd">Discord</a> • 
  <a href="https://github.com/Vic92548/VAPR">GitHub</a>
</p>