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

app.use(express.json({limit: "5mb"})) // we are increasing the limit of request body to 5mb because we will be sending profile picture in request body when user updates profile picture, and profile picture can be large in size, so we need to increase the limit of request body to 5mb to avoid error of request body too large
app.use(express.urlencoded({extended: true, limit: "5mb"})) // we are increasing the limit of request body to 5mb because we will be sending profile picture in request body when user updates profile picture, and profile picture can be large in size, so we need to increase the limit of request body to 5mb to avoid error of request body too large
app.use(express.static("public")) // to serve static files like profile pictures, we will save profile pictures in public folder and when we want to access profile picture we can access it using url like http://localhost:8080/profilePics/filename.jpg, here profilePics is a folder inside public folder where we will save profile pictures of users
app.use(cookieParser()) // we will be sending access token in cookie, so we need to use cookie parser middleware to parse the cookies from the request, after using this middleware we can access cookies using req.cookies

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