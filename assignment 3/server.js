const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");


// Middleware to parse body data for form submission
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(expressLayouts);


// Set static folder for serving static files (like CSS, images, etc.)


// Set view engine to EJS
app.set("view engine", "ejs");




// Route for the landing page
app.get("/", (req, res) => {
    res.render("pages/main-site-pages/home", {title: "Home Page" });
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
