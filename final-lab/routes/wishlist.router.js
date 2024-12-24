const express = require('express');
const router = express.Router();
const Wishlist = require('../model/Wishlist');
const Product = require('../model/product');

// Get wishlist page
router.get('/', async (req, res) => {
    console.log('Accessing wishlist page');
    
    if (!req.session.user) {
        console.log('User not logged in, redirecting to login');
        return res.redirect('/login');
    }

    try {
        const wishlist = await Wishlist.findOne({ user: req.session.user._id })
            .populate('products');
        
        console.log('Retrieved wishlist:', wishlist);

        res.render('pages/wishlist', {
            wishlist: wishlist ? wishlist.products : [],
            user: req.session.user,
            layout: false
        });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).render('error', { 
            message: 'Error fetching wishlist',
            error: error.message,
            layout: false
        });
    }
});

// Add to wishlist
router.post('/add/:productId', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Please login to add items to wishlist' });
    }

    try {
        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let wishlist = await Wishlist.findOne({ user: req.session.user._id });
        
        if (!wishlist) {
            wishlist = new Wishlist({
                user: req.session.user._id,
                products: [req.params.productId]
            });
        } else if (!wishlist.products.includes(req.params.productId)) {
            wishlist.products.push(req.params.productId);
        } else {
            return res.json({ message: 'Product already in wishlist' });
        }

        await wishlist.save();
        res.json({ success: true, message: 'Product added to wishlist' });
    } catch (error) {
        console.error('Wishlist error:', error);
        res.status(500).json({ message: 'Error adding to wishlist' });
    }
});

// Remove from wishlist
router.delete('/remove/:productId', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Please login to remove items from wishlist' });
    }

    try {
        const wishlist = await Wishlist.findOne({ user: req.session.user._id });
        if (wishlist) {
            wishlist.products = wishlist.products.filter(
                product => product.toString() !== req.params.productId
            );
            await wishlist.save();
            res.json({ success: true });
        } else {
            res.status(404).json({ message: 'Wishlist not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error removing from wishlist' });
    }
});

module.exports = router; 