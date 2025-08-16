// src/controllers/user.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;

  // Validation: check required fields
  if (
    [fullName, username, email, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new apiError(400, "Please fill all the required fields");
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    if (existingUser.username === username) {
      throw new apiError(400, "User already exists with this username");
    }
    if (existingUser.email === email) {
      throw new apiError(400, "User already exists with this email");
    }
  }
  console.log(req.files);
  // Handle avatar and cover image
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new apiError(500, "Failed to upload avatar to Cloudinary");
  }

  // Create user in DB
  const user = await User.create({
    username,
    email,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage ? coverImage.url : "",
    password,
  });

  // Fetch newly created user without sensitive fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(
      500,
      "Failed to create user: Something went wrong while creating the user"
    );
  }

  // Send response
  return res
    .status(201)
    .json(new apiResponse(201, createdUser, "User registered successfully"));
});

export { registerUser };
