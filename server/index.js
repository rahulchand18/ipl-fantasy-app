const express = require("express");
const path = require("path");
const hbs = require("hbs");
const bcrypt = require("bcryptjs");
const cron = require("node-cron");
const session = require("express-session");
const multer = require("multer");
const salt = bcrypt.genSaltSync(10);
const router = require("./routes/router");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const mongooseConnect = require("./db/conn");
const morgan = require("morgan");
const logStdout = process.stdout;
const util = require("util");

// const User = require('./models/user');
// const { editSaveController } = require('./controllers/user.controller');
// const Uservevar http = require("http");

const static_path = path.join(__dirname, "./templates/static");
const template = path.join(__dirname, "./templates/views");
const partials_path = path.join(__dirname, "./templates/partials");
app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views", template);
hbs.registerPartials(partials_path);
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);
const whitelist = ["https://amsfront.javra.com", "http://localhost:4200"];
// const corsOptions = {
//   credentials: true,
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
// };
const corsOptions = {
  credentials: true,
  origin: true,
};
app.use(cors(corsOptions));

//Setting UP Multer for image
app.use(morgan(":method :url :status :response-time :date"));

console.log = function () {
  logStdout.write(
    new Date().toString() + "  " + util.format.apply(null, arguments) + "\n"
  );
};

app.use("", router);

console.log("Connecting To Database...");
mongooseConnect().then(() => {
  app.listen(3000, () => {
    console.log("Server started at port 3000");
  });
});
