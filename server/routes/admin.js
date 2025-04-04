const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const adminLayout = 'layouts/admin';
const jwtSecret = process.env.JWT_SECRET;

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
});

// Create the Multer instance with storage, file filter, and size limit
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (jpg, png, gif) are allowed'));
        }
    },
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit
}); 

// Middleware to check login and admin role
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden: Admins only' });
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
    }
};

// GET /admin - Admin login page
router.get('/admin', async (req, res) => {
    try {
        const locals = { title: "Admin", description: "Simple Blog created with NodeJs, Express & MongoDb." };
        res.render('admin/index', { locals, layout: adminLayout });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

// POST /admin - Check login
router.post('/admin', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid || user.role !== 'admin') return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret);
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

// GET /dashboard - Admin dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const locals = { title: "Dashboard", description: "Simple Blog created with NodeJs, Express & MongoDb." };
        const data = await Post.find();
        res.render('admin/dashboard', { locals, data, layout: adminLayout });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

// GET /add-post - Create new post page
router.get('/add-post', authMiddleware, async (req, res) => {
    try {
        const locals = { title: "Add Post", description: "Simple Blog created with NodeJs, Express & MongoDb." };
        const data = await Post.find();
        res.render('admin/add-post', { locals, data, layout: adminLayout });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle post creation with image upload
router.post('/add-post', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { title, body } = req.body;
        if (!title || !body) {
            return res.status(400).json({ message: 'Title and body are required' });
        }

        // Construct the image URL if a file was uploaded
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        // Create and save the new post
        const newPost = new Post({
            title,
            body,
            imageUrl,
            author: req.userId
        });
        await newPost.save(); // Using save() instead of create() for consistency with newPost object

        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

// GET /edit-post/:id - Edit post page
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        const locals = { title: "Edit Post", description: "Simple Blog created with NodeJs, Express & MongoDb." };
        const data = await Post.findOne({ _id: req.params.id });
        res.render('admin/edit-post', { locals, data, layout: adminLayout });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

// PUT /edit-post/:id - Update post with optional image upload
router.put('/edit-post/:id', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { title, body } = req.body;
        const postId = req.params.id;

        if (!title || !body) {
            return res.status(400).json({ message: 'Title and body are required' });
        }

        // Prepare update data
        const updateData = {
            title,
            body,
            updatedAt: Date.now()
        };

        // If a new image is uploaded, add its URL to the update data
        if (req.file) {
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const updatedPost = await Post.findByIdAndUpdate(postId, updateData, { new: true });
        if (!updatedPost) {
            return res.status(404).send('Post not found');
        }

        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

// POST /register - Register admin
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            const user = await User.create({ username, password: hashedPassword, role: 'admin' });
            res.status(201).json({ message: 'Admin Created', user });
        } catch (error) {
            if (error.code === 11000) return res.status(400).json({ message: 'Username already in use' });
            res.status(500).json({ message: 'Internal server error' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

// DELETE /delete-post/:id - Delete post
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
    try {
        await Post.deleteOne({ _id: req.params.id });
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

// GET /logout - Admin logout
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

module.exports = router;