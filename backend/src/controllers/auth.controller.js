import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
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
    const existedUser = await User.findOne({email:email.toLowerCase()})

    if(existedUser){
        throw new ApiError(409, "User with email already exists")
    }

    // checking if avatar and cover image are uploaded or not
    const ProfilePicLocalPath = req.files?.ProfilePic[0]?.path

    // if profile picture is uploaded then we will upload it on cloudinary and get the url of uploaded profile picture and save that url in database, if profile picture is not uploaded then we will save empty string in database for profile picture
    const profilePic = await uploadOnCloudinary(ProfilePicLocalPath)

    // creating user in database
    const user = await User.create({
        fullName,
        email,
        password,
        profilePic: profilePic?.url || ""
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

const loginUser = asyncHandler(async (req, res) => {
    // getting details of user
    const {email, password, fullName} = req.body

    if (!email) {
        throw new ApiError(400, "email is required")
    }

    // finding user in database
    const user = await User.findOne({email:email.toLowerCase()})

    if (!user) {
        throw new ApiError(404, "User doesn't exist")
    } 

    // validating password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    // getting access token and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    //sending cookies
    const options = {
        httpOnly: true, // can only be modified by server not by frontend
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )

})

export { signupUser }
