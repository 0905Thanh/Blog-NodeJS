const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

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

const authMiddleware = (req, res, next) => {
    const jwtSecret = process.env.JWT_SECRET;
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
    }
};

router.get('/register', async (req, res) => {
    try {
        const locals = { title: "Register", description: "Simple Blog created with NodeJs, Express & MongoDb." };
        res.render('user/register', { locals, layout: 'layouts/user' }); // Chỉ định layout
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            const user = await User.create({ username, password: hashedPassword, role: 'user' });
            // res.status(201).json({ message: 'User Created', user });
            return res.status(201).redirect('/user/login');
        } catch (error) {
            if (error.code === 11000) return res.status(400).json({ message: 'Username already in use' });
            else return res.status(500).json({ message: 'Internal server error' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/login', async (req, res) => {
    try {
        const locals = { title: "Login", description: "Simple Blog created with NodeJs, Express & MongoDb." };
        res.render('user/login', { locals, layout: 'layouts/user' }); // Chỉ định layout
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/login', async (req, res) => {
    try {
        const jwtSecret = process.env.JWT_SECRET;
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });
        const token = jwt.sign({ userId: user._id, role: user.role, username: user.username }, jwtSecret);
        res.cookie('token', token, { httpOnly: true });
        res.send(`
            <html>
                <script>
                    window.location.href = '/';
                </script>
            </html>
        `);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

module.exports = router;