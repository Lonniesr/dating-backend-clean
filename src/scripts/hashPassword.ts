import bcrypt from "bcrypt";

async function run() {
  const hash = await bcrypt.hash("TempPass123!", 10);
  console.log("HASH:", hash);
}

run();