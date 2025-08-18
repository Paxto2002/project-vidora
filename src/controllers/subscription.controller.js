import mongoose, { isValidObjectId } from "mongoose";
import User from "../models/user.model.js";
import Subscription from "../models/subscription.model.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new apiError(400, "Invalid channel id");
  }

  const userId = req.user?._id; // user from auth middleware

  if (userId.toString() === channelId.toString()) {
    throw new apiError(400, "You cannot subscribe to yourself");
  }

  // check if already subscribed
  const existing = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (existing) {
    await existing.deleteOne();
    return res
      .status(200)
      .json(new apiResponse(200, {}, "Unsubscribed successfully"));
  }

  await Subscription.create({
    subscriber: userId,
    channel: channelId,
  });

  return res
    .status(201)
    .json(new apiResponse(201, {}, "Subscribed successfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new apiError(400, "Invalid channel id");
  }

  const subscribers = await Subscription.find({ channel: channelId })
    .populate("subscriber", "username email")
    .lean();

  return res
    .status(200)
    .json(new apiResponse(200, { count: subscribers.length, subscribers }));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new apiError(400, "Invalid subscriber id");
  }

  const channels = await Subscription.find({ subscriber: subscriberId })
    .populate("channel", "username email")
    .lean();

  return res
    .status(200)
    .json(new apiResponse(200, { count: channels.length, channels }));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
