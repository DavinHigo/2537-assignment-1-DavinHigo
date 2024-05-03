require("./utils.js");
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

const saltRounds = 12;
const port = process.env.PORT || 3000;
const app = express();

const Joi = require("joi");

const expireTime = 24 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;
//end of secret

app.use(express.static(__dirname + "/public")) 


var {database} = include('databaseConnection');
const userCollection = database.db(mongodb_database).collection('users');

app.use(express.urlencoded({extended: false}));

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
	crypto: {
		secret: mongodb_session_secret
	}
})

app.use(session({ 
    secret: node_session_secret,
	store: mongoStore, //default is memory store 
	saveUninitialized: false, 
	resave: true,
    cookie: {
        maxAge: expireTime // Session expires after 24 hours
      }
}
));

// Home Page
app.get('/', (req, res) => {
    if (req.session.user) {
        // User is logged in
        res.send(`Hello, ${req.session.user.name}!<br><a href="/members">Members Area</a> | <a href="/logout">Logout</a>`);
    } else {
        // User is not logged in
        res.send(`
            <form action="/signup" method="GET">
                <button type="submit">Sign Up</button>
            </form>
            <form action="/login" method="GET">
                <button type="submit">Log In</button>
            </form>
        `);
    }
});


// Handle signup form submission
app.get('/signup', (req, res) => {
    res.send(`
        <p>Sign Up</p>
        <form action="/signupsubmit" method="POST">
            Name: <input type="text" name="name"><br>
            Email: <input type="email" name="email"><br>
            Password: <input type="password" name="password"><br>
            <button type="submit">Sign Up</button>
        </form>
    `);
});

// Handle login form submission
app.get('/login', (req, res) => {
    res.send(`
        <p>Log In</p>
        <form action="/loginsubmit" method="POST">
            Email: <input type="email" name="email"><br>
            Password: <input type="password" name="password"><br>
            <button type="submit">Log In</button>
        </form>
    `);
});


// Handle signup form submission
app.post('/signupsubmit', (req, res) => {
    const { name, email, password } = req.body;
    const errors = [];

    // Check for missing fields
    if (!name) {
        errors.push('Name is required');
    }
    if (!email) {
        errors.push('Email is required');
    }
    if (!password) {
        errors.push('Password is required');
    }

    // If there are errors, render the signup form with error messages and retry link
    if (errors.length > 0) {
        return res.send(`
            <p style="color: red;">${errors.join(', ')}</p>
            <a href="/signup">Try again</a> <!-- Link to refresh the page -->
        `);
    }

    // Assuming you have a User model and database interaction
    const user = { name, email, password };
    req.session.user = user; // Store user in session

    res.redirect('/');
});


// Handle login form submission
app.post('/loginsubmit', (req, res) => {
    const { email, password } = req.body;
    const errors = [];

    // Check for missing fields
    if (!email || !password) {
        errors.push('Email/Password is invalid');
    }

    // If there are errors, render the login form with error messages and retry link
    if (errors.length > 0) {
        return res.send(`
            <p style="color: red;">${errors.join(', ')}</p>
            <a href="/login">Try again</a> <!-- Link to refresh the page -->
        `);
    }

    // Implement authentication logic (e.g., check against database)
    // Assuming authentication is successful
    const user = { name: 'Fernandez', email };
    req.session.user = user; // Store user in session

    res.redirect('/');
});








// Members Area
app.get('/members', (req, res) => {
    if (req.session.user) {
        // Display members area if user is logged in
        res.send('Members Area');
    } else {
        // Redirect to login if user is not logged in
        res.redirect('/login');
    }
}); 

// Logout
app.get('/logout', (req, res) => {
    // Destroy session and redirect to home page
    req.session.destroy((err) => {
        if (err) {
            return res.send('Error logging out');
        }
        res.redirect('/');
    });
});


//Bottom (404, Port)
app.get("*", (req,res) => {
    res.status(404);
    res.send("Page not found - 404");
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

