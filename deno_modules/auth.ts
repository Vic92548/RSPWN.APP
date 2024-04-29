// Environment variable-based configuration
const clientId = Deno.env.get("DISCORD_ClientID");
const clientSecret = Deno.env.get("DISCORD_ClientSecret");
const DOMAIN = Deno.env.get("DOMAIN");
const redirectUri = `https://${DOMAIN}/auth/discord/callback`;

/**
 * Generates a unique secret key using cryptographic randomness.
 * @returns {string} A unique secret key encoded in base64.
 */
function generateSecretKey(): string {
    // Define the byte length for the secret key
    const byteLength = 32;  // This length is typically sufficient for most security needs

    // Generate cryptographically secure random bytes
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);

    return btoa(String.fromCharCode(...bytes));
}


/**
 * Authenticate requests by verifying the JWT token.
 * @param {Request} request The incoming HTTP request.
 * @returns {Promise<{isValid: boolean, userData?: any}>} The authentication status and user data if valid.
 */
export async function authenticateRequest(request: Request): Promise<{isValid: boolean, userData?: any}> {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { isValid: false };
    }

    const kv = await Deno.openKv();
    const secret_key = authHeader.slice(7);  // Remove "Bearer " from the start
    const userData = await kv.get(["secret_keys", secret_key]);
    console.log(userData);

    if(userData.value){
        return { isValid: true, userData: userData ? userData.value : null };
    }else{
        return { isValid: false };
    }

    
    
}


// Function to handle the OAuth callback
export async function handleOAuthCallback(request: Request): Promise<Response> {
    const url = new URL(request.url, `https://${DOMAIN}/`);
    const code = url.searchParams.get("code");
    if (!code) return new Response("Authorization code not found", { status: 400 });

    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri
        })
    });

    if (!tokenResponse.ok) {
        return new Response("Failed to obtain access token", { status: tokenResponse.status });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user data from Discord API
    const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userResponse.ok) {
        return new Response("Failed to fetch user data", { status: userResponse.status });
    }

    const userData = await userResponse.json();


    // Optionally store user data and JWT in Deno KV
    const kv = await Deno.openKv();
    await kv.set(["discordUser", userData.id], userData);

    const secret_key = generateSecretKey();
    await kv.set(["secret_keys", secret_key], userData);

    // Read and prepare the HTML response
    const htmlTemplate = await Deno.readTextFile("discord_callback.html");
    const htmlContent = htmlTemplate
        .replace('{{jwt}}', secret_key)
        .replace('{{userData}}', JSON.stringify(userData).replace(/"/g, '\\"'));

    return new Response(htmlContent, {
        status: 200,
        headers: { "Content-Type": "text/html" }
    });
}

// Function to redirect to Discord login
export function redirectToDiscordLogin(): Response {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email%20guilds.join`;
    return Response.redirect(authUrl);
}
