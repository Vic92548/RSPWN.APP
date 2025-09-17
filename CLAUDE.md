# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VAPR is a gamified social platform where creators share content through a swipe-based interface (Tinder for content). The platform includes user authentication via Discord, content posting with reactions, an XP/leveling system, and multiple specialized dashboards.

## Common Commands

### Development
- `npm start` - Run the production server
- `npm run dev` - Run development server with nodemon
- `npm run build` - Alias for `node build.js`
- `node build.js` - Build main app (processes HTML templates, compiles Sass, minifies JS/CSS)
- `node build-all.js` - Build main app + all dashboards
- `node build-all.js --only-dashboards` - Build only dashboards
- `node build-all.js --skip-dashboards` - Build only main app
- `node build-all.js partners store` - Build main app + specific dashboards
- `node build-all.js --help` - Show detailed build options

### Scripts
- `npm run add-game` / `node scripts/add-game.js` - Add new games to the platform
- `npm run manage-games` / `node scripts/manage-games.js` - Manage existing games
- `npm run creator-admin` / `node creator-admin.js` - Creator administration tools

## Architecture

### Core Structure
- **Frontend**: Vanilla JS with custom template engine, Sass styling, glass morphism UI
- **Backend**: Express.js server with modular design
- **Database**: MongoDB for data persistence, better-sqlite3 for local caching
- **Authentication**: Discord OAuth integration
- **Media Storage**: BunnyCDN for images/videos
- **Build System**: Custom build process that compiles templates, Sass, and minifies assets

### Key Directories
- `src/` - Frontend source code
  - `src/components/` - HTML templates with custom `[[template]]` inclusion syntax
  - `src/js/` - JavaScript modules (prefixed with `$` for core utilities)
  - `src/scss/` - Sass stylesheets with component-based architecture
- `server_modules/` - Backend modules organized by feature
- `dashboards/` - Separate React/Vite applications for different user dashboards
- `public/` - Generated build output

### Template System
The project uses a custom template engine where `[[filename]]` includes content from `src/components/`. The build process processes these includes and generates the final HTML.

### Dashboard Architecture
Multiple independent React dashboards built with Vite:
- `partners` - Game developer tools
- `store` - Game marketplace
- `creators` - Content creator analytics
- `downloads` - Download management
- `terms` - Legal pages
- `privacy` - Privacy policy

Each dashboard has its own package.json and builds to `public/{dashboard-name}/`.

### Server Module Organization
- `auth.js` - Discord OAuth and user authentication
- `post.js` - Content posting, likes, reactions, following
- `posts/` - Detailed post-related functionality (feed, interactions, video)
- `rpg.js` - XP system and gamification
- `games.js` - Game management and integration
- `routes/` - API endpoint handlers
- `security.js` - Rate limiting, CORS, security middleware

### Environment Configuration
Required environment variables (see README.md for full list):
- `DATABASE_URL` - MongoDB connection string
- `DISCORD_ClientID` / `DISCORD_ClientSecret` - Discord OAuth
- `BUNNY_CDN_*` - BunnyCDN configuration for media storage
- `BASE_URL` - Application base URL

### Build Process
1. HTML templates are processed with `[[include]]` syntax
2. Sass files compiled and minified
3. JavaScript files combined and minified
4. Dashboard frontends built separately with Vite
5. All output goes to `public/` directory

### API Structure
REST API with endpoints organized by feature:
- `/api/auth/*` - Authentication
- `/api/posts/*` - Post management
- `/api/users/*` - User profiles
- `/api/games/*` - Game-related features
- `/api/analytics/*` - Analytics data

The server uses middleware for authentication, rate limiting, and request rendering.

## Important Development Notes

### CSS/SCSS Best Practices
- **Always check existing CSS rules when modifying collapsed/hidden states**: The menu system has specific rules for collapsed states that may hide elements with broad selectors (e.g., `div { display: none }`). Always inspect the full CSS context before adding new elements.
- **Use specific selectors to avoid conflicts**: When adding new elements that should remain visible in collapsed states, use `:not()` selectors or more specific class targeting to override broad hiding rules.
- **Test responsive and interactive states**: Always test collapsed menus, mobile views, and interactive states after making changes to ensure new elements don't get unintentionally hidden.

### Template Engine Considerations
- The `[[template]]` inclusion system processes templates at build time, so changes require running `node build.js`
- Template includes are resolved recursively, allowing nested template inclusions
- Templates process `[[filename]]` syntax where filename refers to files in `src/components/`
- Build system automatically handles minification of HTML, CSS, and JavaScript

### Request Flow Architecture
The server uses a sophisticated routing and middleware system:
1. **Security Middleware**: Helmet, CORS, rate limiting applied first
2. **Authentication Middleware**: JWT-based auth with Discord OAuth
3. **Route Handlers**: Organized by feature (posts, games, creators, auth)
4. **Database Layer**: MongoDB for persistence, better-sqlite3 for caching
5. **CDN Integration**: BunnyCDN for media storage and delivery

### Dashboard Build System
Each dashboard in `dashboards/` is an independent React + Vite application:
- Individual package.json with own dependencies
- Builds to `public/{dashboard-name}/` for production serving
- Supports both individual builds (`npm run build:partners`) and batch builds
- Each dashboard can be built independently or as part of the full build process

### API Endpoint Organization
- `/api/auth/*` - Authentication and user management
- `/api/posts/*` - Content creation, interaction, and management
- `/api/games/*` - Game library, keys, downloads, updates
- `/api/creators/*` - Creator program, analytics, monetization
- `/api/buckets/*` - Content curation and organization
- `/api/analytics/*` - Performance metrics and insights

### JavaScript Module Structure
Frontend JavaScript follows a specific naming convention:
- Files prefixed with `$` are core utilities (e.g., `$router.js`, `$dom.js`)
- Modules are organized by feature (games/, downloads/, utils/)
- Global initialization handled by `$init.js`
- Template engine integration via `$_vapr-template-engine.js`