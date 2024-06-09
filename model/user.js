const mongoose = require('mongoose');
const { Schema } = mongoose;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
  headOfFamilyName: {
    type: String,
    required: true
  },
  IDNumber: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  admin: Boolean
});

UserSchema.methods.isAnAdmin = async function(){
  this.admin = true;
  return await this.save();
}

// adding username, hash and salt from original password
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);