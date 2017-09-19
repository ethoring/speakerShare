const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var mixSchema = new Schema({
  name:         String,
  password:     String,
  description:  String,
  admin:        String, // Schema.Types.ObjectId
  created:      { type: Date, default: Date.now },
  mixtape:      [],
  users:        []
});

module.export = mongoose.model('MixModel', mixSchema);
