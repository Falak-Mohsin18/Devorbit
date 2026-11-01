require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function checkPass() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: "falak@example.com" });
  console.log("Password hash starts with:", user.password.slice(0, 10));
  const testList = [
    "password123", "password", "123456", "12345678", "admin", "admin123", "falak", "falak123", "devorbit", "devorbit123", "secret", "secret123"
  ];
  for (const t of testList) {
    if (await bcrypt.compare(t, user.password)) {
      console.log("FOUND PASSWORD:", t);
      await mongoose.disconnect();
      return;
    }
  }
  console.log("No match in list");
  await mongoose.disconnect();
}
checkPass();
