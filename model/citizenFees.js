const mongoose = require('mongoose');
const { Schema } = mongoose;

const ImagesSchema = new Schema({
  url: String,
  filename: String
});

ImagesSchema.virtual('displayImg').get(() => this.url.replace('/upload', '/upload/w_2500,h_2500,c_limit'));

ImagesSchema.virtual('cbImg').get(() => this.url.replace('/upload', '/upload/w_250,h_250,c_limit'));

const CitizenFeesSchema = new Schema({
  address: {
    type: String,
    required: true
  },
  headOfFamilyName: {
    type: String,
    required: true
  },
  dateOfTransaction: {
    type: Date,
    required: true
  },
  transactionValue: {
    type: Number,
    min: 1,
    required: true
  },
  months: [
    {
      year: {
        type: Number,
        required: true,
      },
      month: {
        type: Number,
        min: 1,
        max: 12,
        required: true,
      },
    }
  ],
  images: [ImagesSchema],
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
});

module.exports = mongoose.model('CitizenFees', CitizenFeesSchema);