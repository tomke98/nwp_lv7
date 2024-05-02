let express = require("express");
let router = express.Router();
let mongoose = require("mongoose"); //mongo connection
let bodyParser = require("body-parser"); //parses information from POST
let methodOverride = require("method-override"); //used to manipulate POST

//Any requests to this controller must pass through this 'use' function
//Copy and pasted from method-override
router.use(bodyParser.urlencoded({ extended: true }));
router.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method;
      delete req.body._method;
      return method;
    }
  })
);

router
  .route("/")
  .get(function (req, res, next) {
    const data = {
      email: "",
      password: "",
    };

    res.render("login/index", {
      data: data,
      title: "Login",
    });
  })
  .post(function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    const data = {
      email: email,
      password: password,
    };
    //retrieve the user
    mongoose
      .model("User")
      .findOne({ email: email, password: password }, function (err, user) {
        if (err) {
          return console.error(err);
        } else {
          if (user) {
            req.session.uid = user.id;
            res.redirect("/");
          } else {
            const error = "Invalid user";
            res.format({
              html: function () {
                res.render("login/index", {
                  error: error,
                  data: data,
                  title: "Prijava korisnika",
                });
              },
            });
          }
        }
      });
  });

module.exports = router;
