import { Router, Request, Response } from "express";
import { requireUser } from "../../../middleware/requireUser";
import prisma from "../../../prisma";

// Controllers
import updateProfile from "./updateProfile";
import deletePhoto from "./deletePhoto";
import reorderPhotos from "./reorderPhotos";
import swipeStats from "../../swipe/routes/swipeStats";
import matchCount from "./matchCount";
import profileCompletion from "./profileCompletion";
import getMatches from "./getMatches";

const router = Router();

/**
 * USERNAME CHECK
 */
router.get("/check-username", async (req: Request, res: Response) => {
  try {
    const username = String(req.query.username || "").toLowerCase();

    if (!username || username.length < 3) {
      return res.json({ available: false });
    }

    const existing = await prisma.user.findFirst({
      where: { username },
      select: { id: true },
    });

    res.json({
      available: !existing,
    });
  } catch (err) {
    console.error("USERNAME CHECK ERROR:", err);

    res.status(500).json({
      available: false,
    });
  }
});

/**
 * PROFILE (ONLY ONE ROUTE)
 */
router.put("/profile", requireUser, updateProfile);

/**
 * PHOTOS
 */
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