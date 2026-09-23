import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import redis from "../../../redis";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

const DISCOVER_CACHE_TTL = 60;
const PAGE_SIZE = 30;
const BUFFER_SIZE = 120;
const MAX_CANDIDATES = 300;

/**
 * Calculate distance between two latitude/longitude coordinates
 * using the Haversine formula.
 *
 * Returns distance in miles.
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Calculate a user's current age accurately.
 *
 * This accounts for whether the user's birthday
 * has occurred yet this year.
 */
function calculateAge(birthdate: Date | string): number {
  const dob = new Date(birthdate);

  if (Number.isNaN(dob.getTime())) {
    return -1;
  }

  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();

  const monthDifference = today.getMonth() - dob.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Safely convert a preference value to a number.
 *
 * Handles both numeric JSON values and numeric strings.
 */
function getPreferenceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }

  return null;
}

router.get(
  "/",
  requireUser,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      /*
       * -----------------------------------------
       * PAGINATION
       * -----------------------------------------
       */

      const rawCursor = Number(req.query.cursor ?? 0);

      const cursor =
        Number.isFinite(rawCursor) && rawCursor >= 0
          ? Math.floor(rawCursor)
          : 0;

      /*
       * -----------------------------------------
       * CURRENT USER
       * -----------------------------------------
       */

      const currentUser = await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          preferences: true,
          latitude: true,
          longitude: true,
        },
      });

      if (!currentUser) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      /*
       * -----------------------------------------
       * USER PREFERENCES
       * -----------------------------------------
       */

      const prefs =
        currentUser.preferences &&
        typeof currentUser.preferences === "object"
          ? (currentUser.preferences as Record<string, any>)
          : {};

      const interested =
        typeof prefs.interestedIn === "string"
          ? prefs.interestedIn.trim().toLowerCase()
          : "";

      const onlyVerified = prefs.onlyVerified === true;
      const boostVerified = prefs.boostVerified === true;
      const prioritizeLikedYou = prefs.prioritizeLikedYou === true;

      const minAge = getPreferenceNumber(prefs.minAge);
      const maxAge = getPreferenceNumber(prefs.maxAge);
      const locationRadius = getPreferenceNumber(prefs.locationRadius);

      /*
       * A null radius means the user has selected
       * no location restriction / any location.
       */
      const anyLocation = locationRadius === null;

      /*
       * -----------------------------------------
       * REDIS CACHE
       * -----------------------------------------
       *
       * IMPORTANT:
       *
       * Age, distance and verified settings are included
       * in the cache key so changing preferences does not
       * return stale Discover results.
       */

      const cacheKey = [
        "discover",
        userId,
        cursor,
        interested || "everyone",
        minAge ?? "any",
        maxAge ?? "any",
        locationRadius ?? "any",
        onlyVerified ? "verified" : "all",
        boostVerified ? "boostVerified" : "normalVerified",
        prioritizeLikedYou ? "likedFirst" : "normalLikes",
      ].join(":");

      if (redis) {
        try {
          const cached = await redis.get(cacheKey);

          if (cached) {
            return res.json(JSON.parse(cached));
          }
        } catch (redisError) {
          /*
           * Redis should never prevent Discover
           * from working.
           */
          console.error("DISCOVER REDIS GET ERROR:", redisError);
        }
      }

      /*
       * -----------------------------------------
       * SWIPES
       * -----------------------------------------
       *
       * We need:
       *
       * 1. People this user has already swiped on.
       * 2. People who have liked this user.
       */

      const swipeData = await prisma.swipe.findMany({
        where: {
          OR: [
            {
              swiperId: userId,
            },
            {
              targetId: userId,
            },
          ],
        },

        select: {
          swiperId: true,
          targetId: true,
          liked: true,
        },
      });

      const swipedIds = new Set<string>();
      const likedYouSet = new Set<string>();

      for (const swipe of swipeData) {
        if (swipe.swiperId === userId) {
          swipedIds.add(swipe.targetId);
        }

        if (swipe.targetId === userId && swipe.liked) {
          likedYouSet.add(swipe.swiperId);
        }
      }

      /*
       * -----------------------------------------
       * EXISTING MATCHES
       * -----------------------------------------
       */

      const matches = await prisma.match.findMany({
        where: {
          OR: [
            {
              userAId: userId,
            },
            {
              userBId: userId,
            },
          ],
        },

        select: {
          userAId: true,
          userBId: true,
        },
      });

      const matchedIds = new Set<string>();

      for (const match of matches) {
        if (match.userAId !== userId) {
          matchedIds.add(match.userAId);
        }

        if (match.userBId !== userId) {
          matchedIds.add(match.userBId);
        }
      }

      /*
       * -----------------------------------------
       * BLOCKS
       * -----------------------------------------
       *
       * Exclude users blocked in either direction.
       */

      const blocks = await prisma.block.findMany({
        where: {
          OR: [
            {
              blockerId: userId,
            },
            {
              blockedId: userId,
            },
          ],
        },

        select: {
          blockerId: true,
          blockedId: true,
        },
      });

      const blockedIds = new Set<string>();

      for (const block of blocks) {
        if (block.blockerId === userId) {
          blockedIds.add(block.blockedId);
        }

        if (block.blockedId === userId) {
          blockedIds.add(block.blockerId);
        }
      }

      /*
       * -----------------------------------------
       * COMBINE EXCLUSIONS
       * -----------------------------------------
       */

      const excludedIds = Array.from(
        new Set([
          ...Array.from(swipedIds),
          ...Array.from(matchedIds),
          ...Array.from(blockedIds),
        ])
      ).slice(0, 500);

      /*
       * -----------------------------------------
       * DATABASE CANDIDATES
       * -----------------------------------------
       *
       * Gender is filtered at the database level where
       * possible to reduce unnecessary candidate loading.
       *
       * Age and distance are applied below because:
       *
       * - birthdate needs accurate age calculation
       * - distance requires Haversine calculation
       */

      const candidates = await prisma.user.findMany({
        where: {
          id: {
            not: userId,

            ...(excludedIds.length > 0 && {
              notIn: excludedIds,
            }),
          },

          role: "user",

          onboardingComplete: true,

          banned: false,

          shadowBanned: false,

          photos: {
            some: {},
          },

          ...(interested === "men" && {
            gender: {
              in: ["male", "Male", "man", "Man"],
            },
          }),

          ...(interested === "women" && {
            gender: {
              in: ["female", "Female", "woman", "Woman"],
            },
          }),

          ...(onlyVerified && {
            verified: true,
          }),
        },

        select: {
          id: true,
          name: true,
          gender: true,
          race: true,
          birthdate: true,
          location: true,
          latitude: true,
          longitude: true,
          lastActiveAt: true,
          eloScore: true,
          verified: true,
          preferences: true,

          photos: {
            select: {
              url: true,
            },

            orderBy: {
              order: "asc",
            },
          },
        },

        take: MAX_CANDIDATES,
      });

      /*
       * -----------------------------------------
       * HARD PREFERENCE FILTERING + RANKING
       * -----------------------------------------
       *
       * IMPORTANT:
       *
       * Age and distance are HARD filters.
       *
       * A user outside the selected age range or
       * distance radius cannot appear merely because
       * they have a high ranking score.
       */

      const ranked = candidates
        .filter((user) => {
          /*
           * -----------------------------------------
           * MUTUAL GENDER / INTEREST COMPATIBILITY
           * -----------------------------------------
           */

          const theirPrefs =
            user.preferences && typeof user.preferences === "object"
              ? (user.preferences as Record<string, any>)
              : {};

          const theirInterested =
            typeof theirPrefs.interestedIn === "string"
              ? theirPrefs.interestedIn.trim().toLowerCase()
              : "";

          const normalizedGender = (user.gender || "")
            .trim()
            .toLowerCase();

          if (interested === "women") {
            const isWoman =
              normalizedGender === "female" ||
              normalizedGender === "woman";

            if (!isWoman) {
              return false;
            }

            if (
              theirInterested !== "men" &&
              theirInterested !== "everyone"
            ) {
              return false;
            }
          }

          if (interested === "men") {
            const isMan =
              normalizedGender === "male" ||
              normalizedGender === "man";

            if (!isMan) {
              return false;
            }

            if (
              theirInterested !== "women" &&
              theirInterested !== "everyone"
            ) {
              return false;
            }
          }

          /*
           * -----------------------------------------
           * HARD AGE FILTER
           * -----------------------------------------
           */

          if (minAge !== null || maxAge !== null) {
            /*
             * If a user requested an age range and we
             * cannot verify the candidate's age, do not
             * place that candidate into the filtered feed.
             */
            if (!user.birthdate) {
              return false;
            }

            const age = calculateAge(user.birthdate);

            if (age < 0) {
              return false;
            }

            if (minAge !== null && age < minAge) {
              return false;
            }

            if (maxAge !== null && age > maxAge) {
              return false;
            }
          }

          /*
           * -----------------------------------------
           * HARD DISTANCE FILTER
           * -----------------------------------------
           */

          if (!anyLocation) {
            /*
             * If the user selected a radius, LynQ needs
             * coordinates for both profiles to guarantee
             * that the candidate actually falls inside it.
             */
            if (
              currentUser.latitude == null ||
              currentUser.longitude == null ||
              user.latitude == null ||
              user.longitude == null
            ) {
              return false;
            }

            const distance = calculateDistance(
              currentUser.latitude,
              currentUser.longitude,
              user.latitude,
              user.longitude
            );

            if (
              locationRadius !== null &&
              distance > locationRadius
            ) {
              return false;
            }
          }

          /*
           * -----------------------------------------
           * VERIFIED-ONLY
           * -----------------------------------------
           *
           * This is also applied at the Prisma query level,
           * but retaining this check provides an additional
           * guard against unexpected data.
           */

          if (onlyVerified && !user.verified) {
            return false;
          }

          return true;
        })

        /*
         * -----------------------------------------
         * RANK USERS WHO PASSED ALL HARD FILTERS
         * -----------------------------------------
         */
        .map((user) => {
          let score = 0;

          /*
           * -----------------------------------------
           * LIKED YOU
           * -----------------------------------------
           */

          if (likedYouSet.has(user.id)) {
            score += prioritizeLikedYou ? 1000 : 500;
          }

          /*
           * -----------------------------------------
           * VERIFIED BOOST
           * -----------------------------------------
           */

          if (boostVerified && user.verified) {
            score += 80;
          }

          /*
           * -----------------------------------------
           * RECENT ACTIVITY
           * -----------------------------------------
           */

          if (user.lastActiveAt) {
            const hoursSinceActive =
              (Date.now() -
                new Date(user.lastActiveAt).getTime()) /
              (1000 * 60 * 60);

            if (Number.isFinite(hoursSinceActive)) {
              score += Math.max(0, 100 - hoursSinceActive);
            }
          }

          /*
           * -----------------------------------------
           * PROFILE COMPLETENESS
           * -----------------------------------------
           */

          score += (user.photos?.length || 0) * 10;

          /*
           * -----------------------------------------
           * ELO / PROFILE QUALITY
           * -----------------------------------------
           */

          if (
            typeof user.eloScore === "number" &&
            Number.isFinite(user.eloScore)
          ) {
            score += user.eloScore * 0.05;
          }

          /*
           * -----------------------------------------
           * DISTANCE RANKING
           * -----------------------------------------
           *
           * Everyone reaching this point is already
           * inside the user's requested radius.
           *
           * This simply gives closer profiles a small
           * ranking advantage.
           */

          let distance: number | null = null;

          if (
            currentUser.latitude != null &&
            currentUser.longitude != null &&
            user.latitude != null &&
            user.longitude != null
          ) {
            distance = calculateDistance(
              currentUser.latitude,
              currentUser.longitude,
              user.latitude,
              user.longitude
            );

            /*
             * Preserve the original LynQ distance-ranking
             * behavior: profiles within roughly 50 miles
             * receive progressively more ranking weight.
             */
            score += Math.max(0, 50 - distance);
          }

          /*
           * -----------------------------------------
           * SMALL RANDOMIZATION
           * -----------------------------------------
           *
           * Prevents Discover from looking completely
           * identical on every ranking calculation.
           */

          score += Math.random() * 10;

          return {
            ...user,
            score,
            distance,
          };
        })

        /*
         * -----------------------------------------
         * FINAL RANKING
         * -----------------------------------------
         */

        .sort((a, b) => b.score - a.score);

      /*
       * -----------------------------------------
       * TOP PICKS
       * -----------------------------------------
       *
       * IMPORTANT:
       *
       * Top Picks are selected AFTER hard preference
       * filtering. A Top Pick can therefore never bypass
       * age, distance, gender or verified-only settings.
       */

      const topPicks = [...ranked]
        .sort(
          (a, b) =>
            (b.eloScore || 0) - (a.eloScore || 0)
        )
        .slice(0, 3);

      const topPickIds = new Set(
        topPicks.map((user) => user.id)
      );

      const remaining = ranked.filter(
        (user) => !topPickIds.has(user.id)
      );

      const finalFeed = [
        ...topPicks,
        ...remaining,
      ];

      /*
       * -----------------------------------------
       * PAGINATION WINDOW
       * -----------------------------------------
       */

      const windowed = finalFeed.slice(
        cursor,
        cursor + BUFFER_SIZE
      );

      const page = windowed.slice(0, PAGE_SIZE);

      /*
       * -----------------------------------------
       * API RESPONSE PROFILES
       * -----------------------------------------
       */

      const profiles = page.map((user) => ({
        id: user.id,
        name: user.name,
        gender: user.gender,
        race: user.race,
        birthdate: user.birthdate,
        location: user.location,
        latitude: user.latitude,
        longitude: user.longitude,

        // Online/activity status
        lastActiveAt: user.lastActiveAt,

        photos: (user.photos ?? []).map(
          (photo: { url: string }) => photo.url
        ),
      }));

      /*
       * Only advertise another cursor when another
       * profile actually exists in the filtered feed.
       */
      const hasMore =
        cursor + PAGE_SIZE < finalFeed.length;

      const response = {
        profiles,

        nextCursor: hasMore
          ? cursor + PAGE_SIZE
          : null,

        /*
         * This metadata gives the frontend enough
         * information to create a useful empty state:
         *
         * "No more people match ages 30–60
         * within 100 miles."
         */
        discoverMeta: {
          resultCount: profiles.length,
          totalAvailable: finalFeed.length,

          filters: {
            interestedIn:
              prefs.interestedIn ?? null,

            minAge,

            maxAge,

            locationRadius,

            onlyVerified,
          },

          exhausted:
            finalFeed.length === 0 ||
            !hasMore,
        },
      };

      /*
       * -----------------------------------------
       * CACHE RESPONSE
       * -----------------------------------------
       */

      if (redis) {
        try {
          await redis.set(
            cacheKey,
            JSON.stringify(response),
            {
              EX: DISCOVER_CACHE_TTL,
            }
          );
        } catch (redisError) {
          /*
           * Cache failure should not cause the
           * Discover endpoint itself to fail.
           */
          console.error(
            "DISCOVER REDIS SET ERROR:",
            redisError
          );
        }
      }

      return res.json(response);
    } catch (err) {
      console.error("DISCOVER ERROR:", err);

      return res.status(500).json({
        message: "Failed to load discover feed",
      });
    }
  }
);

export default router;