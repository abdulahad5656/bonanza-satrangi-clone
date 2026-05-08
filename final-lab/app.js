const path = require("path");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");

const { router: adminAuthRouter, isAuthenticated: isAdminAuthenticated } = require("./routes/admin/auth.router");
const wishlistRouter = require("./routes/wishlist.router");
const { router: authRouter } = require("./routes/auth.router");
const productsRouter = require("./routes/admin/products.router");

const app = express();

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(cookieParser());
app.use(flash());

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "uploads")));
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.messages = {
    error: req.flash("error"),
    success: req.flash("success"),
  };
  next();
});

app.use("/wishlist", wishlistRouter);
app.use(authRouter);
app.use(adminAuthRouter);

app.use("/admin/dashboard", isAdminAuthenticated);
app.use("/admin/products", isAdminAuthenticated);
app.use("/admin/categories", isAdminAuthenticated);

app.use(productsRouter);

const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  mongoose
    .connect(mongoUri)
    .then(() => {
      // eslint-disable-next-line no-console
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("MongoDB connection error:", err);
    });
} else {
  // eslint-disable-next-line no-console
  console.warn("MONGODB_URI is not set; skipping MongoDB connection.");
}

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err.stack);
  res.status(500).render("error", {
    message: "Something broke!",
    error: process.env.NODE_ENV === "development" ? err : {},
    layout: "layout.ejs",
  });
});

module.exports = app;

