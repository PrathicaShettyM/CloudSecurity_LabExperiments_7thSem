const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json()); // convert all the text to json
app.use(express.urlencoded({extended: true})); // parse the form data

// serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// connect to PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {rejectUnauthorized: false},
});


// --- Home Page ---

app.get('/', (req, res) => {
    res.send(
        `
        <h2>SQL Injection Demo on Azure Cloud</h2>
        <p>Try <a href="/login-vulnerable.html">/login-vulnerable</a> to see SQL Injection in action (unsafe)</p>
        <p>Try <a href="/login-secure.html">/login-secure</a> to see the safe version (parameterised)</p>
        `
    );
});



// --- Vulnerable handler (uses string concatenation) ---

app.post('/login-vulnerable', async (req, res) => {
    const { username, password } = req.body;

    try {
        const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
        console.log("Executing query: ", query);

        const result = await pool.query(query);

        if(result.rows.length > 0){
            res.send('Login successful (but vulnerable to SQL Injection)!')
        } else {
            res.status(401).send('Unauthorised');
        }

    } catch (err) {
        console.log("Error: ", err);
        res.status(500).send('Server error');
    }
});


// --- Secure handler (parameterised) ---
app.post('/login-secure', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE username=$1 AND password=$2", [username, password]
        );

        if(result.rows.length > 0){
            res.send('Login successful (safe from SQL Injection)!');
        } else {
            res.status(401).send('Unauthorised');
        }

    } catch (err) {
        console.log("Error: ", err);
        res.status(500).send('Server error')
    }
});


