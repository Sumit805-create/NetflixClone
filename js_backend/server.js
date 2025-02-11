require('dotenv').config(); // Load environment variables

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

//  Debugging: Check if `.env` variables are loaded
console.log("RAZORPAY_SECRET:", process.env.RAZORPAY_SECRET ? "Loaded " : "Missing ");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Loaded " : "Missing ");

//  MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',  
    password: 'Sumit@12345',  
    database: 'netflix'
});

db.connect(err => {
    if (err) {
        console.error(' Database connection failed:', err);
    } else {
        console.log(' Connected to MySQL Database');
    }
});

//  Razorpay Instance
const razorpay = new Razorpay({
    key_id: 'rzp_test_K5Ui643gWIwneL', 
    key_secret: process.env.RAZORPAY_SECRET 
});

//  JWT Secret Key
const SECRET_KEY = process.env.JWT_SECRET || 'bd3179585909c81956bc2cc18e8388e793b1113b8946e9b4ec8caba9a5be88d8';

//  Middleware to Verify JWT Token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: ' Token required' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: ' Invalid token' });
        req.user = decoded;
        next();
    });
};

//  **1️ User Signup (Uses `email` Instead of `username`)**
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: ' Email and password required' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (email, password, subscribe) VALUES (?, ?, 0)'; // Default subscription to 0

        db.query(sql, [email, hashedPassword], (err, result) => {
            if (err) {
                console.error(" Signup error:", err);
                return res.status(500).json({ message: ' Error signing up', error: err });
            }
            res.json({ message: ' User registered successfully' });
        });
    } catch (error) {
        res.status(500).json({ message: ' Error hashing password', error });
    }
});

//  **2️ User Login (Uses `email` Instead of `username`)**
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: ' Email and password required' });

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ message: ' Error logging in', error: err });

        if (results.length > 0) {
            const user = results[0];
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: '2h' });
                res.json({ message: ' Login successful', token, subscribed: user.subscribe === 1 });
            } else {
                res.status(401).json({ message: ' Invalid credentials' });
            }
        } else {
            res.status(401).json({ message: ' User not found' });
        }
    });
});

//  **3️ Create a Razorpay Order**
app.post('/create-order', async (req, res) => {
    const { amount, currency, email } = req.body;
    if (!amount || !currency || !email) {
        return res.status(400).json({ message: " Amount, currency, and email are required" });
    }

    try {
        const options = {
            amount: amount * 100, // Convert to paise
            currency: currency,
            receipt: `order_rcptid_${Math.random().toString(36).substring(7)}`,
            payment_capture: 1
        };
        
        const order = await razorpay.orders.create(options);
        console.log(` Order Created: ${order.id} for ${email}`);
        res.json(order);
    } catch (error) {
        console.error(" Error creating Razorpay order:", error);
        res.status(500).json({ message: " Error creating order", error });
    }
});

//  **4️ Verify Payment and Store Subscription Details**
app.post('/verify-payment', (req, res) => {
    

    const { razorpay_payment_id, email } = req.body;

    if ( !razorpay_payment_id ||  !email) {
        return res.status(400).json({ message: " Invalid payment details or missing email" });
    }

    
    
    console.log(` Payment verified for user: ${email}`);

    const updateUserSubscription = 'UPDATE users SET subscribe = 1 WHERE email = ?';
    db.query(updateUserSubscription, [email], (err, result) => {
        if (err) {
            console.error(" Database error updating subscription:", err);
            return res.status(500).json({ message: " Database error", error: err });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: " User not found" });
        }
        
        res.json({ message: " Payment successful, subscription activated!" });
    });
});

// **5️ Get Movies (Protected)**
app.get('/movies', verifyToken, (req, res) => {
    const sql = 'SELECT * FROM movies';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: ' Error fetching movies', error: err });
        res.json(results);
    });
});


app.get('/movies/category', verifyToken, (req, res) => {
    const { category } = req.query;

    if (!category) {
        return res.status(400).json({ message: 'Category is required' });
    }

    const sql = 'SELECT * FROM movies WHERE category = ?';
    db.query(sql, [category], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching movies', error: err });
        res.json(results);
    });
});


// **6️ Start Server**
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
