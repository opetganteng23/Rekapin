import { config } from "dotenv";
config({ path: ".env.local" });
import bcrypt from "bcryptjs";
import "../src/lib/dns-fix";
import { MongoClient } from "mongodb";

async function main() {
  const { MONGODB_URI, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD } = process.env;
  if (!MONGODB_URI || !INITIAL_ADMIN_EMAIL || !INITIAL_ADMIN_PASSWORD) {
    throw new Error("Set MONGODB_URI, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD di .env");
  }
  const client = await new MongoClient(MONGODB_URI).connect();
  const db = client.db();
  const users = db.collection("users");
  await users.createIndex({ email: 1 }, { unique: true });
  await users.createIndex({ resetTokenHash: 1 }, { sparse: true });

  const email = INITIAL_ADMIN_EMAIL.toLowerCase();
  if (await users.findOne({ email })) {
    console.log(`Admin ${email} sudah ada, dilewati.`);
  } else {
    await users.insertOne({
      name: "Admin",
      email,
      passwordHash: await bcrypt.hash(INITIAL_ADMIN_PASSWORD, 12),
      role: "admin",
      isActive: true,
      createdAt: new Date(),
    });
    console.log(`Admin ${email} dibuat. Segera ganti password dari halaman profil.`);
  }

  const settings = db.collection("settings");
  if (!(await settings.findOne({}))) {
    await settings.insertOne({
      recapFrequency: "monthly",
      recapDayOfMonth: 1,
      recapDayOfWeek: 1,
      recapHour: 6,
      updatedAt: new Date(),
    });
    console.log("Settings default dibuat.");
  }
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
