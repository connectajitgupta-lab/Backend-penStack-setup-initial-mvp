import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import logger from "../utils/logger.js" // ✅ add karo

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// ✅ Pool connection check
pool.on("connect", () => {
  logger.info("Database connected successfully")
})

pool.on("error", (err) => {
  logger.error(`Database connection error: ${err.message}`)
  process.exit(1)
})

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV !== "production"
    ? [{ emit: "event", level: "query" }]  // development mein query log
    : [],
})

// ✅ Sirf development mein query log dikhao
if (process.env.NODE_ENV !== "production") {
  prisma.$on("query", (e) => {
    logger.debug(`Query: ${e.query} | Duration: ${e.duration}ms`)
  })
}

export default prisma