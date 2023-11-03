const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Define the User schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Your Full_Name"],
    maxLength: [30, "Name cannot exceed 30 charachters"],
    minLength: [4, "Name should not be less than 4 charachters"],
  },
  email: {
    type: String,
    required: [true, "Please Enter Your Email"],
    unique: true,
    validate: [validator.isEmail, "Please Enter a valid Email"],
  },
  password: {
    type: String,
    required: [true, "Please Enter your password"],
    minLength: [8, "Password must be at least 8 characters"],
    select: false,
  },
  own_id: {
    type: String,
    required: [true, "Please Enter your mobile number"],
    maxLength: [10, "mobile cannot be greater than 10 characters"],
    minLength: [10, "mobile must be at least 10 characters"],
    unique: true,
  },
  sponsor_id: {
    type: String,
    required: [true, "Please Enter Your sponsor mobile Number"],
    maxLength: [10, "sponsor mobile cannot be greater than 10 characters"],
    minLength: [10, "sponsor mobile must be at least 10 characters"],
  },
  position: {
    type: String,
    enum: ["Left", "Right"],
    required: [true, "please enter your side"],
  },
  parent_id: {
    type: String,
    default: "",
  },
  income: {
    type: Number,
    default: 0,
  },
  TotalLeftCount: {
    type: Number,
    default: 0,
  },
  TotalRightCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["Active", "Inactive","Dead"],
    default: "Inactive",
  },
  wallet:{
    type: Number,
    default: 0,
  },
  role: {
    type: String,
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },

  resetPasswordToken: String,
  resetPasswordExpire: String,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

//JWT Token
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};


// Compare Password

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generating Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
  // Generating Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hashing and adding resetPasswordToken to userSchema
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};




module.exports = mongoose.model("User", userSchema);