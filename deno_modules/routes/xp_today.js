import { authenticateRequest } from "../auth.js";
import { xpLogCollection } from "../database.js";

export async function xpTodayHandler(request) {
    const auth = await authenticateRequest(request);
    if (!auth.isValid) return new Response("Unauthorized", { status: 401 });

    const userId = auth.userData.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const logs = await xpLogCollection.aggregate([
        { $match: { userId, timestamp: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).toArray();

    const xp = logs[0]?.total || 0;

    return new Response(JSON.stringify({ xp }), {
        headers: { "Content-Type": "application/json" }
    });
}
