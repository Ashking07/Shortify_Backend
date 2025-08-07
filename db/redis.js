import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

export const client = createClient({
  username: "default",
  password: process.env.REDIS_PASS,
  socket: {
    host: "redis-12835.c240.us-east-1-3.ec2.redns.redis-cloud.com",
    port: 12835,
  },
});

client.on("error", (err) => console.log("Redis Client Error", err));
