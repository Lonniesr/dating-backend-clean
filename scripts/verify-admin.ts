// scripts/verify-admin.ts

/**
 * Admin Backend Verification Script
 * -----------------------------------
 * Checks:
 *  - Required admin controllers exist
 *  - Required admin routes exist
 *  - server.ts mounts admin routes
 */

import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "..");

// ---------------------------------
// EXPECTED ADMIN MODULE STRUCTURE
// ---------------------------------
const adminControllers = [
  "src/modules/admin/controllers/adminAnalytics.controller.ts",
  "src/modules/admin/controllers/adminModeration.controller.ts",
  "src/modules/admin/controllers/adminFeatureRollouts.controller.ts",
  "src/modules/admin/controllers/adminExperiments.controller.ts",
  "src/modules/admin/controllers/adminSystemTasks.controller.ts",
  "src/modules/admin/controllers/adminApiKeys.controller.ts",
  "src/modules/admin/controllers/adminContent.controller.ts",
  "src/modules/admin/controllers/adminOnboardingFlows.controller.ts",
  "src/modules/admin/controllers/adminInternalTools.controller.ts",
  "src/modules/admin/controllers/adminNotifications.controller.ts",
  "src/modules/admin/controllers/adminEmails.controller.ts",
  "src/modules/admin/controllers/adminEmailMonitor.controller.ts",
];

const adminRoutes = [
  "src/modules/admin/routes/adminAnalytics.routes.ts",
  "src/modules/admin/routes/adminModeration.routes.ts",
  "src/modules/admin/routes/adminFeatureRollouts.routes.ts",
  "src/modules/admin/routes/adminExperiments.routes.ts",
  "src/modules/admin/routes/adminSystemTasks.routes.ts",
  "src/modules/admin/routes/adminApiKeys.routes.ts",
  "src/modules/admin/routes/adminContent.routes.ts",
  "src/modules/admin/routes/adminOnboardingFlows.routes.ts",
  "src/modules/admin/routes/adminInternalTools.routes.ts",
  "src/modules/admin/routes/adminNotifications.routes.ts",
  "src/modules/admin/routes/adminEmails.routes.ts",
  "src/modules/admin/routes/adminEmailMonitor.routes.ts",
];

const requiredMount = "/api/admin";

// ---------------------------------
// HELPERS
// ---------------------------------
function checkFiles(title: string, files: string[]) {
  console.log(`\n=== ${title} ===`);

  files.forEach((file) => {
    const exists = fs.existsSync(path.join(root, file));
    console.log(`${exists ? "✔" : "✘"} ${file}`);
  });
}

function checkServerMount() {
  console.log(`\n=== SERVER ROUTE MOUNT CHECK ===`);

  const serverPath = path.join(root, "src/server.ts");

  if (!fs.existsSync(serverPath)) {
    console.log("✘ src/server.ts not found");
    return;
  }

  const content = fs.readFileSync(serverPath, "utf8");

  const exists = content.includes(requiredMount);
  console.log(`${exists ? "✔" : "✘"} ${requiredMount}`);
}

// ---------------------------------
// RUN
// ---------------------------------
console.log("=====================================");
console.log(" ADMIN BACKEND VERIFICATION REPORT ");
console.log("=====================================");

checkFiles("ADMIN CONTROLLERS", adminControllers);
checkFiles("ADMIN ROUTES", adminRoutes);
checkServerMount();

console.log("\nVerification complete.\n");