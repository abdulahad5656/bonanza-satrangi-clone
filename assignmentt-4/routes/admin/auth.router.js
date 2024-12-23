const express = require('express');
const router = express.Router();
const Admin = require('../../model/Admin');
const Products = require('../../model/product');
const Order = require('../../model/Order');
const mongoose = require('mongoose');

// Middleware to check if admin is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.adminId) {
        return next();
    }
    res.redirect('/admin/login');
};

// Home route (main website)
router.get('/', async (req, res) => {
    try {
        const product = await Products.find();
        res.render('pages/main-site-pages/home', { 
            product,
            layout: 'layout.ejs'
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Cart routes
router.get("/add-to-cart/:id", async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Verify if product exists
        const product = await Products.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Get existing cart or initialize new one
        let cart = {};
        try {
            cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : {};
        } catch (e) {
            cart = {};
        }

        // Add or increment product
        cart[productId] = (cart[productId] || 0) + 1;

        // Set cookie with stringified cart
        res.cookie('cart', JSON.stringify(cart), {
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            httpOnly: true
        });

        // Fix for deprecated redirect
        res.redirect(req.get('Referrer') || '/');
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).send('Failed to add item to cart');
    }
});

router.get("/cart", async (req, res) => {
    try {
        let cart = {};
        try {
            cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : {};
        } catch (e) {
            cart = {};
        }

        const productIds = Object.keys(cart);

        if (!productIds.length) {
            return res.render("pages/main-site-pages/cart", { 
                products: [],
                cartTotal: 0,
                layout: false 
            });
        }

        const products = await Products.find({ 
            _id: { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) }
        });

        const productsWithQuantity = products.map(product => {
            const productObj = product.toObject();
            productObj.quantity = cart[product._id.toString()];
            productObj.total = product.price * productObj.quantity;
            return productObj;
        });

        const cartTotal = productsWithQuantity.reduce((sum, product) => 
            sum + product.total, 0);

        res.render("pages/main-site-pages/cart", {
            products: productsWithQuantity,
            cartTotal,
            layout: false,
            showCheckout: true
        });
    } catch (error) {
        console.error('Cart error:', error);
        res.status(500).render("pages/main-site-pages/cart", {
            products: [],
            cartTotal: 0,
            error: 'Failed to load cart',
            layout: false
        });
    }
});

// Update cart quantity
router.post("/update-cart-quantity/:id", async (req, res) => {
    try {
        const productId = req.params.id;
        const { quantity } = req.body;
        
        if (quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        // Get current cart
        let cart = {};
        try {
            cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : {};
        } catch (e) {
            cart = {};
        }

        // Update quantity
        cart[productId] = parseInt(quantity);

        // Save updated cart
        res.cookie('cart', JSON.stringify(cart), {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Update quantity error:', error);
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

// Remove from cart
router.post("/remove-from-cart/:id", async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Get current cart
        let cart = {};
        try {
            cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : {};
        } catch (e) {
            cart = {};
        }

        // Remove item
        delete cart[productId];

        // Save updated cart
        res.cookie('cart', JSON.stringify(cart), {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Remove item error:', error);
        res.status(500).json({ error: 'Failed to remove item' });
    }
});

// Add this new route for creating orders
router.post("/create-order", async (req, res) => {
    try {
        const { shippingDetails, paymentDetails } = req.body;
        
        // Validate required fields
        if (!shippingDetails || !paymentDetails || !paymentDetails.method) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required details' 
            });
        }

        // Validate payment method
        if (!['credit', 'cod'].includes(paymentDetails.method)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid payment method' 
            });
        }

        // Additional validation for credit card payments
        if (paymentDetails.method === 'credit') {
            if (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Missing card details' 
                });
            }
        }

        let cart = {};
        try {
            cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : {};
        } catch (e) {
            cart = {};
        }

        const productIds = Object.keys(cart);
        
        if (!productIds.length) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cart is empty' 
            });
        }

        const products = await Products.find({ 
            _id: { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) }
        });
        
        // Calculate total and prepare order items
        const orderItems = products.map(product => ({
            productId: product._id,
            quantity: cart[product._id.toString()],
            price: product.price
        }));

        const subtotal = orderItems.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0);
            
        const shippingCost = subtotal >= 100 ? 0 : 10;
        const totalAmount = subtotal + shippingCost;

        // Create order
        const order = new Order({
            products: orderItems,
            subtotal,
            shippingCost,
            totalAmount,
            shippingDetails,
            paymentMethod: paymentDetails.method,
            paymentStatus: paymentDetails.method === 'cod' ? 'pending' : 'paid',
            orderNumber: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            status: 'pending'
        });

        await order.save();

        // Clear cart after successful order
        res.clearCookie('cart');
        
        res.json({ 
            success: true, 
            orderNumber: order.orderNumber 
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create order' 
        });
    }
});

// Admin routes
// Login page
router.get('/admin/login', (req, res) => {
    res.render('pages/admin/login', { layout: false});
});

// Register page
router.get('/admin/register', (req, res) => {
    res.render('pages/admin/register', { layout: false});
});

// Handle login
router.post('/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });
        
        if (!admin) {
            return res.render('pages/admin/login', { 
                error: 'Invalid credentials',
                layout: false
            });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.render('pages/admin/login', { 
                error: 'Invalid credentials',
                layout: false
            });
        }

        req.session.adminId = admin._id;
        res.redirect('/admin/dashboard');
    } catch (error) {
        res.render('pages/admin/login', { 
            error: 'Server error',
            layout: false
        });
    }
});

// Handle register
router.post('/admin/register', async (req, res) => {
    try {
        console.log('Registration attempt:', req.body);
        
        const { username, password } = req.body;
        
        if (!username || !password) {
            console.log('Missing required fields');
            return res.render('pages/admin/register', { 
                error: 'Username and password are required',
                layout: false
            });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            console.log('Username already exists');
            return res.render('pages/admin/register', { 
                error: 'Username already taken',
                layout: false
            });
        }

        const admin = new Admin({ username, password });
        await admin.save();
        console.log('Admin registered successfully');

        res.redirect('/admin/login');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('pages/admin/register', { 
            error: 'Registration failed: ' + error.message,
            layout: false
        });
    }
});

// Logout
router.get('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

module.exports = { router, isAuthenticated }; 