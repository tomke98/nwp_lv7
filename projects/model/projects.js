//stvaranje projektne scheme
let mongoose = require("mongoose");
let projectSchema = new mongoose.Schema({
  projectName: String,
  projectDescription: String,
  projectPrice: String,
  projectFinishedWorks: String,
  projectStartDate: String,
  projectEndDate: String,
  projectMembers: String,
  projectAuthor: String,
  isArchived: Boolean,
});

mongoose.model("Project", projectSchema);
