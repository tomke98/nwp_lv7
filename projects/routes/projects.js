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

//arhivirani projekti korisnika
router.route("/archive").get(function (req, res, next) {
  if (redirectIfNotLoggedIn(req, res)) return;

  const uid = req.session.uid.toString();

  mongoose.model("User").findById(uid, function (err, user) {
    if (err) {
      return console.error(err);
    } else {
      mongoose.model("Project").find(
        {
          isArchived: true,
          $or: [
            { projectAuthor: uid },
            { projectMembers: { $regex: user.username, $options: "i" } },
          ],
        },
        function (err, projects) {
          if (err) {
            return console.error(err);
          } else {
            res.format({
              html: function () {
                res.render("projects/archive", {
                  title: "Moji arhivirani projekti",
                  projects: projects,
                });
              },
              json: function () {
                res.json(projects);
              },
            });
          }
        }
      );
    }
  });
});

//korisnikovi projekti (na kojima je voditelj i na kojima je član)
router.route("/myprojects").get(function (req, res, next) {
  if (redirectIfNotLoggedIn(req, res)) return;

  const uid = req.session.uid.toString();

  mongoose.model("User").findById(uid, function (err, user) {
    if (err) {
      return console.error(err);
    } else {
      mongoose
        .model("Project")
        .find({ projectAuthor: uid }, function (err, leaderProjects) {
          if (err) {
            return console.error(err);
          } else {
            mongoose
              .model("Project")
              .find(
                { projectMembers: { $regex: user.username, $options: "i" } },
                function (err, memberProjects) {
                  if (err) {
                    return console.error(err);
                  } else {
                    res.format({
                      html: function () {
                        res.render("projects/myprojects", {
                          title: "Moji projekti",
                          leaderProjects: leaderProjects,
                          memberProjects: memberProjects,
                        });
                      },
                      json: function () {
                        res.json(leaderProjects);
                        res.json(memberProjects);
                      },
                    });
                  }
                }
              );
          }
        });
    }
  });
});

//DELETE a Project by ID
router.route("/delete/:id").delete(function (req, res) {
  if (redirectIfNotLoggedIn(req, res)) return;

  mongoose.model("Project").findById(req.params.id, function (err, project) {
    //find blob by ID
    if (err) {
      return console.error(err);
    } else {
      //remove it from Mongo
      project.remove(function (err, project) {
        if (err) {
          return console.error(err);
        } else {
          //Returning success messages saying it was deleted
          console.log("DELETE removing ID: " + project._id);
          res.format({
            //HTML returns us back to the main page, or you can create a success page
            html: function () {
              res.redirect("/projects/myprojects");
            },
            //JSON returns the item with the message that is has been deleted
            json: function () {
              res.json({
                message: "deleted",
                item: project,
              });
            },
          });
        }
      });
    }
  });
});

router
  .route("/")
  //GET all projects
  .get(function (req, res, next) {
    //retrieve all projects from Monogo
    if (redirectIfNotLoggedIn(req, res)) return;

    mongoose.model("Project").find({}, function (err, projects) {
      if (err) {
        return console.error(err);
      } else {
        //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
        mongoose.model("User").find({}, function (err, users) {
          if (err) {
            return console.error(err);
          } else {
            for (project of projects) {
              for (user of users) {
                if (project.projectAuthor == user._id) {
                  project.authorName = user.username;
                  break;
                }
              }
            }

            res.format({
              //HTML response will render the index.jade file in the views/projects folder. We are also setting "projects" to be an accessible variable in our jade view
              html: function () {
                res.render("projects/index", {
                  title: "Projects",
                  projects: projects,
                });
              },
              //JSON response will show all projects in JSON format
              json: function () {
                res.json(projects);
              },
            });
          }
        });
      }
    });
  })
  //POST a new project
  .post(function (req, res) {
    if (redirectIfNotLoggedIn(req, res)) return;
    // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
    const projectName = req.body.projectName;
    const projectDescription = req.body.projectDescription;
    const projectPrice = req.body.projectPrice;
    const _members = req.param("projectMember");
    let projectMembers;
    if (typeof _members === "undefined") {
      projectMembers = "";
    } else {
      projectMembers = _members.toString();
    }
    const projectFinishedWorks = req.body.projectFinishedWorks;
    const projectStartDate = req.body.projectStartDate;
    const projectEndDate = req.body.projectEndDate;
    const isArchived = req.body.isArchived === "on";
    const projectAuthor = req.session.uid;

    mongoose.model("Project").create(
      {
        projectName: projectName,
        projectDescription: projectDescription,
        projectPrice: projectPrice,
        projectMembers: projectMembers,
        projectFinishedWorks: projectFinishedWorks,
        projectStartDate: projectStartDate,
        projectEndDate: projectEndDate,
        isArchived: isArchived,
        projectAuthor: projectAuthor,
      },
      function (err, project) {
        if (err) {
          res.send(
            "There was a problem adding the information to the database."
          );
        } else {
          //Project has been created
          console.log("POST creating new project: " + project);
          res.format({
            //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
            html: function () {
              // If it worked, set the header so the address bar doesn't still say /adduser
              res.location("projects");
              // And forward to success page
              res.redirect("/projects");
            },
            json: function () {
              res.json(project);
            },
          });
        }
      }
    );
  });

