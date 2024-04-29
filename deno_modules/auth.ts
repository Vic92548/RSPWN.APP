// Discord OAuth settings
const clientId = "1234541478374539396"; // Replace with your Discord client ID
const clientSecret = "WbiP8yIaG-LVPaxizSGuBkL__REuQ756"; // Replace with your Discord client secret
const redirectUri = "https://vapr.deno.dev/auth/discord/callback";

// Function to handle the OAuth callback
export async function handleOAuthCallback(request: Request): Promise<Response> {
    const url = new URL(request.url, `https://vapr.deno.dev/`);
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
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!userResponse.ok) {
        return new Response("Failed to fetch user data", { status: userResponse.status });
    }

    const userData = await userResponse.json();

    // Optionally store user data in Deno KV
    const kv = await Deno.openKv();
    await kv.set(["discordUser", userData.id], userData);

    return new Response(`Hello, ${userData.username}!`, { status: 200 });
}

// Function to redirect to Discord login
export function redirectToDiscordLogin(): Response {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email%20guilds.join`;
    return Response.redirect(authUrl);
}
