//spajanje na MongoDb server
let mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/projects", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
