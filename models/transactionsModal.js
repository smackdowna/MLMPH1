const mongoose = require("mongoose");


// Define the User schema
const transactionSchema = new mongoose.Schema({
    sender_own_id: {
      type: String,
      required: [true, "Please Enter your mobile number"],
      maxLength: [10, "mobile cannot be greater than 10 characters"],
      minLength: [10, "mobile must be at least 10 characters"],
    },
    recevier_own_id: {
        type: String,
        required: [true, "Please Enter recever number"],
        maxLength: [10, "mobile cannot be greater than 10 characters"],
        minLength: [10, "mobile must be at least 10 characters"],
      },
    amount:{
        type: Number,
        default: 0,
    },
    transaction_time: {
      type: Date,
      default: Date.now(),
    },
});
  

module.exports = mongoose.model("Transactions", transactionSchema);