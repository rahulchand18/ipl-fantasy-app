const mongoose = require("mongoose");
const connect = () => {
  return mongoose
    .connect("mongodb://amss-db:27017/Registration", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Connection Successful");
    })
    .catch((error) => {
      console.log("Error while connecting to database\n", error);
      setTimeout(() => {
        console.log("Trying reconnecting to database..");
        connect();
      }, 3000);
    });
};

module.exports = connect;
