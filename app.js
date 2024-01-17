const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const errorMiddleware = require("./middlewares/error");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const corsOptions ={
    //origin:'http://localhost:3000',
    origin:'https://mlm-premanandchowdhury.vercel.app', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
app.use(cors(corsOptions));


app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());



//Route Imports
const user = require("./routes/userRoute");
app.use("/api/v1",user);

app.use(errorMiddleware);




module.exports = app;