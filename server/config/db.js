const mongoose = require('mongoose');
const connectDB = async () => {

    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URL);
        console.log(`Database Connected: ${mongoose.connection.host}`);
    } catch (error) {
        console.log(error);
    }
};

module.exports = connectDB;