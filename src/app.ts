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