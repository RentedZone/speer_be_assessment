const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const PORT = 3000;
const server = http.createServer(app);
const connectDB = require('./db');
// Import route
const authRoute = require('./views/routes/auth');
const dotenv = require('dotenv');
const session = require('express-session');

dotenv.config({path: './config.env'});
connectDB(); // connect to server

const SESSION_AGE = 1000 * 60 * 60 * 2; // 2 hrs

// express session
app.use(session({
    name: 'test',
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: SESSION_AGE}
}));

// Body Parser MW
app.use(express.json());
app.use(express.urlencoded({extended: false}));

// Route middlewares
app.use('/api/user', authRoute);

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}\n`));