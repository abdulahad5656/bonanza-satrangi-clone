// routes/admin.js
const express = require('express');
const router = express.Router();
let multer  = require("multer")


let Product = require("../../model/product");

const Category = require('../../model/Category'); // New schema

const storage = multer.diskStorage({
  destination: function(req , file , cb){
      cb(null,"./uploads")
  },
  filename: function(req , file , cb){
      cb(null, `${Date.now()}-${file.originalname}`)
  }
})

const upload = multer({ storage: storage });

// Categories route with pagination
router.get('/categories', async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Get the current page from query params, default to 1
  const limit = 10; // Number of items per page
  const skip = (page - 1) * limit; // Calculate items to skip

  try {
      // Fetch categories with pagination
      const categories = await Category.find()
          .skip(skip)
          .limit(limit);

      // Total count of categories
      const totalCategories = await Category.countDocuments();

      // Total pages
      const totalPages = Math.ceil(totalCategories / limit);

      res.render('pages/admin/categories', {
          categories,
          currentPage: page,
          totalPages,
          title: 'Categories', // Pass the title here
          layout:'admin-layout.ejs'
      });
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});


// // View all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.render('pages/admin/categories', {layout: 'admin-layout.ejs',categories});
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Create category form
router.get('/categories/create', (req, res) => {
  res.render('pages/admin/create-categories',{layout: 'admin-layout.ejs'});
});

// Handle category creation
router.post('/categories/create', async (req, res) => {
  const { name } = req.body;
  try {
    await Category.create({ name });
    res.redirect('/categories');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Edit category form
router.get('/categories/edit/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    res.render('pages/admin/edit-category', {layout: 'admin-layout.ejs',category});
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Handle category update
router.post('/categories/edit/:id', async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.params,req.body.name);
    res.redirect('/categories');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Handle category deletion
router.get('/categories/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Category.findByIdAndDelete(id);
    res.redirect('/categories');
  } catch (error) {
    res.status(500).send(error.message);
  }
});






router.post("/admin/create",upload.single("file"),async (req,res)=>{
    let newProduct = new Product(req.body);
    if (req.file) newProduct.picture = req.file.filename;
    newProduct.isFeatured = Boolean(req.body.isFeatured);
    
    await newProduct.save();
    return res.redirect("/admin/products");
})

// Dashboard
router.get('/admin/dashboard', (req, res) => {
  res.render('pages/admin/dashboard', { title: 'Dashboard', layout: 'admin-layout.ejs' });
});


// Create Product
router.get('/admin/create', (req, res) => {
  res.render('pages/admin/create', { title: 'create page' ,layout: 'admin-layout.ejs' });
});
//producttslist
// router.get('/admin/product', async (req, res) => {
//   try {
//     const products = await Product.find();  // Fetch products from MongoDB
//     res.render('pages/admin/product', {
//       products, 
//       layout: 'admin-layout.ejs',
//       title: 'Product Management'  // Add this line
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Server Error');
//   }
// });
// Edit Product
// Edit category form
// Get the product to edit
router.get('/admin/products/edit/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.redirect('/admin/products'); // Redirect if product not found
    }
    res.render('pages/admin/edit', { product,layout:'admin-layout.ejs' });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.redirect('/admin/products'); // Redirect on error
  }
});

// Update the product
router.post('/admin/products/edit/:id', async (req, res) => {
  const { name, price, category, picture } = req.body;
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, category, picture },
      { new: true } // Return updated document
    );

    if (!updatedProduct) {
      return res.redirect('/admin/products'); // Redirect if update fails
    }

    // Redirect to product list after successful update
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Error updating product:', err);
    res.redirect('/admin/products'); // Redirect on error
  }
});

router.get('/admin/products/delete/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    // Find and delete the product from the database
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      // Redirect with an error message in the query string
      return res.redirect('/admin/products?error=Product not found');
    }

    // Redirect with a success message in the query string
    res.redirect('/admin/products?success=Product "${deletedProduct.name}" deleted successfully');
  } catch (err) {
    console.error('Error deleting product:', err.message);
    res.redirect('/admin/products?error=An error occurred while deleting the product');
  }
});







router.get("/admin/products/:page?", async (req, res) => {
  let page = req.params.page ? Number(req.params.page) : 1;
  let pageSize = 2;
  let products = await Product.find().limit(pageSize).skip((page - 1) * pageSize);
  let totalRecords = await Product.countDocuments();
  let totalPages = Math.ceil(totalRecords / pageSize);
  res.render("pages/admin/product", {layout: "admin-layout.ejs",products,page,totalRecords,totalPages
});
});



module.exports = router;
