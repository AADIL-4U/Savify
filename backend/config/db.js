const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // process.env.MONGO_URI is loaded from the .env file
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);

        // Exit the Node.js process if the database fails to connect
        process.exit(1);
    }
};

module.exports = connectDB;