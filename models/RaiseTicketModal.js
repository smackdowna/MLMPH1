const mongoose = require("mongoose");


// Define the User schema
const TicketSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  own_id: String,
  name: String,
  issue: String,
  status:{type:String, default:"Pending"},
  date: { type: Date, default: Date.now },
});



module.exports = mongoose.model("Ticket", TicketSchema);