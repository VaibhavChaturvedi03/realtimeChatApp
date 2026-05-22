import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

dotenv.config({path: './.env'});

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN, 
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 8080;

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8080, () => {
        console.log(`Server is running on port ${process.env.PORT || 8080}`);
    });
})
.catch((err)=>{console.log("connection failed",err)})