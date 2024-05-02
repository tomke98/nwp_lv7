let express = require("express");
let router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.redirect("http://localhost:3000/projects");
});

module.exports = router;
