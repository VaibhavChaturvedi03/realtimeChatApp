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
    const existedUser = await User.findOne({email})

    if(existedUser){
        throw new ApiError(409, "User with email already exists")
    }

    // checking if avatar and cover image are uploaded or not
    const ProfilePicLocalPath = req.files?.profilePic[0]?.path

    // if profile picture is uploaded then we will upload it on cloudinary and get the url of uploaded profile picture and save that url in database, if profile picture is not uploaded then we will save empty string in database for profile picture
    const profilePic = await uploadOnCloudinary(ProfilePicLocalPath)

    // creating user in database
    const user = await User.create({
        fullName,
        email,
        password,
        profilePic: profilePic?.url 
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
    const user = await User.findOne({email})

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

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {refreshToken: undefined}
        },
        {new: true}
    )

    const options = {
        httpOnly: true, 
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out successfully")
    )

})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken // body way for mobile apps
    
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user =await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true    
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

export { signupUser, loginUser, logoutUser, refreshAccessToken }
