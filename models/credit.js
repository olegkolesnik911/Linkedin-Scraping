const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({
  apiKey: {
    type: String,
    required: true
  },
  availableCredits: {
    type: Number,
    required: true
  }
});

const Credit = mongoose.model('Credit', creditSchema);

module.exports = Credit;