router.get("/new", function (req, res) {
  if (redirectIfNotLoggedIn(req, res)) return;

  const uid = req.session.uid.toString();

  mongoose.model("User").find({ _id: { $ne: uid } }, function (err, users) {
    if (err) {
      console.log("GET Error: There was a problem retrieving: " + err);
    } else {
      res.render("projects/new", {
        title: "Dodaj novi projekt",
        users: users,
      });
    }
  });
});

router.route("/:id").get(function (req, res) {
  if (redirectIfNotLoggedIn(req, res)) return;

  const uid = req.session.uid.toString();

  mongoose.model("User").findById(uid, function (err, user) {
    if (err) {
      return console.error(err);
    } else {
      mongoose
        .model("Project")
        .findById(req.params.id, function (err, project) {
          if (err) {
            console.log("GET Error: There was a problem retrieving: " + err);
          } else {
            res.format({
              html: function () {
                res.render("projects/show", {
                  project: project,
                  projectAuthor: user.username,
                  title: "Detalji projekta",
                });
              },
              json: function () {
                res.json(project);
              },
            });
          }
        });
    }
  });
});

router
  .route("/edit/:id")
  //GET the individual project by Mongo ID
  .get(function (req, res) {
    if (redirectIfNotLoggedIn(req, res)) return;

    const uid = req.session.uid.toString();

    mongoose.model("User").find({ _id: { $ne: uid } }, function (err, users) {
      if (err) {
        console.log("GET Error: There was a problem retrieving: " + err);
      } else {
        mongoose
          .model("Project")
          .findById(req.params.id, function (err, project) {
            if (err) {
              console.log("GET Error: There was a problem retrieving: " + err);
            } else {
              for (user of users) {
                const members = project.projectMembers;
                if (members === "" || members === null) {
                  user.checked = false;
                } else {
                  user.checked = members.includes(user.username);
                }
              }

              res.format({
                //HTML response will render the 'edit.jade' template
                html: function () {
                  res.render("projects/edit", {
                    title: "Project: " + project._id,
                    project: project,
                    users: users,
                    title: "Edit",
                  });
                },
                //JSON response will return the JSON output
                json: function () {
                  res.json(project);
                  res.json(users);
                },
              });
            }
          });
      }
    });
  })
  //PUT to update a project by ID
  .put(function (req, res) {
    if (redirectIfNotLoggedIn(req, res)) return;
    // Get our REST or form values. These rely on the "name" attributes
    const projectName = req.body.projectName;
    const projectDescription = req.body.projectDescription;
    const projectPrice = req.body.projectPrice;
    const _members = req.param("projectMember");
    let projectMembers;
    if (typeof _members === "undefined") {
      projectMembers = "";
    } else {
      projectMembers = _members.toString();
    }
    const projectFinishedWorks = req.body.projectFinishedWorks;
    const projectStartDate = req.body.projectStartDate;
    const projectEndDate = req.body.projectEndDate;
    const isArchived = req.body.isArchived === "on";

    mongoose.model("Project").findById(req.params.id, function (err, project) {
      project.update(
        {
          projectName: projectName,
          projectDescription: projectDescription,
          projectPrice: projectPrice,
          projectMembers: projectMembers,
          projectFinishedWorks: projectFinishedWorks,
          projectStartDate: projectStartDate,
          projectEndDate: projectEndDate,
          isArchived: isArchived,
        },
        function (err, projectId) {
          if (err) {
            res.send(
              "There was a problem updating the information to the database: " +
                err
            );
          } else {
            res.format({
              html: function () {
                res.redirect("/projects/myprojects");
              },
            });
          }
        }
      );
    });
  });

router
  .route("/editMember/:id")
  .get(function (req, res) {
    if (redirectIfNotLoggedIn(req, res)) return;

    const uid = req.session.uid.toString();

    mongoose.model("User").find({ _id: { $ne: uid } }, function (err, users) {
      if (err) {
        console.log("GET Error: There was a problem retrieving: " + err);
      } else {
        mongoose
          .model("Project")
          .findById(req.params.id, function (err, project) {
            if (err) {
              console.log("GET Error: There was a problem retrieving: " + err);
            } else {
              for (user of users) {
                const members = project.projectMembers;
                if (members === "" || members === null) {
                  user.checked = false;
                } else {
                  user.checked = members.includes(user.username);
                }
              }

              res.format({
                html: function () {
                  res.render("projects/edit_member", {
                    title: "Project: " + project._id,
                    project: project,
                    users: users,
                    title: "Edit",
                  });
                },
                json: function () {
                  res.json(project);
                  res.json(users);
                },
              });
            }
          });
      }
    });
  })
  .put(function (req, res) {
    if (redirectIfNotLoggedIn(req, res)) return;

    const projectFinishedWorks = req.body.projectFinishedWorks;

    mongoose.model("Project").findById(req.params.id, function (err, project) {
      project.update(
        {
          projectFinishedWorks: projectFinishedWorks,
        },
        function (err, projectId) {
          if (err) {
            res.send(
              "There was a problem updating the information to the database: " +
                err
            );
          } else {
            res.format({
              html: function () {
                res.redirect("/projects/myprojects");
              },
            });
          }
        }
      );
    });
  });

function redirectIfNotLoggedIn(req, res) {
  if (!req.session.uid) {
    res.redirect("/login");
    return true;
  }
  return false;
}

module.exports = router;
