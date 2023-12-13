const app = require("./app");
const dotenv = require("dotenv");
const connectDB = require("./config/database");

app.get("/", (req, res) => {
  res.send("Working fine");
});

//Handling uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting Down the server due to uncaught Exception`);
  process.exit(1);
});

//config
dotenv.config({
  path: "config/config.env",
});

//connection with database
connectDB();

const server = app.listen(process.env.PORT, () => {
  console.log(`Server is working on port http://localhost:${process.env.PORT}`);
});

//Unhandled Promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting Down the server due to unhandled Promise Rejection`);

  server.close(() => {
    process.exit(1);
  });
});
