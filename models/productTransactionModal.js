const mongoose = require("mongoose");

const producttransactionSchema = new mongoose.Schema({
    Buy_user_own_id:{
      type: String,
      required: [true, "Please Enter your mobile number"],
      maxLength: [10, "mobile cannot be greater than 10 characters"],
      minLength: [10, "mobile must be at least 10 characters"],
    },
    productCost: Number,
    type: String, 
    Puchased_time: { type: Date, default: Date.now },

})

module.exports = mongoose.model("ProductTransactions", producttransactionSchema);