// src/controllers/comment.controller.js
import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import Video from "../models/video.model.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * GET: All comments for a video (with pagination)
 */
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new apiError(400, "Invalid video ID");
  }

  // Ensure video exists
  const video = await Video.findById(videoId);
  if (!video) throw new apiError(404, "Video not found");

  const commentsAggregate = Comment.aggregate([
    { $match: { video: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }],
      },
    },
    { $unwind: "$owner" },
    { $sort: { createdAt: -1 } },
  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const result = await Comment.aggregatePaginate(commentsAggregate, options);

  return res
    .status(200)
    .json(new apiResponse(200, result, "Comments fetched successfully"));
});

/**
 * POST: Add a comment to a video
 */
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id; // Assuming auth middleware sets req.user

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new apiError(400, "Invalid video ID");
  }
  if (!content?.trim()) throw new apiError(400, "Comment content is required");

  const video = await Video.findById(videoId);
  if (!video) throw new apiError(404, "Video not found");

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: userId,
  });

  return res
    .status(201)
    .json(new apiResponse(201, comment, "Comment added successfully"));
});

/**
 * PUT: Update a comment
 */
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new apiError(400, "Invalid comment ID");
  }
  if (!content?.trim()) throw new apiError(400, "Updated content is required");

  const comment = await Comment.findById(commentId);
  if (!comment) throw new apiError(404, "Comment not found");

  if (comment.owner.toString() !== userId.toString()) {
    throw new apiError(403, "You are not allowed to edit this comment");
  }

  comment.content = content;
  await comment.save();

  return res
    .status(200)
    .json(new apiResponse(200, comment, "Comment updated successfully"));
});

/**
 * DELETE: Remove a comment
 */
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new apiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) throw new apiError(404, "Comment not found");

  if (comment.owner.toString() !== userId.toString()) {
    throw new apiError(403, "You are not allowed to delete this comment");
  }

  await comment.deleteOne();

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
