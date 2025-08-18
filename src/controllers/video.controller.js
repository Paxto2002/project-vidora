import mongoose, { isValidObjectId } from "mongoose";
import Video from "../models/video.model.js";
import User from "../models/user.model.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Get all videos with pagination, search, sorting
const getAllVideos = asyncHandler(async (req, res) => {
  let {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const filter = {};

  if (query) {
    filter.title = { $regex: query, $options: "i" }; // case-insensitive search
  }
  if (userId && isValidObjectId(userId)) {
    filter.owner = userId;
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortType === "asc" ? 1 : -1;

  const videos = await Video.find(filter)
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("owner", "username email");

  const totalVideos = await Video.countDocuments(filter);

  return res.status(200).json(
    new apiResponse(200, {
      total: totalVideos,
      page,
      limit,
      videos,
    })
  );
});

// Publish (upload) a new video
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new apiError(400, "Title and description are required");
  }

  if (!req.files?.videoFile?.[0]) {
    throw new apiError(400, "Video file is required");
  }

  // upload video and thumbnail to cloudinary
  const videoUpload = await uploadOnCloudinary(
    req.files.videoFile[0].path,
    "video"
  );
  let thumbnailUpload = null;

  if (req.files?.thumbnail?.[0]) {
    thumbnailUpload = await uploadOnCloudinary(
      req.files.thumbnail[0].path,
      "image"
    );
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoUpload?.url,
    thumbnail: thumbnailUpload?.url || "",
    duration: videoUpload?.duration || 0,
    owner: req.user?._id,
  });

  return res
    .status(201)
    .json(new apiResponse(201, video, "Video published successfully"));
});

// Get a video by ID
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId).populate(
    "owner",
    "username email"
  );

  if (!video) {
    throw new apiError(404, "Video not found");
  }

  return res.status(200).json(new apiResponse(200, video));
});

// Update video details
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id");
  }

  const updates = {};
  if (title) updates.title = title;
  if (description) updates.description = description;

  if (req.files?.thumbnail?.[0]) {
    const thumbnailUpload = await uploadOnCloudinary(
      req.files.thumbnail[0].path,
      "image"
    );
    updates.thumbnail = thumbnailUpload?.url;
  }

  const video = await Video.findOneAndUpdate(
    { _id: videoId, owner: req.user?._id },
    updates,
    { new: true }
  );

  if (!video) {
    throw new apiError(404, "Video not found or not authorized");
  }

  return res
    .status(200)
    .json(new apiResponse(200, video, "Video updated successfully"));
});

// Delete a video
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id");
  }

  const video = await Video.findOneAndDelete({
    _id: videoId,
    owner: req.user?._id,
  });

  if (!video) {
    throw new apiError(404, "Video not found or not authorized");
  }

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Video deleted successfully"));
});

// Toggle publish status (public/private)
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id");
  }

  const video = await Video.findOne({ _id: videoId, owner: req.user?._id });

  if (!video) {
    throw new apiError(404, "Video not found or not authorized");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(new apiResponse(200, video, "Video publish status toggled"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
