const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const { MongoClient } = require('mongodb');

const app = express();

// Load environment variables from .env file
require('dotenv').config();

const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;
const mongoSessionSecret = process.env.MONGODB_SESSION_SECRET;
const nodeSessionSecret = process.env.NODE_SESSION_SECRET;

async function connectToMongo() {
  const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  
  try {
    await client.connect();
    console.log('Connected to MongoDB!');
    
    // Configure session middleware
    app.use(session({
      secret: nodeSessionSecret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: mongoUri,
        crypto: {
          secret: mongoSessionSecret
        }
      }),
      cookie: {
        maxAge: 24 * 60 * 60 * 1000 // Session expiration (1 day)
      }
    }));

    app.use(express.urlencoded({extended: false}));
    app.use(express.static(__dirname + "/public")) 

    // Example usage: Protecting a route with session authentication
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    // User is logged in
    const { username } = req.session.user;
    res.send(`
      <p>Hello, ${username}!</p>
      <button onclick="window.location='/members'">Members Area</button>
      <button onclick="window.location='/logout'">Logout</button>
    `);
  } else {
    // User is not logged in
    res.send(`
      <h1>Welcome to My App!</h1>
      <p>Choose an action:</p>
      <button onclick="window.location='/signup'">Sign Up</button>
      <button onclick="window.location='/login'">Login</button>
    `);
  }
});


    // Route for rendering the members area (requires authentication)
    app.get('/members', (req, res) => {
      if (req.session && req.session.user) {
        const { username } = req.session.user;
        res.send(`
            <h1>Hello, ${username}.</h1>

            <button onclick="window.location='/logout'">Logout</button>
        `);
      } else {
        res.status(401).send('Unauthorized. Please log in to access this page.');
      }
    });

    // Route for logging out (clear session and redirect to home page)
    app.get('/logout', (req, res) => {
      req.session.destroy(err => {
        if (err) {
          console.error('Error destroying session:', err);
        }
        res.redirect('/');
      });
    });

    // Route for rendering signup form
    app.get('/signup', (req, res) => {
      res.send(`
        <h1>Sign Up</h1>
        <form action="/signup" method="POST">
          <input type="text" name="username" placeholder="Username" required><br>
          <input type="email" name="email" placeholder="Email" required><br>
          <input type="password" name="password" placeholder="Password" required><br>
          <button type="submit">Sign Up</button>
        </form>
      `);
    });

    // Route for processing signup form submission
    app.post('/signup', async (req, res) => {
      const { username, email, password } = req.body;
      const usersCollection = client.db().collection('users');
      try {
        await usersCollection.insertOne({ username, email, password });
        res.send('User registered successfully!');
      } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).send('Failed to register user');
      }
    });

    // Route for rendering login form
    app.get('/login', (req, res) => {
      res.send(`
        <h1>Login</h1>
        <form action="/login" method="POST">
          <input type="text" name="username" placeholder="Username" required>
          <input type="password" name="password" placeholder="Password" required>
          <button type="submit">Login</button>
        </form>
      `);
    });

    // Route for processing login form submission
    app.post('/login', async (req, res) => {
      const { username, password } = req.body;
      const usersCollection = client.db().collection('users');
      const user = await usersCollection.findOne({ username, password });

      if (user) {
        req.session.user = user; // Store user in session
        res.send('Login successful!');
      } else {
        res.status(401).send('Invalid username or password');
      }
    });

    // Route for handling 404 Not Found
    app.get('*', (req, res) => {
      res.status(404).send('Page not found - 404');
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

  } catch (err) {
    console.error("Connection error:", err);
    process.exit(1); // Exit with error if connection fails
  }
}

connectToMongo().catch(console.error);
