const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  familyName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    //select: false,
  },
  sex: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  age: {
    type: String,
    required: true,
  },
});

userSchema.pre("save", async function (next) {
  this.password = await bcryptjs.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
