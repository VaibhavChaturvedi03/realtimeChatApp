import "dotenv/config";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js"
import { Message } from "../models/message.model.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const getAllContacts = asyncHandler(async (req, res) => {

    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        return res
            .status(200)
            .json(
                new ApiResponse(200, "Contacts fetched successfully", filteredUsers)
            );

    } catch (error) {
        throw new ApiError(500, error?.message || "something went wrong while fetching contacts")
    }

})

const getAllChats = asyncHandler(async (req, res) => {

    try {
        const loggedInUserId = req.user._id;

        // find all the messages where the logged-in user is either sender or receiver
        const messages = await Message.find({
            $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
        });

        const chatPartnerIds = [
            ...new Set( // using Set to get unique user IDs
                messages.map((msg) =>  // using map to get the ID of the chat partner (the other user in the conversation)
                    msg.senderId.toString() === loggedInUserId.toString()
                        ? msg.receiverId.toString()
                        : msg.senderId.toString()
                )
            ),
        ];

        const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");

        return res.status(200).json(new ApiResponse(200, "Chats fetched successfully", chatPartners));

    } catch (error) {
        throw new ApiError(500, error?.message || "something went wrong while fetching chats")
    }

})

const getAllMessages = asyncHandler(async (req, res) => {

    try {
        const myId = req.user._id;
        const { id: userToChatId } = req.params;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        });

        return res.status(200).json(new ApiResponse(200, "Messages fetched successfully", messages));

    } catch (error) {
        throw new ApiError(500, error?.message || "something went wrong while fetching messages")
    }

})

const sendMessage = asyncHandler(async (req, res) => {

    try {
        const { text } = req.body || {};
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        if (!text && !req.file) {
            return res.status(400).json({ message: "Text or image is required." });
        }
        if (senderId.equals(receiverId)) {
            return res.status(400).json({ message: "Cannot send messages to yourself." });
        }
        const receiverExists = await User.exists({ _id: receiverId });
        if (!receiverExists) {
            return res.status(404).json({ message: "Receiver not found." });
        }

        let imageUrl;
        const sentImageLocalPath = req.file?.path;
        if (sentImageLocalPath) {
            // Upload image only when provided
            imageUrl = await uploadOnCloudinary(sentImageLocalPath);
            if (!imageUrl) {
                throw new ApiError(400, "Image upload failed")
            }
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl?.url,
        });

        await newMessage.save();

        return res.status(201).json(new ApiResponse(201, "Message sent successfully", newMessage));

    } catch (error) {
        throw new ApiError(500, error?.message || "something went wrong while sending message")
    }

})

export { getAllContacts, getAllChats, getAllMessages, sendMessage }