import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const updateProfilePic = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
    
})