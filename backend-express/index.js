require("dotenv").config();
const cors = require("cors");
const express = require("express");

const mongoConnect = require("./mongoConfig.js");
const router = require("./Router/Router.js");

const app = express();
const port = 3000;

// command to parse the incoming request
app.use(express.json());


// check if all the keys are provided
if (!process.env.MONGO_URI || !process.env.SECRET_KEY || !process.env.PASSWORD_KEY) {
    console.error("Please provide all the .env keys!!");
    console.error("MONGO_URI, SECRET_KEY, PASSWORD_KEY");
    process.exit(1);
}


// connect to the database
mongoConnect();


// // Middleware to log all the requests
// app.use((req, res, next) => {
//     console.log(`${Date().slice(0, 24)} => (${req.method}) http://${req.ip.slice(7)}${req.url}`);
//     next()
// })


// setting up cors
const allowedOrigins = [
    "https://securevault.pages.dev"
]
const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
};
app.use(cors(corsOptions))


// setting up router
app.use("/api", router);


// // setting up the server locally run
// app.listen(port, '0.0.0.0', () => {
//     console.log(`Server running at => http://localhost:${port}/`);
// });


// setting up the server for production
app.listen(port, () => {
    console.log(`Server started on the PORT - ${port}/`);
});
