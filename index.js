
require("./utils.js");

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const Joi = require("joi");
const saltRounds = 15;
const expireTime = 24 * 60 * 60 * 1000;


const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;
const port = process.env.PORT || 3000;
const app = express();


app.use(express.static(__dirname + "/images")) 


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

app.get('/', (req, res) => {
    if (req.session.pageHits) { 
        req.session.pageHits++; 
    }
    else {
        req.session.pageHits = 1; 
    }
    res.send("<h1>Hello World! " + req.session.pageHits + "</h1>"); 
});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

