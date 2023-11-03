const mongoose = require("mongoose");


// Define the User schema
const incomeSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  own_id: String,
  name: String,
  email: String,
  income: Number,
  minCount: Number,
  leftCarryForward: Number,
  rightCarryForward: Number,
  lastMinCount: Number,
  lastLeftCarryForward: Number,
  lastRightCarryForward: Number,
  date: { type: Date, default: Date.now },
  month: String,
  year: Number,
});



module.exports = mongoose.model("Income", incomeSchema);