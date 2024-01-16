const mongoose = require("mongoose");

const BinaryIncomeSchema = new mongoose.Schema({
    user_id: { type:String },
    //user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    own_id: String,
    name: String,
    email: String,
    inc: Number,
    date: { type: Date, default: Date.now },
    month: String,
    year: Number,
});



module.exports = mongoose.model("BinaryIncome", BinaryIncomeSchema);
  