// imports from auth.js which you might already have in your project
import { authenticateRequest } from "../deno_modules/auth.js";

/**
 * This middleware function authenticates each request using a common function
 * authenticateRequest. It throws an error if the authentication fails, which should
 * be handled by the calling function.
 *
 * @param {Request} request - The incoming request object.
 * @returns {Promise<any>} - The authentication result if successful.
 * @throws {Object} - Throws an error object with status and message if authentication fails.
 */
async function authenticateMiddleware(request) {
    const authResult = await authenticateRequest(request);
    if (!authResult.isValid) {
        // Throwing an object to be caught by the error handling in the route handling.
        throw { status: 401, message: "Unauthorized" };
    }
    // Adding the authentication result to the request object for further use in the request handling pipeline.
    request.authResult = authResult;
    return request;  // Return the modified request with the auth result attached.
}

export { authenticateMiddleware };
