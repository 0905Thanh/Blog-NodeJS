require('dotenv').config();

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const connectDB = require('./server/config/db');
const mainRoutes = require('./server/routes/main');
const adminRoutes = require('./server/routes/admin');
const userRoutes = require('./server/routes/user'); // Ensure this line is present
const fs = require('fs');
const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();

// Kết nối MongoDB
connectDB();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

// Static files
app.use(express.static('public'));

// Template engine
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Routes
app.use('/', mainRoutes);
app.use('/', adminRoutes);
app.use('/user', userRoutes); // Ensure this line is present

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});