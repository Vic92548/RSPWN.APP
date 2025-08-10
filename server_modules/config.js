export const config = {
    server: {
        port: process.env.PORT || 8080,
        baseUrl: process.env.BASE_URL || 'http://localhost:8080',
        trustProxy: true
    },

    limits: {
        json: '10mb',
        urlencoded: '10mb',
        fileSize: 50 * 1024 * 1024,
        maxFiles: 1
    },

    rateLimit: {
        general: {
            windowMs: 15 * 60 * 1000,
            max: 250,
            message: 'Too many requests from this IP, please try again later.'
        },
        auth: {
            windowMs: 15 * 60 * 1000,
            max: 20,
            message: 'Too many authentication attempts, please try again later.'
        },
        createPost: {
            windowMs: 60 * 60 * 1000,
            max: 10,
            message: 'Post creation limit reached. Please wait before creating more posts.'
        }
    },

    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:8080']
    },

    media: {
        allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
        allowedImageExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        allowedVideoExtensions: ['mp4', 'webm', 'ogg', 'mov']
    },

    templates: {
        baseDir: './src/components/',
        enableCache: true,
        includePattern: /\[\[(.+?)\]\]/g,
        variablePattern: /\{\{(.+?)\}\}/g
    },

    static: {
        maxAge: 0,
        cacheControl: 'no-store, no-cache, must-revalidate, proxy-revalidate',
        pragma: 'no-cache',
        expires: '0',
        surrogateControl: 'no-store'
    },

    reactions: {
        allowedEmojis: ['💩', '👀', '😂', '💯']
    },

    validation: {
        postId: /^[a-f0-9-]{36}$/,
        username: /^[a-zA-Z0-9_-]+$/,
        backgroundId: /^[a-zA-Z0-9_-]+$/
    },

    meta: {
        default: {
            description: "Self promote your awesomeness",
            author: "VAPR",
            image: "https://vapr-club.b-cdn.net/posts/3bad19ce-9f1b-4abd-a718-3d701c3ca09a.png",
            url: "https://vapr.club/",
            defaultAvatar: "https://vapr-club.b-cdn.net/default_vapr_avatar.png"
        }
    },

    messages: {
        errors: {
            invalidPostId: 'Invalid post ID format',
            invalidUsername: 'Invalid username format',
            invalidBackgroundId: 'Invalid backgroundId parameter',
            invalidPostIdParam: 'Invalid postId parameter',
            invalidAction: 'Invalid action specified',
            invalidEmoji: 'Invalid emoji parameter',
            userNotFound: 'User not found',
            postNotFound: 'Post not found',
            keyRequired: 'Key is required',
            noFileUploaded: 'No file uploaded',
            invalidFileType: 'Invalid file type',
            onlyZipAllowed: 'Only ZIP files are allowed for game updates',
            ambassadorRequired: 'Ambassador user ID is required',
            internalError: 'Internal server error',
            somethingWrong: 'Something went wrong!',
            unauthorized: 'Unauthorized'
        },
        success: {
            backgroundUpdated: 'Background updated successfully',
            invitationAccepted: 'Invitation accepted successfully',
            logoutSuccess: { success: true }
        }
    },

    cookies: {
        jwt: {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 604800,
            path: '/'
        },
        oauthState: {
            httpOnly: true,
            secure: true,
            sameSite: 'Lax',
            maxAge: 600
        }
    }
};