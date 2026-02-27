import { Router } from "express";
import { requireUser } from "../../../middleware/requireUser";   // ✅ FIXED
import { upload } from "../../../middleware/upload";
import prisma from "../../../prisma";                    // ✅ FIXED (even if unused)

// Controllers
import updateProfile from "./updateProfile";
import editProfile from "./editProfile";                 
import uploadPhoto from "./uploadPhoto";
import deletePhoto from "./deletePhoto";
import reorderPhotos from "./reorderPhotos";
import swipeStats from "../../swipe/routes/swipeStats";
import matchCount from "./matchCount";
import profileCompletion from "./profileCompletion";
import getMatches from "./getMatches";

const router = Router();

/**
 * PROFILE
 */
router.get("/edit", requireUser, editProfile);
router.put("/update", requireUser, updateProfile);

/**
 * PHOTOS
 */
router.post("/photos/upload", requireUser, upload.single("photo"), uploadPhoto);
router.delete("/photos/:index", requireUser, deletePhoto);
router.put("/photos/reorder", requireUser, reorderPhotos);

/**
 * MATCHES
 */
router.get("/matches", requireUser, getMatches);

/**
 * ANALYTICS
 */
router.get("/swipe-stats", requireUser, swipeStats);
router.get("/match-count", requireUser, matchCount);
router.get("/profile-completion", requireUser, profileCompletion);

export default router;
