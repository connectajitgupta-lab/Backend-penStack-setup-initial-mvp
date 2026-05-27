import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, json, colorize, simple } = winston.format;

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "debug",

  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    json() // production mein JSON format best hai (parsing easy hoti hai)
  ),

  transports: [
    // Error logs alag file mein
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxFiles: "30d", // 30 din baad auto delete
      zippedArchive: true, // compress old logs
    }),

    // Saare logs combined file mein
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      zippedArchive: true,
    }),
  ],
});

// Development mein console pe bhi dikhao
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), simple()),
    })
  );
}

export default logger;