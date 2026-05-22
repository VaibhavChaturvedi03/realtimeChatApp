import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const getUserDetails = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User details fetched successfully")
    )

})

const updateAccountDetails = asyncHandler(async (req, res) => {

    const {fullName, email} = req.body

    if (!fullName && !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { // it is used to update the specific fields in document without replacing the whole document
                fullName,
                email
            }
        },
        {new: true} // return the updated document
    ).select("-password") // we don't want to send password in response

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account details updated successfully")
    )

})

const updateProfilePic = asyncHandler(async (req, res) => {

    // getting user details from the token
    const user = await User.findById(req.user._id)
    
    // if user is not found then throw an error
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // if user is found then upload the profile picture to cloudinary
    const profilePicLocalPath = req.file?.path
    
    if (!profilePicLocalPath) {
        throw new ApiError(400, "Profile picture is required")
    }

    // uploading them on cloudinary
    const profilePic = await uploadOnCloudinary(profilePicLocalPath)

    if (!profilePic) {
        throw new ApiError(400, "Profile picture is required")
    }

    // updating the user's profile picture
    user.profilePic = profilePic.url
    await user.save()

    return res.status(200).json(
        new ApiResponse(200, user, "Profile picture updated successfully")
    )

})

const changePassword = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const {oldPassword, newPassword} = req.body

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Old password is incorrect")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password changed successfully")
    )

})

export { getUserDetails, updateAccountDetails, updateProfilePic, changePassword }