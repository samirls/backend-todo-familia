const mongoose = require('mongoose')

const TodoItemSchema = new mongoose.Schema({
  item:{
    type: String,
    required: true
  },
  createdAt:{
    type: Date,
    default: Date.now(),
  },
  users:{
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    required: true,
  }
})

module.exports = mongoose.model('todo', TodoItemSchema);