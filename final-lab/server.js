const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { router: adminAuthRouter, isAuthenticated } = require('./routes/admin/auth.router');
const wishlistRouter = require('./routes/wishlist.router');
const { router: authRouter } = require('./routes/auth.router');

// Body parser middleware - this should come BEFORE routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration - use only ONE session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(cookieParser());

// Static files and view engine setup
app.use(express.static("public"));
app.use(express.static("uploads"));
app.use(expressLayouts);
app.set("view engine", "ejs");

// Move the user middleware before all routes
// Add this right after session configuration
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// Routes
app.use('/wishlist', wishlistRouter);
app.use(authRouter);
app.use(adminAuthRouter);

// Protect admin routes
app.use('/admin/dashboard', isAuthenticated);
app.use('/admin/products', isAuthenticated);
app.use('/admin/categories', isAuthenticated);

// Other routes and middleware...
const productsRouter = require("./routes/admin/products.router");
app.use(productsRouter);

// Add this after other route configurations
app.use(wishlistRouter);

// Add this with other app.use statements
app.use(authRouter);

// Add this middleware before your routes
app.use((req, res, next) => {
    // Make user data available to all views
    res.locals.user = req.session.user;
    // Add flash messages if you're using them
    res.locals.messages = {
        error: req.flash('error'),
        success: req.flash('success')
    };
    next();
});

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/saphire")
.then(() => {
    console.log("Connected to MongoDB");
})
.catch((err) => {
    console.error("MongoDB connection error:", err);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        message: 'Something broke!',
        error: process.env.NODE_ENV === 'development' ? err : {},
        layout: 'layout.ejs'
    });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});