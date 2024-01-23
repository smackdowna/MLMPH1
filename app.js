const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const errorMiddleware = require("./middlewares/error");
const cookieParser = require("cookie-parser");
const cors = require("cors");

app.use(
    cors({
      origin: 'http://shreegoudham.com/',
      credentials: true,
      methods: ["GET", "POST", "DELETE", "PUT"],
    })
  );


app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());



//Route Imports
const user = require("./routes/userRoute");
app.use("/api/v1",user);

app.use(errorMiddleware);




module.exports = app;