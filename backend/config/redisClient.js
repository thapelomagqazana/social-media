import Redis from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on("connect", () => console.log("✅ Connected to Redis"));
redisClient.on("error", (err) => console.error("❌ Redis Error", err));

// Auto-close Redis when Jest exits
if (process.env.NODE_ENV === "test") {
  afterAll(async () => {
    await redisClient.quit();
  });
}

export default redisClient;
