import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import User from "../models/user.model.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create a new Tweet
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new apiError(400, "Tweet content is required");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id, // assuming auth middleware sets req.user
  });

  return res
    .status(201)
    .json(new apiResponse(201, tweet, "Tweet created successfully"));
});

// Get all tweets of a user
const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new apiError(400, "Invalid user id");
  }

  const tweets = await Tweet.find({ owner: userId })
    .sort({ createdAt: -1 }) // latest first
    .lean();

  return res
    .status(200)
    .json(new apiResponse(200, { count: tweets.length, tweets }));
});

// Update a tweet
const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(tweetId)) {
    throw new apiError(400, "Invalid tweet id");
  }
  if (!content || content.trim() === "") {
    throw new apiError(400, "Tweet content is required");
  }

  const tweet = await Tweet.findOneAndUpdate(
    { _id: tweetId, owner: req.user?._id },
    { content },
    { new: true }
  );

  if (!tweet) {
    throw new apiError(404, "Tweet not found or not authorized");
  }

  return res
    .status(200)
    .json(new apiResponse(200, tweet, "Tweet updated successfully"));
});

// Delete a tweet
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new apiError(400, "Invalid tweet id");
  }

  const tweet = await Tweet.findOneAndDelete({
    _id: tweetId,
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new apiError(404, "Tweet not found or not authorized");
  }

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
