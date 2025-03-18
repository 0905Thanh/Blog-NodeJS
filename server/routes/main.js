const express = require('express');
// const { get } = require('mongoose');
const router = express.Router();
const Post = require('../models/Post');

/*
// GET
// HOME
*/
router.get('', async (req, res) => {
    try {
        const locals = {
            title: "NodeJs Blog", 
            description: "Simple Blog created with NodeJs, Express & MongoDb."
        }

        let perPage = 10;
        let page = req.query.page || 1;
        
        const data = await Post.aggregate([ { $sort: { createAt: -1 } } ])
        .skip(perPage * page - perPage)
        .limit(perPage)
        .exec();
        
        const count = await Post.count;
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);

        res.render('index', { 
            locals, 
            data,
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            currentRoute: '/'
        });


    } catch (error) {
        console.log(error);        
    }

});

// router.get('', async (req, res) => {
//     const locals = {
//         title: "NodeJs Blog", 
//         description: "Simple Blog created with NodeJs, Express & MongoDb."
//     }

//     try {
//         const data = await Post.find();
//         res.render('index', { locals, data });
//     } catch (error) {
//         console.log(error);        
//     }

// });

/*
// GET
// Post: id
*/
router.get('/post/:id', async (req, res) => {
    try {
        let slug = req.params.id;

        const data = await Post.findById({ _id: slug});

        const locals = {
            title: data.title, 
            description: "Simple Blog created with NodeJs, Express & MongoDb.",
            currentRoute: `/post/${slug}`
        }

        res.render('post', { locals, data });
    } catch (error) {
        console.log(error);        
    }

});


/*
// Post
// Post - searchTerm
*/
router.post('/search', async (req, res) => {
    try {
        const locals = {
            title: "Search", 
            description: "Simple Blog created with NodeJs, Express & MongoDb."
        }
        
        let searchTerm = req.body.searchTerm;
        const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "")

        const data = await Post.find({
            $or: [
                { title: { $regex: new RegExp(searchNoSpecialChar, 'i') }},
                { body: { $regex: new RegExp(searchNoSpecialChar, 'i') }},
            ]
        });

        res.render("search", {
            data, 
            locals
        });



    } catch (error) {
        console.log(error);        
    }
    
});

router.get('/about', (req, res) => {
    res.render('about', {
        currentRoute: '/about'
    });
});


module.exports = router;
// function insertPostData () {
//     Post.insertMany([
//         {
//             title: "Building a Blog",
//             body: "This is the body text"
//         },
//         {
//             title: "Mastering Web Development: A Developer's Guide",
//             body: "Web development is a constantly evolving field. In this blog, we explore the latest trends, best practices, and essential tools for modern developers. From frontend frameworks like React and Vue.js to backend solutions with Node.js and Django, we cover everything you need to build efficient and scalable applications. Stay updated with coding tips, performance optimization techniques, and industry insights to enhance your development workflow."
//         },
//         {
//             title: "Understanding Asynchronous JavaScript",
//             body: "JavaScript’s asynchronous nature can be tricky to master. In this post, we dive into callbacks, promises, and async/await to help you write clean, efficient code. Learn how to handle API requests, avoid callback hell, and improve your application’s performance with proper async techniques."
//         },
//         {
//             title: "A Deep Dive into RESTful APIs",
//             body: "RESTful APIs power modern web applications, enabling seamless data exchange between clients and servers. This blog covers the fundamentals of REST, how to design scalable APIs, and best practices for authentication, versioning, and error handling."
//         },
//         {
//             title: "Getting Started with DevOps",
//             body: "DevOps bridges the gap between development and operations, fostering collaboration and automation. Learn about CI/CD pipelines, containerization with Docker, and infrastructure as code with Terraform to streamline your software development process."
//         },
//         {
//             title: "The Power of TypeScript for Large-Scale Applications",
//             body: "TypeScript extends JavaScript by adding static typing, making it an excellent choice for large-scale projects. Discover how TypeScript enhances code maintainability, prevents runtime errors, and integrates seamlessly with popular frameworks like React and Angular."
//         },
//         {
//             title: "Exploring the Future of AI in Software Development",
//             body: "AI is reshaping software development, from code generation to automated testing. In this blog, we explore AI-powered tools like GitHub Copilot, AI-driven debugging, and how machine learning is influencing coding practices."
//         },
//         {
//             title: "Building Secure Web Applications",
//             body: "Security is a critical aspect of web development. Learn how to protect your applications from common threats like SQL injection, XSS, and CSRF attacks. We also discuss best practices for authentication, encryption, and secure API development."
//         },
//         {
//             title: "Mastering Git for Version Control",
//             body: "Git is an essential tool for every developer. In this post, we break down Git commands, branching strategies, and collaboration workflows using platforms like GitHub and GitLab. Learn how to resolve merge conflicts and maintain a clean commit history."
//         },
//         {
//             title: "Performance Optimization for Web Applications",
//             body: "Slow-loading websites can drive users away. Discover techniques to optimize your web applications, including lazy loading, caching, image optimization, and reducing JavaScript execution time to improve page speed and user experience."
//         },
//         {
//             title: "Introduction to Cloud Computing for Developers",
//             body: "Cloud computing has transformed how applications are deployed and scaled. Learn about cloud service models (IaaS, PaaS, SaaS), popular cloud providers like AWS, Azure, and Google Cloud, and how to deploy applications in the cloud efficiently."
//         }
//     ])
// }
// insertPostData();