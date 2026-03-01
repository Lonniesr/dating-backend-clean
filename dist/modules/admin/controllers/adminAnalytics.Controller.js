"use strict";
// src/controllers/adminAnalyticsController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminAnalytics = void 0;
const getAdminAnalytics = async (req, res) => {
    try {
        // Replace these with real DB queries when ready
        const analytics = {
            activeUsers: 1200,
            newUsers24h: 85,
            matches24h: 340,
            retentionRate: 62,
            avgSessionTime: 14,
            dailyActive: [40, 55, 60, 48, 70, 80, 90],
        };
        res.json(analytics);
    }
    catch (err) {
        console.error("Analytics error:", err);
        res.status(500).json({ error: "Failed to load analytics" });
    }
};
exports.getAdminAnalytics = getAdminAnalytics;
