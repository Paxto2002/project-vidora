//src/controllers/user.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from the frontend
  // validation: is the email etc in correct format
  // if required fields are left missing, return error asking to fill them
  // if required fields are filled, check if the user already exists
  // if the user already exists, return error saying user already exists
  // if the user does not exist, create a new user
  // check the avatar,
  // if present, upload them to cloudinary
  // if not present, use a default avatar
  // create user object
  // save the user to the database - create entry in DB
  // remove password and refreshtoken fields from the res.body
  // check for user creation success
  // if failed, return error
  // return res with success message and user details

  const { username, email, fullName, password } = req.body;
  console.log("Username from the request body: ", req.body.username);

  if (
    [fullName, username, email, password].some((field) => field?.trim === "")
  ) {
    throw new apiError(400, "Please fill all the required fields");
  }

  const existingUser = User.findOne({ $or: [{ username }, { email }] });
  if (existingUser.username === username) {
    throw new apiError(400, "User already exists with this username");
  } else if (existingUser.email === email) {
    throw new apiError(400, "User already exists with this email");
  }

  const avatarLocalPath = req.fields?.avatar[0]?.path;
  const coverImageLocalPath = req.fields?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new apiError(500, "Failed to upload avatar to Cloudinary");
  }

  const user = await User.create({
    username,
    email,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage ? coverImage.url : "",
    password,
  });

  const createdUser = await user
    .findById(user._id)
    .select("-password -refreshToken");
  if (!createdUser) {
    throw new apiError(
      500,
      "Failed to create user: Something went wrong while creating the user"
    );
  }
  return res
    .status(201)
    .json(new apiResponse(201, createdUser, "User registered successfully"));
});

export { registerUser };
