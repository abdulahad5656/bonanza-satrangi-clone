const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");

// Middleware to parse body data for form submission
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
// Use EJS layouts
app.use(expressLayouts);
app.use(express.static("uploads"));

// Set static folder for serving static files (like CSS, images, etc.)


// Set view engine to EJS
app.set("view engine", "ejs");

// MongoDB connection (IPv4 version)
const connectionString = "mongodb://127.0.0.1:27017/saphire";

mongoose.connect(connectionString, {
    // Optional parameters for clarity and potential backward compatibility
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log(`Connected to MongoDB at: ${connectionString}`);
})
.catch((err) => {
    console.error("MongoDB connection error:", err);
});

// Routes (Importing the router for the admin products)
const productsRouter = require("./routes/admin/products.router");
app.use( productsRouter);  // Add a base path for admin product routes

// Route for the landing page
app.get("/", (req, res) => {
    res.render("pages/main-site-pages/home", { title: "Home Page" });
});

app.get("/cv", (req, res) => {
    res.render("pages/main-site-pages/cv", { title: "cv Page" });
});

// Additional example routes can be added here...

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
