const express = require('express');
const router = express.Router();
const User = require('../model/User');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Login page
router.get('/login', (req, res) => {
    res.render('pages/auth/login', { layout: 'layout.ejs' });
});

// Register page
router.get('/register', (req, res) => {
    res.render('pages/auth/register', { layout: 'layout.ejs' });
});

// Login POST
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('pages/auth/login', { 
                error: 'Invalid email or password',
                layout: 'layout.ejs'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('pages/auth/login', { 
                error: 'Invalid email or password',
                layout: 'layout.ejs'
            });
        }

        req.session.user = {
            _id: user._id,
            name: user.name,
            email: user.email
        };

        res.redirect('/');
    } catch (error) {
        res.render('pages/auth/login', { 
            error: 'An error occurred',
            layout: 'layout.ejs'
        });
    }
});

// Register POST
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('pages/auth/register', { 
                error: 'Email already registered',
                layout: 'layout.ejs'
            });
        }

        // Create new user
        const user = new User({ name, email, password });
        await user.save();

        req.session.user = {
            _id: user._id,
            name: user.name,
            email: user.email
        };

        res.redirect('/');
    } catch (error) {
        res.render('pages/auth/register', { 
            error: 'An error occurred',
            layout: 'layout.ejs'
        });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = { router, isAuthenticated }; 