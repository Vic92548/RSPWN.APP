# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VAPR is a gamified social platform where creators share content through a swipe-based interface (Tinder for content). The platform includes user authentication via Discord, content posting with reactions, and an XP/leveling system.

## Common Commands

### Development
- `npm start` - Run the production server
- `npm run dev` - Run development server with nodemon
- `npm run build` - Alias for `node build.js`
- `node build.js` - Build main app (processes HTML templates, compiles Sass, minifies JS/CSS)
- `node build-all.js` - Legacy build script (equivalent to `node build.js` now that dashboards are removed)


### Scripts
- `npm run add-game` / `node scripts/add-game.js` - Add new games to the platform
- `npm run manage-games` / `node scripts/manage-games.js` - Manage existing games
- `npm run creator-admin` / `node creator-admin.js` - Creator administration tools

## Architecture

### Core Structure
- **Frontend**: Vanilla JS with custom template engine, Sass styling, glass morphism UI
- **Backend**: Express.js server with modular design
- **Database**: MongoDB for data persistence
- **Authentication**: Discord OAuth integration
- **Media Storage**: BunnyCDN for images/videos
- **Build System**: Custom build process that compiles templates, Sass, and minifies assets

### Key Directories
- `src/` - Frontend source code
  - `src/components/` - HTML templates with custom `[[template]]` inclusion syntax
  - `src/js/` - JavaScript modules (prefixed with `$` for core utilities)
  - `src/scss/` - Sass stylesheets with component-based architecture
- `server_modules/` - Backend modules organized by feature
- `public/` - Generated build output

### Template System
The project uses a custom template engine where `[[filename]]` includes content from `src/components/`. The build process processes these includes and generates the final HTML.


### Server Module Organization
Key modules in `server_modules/`:
- `auth.js` - Discord OAuth and user authentication
- `post.js` - Content posting, likes, reactions, following
- `posts/` - Detailed post-related functionality (feed, interactions, video, reactions, create)
- `rpg.js` - XP system and gamification
- `games.js` - Game management and integration
- `routes/` - API endpoint handlers (analytics, xp_today)
- `security.js` - Rate limiting, CORS, security middleware
- `database.js` - MongoDB connection and operations
- `unified_router.js` - Centralized routing system
- `template_engine.js` - Server-side template processing
- `creators.js` - Creator program functionality
- `buckets.js` - Content organization features

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
4. All output goes to `public/` directory

### API Structure
REST API with endpoints organized by feature:
- `/api/auth/*` - Authentication
- `/api/posts/*` - Post management
- `/api/users/*` - User profiles
- `/api/games/*` - Game-related features
- `/api/analytics/*` - Analytics data

The server uses middleware for authentication, rate limiting, and request rendering.

## Important Development Notes

### Code Style Requirements
- **NEVER ADD COMMENTS TO CODE**: Do not add any comments to JavaScript, CSS, SCSS, HTML, or any other code files. Write clean, self-documenting code without explanatory comments.
- **NEVER RUN THE SERVER**: Do not use commands like `npm start`, `npm run dev`, or any server startup commands. Only use build commands when necessary.

### CSS/SCSS Best Practices
- **ALWAYS USE VARIABLE COLORS FROM `src/scss/_variables.scss`**: Never hardcode colors like #000000, #FFFFFF, #1A1A1A, etc. Always use the predefined variables ($bg-primary, $bg-secondary, $text-primary, $border-primary, etc.) from the variables file to maintain consistency and make theme changes easier. The variables file contains the complete color system following RSPWN brand guidelines.
- **Always check existing CSS rules when modifying collapsed/hidden states**: The menu system has specific rules for collapsed states that may hide elements with broad selectors (e.g., `div { display: none }`). Always inspect the full CSS context before adding new elements.
- **Use specific selectors to avoid conflicts**: When adding new elements that should remain visible in collapsed states, use `:not()` selectors or more specific class targeting to override broad hiding rules.
- **Test responsive and interactive states**: Always test collapsed menus, mobile views, and interactive states after making changes to ensure new elements don't get unintentionally hidden.
- **ALWAYS run `node build.js` after SCSS changes**: After making any changes to SCSS files, ALWAYS run `node build.js` to verify that everything compiles successfully and there are no syntax errors or undefined variables/mixins.
- **ALWAYS FIX SASS WARNINGS**: If any Sass deprecation warnings appear during compilation, fix them immediately. Wrap CSS declarations in `& {}` blocks when they appear after nested rules like `@media` queries to resolve mixed-decls warnings.

