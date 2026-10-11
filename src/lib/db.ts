import "./dns-fix";
import { MongoClient, ObjectId, type Db } from "mongodb";

export type Role = "employee" | "approver" | "admin";

export interface UserDoc {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string | null;
  role: Role;
  isActive: boolean;
  resetTokenHash?: string | null;
  resetTokenExpiresAt?: Date | null;
  monthlyHourLimit?: number | null;
  createdAt: Date;
}

export interface OvertimeDoc {
  _id: ObjectId;
  userId: ObjectId;
  startTime: Date;
  finishTime: Date;
  totalHours: number;
  evidenceUrls: string[];
  status: "pending" | "approved" | "rejected";
  approvedBy?: ObjectId | null;
  approvedAt?: Date | null;
  rejectNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingsDoc {
  _id: ObjectId;
  recapFrequency: "monthly" | "weekly";
  recapDayOfMonth: number;
  recapDayOfWeek: number;
  recapHour: number;
  updatedBy?: ObjectId;
  updatedAt: Date;
}

const globalForMongo = globalThis as unknown as { _mongo?: Promise<MongoClient> };

function client(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI belum diset");
  // Cache di globalThis agar HMR tidak membuka koneksi baru terus-menerus.
  if (!globalForMongo._mongo) {
    globalForMongo._mongo = new MongoClient(uri).connect().catch((e) => {
      globalForMongo._mongo = undefined; // jangan cache koneksi yang gagal
      throw e;
    });
  }
  return globalForMongo._mongo;
}

export async function getDb(): Promise<Db> {
  return (await client()).db();
}

export async function users() {
  return (await getDb()).collection<UserDoc>("users");
}
export async function overtimeRecords() {
  return (await getDb()).collection<OvertimeDoc>("overtimeRecords");
}
export async function settings() {
  return (await getDb()).collection<SettingsDoc>("settings");
}
