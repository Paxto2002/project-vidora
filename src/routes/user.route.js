//src/routes/user.route.js
import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"; // Assuming you have a multer setup for file uploads
const router = Router();
router.route("/register").post(
  upload.fields([
    { name: avatar, maxCount: 1 },
    {
      name: coverImage,
      maxCount: 1,
    },
  ]),
  registerUser
);
export default router;
