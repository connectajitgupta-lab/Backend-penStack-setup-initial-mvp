# Backend Setup Guide (Express + TypeScript + Prisma + PostgreSQL)

> Initial Starter setup for learners, MVP products

---

## Phase 1 — Project Initialization

```bash
npm init -y
```

`package.json` mein add karo:
```json
"type": "module"
```

---

## Phase 2 — Install Dependencies

```bash
# Core packages
npm i express bcrypt cookie-parser cors dotenv jsonwebtoken zod pg

# Prisma
npm i -D prisma
npm i @prisma/client @prisma/adapter-pg

# TypeScript
npm i -D typescript tsx

# Type definitions
npm i -D @types/bcrypt @types/cookie-parser @types/cors @types/express @types/jsonwebtoken @types/node @types/pg
```

---

## Phase 3 — Config Files

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2020",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "typeRoots": ["./src/types", "./node_modules/@types"]
  },
  "exclude": ["node_modules"],
  "include": ["src"]
}
```

### `package.json` — Scripts
```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "db:migrate": "npx prisma migrate dev --name init",
  "db:generate": "npx prisma generate"
}
```

---

## Phase 4 — Environment Setup

### `.env`
```env
NODE_ENVIRONMENT=development
PORT=8080
DATABASE_URL=postgresql://username:pass@localhost:5432/database-name
CORS_ORIGINS="http://localhost:5173"
JWT_ACCESS_TOKEN_SECRET= jwtaccesstokensecret
JWT_REFRESH_TOKEN_SECRET= jwtrefreshtokensecret
ACCESS_TOKEN_EXPIRY="30d"
REFRESH_TOKEN_EXPIRY="60d"
```

### `.example.env`
Same as `.env` — values blank rakho (teammates ke liye reference)

---

## Phase 5 — Prisma Setup

```bash
npx prisma
npx prisma init
```

### `prisma.config.ts`
```typescript
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

### `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// --- Yahan apna data schema banao --- example:

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         UserRole @default(OWNER)
  organizations Organization[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum UserRole {
  OWNER
  ADMIN
  STAFF
}
```

> ⚠️ Schema update karne ke baad hamesha ye dono commands sequence mein chalao:
> ```bash
> npm run db:migrate
> npm run db:generate
> ```

---

## Phase 6 — Folder Structure

```
src/
 ├── index.ts
 ├── app.ts
 ├── lib/
 │    └── prisma.ts
 ├── middlewares/
 │    ├── auth.middleware.ts
 │    ├── error.middleware.ts
 │    └── morgan.middleware.ts
 ├── modules/
 │    └── user/
 │         ├── user.schema.ts
 │         ├── user.service.ts
 │         ├── user.controller.ts
 │         └── user.route.ts
 ├── types/
 │    └── index.ts
 ├── utils/
 │    ├── logger.ts
 │    ├── api.ts
 │    ├── catch.ts
 │    ├── jwt.ts
 │    └── hash.ts
 └── validations/
```

---

## Phase 7 — Core Files

### `src/lib/prisma.ts`
```typescript
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
```

### `src/app.ts`
```typescript
import express,{Request, Response} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";
import morganMiddleware from "./middlewares/morgan.middleware.js"; // ✅ add
import logger from "./utils/logger.js"; // ✅ add

const app = express();

app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cors({
    origin:process.env.CORS_ORIGINS,
    credentials:true,
}))
app.use(cookieParser())
app.use(morganMiddleware);

// health-check
app.get("/health-check",(req:Request, res:Response)=>{
    logger.info("Health check called");
    return res.status(200).json({
        success:true,
        message:"health is fine",
    })
})

//  from here write api router
// import UserRouter from "./modules/user/user.route.js";
// import CrudRouter from "./modules/crud/crud.route.js";

// app.use("/api/v1/auth", UserRouter)
// app.use("/api/v1/crud", CrudRouter)

app.use(errorHandler)
export default app
```

### `src/index.ts`
```typescript
import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // ⚠️ Sabse pehle — kisi bhi import se pehle

import app from "./app.js";
import { prisma } from "./lib/prisma.js";
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
```

---

## Phase 8 — Logging Setup

```bash
npm install winston morgan winston-daily-rotate-file
npm install -D @types/morgan
```

### `src/utils/logger.ts`
```typescript
copy from file
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, json, colorize, simple } = winston.format;

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "debug",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), json()),
  transports: [
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxFiles: "30d",
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      zippedArchive: true,
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), simple()),
    })
  );
}

export default logger;
```

### `src/middlewares/morgan.middleware.ts`
```typescript
copy from file
import morgan, { StreamOptions } from "morgan";
import logger from "../utils/logger.js";

const stream: StreamOptions = {
  write: (message) => logger.http(message.trim()),
};

const morganMiddleware = morgan(
  process.env.NODE_ENV === "production"
    ? ":remote-addr :method :url :status :res[content-length] - :response-time ms"
    : "dev",
  { stream }
);

export default morganMiddleware;
```

### `src/middlewares/error.middleware.ts`
```typescript
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import logger from "../utils/logger.js";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.code === "P2002") {
    statusCode = 400;
    message = "Duplicate field value";
  }

  if (err instanceof ZodError) {
    statusCode = 400;
    message = err.issues.map((e) => e.message).join(", ");
  }

  logger.error({
    statusCode,
    message,
    method: req.method,
    url: req.url,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
  });

  res.status(statusCode).json({ success: false, message });
};
```

---

## Phase 9 — Git Setup

### `.gitignore`
```
node_modules/
dist/
logs/
.env
/src/generated/prisma
```

### SSH Setup (one time)
```bash
# 1. Key banao
ssh-keygen -t ed25519 -C "tumhari@email.com"

# 2. Copy karo
cat ~/.ssh/id_ed25519.pub

# 3. GitHub → Settings → SSH Keys → New → Paste

# 4. Remote URL set karo
git remote set-url origin git@github.com:username/repo-name.git

# 5. Test karo
ssh -T git@github.com

# 6. Push karo
git push -u origin main
```

---

## Phase 10 — Start Karo

```bash
npm run dev
```

Terminal mein ye dikhega:
```
info: Database connected successfully
info: Server running on port 4001
```

Health check karo:
```
GET http://localhost:4001/health-check
```

---

## Quick Reference

| Command | Kaam |
|---|---|
| `npm run dev` | Development server start |
| `npm run build` | TypeScript compile |
| `npm run start` | Production server start |
| `npm run db:migrate` | Schema changes apply karo |
| `npm run db:generate` | Prisma client regenerate karo |

| Logger | Kab use karo |
|---|---|
| `logger.info` | Server start, DB connect |
| `logger.warn` | Rate limit, warnings |
| `logger.error` | Failures — auto error middleware mein |
| `logger.debug` | Development debugging |