### Template Engine Considerations
- The `[[template]]` inclusion system processes templates at build time, so changes require running `node build.js`
- Template includes are resolved recursively, allowing nested template inclusions
- Templates process `[[filename]]` syntax where filename refers to files in `src/components/`
- Build system automatically handles minification of HTML, CSS, and JavaScript

### Request Flow Architecture
The server uses a sophisticated routing and middleware system:
1. **Security Middleware**: Helmet, CORS, rate limiting applied first
2. **Authentication Middleware**: JWT-based auth with Discord OAuth
3. **Route Handlers**: Organized by feature in server_modules/ (posts, games, creators, auth)
4. **Database Layer**: MongoDB for persistence (see server_modules/database.js)
5. **CDN Integration**: BunnyCDN for media storage and delivery
6. **Unified Routing**: Uses server_modules/unified_router.js for centralized route management


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

## RSPWN BRAND GUIDELINES FOR AI AGENTS

### BRAND IDENTITY
- **Name**: RSPWN (always uppercase, represents infinite innovation/respawn)
- **Mission**: Open-source gaming and AI platforms, community-driven innovation
- **Values**: Forward-thinking, collaborative, bold, open-source, flexible

### DESIGN INSPIRATION & AESTHETIC
- **Reference Standards**: Epic Games, Riot Games, Steam, Discord, Unity, Vercel, Linear
- **Visual Direction**: Clean, modern, minimalist gaming aesthetic with enterprise-level polish
- **Design Philosophy**: Flat design with perfect typography and spacing, inspired by Epic's clean UI
- **Target Aesthetic**: Professional gaming platforms that prioritize clarity and usability

### LOGO & TYPOGRAPHY
- **Primary Logo**: "RSPWN" in Audiowide font, uppercase, tight letter-spacing
- **Logo Usage**: Use Audiowide ONLY for brand name and major headings
- **Body Text**: Inter font family for all other content
- **Minimum logo size**: 16px height
- **Never distort, add effects, or modify logo proportions**

### COLOR SYSTEM
**Foundation:**
- Brand Black: #000000 (backgrounds, depth)
- Brand White: #FFFFFF (text, highlights)

**Innovation Colors:**
- Primary Blue: #4A9EFF (innovation, trust, primary actions)
- Secondary Purple: #8B5CF6 (creativity, premium features)

**Text System:**
- Primary Text: #FFFFFF (headlines, key content)
- Secondary Text: #CCCCCC (body text, descriptions)
- Muted Text: #888888 (labels, captions)

**Gray Scale:**
- Dark: #0A0A0A
- Gray: #1A1A1A
- Gray Light: #2A2A2A

### DESIGN PRINCIPLES
- **Flat & Clean**: No gradients, shadows only for depth hierarchy (like Epic Games Store)
- **Sharp Edges**: Clean rectangular shapes with consistent border radius (4-8px)
- **Solid Colors**: Flat color blocks, no gradients or unnecessary effects
- **Typography First**: Clear hierarchy through size and weight, not effects
- **Generous Spacing**: Wide margins and padding for breathing room
- **Grid-Based**: Strict alignment and consistent spacing units (8px base)
- **Monochromatic Focus**: Primarily black/white/gray with strategic color accents

### UI/UX STANDARDS
**Component Design:**
- **Cards**: Flat backgrounds with subtle borders, clean hover states
- **Buttons**: Solid colors, clean edges, simple state changes (no gradients)
- **Navigation**: Minimal with clear active states, inspired by Epic Games launcher
- **Forms**: Clean inputs with simple borders and clear focus states
- **Icons**: Consistent stroke width, geometric, minimal

**Visual Effects:**
- Minimal shadows (only for elevation: 0-2px)
- Quick transitions (150-200ms)
- Simple hover states (color change or opacity)
- Clean focus states with solid borders
- No gradients, glows, or decorative effects

### DO'S:
- Create ultra-clean, flat interfaces like Epic Games Store
- Use solid colors and clear typography hierarchy
- Implement subtle, functional micro-interactions
- Reference Epic Games' minimalist approach to UI
- Maintain consistent spacing using 8px grid system
- Use Audiowide only for brand name and major headings
- Keep designs accessible with high contrast
- Focus on content over decoration

### DON'TS:
- Never use gradients, glows, or decorative effects
- Never add unnecessary visual complexity
- Never use drop shadows except for functional depth
- Never compromise clarity for visual effects
- Never stretch, skew, or distort logo
- Never use Audiowide for body text
- Never place logo on busy/low-contrast backgrounds
- Never use colors outside established palette