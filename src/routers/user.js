const express = require("express");
const User = require("../models/users");
const auth = require("../middleware/auth");
const router = new express.Router();
const multer = require("multer");
const sharp = require("sharp");
const { sendwelcomemail } = require('../emails/account');  // Import email sending function
const { sendexitmail } = require('../emails/account');    // Import email sending function

// Create a new user
router.post("/users", async (req, res) => {
    const user = new User(req.body);  // Create a new user with the request body

    try {
        await user.save();  // Save the new user to the database
        sendwelcomemail(user.email, user.name);  // Send a welcome email after user creation
        const token = await user.generateauthtoken();  // Generate an authentication token for the user
        res.status(201).send({ user, token });  // Send back the created user and token
    } catch (e) {
        res.status(400).send(e);  // 400: Bad request (e.g., validation failure)
    }
});

// User login
router.post("/users/login", async (req, res) => {
    try {
        console.log("Login request body:", req.body);  // Log the login request body (for debugging)
        const user = await User.findByCredentials(req.body.email, req.body.password);  // Validate user credentials
        const token = await user.generateauthtoken();  // Generate a token for the logged-in user
        res.send({ user, token });  // Send back the user and token
    } catch (e) {
        res.status(400).send("Login failed");  // 400: Login failed (invalid credentials)
    }
});

// User logout (current session)
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;  // Remove the current token from the user's tokens
        });
        await req.user.save();  // Save the updated tokens list
        res.send();  // Send back a response indicating successful logout
    } catch (e) {
        res.status(500).send();  // 500: Internal server error
    }
});

// User logout from all sessions
router.post('/users/logoutall', auth, async (req, res) => {
    try {
        req.user.tokens = [];  // Clear all tokens (logout from all sessions)
        await req.user.save();  // Save the updated tokens list
        res.send();  // Send back a response indicating successful logout
    } catch (e) {
        res.status(500).send();  // 500: Internal server error
    }
});

// Get currently logged-in user information
router.get("/users/me", auth, async (req, res) => {
    res.send(req.user);  // Send the authenticated user's data
});

// Get user by ID
router.get("/users/:id", async (req, res) => {
    const _id = req.params.id;  // Get the user ID from the URL parameter
    try {
        const user = await User.findById(_id);  // Find the user by ID
        if (!user) {
            return res.status(404).send();  // 404: Not found
        }
        res.status(200).send(user);  // Send the found user
    } catch (e) {
        res.status(500).send(e);  // 500: Internal server error
    }
});

// Update the logged-in user's data
router.patch("/users/me", auth, async (req, res) => {
    const updates = Object.keys(req.body);  // Get the keys of the fields to update
    const allowedUpdates = ["name", "email", "password", "age"];  // Define allowed fields for update
    const isValidOperation = updates.every((update) =>
        allowedUpdates.includes(update)  // Check if all requested updates are allowed
    );

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!" });  // 400: Invalid updates request
    }

    try {
        const user = await req.user;  // Get the currently logged-in user
        updates.forEach((update) => user[update] = req.body[update]);  // Update each field
        await user.save();  // Save the updated user
        res.send(user);  // Send the updated user data
    } catch (e) {
        res.status(400).send(e);  // 400: Bad request
    }
});

// Delete the logged-in user
router.delete("/users/me", auth, async (req, res) => {
    try {
        sendexitmail(req.user.email, req.user.name);  // Send exit email to the user
        await req.user.deleteOne();  // Delete the user from the database
        res.send(req.user);  // Send the deleted user's data
    } catch (e) {
        res.status(500).send(e);  // 500: Internal server error
    }
});

// Configure multer for handling file uploads (avatars)
const upload = multer({
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("Please upload a valid format"));  // Validate file type (only jpg, jpeg, png)
        }
        cb(undefined, true);  // Accept the file
    }
});

// Upload avatar for the logged-in user
router.post("/users/me/avatar", auth, upload.single("avatar"), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();  // Resize and convert image
    req.user.avatar = buffer;  // Save the avatar in the user's profile
    await req.user.save();  // Save the updated user data
    res.send();  // Send back a response
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });  // 400: Bad request (invalid file)
});

// Delete avatar for the logged-in user
router.delete("/users/me/avatar", auth, async (req, res) => {
    req.user.avatar = undefined;  // Remove the avatar from the user's profile
    await req.user.save();  // Save the updated user data
    res.send();  // Send back a response
});

// Get user avatar by ID
router.get("/users/:id/avatar", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);  // Find user by ID
        if (!user || !user.avatar) {
            throw new Error();  // If user or avatar doesn't exist, throw an error
        }
        res.set('Content-Type', 'image/jpg');  // Set the content type for the image
        res.send(user.avatar);  // Send the avatar image
    } catch (e) {
        res.status(404).send();  // 404: Not found (user or avatar doesn't exist)
    }
});

module.exports = router;  // Export the router for use in the app
