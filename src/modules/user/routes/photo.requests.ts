import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * 📩 Request access to private photo
 */
router.post("/request", requireUser, async (req: Request, res: Response) => {
  try {
    const requesterId = (req as any).user?.id;
    const { photoId, message } = req.body as {
      photoId?: string;
      message?: string;
    };

    if (!requesterId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!photoId) {
      return res.status(400).json({ error: "photoId is required" });
    }

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    if (!(photo as any).isPrivate) {
      return res.status(400).json({ error: "Photo is not private" });
    }

    if (photo.userId === requesterId) {
      return res.status(400).json({ error: "Cannot request your own photo" });
    }

    const existing = await (prisma as any).photoAccessRequest.findUnique({
      where: {
        photoId_requesterId: {
          photoId,
          requesterId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Already requested" });
    }

    const request = await (prisma as any).photoAccessRequest.create({
      data: {
        photoId,
        requesterId,
        ownerId: photo.userId,
        message,
      },
    });

    return res.json(request);
  } catch (err) {
    console.error("photo request error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ Respond to request (approve / deny)
 */
router.post("/respond", requireUser, async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?.id;
    const { requestId, status } = req.body as {
      requestId?: string;
      status?: "approved" | "denied";
    };

    if (!ownerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!requestId || !status) {
      return res.status(400).json({ error: "Invalid request" });
    }

    if (!["approved", "denied"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const request = await (prisma as any).photoAccessRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.ownerId !== ownerId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updated = await (prisma as any).photoAccessRequest.update({
      where: { id: requestId },
      data: { status },
    });

    return res.json(updated);
  } catch (err) {
    console.error("photo respond error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * 📬 Get incoming requests
 */
router.get("/incoming", requireUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const requests = await (prisma as any).photoAccessRequest.findMany({
      where: {
        ownerId: userId,
        status: "pending",
      },
      include: {
  requester: {
    select: {
      id: true,
      username: true,
      name: true,
      photos: {
        select: {
          url: true,
        },
        take: 1,
      },
    },
  },
  photo: true,
},
      orderBy: { createdAt: "desc" },
    });

    return res.json(requests);
  } catch (err) {
    console.error("incoming requests error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * 🔓 Check if viewer can see a private photo
 */
router.get("/can-view/:photoId", requireUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const photoId = req.params.photoId as string;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    if (photo.userId === userId) {
      return res.json({ canView: true });
    }

    if (!(photo as any).isPrivate) {
      return res.json({ canView: true });
    }

    const access = await (prisma as any).photoAccessRequest.findFirst({
      where: {
        photoId,
        requesterId: userId,
        status: "approved",
      },
    });

    return res.json({ canView: !!access });
  } catch (err) {
    console.error("can view error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/mine", requireUser, async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    const requests = await (prisma as any).photoAccessRequest.findMany({
      where: {
        requesterId: userId,
      },
      select: {
        photoId: true,
        status: true,
      },
    });

    res.json(requests);
  } catch (err) {
    console.error("mine requests error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;