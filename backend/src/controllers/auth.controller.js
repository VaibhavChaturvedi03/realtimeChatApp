import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {

    try{
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found")
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    }catch(error){
        throw new ApiError(
            500,
            error?.message || "something went wrong while generating access and refresh token"
        )
    }

}

const signupUser = asyncHandler(async (req, res) => {
    // getting details of user
    const {fullName, email, password} = req.body

    // validating if any field is empty or not
    if(
        [fullName, email, password].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }
    
    // checking if user with email already exists
    const existedUser = await User.findOne({
        $or: [{email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email already exists")
    }

    // creating user in database
    const user = await User.create({
        fullName,
        email,
        password
    })

    // checking if user is created or not
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" // adding things which we don't want to send in response
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while creating user")
    }

    // sending response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

export { signupUser }
