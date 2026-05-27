import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import logger from "../utils/logger.js"; // ✅ add karo

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Prisma duplicate error
  if (err.code === "P2002") {
    statusCode = 400;
    message = "Duplicate field value";
  }

  // Zod validation error
  if (err instanceof ZodError) {
    statusCode = 400;
    message = err.issues.map((e) => e.message).join(", ");
  }

  // ✅ Logger add karo yahan
  logger.error({
    statusCode,
    message,
    method: req.method,
    url: req.url,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    message,
  });
};