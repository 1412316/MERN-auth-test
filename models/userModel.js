const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name."],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Please enter your email."],
    trim: true,
    unique: true
  },
  password: {
    type: String,
    required: [true, "Please enter your password."]
  },
  role: {
    type: Number,
    default: 0   // 0: user, 1: admin
  },
  avatar: {
    type: String,
    default: "https://res.cloudinary.com/dosivta5n/image/upload/v1604567361/avatar/5a39bea42397c_thumb900_pwkh6p.jpg"
  },
}, {
  timestamps: true
})

module.exports = mongoose.model("Users", userSchema);