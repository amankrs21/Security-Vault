require("dotenv").config();
const cors = require("cors");
const express = require("express");

const router = require("./src/app.router.js");
const mongoConnect = require("./src/db.config.js");

const app = express();
const port = process.env.PORT;

// Disable x-powered-by header to prevent version disclosure
app.disable("x-powered-by");

// command to parse the incoming request
app.use(express.json());


// check if all the keys are provided
if (!process.env.MONGO_URL || !process.env.SECRET_KEY || !process.env.PASSWORD_KEY) {
    console.error("Please provide all the .env keys!!");
    console.error("MONGO_URI, SECRET_KEY, PASSWORD_KEY");
    process.exit(1);
}


// connect to the database
mongoConnect();


// Middleware to log all the requests
app.use((req, res, next) => {
    console.log(`${Date().slice(0, 24)} => (${req.method}) http://${req.ip.slice(7)}${req.url}`);
    next()
})


// Middleware to handle errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


// setting up cors
const allowedOrigins = [
    "http://localhost:5173",
    "http://192.168.1.38:5173",
    "https://securevault.pages.dev"
]
const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
};
app.use(cors(corsOptions))


// setting up router
app.use("/api", router);
app.get("/", (req, res) => { res.send("Secure-Vault Server is up and running!!"); });


// setting up the server locally run
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at => http://localhost:${port}/`);
});
