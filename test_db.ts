import { readDb, writeDb } from "./lib/db";
import { v4 as uuidv4 } from "uuid";

console.log("Reading DB...");
const db = readDb();
const initialCount = db.users.length;
console.log(`Initial user count: ${initialCount}`);

const newUser = {
  id: uuidv4(),
  name: "PersistenceTest" + Date.now(),
  passwordHash: "hash",
  phone: "",
  bonusBalance: 0,
  totalEarned: 0,
  totalSpent: 0,
  streak: 0,
  level: 1,
  xp: 0
};

db.users.push(newUser);
console.log("Writing DB...");
writeDb(db);

console.log("Reading DB again...");
const db2 = readDb();
const finalCount = db2.users.length;
console.log(`Final user count: ${finalCount}`);

if (finalCount === initialCount + 1) {
  console.log("SUCCESS: Data persisted locally.");
} else {
  console.log("FAILURE: Data not persisted!");
}
