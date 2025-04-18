const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect(process.env.mongodb_url)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.log("Connection error:", error);
    });
