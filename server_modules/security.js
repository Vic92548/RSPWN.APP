import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';

export function setupSecurityMiddleware(app) {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://fonts.googleapis.com",
                    "https://ka-f.fontawesome.com",
                    "https://kit.fontawesome.com"
                ],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://kit.fontawesome.com",
                    "https://ka-f.fontawesome.com",
                    "https://cdn.jsdelivr.net",
                    "https://cloud.umami.is",
                    "https://eu-assets.i.posthog.com",
                    "https://eu.i.posthog.com"
                ],
                imgSrc: [
                    "'self'",
                    "data:",
                    "https:",
                    "blob:",
                    "https://cdn.discordapp.com",
                    "https://vapr-club.b-cdn.net",
                    "https://vz-3641e40e-815.b-cdn.net"
                ],
                connectSrc: [
                    "'self'",
                    "https://api.github.com",
                    "https://ka-f.fontawesome.com",
                    "https://kit.fontawesome.com",
                    "https://cloud.umami.is",
                    "https://eu.i.posthog.com",
                    "https://api-gateway.umami.dev",
                    "https://discord.com",
                    "https://headless.tebex.io"
                ],
                scriptSrcAttr: ["'unsafe-inline'"],
                fontSrc: [
                    "'self'",
                    "https://fonts.gstatic.com",
                    "https://kit.fontawesome.com",
                    "https://ka-f.fontawesome.com"
                ],
                frameSrc: [
                    "'self'",
                    "https://iframe.mediadelivery.net"
                ],
                mediaSrc: [
                    "'self'",
                    "https://iframe.mediadelivery.net",
                    "https://vz-3641e40e-815.b-cdn.net"
                ],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
            }
        },
        crossOriginEmbedderPolicy: false
    }));
}

export const rateLimiters = {
    general: rateLimit({
        windowMs: config.rateLimit.general.windowMs,
        max: config.rateLimit.general.max,
        message: config.rateLimit.general.message,
        standardHeaders: true,
        legacyHeaders: false,
    }),

    auth: rateLimit({
        windowMs: config.rateLimit.auth.windowMs,
        max: config.rateLimit.auth.max,
        message: config.rateLimit.auth.message,
        standardHeaders: true,
        legacyHeaders: false,
    }),

    createPost: rateLimit({
        windowMs: config.rateLimit.createPost.windowMs,
        max: config.rateLimit.createPost.max,
        message: config.rateLimit.createPost.message,
        standardHeaders: true,
        legacyHeaders: false,
    })
};

export const corsOptions = {
    origin: config.cors.allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200
};