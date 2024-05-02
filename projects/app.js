let createError = require("http-errors");
let express = require("express");
let path = require("path");
let cookieParser = require("cookie-parser");
let logger = require("morgan");
let multer = require("multer");
let bodyParser = require("body-parser");

let db = require("./model/db");
let project = require("./model/projects");
let user = require("./model/user");

let routes = require("./routes/index");
let projects = require("./routes/projects");
let register = require("./routes/register");
let login = require("./routes/login");
let logout = require("./routes/logout");

let session = require("express-session");
let methodOverride = require("method-override");

let app = express();

//Upotreba session-a
app.use(methodOverride("X-HTTP-Method-Override"));
app.use(
  session({
    secret: "tajna rijec",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));
app.use(logger("dev"));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", routes);
app.use("/projects", projects);
app.use("/register", register);
app.use("/login", login);
app.use("/logout", logout);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: err,
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    error: {},
  });
});

module.exports = app;
