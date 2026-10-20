import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router();

router.use(requireAdmin);

const PRICE_PER_PREMIUM_SIGNUP = 29;
const DAY_MS = 24 * 60 * 60 * 1000;

type DailyScanPoint = {
  date: string;
  scans: number;
};

function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function utcDayStart(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );
}

/**
 * OVERALL INVITE ANALYTICS
 *
 * Scan totals use InviteScan records, matching /daily-scans.
 * Signup totals use the existing Invite.signupCount counters.
 *
 * Conversion is signups per recorded scan, not a unique-visitor
 * conversion rate.
 *
 * Revenue is an estimate based on current premium invite status.
 * It is not verified payment revenue.
 */
router.get(
  "/overview",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const cutoff = new Date();

      const [totalScans, signupTotals, premiumSignupTotals] =
        await prisma.$transaction([
          prisma.inviteScan.count({
            where: {
              createdAt: { lte: cutoff },
            },
          }),
          prisma.invite.aggregate({
            _sum: {
              signupCount: true,
            },
          }),
          prisma.invite.aggregate({
            where: {
              premium: true,
            },
            _sum: {
              signupCount: true,
            },
          }),
        ]);

      const totalSignups = signupTotals._sum.signupCount ?? 0;
      const premiumSignups =
        premiumSignupTotals._sum.signupCount ?? 0;

      const conversionRate =
        totalScans === 0
          ? 0
          : Number(
              ((totalSignups / totalScans) * 100).toFixed(2)
            );

      const estimatedRevenue =
        premiumSignups * PRICE_PER_PREMIUM_SIGNUP;

      res.json({
        totalScans,
        totalSignups,
        conversionRate,
        premiumSignups,

        // Kept for compatibility with the existing frontend.
        // Display this as "Estimated revenue".
        revenue: estimatedRevenue,
        estimatedRevenue,
        revenueIsEstimated: true,

        conversionRateDefinition:
          "Invite signup counters divided by recorded scans; repeat scans may be included.",
        scanSource: "InviteScan",
        signupSource: "Invite.signupCount",
        timezone: "UTC",
        asOf: cutoff.toISOString(),
      });
    } catch (err: unknown) {
      console.error("OVERVIEW ANALYTICS ERROR:", err);
      res.status(500).json({
        error: "Overview analytics error",
      });
    }
  }
);

/**
 * DAILY SCANS
 *
 * Returns recorded scans in chronological UTC calendar-day order.
 * Includes zero-count days between the first recorded scan and today.
 * Today's count is partial.
 *
 * Zero-filled dates mean no scan records exist for that date.
 * They do not establish that tracking was operating correctly.
 */
router.get(
  "/daily-scans",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const cutoff = new Date();

      const scans = await prisma.inviteScan.findMany({
        where: {
          createdAt: { lte: cutoff },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      res.setHeader("X-Analytics-Timezone", "UTC");
      res.setHeader("X-Analytics-As-Of", cutoff.toISOString());

      if (scans.length === 0) {
        res.json([]);
        return;
      }

      const grouped = new Map<string, number>();

      for (const scan of scans) {
        const day = utcDayKey(scan.createdAt);
        grouped.set(day, (grouped.get(day) ?? 0) + 1);
      }

      const firstDay = utcDayStart(scans[0].createdAt).getTime();
      const lastDay = utcDayStart(cutoff).getTime();

      const result: DailyScanPoint[] = [];

      for (
        let timestamp = firstDay;
        timestamp <= lastDay;
        timestamp += DAY_MS
      ) {
        const date = utcDayKey(new Date(timestamp));

        result.push({
          date,
          scans: grouped.get(date) ?? 0,
        });
      }

      res.json(result);
    } catch (err: unknown) {
      console.error("DAILY SCANS ERROR:", err);
      res.status(500).json({
        error: "Daily scans error",
      });
    }
  }
);

/**
 * DAILY SIGNUPS / CONVERSION
 *
 * Invite.createdAt is the invite's creation date, not a signup date.
 * Invite.signupCount cannot reconstruct actual daily signup history.
 *
 * Return an explicit unavailable response instead of publishing
 * incorrectly dated signup counts.
 *
 * Implement this endpoint against timestamped signup records once
 * the signup model and attribution relationship are available.
 */
router.get(
  "/daily-conversion",
  async (_req: Request, res: Response): Promise<void> => {
    res.status(409).json({
      error:
        "Daily signup history is unavailable from invite counters.",
      code: "DAILY_SIGNUP_HISTORY_UNAVAILABLE",
      message:
        "Accurate daily signups require individual signup timestamps and invite attribution. Invite creation dates cannot be used as signup dates.",
    });
  }
);

/**
 * DEVICE BREAKDOWN
 *
 * Count rows rather than non-null device values so scans with
 * missing device information are included.
 *
 * Preserve the existing _count.device response shape.
 */
router.get(
  "/devices",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const cutoff = new Date();

      const devices = await prisma.inviteScan.groupBy({
        by: ["device"],
        where: {
          createdAt: { lte: cutoff },
        },
        _count: {
          _all: true,
        },
      });

      const grouped = new Map<string, number>();

      for (const entry of devices) {
        const device =
          entry.device?.trim().toLowerCase() || "unknown";

        grouped.set(
          device,
          (grouped.get(device) ?? 0) + entry._count._all
        );
      }

      const result = Array.from(
        grouped,
        ([device, count]) => ({
          device,
          _count: {
            device: count,
          },
        })
      ).sort(
        (a, b) =>
          b._count.device - a._count.device ||
          a.device.localeCompare(b.device)
      );

      res.json(result);
    } catch (err: unknown) {
      console.error("DEVICE ANALYTICS ERROR:", err);
      res.status(500).json({
        error: "Device analytics error",
      });
    }
  }
);

/**
 * LEADERBOARD
 *
 * Uses existing per-invite counters because the supplied code
 * does not establish the InviteScan-to-Invite relationship.
 *
 * These counters must be reconciled with scan records separately.
 */
router.get(
  "/leaderboard",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const top = await prisma.invite.findMany({
        orderBy: [
          { signupCount: "desc" },
          { scanCount: "desc" },
          { code: "asc" },
        ],
        take: 10,
        select: {
          code: true,
          scanCount: true,
          signupCount: true,
          premium: true,
        },
      });

      res.json(top);
    } catch (err: unknown) {
      console.error("LEADERBOARD ERROR:", err);
      res.status(500).json({
        error: "Leaderboard error",
      });
    }
  }
);

export default router;