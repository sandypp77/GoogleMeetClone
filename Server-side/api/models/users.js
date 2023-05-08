const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    username: String,
    password: String,
    joined: { type: Date, default: Date.now },
})

module.exports = mongoose.model("User", userSchema)