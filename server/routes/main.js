const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/user/login');
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        req.username = decoded.username;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
    }
};


const checkLoginStatus = (req, res, next) => {
    const token = req.cookies.token;
    let isLoggedIn = false;

    if (token) {
        try {
            jwt.verify(token, jwtSecret);
            isLoggedIn = true;
        } catch (error) {
            isLoggedIn = false;
        }
    }

    res.locals.isLoggedIn = isLoggedIn;
    next();
};

router.use(checkLoginStatus);

router.get('/', async (req, res) => {
    try {
        const locals = {
            title: "NodeJs Blog",
            description: "Simple Blog created with NodeJs, Express & MongoDb."
        };

        let perPage = 10;
        let page = req.query.page || 1;

        const data = await Post.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' }
            },
            { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } }
        ])
            .skip(perPage * page - perPage)
            .limit(perPage)
            .exec();

        const count = await Post.countDocuments();
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);

        res.render('partials/index', {
            locals,
            data,
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            currentRoute: '/',
            layout: 'layouts/main' // Chỉ định layout
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/post/:id', async (req, res) => {
    try {
        const data = await Post.findById(req.params.id); // No population needed

        if (!data) {
            return res.status(404).send('Post not found');
        }

        const locals = {
            title: data.title,
            description: "Simple Blog created with NodeJs, Express & MongoDb.",
            currentRoute: `/post/${req.params.id}`
        };

        res.render('partials/post', { locals, data, layout: 'layouts/main' });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

// Like a Post
router.post('/post/:id/like', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).send('Post not found');
        }

        // Toggle like: Add user ID if not liked, remove if already liked
        const userId = req.userId;
        const likeIndex = post.likes.indexOf(userId);
        if (likeIndex === -1) {
            post.likes.push(userId); // Add like
        } else {
            post.likes.splice(likeIndex, 1); // Remove like
        }

        await post.save();
        res.redirect(`/post/${req.params.id}`);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

// Add a Comment
router.post('/post/:id/comment', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).send('Post not found');
        }

        post.comments.push({
            content,
            author: req.username
        });

        await post.save();
        res.redirect(`/post/${req.params.id}`);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/search', async (req, res) => {
    try {
        const locals = {
            title: "Search",
            description: "Simple Blog created with NodeJs, Express & MongoDb."
        };

        let searchTerm = req.body.searchTerm;
        const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

        const data = await Post.find({
            $or: [
                { title: { $regex: new RegExp(searchNoSpecialChar, 'i') } },
                { body: { $regex: new RegExp(searchNoSpecialChar, 'i') } }
            ]
        }).populate('author');

        res.render("search", { data, locals, layout: 'layouts/main' }); // Chỉ định layout
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/about', (req, res) => {
    res.render('about', { currentRoute: '/about', layout: 'layouts/main' }); // Chỉ định layout
});

module.exports = router;