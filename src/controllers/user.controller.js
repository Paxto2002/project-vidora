// src/controllers/user.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const generateAccessTokenAndRefreshToken = async (user) => {
  try {
    const user = await User.findById(userId);
    const AccessToken = user.generateAccessToken();
    const RefreshToken = user.generateRefreshToken();

    user.RefreshToken = RefreshToken;
    await user.save({ validateBeforeSave: false });

    return { AccessToken, RefreshToken };
  } catch (error) {
    throw new apiError(500, "Failed to generate Access and Refresh tokens");
  }
};

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

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email) {
    throw new apiError(400, "Please provide username or email");
  }
  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(400, "Invalid password: Please try again");
  }

  const { AccessToken, RefreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggeduser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", AccessToken, options)
    .cookie("refreshToken", RefreshToken, options)
    .json(
      new apiResponse(
        200,
        { user: loggeduser, AccessToken, RefreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("AccessToken", "", options)
    .cookie("RefreshToken", "", options)
    .json(new apiResponse(200, {}, "User logged out successfully"));
});

export { registerUser, loginUser, logoutUser };
