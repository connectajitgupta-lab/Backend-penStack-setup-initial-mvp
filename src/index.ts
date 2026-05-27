import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
})
import app from "./app.js";
import { prisma } from "./lib/prisma.js"; // ✅ sahi path
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 4001;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully");

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Database connection failed: ${error}`);
    process.exit(1);
  }
};

startServer();