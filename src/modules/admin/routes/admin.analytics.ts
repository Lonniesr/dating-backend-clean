import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";
import type { Invite, InviteScan } from "@prisma/client";

const router = Router();

/**
 * OVERALL INVITE ANALYTICS
 */
router.get(
  "/overview",
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const invites: Invite[] = await prisma.invite.findMany();

      const totalScans: number = invites.reduce(
        (sum: number, invite: Invite): number =>
          sum + invite.scanCount,
        0
      );

      const totalSignups: number = invites.reduce(
        (sum: number, invite: Invite): number =>
          sum + invite.signupCount,
        0
      );

      const conversionRate: number =
        totalScans === 0
          ? 0
          : Number(((totalSignups / totalScans) * 100).toFixed(2));

      const premiumInvites: Invite[] = invites.filter(
        (invite: Invite) => invite.premium === true
      );

      const premiumSignups: number = premiumInvites.reduce(
        (sum: number, invite: Invite): number =>
          sum + invite.signupCount,
        0
      );

      const revenue: number = premiumSignups * 29;

      res.json({
        totalScans,
        totalSignups,
        conversionRate,
        premiumSignups,
        revenue,
      });
    } catch (err) {
      console.error("OVERVIEW ANALYTICS ERROR:", err);
      res.status(500).json({ error: "Overview analytics error" });
    }
  }
);

/**
 * DAILY SCANS
 */
router.get(
  "/daily-scans",
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const scans = await prisma.inviteScan.findMany({
  select: { createdAt: true },
});

      const grouped: Record<string, number> = {};

scans.forEach((scan) => {
      const day: string =
          scan.createdAt.toISOString().split("T")[0];

        grouped[day] = (grouped[day] || 0) + 1;
      });

      const result: { date: string; scans: number }[] =
        Object.entries(grouped).map(
          ([date, count]: [string, number]) => ({
            date,
            scans: count,
          })
        );

      res.json(result);
    } catch (err) {
      console.error("DAILY SCANS ERROR:", err);
      res.status(500).json({ error: "Daily scans error" });
    }
  }
);

/**
 * DAILY CONVERSION
 */
router.get(
  "/daily-conversion",
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const invites: Pick<
        Invite,
        "createdAt" | "signupCount"
      >[] = await prisma.invite.findMany({
        select: { createdAt: true, signupCount: true },
      });

      const grouped: Record<string, number> = {};

      invites.forEach(
        (invite: Pick<Invite, "createdAt" | "signupCount">): void => {
          const day: string =
            invite.createdAt.toISOString().split("T")[0];

          grouped[day] =
            (grouped[day] || 0) + invite.signupCount;
        }
      );

      const result: { date: string; signups: number }[] =
        Object.entries(grouped).map(
          ([date, signups]: [string, number]) => ({
            date,
            signups,
          })
        );

      res.json(result);
    } catch (err) {
      console.error("DAILY CONVERSION ERROR:", err);
      res.status(500).json({ error: "Daily conversion error" });
    }
  }
);

/**
 * DEVICE BREAKDOWN
 */
router.get(
  "/devices",
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const devices = await prisma.inviteScan.groupBy({
        by: ["device"],
        _count: { device: true },
      });

      res.json(devices);
    } catch (err) {
      console.error("DEVICE ANALYTICS ERROR:", err);
      res.status(500).json({ error: "Device analytics error" });
    }
  }
);

/**
 * LEADERBOARD
 */
router.get(
  "/leaderboard",
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const top = await prisma.invite.findMany({
        orderBy: { signupCount: "desc" },
        take: 10,
        select: {
          code: true,
          scanCount: true,
          signupCount: true,
          premium: true,
        },
      });

      res.json(top);
    } catch (err) {
      console.error("LEADERBOARD ERROR:", err);
      res.status(500).json({ error: "Leaderboard error" });
    }
  }
);

export default router;