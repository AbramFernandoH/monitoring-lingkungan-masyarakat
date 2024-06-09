const mongoose = require('mongoose');
const { Schema } = mongoose;

const OutcomeSchema = new Schema({
  type: {
    type: String,
    required: true
  },
  Date: {
    type: Date,
    required: true
  },
  value: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Outcome', OutcomeSchema);