require("dotenv").config(); // Load environment variables

const express = require("express");
require("./db/mongoose"); // Establish database connection

const userrouter = require("./routers/user");
const taskrouter = require("./routers/task");

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(userrouter);
app.use(taskrouter);

// Multer setup for image file upload
const multer = require("multer");
const upload = multer({
  dest: "images",  // Folder where uploaded files are saved
  limits: {
    fileSize: 100000,  // Maximum file size: 100KB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload a valid image (jpg, jpeg, png)"));
    }
    cb(undefined, true);  // Accept the file
  },
});

// Route to handle image upload
app.post("/upload", upload.single("upload"), (req, res) => {
  res.send("File uploaded successfully");
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message });  // Send error if file is invalid
});

// Start the server
app.listen(port, () => {
  console.log("Server is running on port " + port);
});

// Log the port used from environment variable
console.log("PORT from env:", process.env.PORT);
