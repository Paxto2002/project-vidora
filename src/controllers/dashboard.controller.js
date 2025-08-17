// src/controllers/dashboard.controller.js
import mongoose from "mongoose";
import Video from "../models/video.model.js";
import Subscription from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Get channel stats: total videos, total views, total subscribers, total likes
 */
const getChannelStats = asyncHandler(async (req, res) => {
  const channelId = req.user?._id; // assuming channel == user account
  if (!channelId) throw new ApiError(401, "Unauthorized: channel not found");

  // 1. Total Videos + Views
  const videoStats = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
      },
    },
  ]);

  // 2. Total Subscribers
  const subscriberCount = await Subscription.countDocuments({
    channel: channelId,
  });

  // 3. Total Likes on all channel’s videos
  const likeStats = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
      },
    },
    { $unwind: "$likedVideo" },
    {
      $match: { "likedVideo.owner": new mongoose.Types.ObjectId(channelId) },
    },
    { $count: "totalLikes" },
  ]);

  const stats = {
    totalVideos: videoStats[0]?.totalVideos || 0,
    totalViews: videoStats[0]?.totalViews || 0,
    totalSubscribers: subscriberCount || 0,
    totalLikes: likeStats[0]?.totalLikes || 0,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
});

/**
 * Get all videos uploaded by a channel
 */
const getChannelVideos = asyncHandler(async (req, res) => {
  const channelId = req.params.channelId || req.user?._id;

  if (!channelId) throw new ApiError(400, "Channel ID is required");

  const videos = await Video.find({ owner: channelId })
    .sort({ createdAt: -1 })
    .select("-__v");

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
