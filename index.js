const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
var cors = require("cors");
// var ejs = require("ejs");

require("dotenv").config();

const app = express();
// app.set("view engine", "ejs");

app.use("/", express.static(__dirname + "/frontend"));

app.listen(8080);

app.use(morgan("tiny"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 5000;

const admin = require("./api/routes/admin");
const user = require("./api/routes/user");
const auth = require("./api/middlewares/auth");
// middleware
app.use("/api/auth", auth);

app.use("/api/admin", admin);
app.use("/api/user", user);

app.listen(port, () => {
    console.log(`server started in port : ${port}`);
});

mongoose
    .connect("mongodb://localhost:27017/ppauth", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
    .then(() => {
        console.log('connected to "ppauth" db');
    })
    .catch(err => {
        console.log(err);
    });
