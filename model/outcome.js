const mongoose = require("mongoose");
const { Schema } = mongoose;

const OutcomeSchema = new Schema({
  typeOfTransaction: {
    type: String,
    required: true,
  },
  dateOfTransaction: {
    type: Date,
    required: true,
  },
  transactionValue: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Outcome", OutcomeSchema);
