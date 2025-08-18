import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import Video from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Toggle like on a video
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid videoId");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    await existingLike.deleteOne();
    return res
      .status(200)
      .json(new apiResponse(200, null, "Video unliked successfully"));
  }

  const like = await Like.create({
    video: videoId,
    likedBy: req.user._id,
  });

  return res
    .status(201)
    .json(new apiResponse(201, like, "Video liked successfully"));
});

// Toggle like on a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new apiError(400, "Invalid commentId");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    await existingLike.deleteOne();
    return res
      .status(200)
      .json(new apiResponse(200, null, "Comment unliked successfully"));
  }

  const like = await Like.create({
    comment: commentId,
    likedBy: req.user._id,
  });

  return res
    .status(201)
    .json(new apiResponse(201, like, "Comment liked successfully"));
});

// Toggle like on a tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new apiError(400, "Invalid tweetId");
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    await existingLike.deleteOne();
    return res
      .status(200)
      .json(new apiResponse(200, null, "Tweet unliked successfully"));
  }

  const like = await Like.create({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  return res
    .status(201)
    .json(new apiResponse(201, like, "Tweet liked successfully"));
});

// Get all liked videos by user
const getLikedVideos = asyncHandler(async (req, res) => {
  const likes = await Like.find({
    likedBy: req.user._id,
    video: { $exists: true },
  }).populate("video");

  return res
    .status(200)
    .json(new apiResponse(200, likes, "Fetched all liked videos successfully"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
