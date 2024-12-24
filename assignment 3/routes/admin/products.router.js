const express = require("express");
let router = express.Router();
router.get("/admin/dashboard", (req, res) => {
  res.render("admin/dashboard", { layout: "admin/admin-layout" });
});
router.get("/admin/products", (req, res) => {
  let products = [
    {
      title: "Pencil",
      description: "This is fine pencil",
      price: 500,
      isFeatured: true,
    },
    {
      title: "Red Pencil",
      description: "This is fine red pencil",
      price: 600,
      isFeatured: true,
    },
  ];
  res.render("admin/products", { layout: "admin/admin-layout", products });
});
module.exports = router;