let express = require("express");
let router = express.Router();

//uništavanje sesije i preusmjeravanje na login stranicu
router.route("/").get(function (req, res, next) {
  req.session.destroy();
  res.redirect("/login");
});

module.exports = router;
