//stvaranje korisničke scheme
let mongoose = require("mongoose");
let userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

mongoose.model("User", userSchema);
