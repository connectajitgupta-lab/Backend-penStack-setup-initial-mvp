import morgan, { StreamOptions } from "morgan";
import logger from "../utils/logger.js";

// Morgan ka output Winston mein bhejo
const stream: StreamOptions = {
  write: (message) => logger.http(message.trim()),
};

// Production mein sensitive info hide karo
const skip = () => {
  const env = process.env.NODE_ENV || "development";
  return env === "production" ? false : false; // dono env mein log karo
};

const morganMiddleware = morgan(
  // Production: short format (IP, method, URL, status, time)
  process.env.NODE_ENV === "production"
    ? ":remote-addr :method :url :status :res[content-length] - :response-time ms"
    : "dev", // Development: colorful short format
  { stream, skip }
);

export default morganMiddleware;