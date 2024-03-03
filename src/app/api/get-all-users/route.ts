import redisClient from "@/app/lib/redisclient";
import redis from "redis";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let users = await redisClient.hGetAll("online");

  return Response.json(users);
}
