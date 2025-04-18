const express = require("express");
const router = new express.Router();
const tasks = require("../models/task");
const auth = require("../middleware/auth");

// Create a new task for the authenticated user
router.post("/tasks", auth, async (req, res) => {
    const task = new tasks({ ...req.body, owner: req.user._id });

    try {
        await task.save();
        res.status(201).send(task); // 201: Task created successfully
    } catch (e) {
        res.status(400).send(e); // 400: Invalid request (e.g., validation error)
    }
});

// Fetch all tasks for the authenticated user with filtering, pagination, and sorting
router.get("/tasks", auth, async (req, res) => {
    const match = {}; // For filtering tasks
    const sort = {};  // For sorting tasks

    // Optional filter by task completion status
    if (req.query.completed) {
        match.completed = req.query.completed === "true"; // Filter by completion
    }

    // Optional sorting logic (e.g., sortBy=createdAt:desc)
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(":");
        const field = parts[0];
        const order = parts[1] || "asc"; // Default to ascending order
        sort[field] = order === "desc" ? -1 : 1; // Sort based on field and order
    }

    try {
        // Populate tasks associated with the authenticated user
        await req.user.populate({
            path: "tasks",
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        });

        res.send(req.user.tasks); // Send the filtered and sorted tasks
    } catch (e) {
        res.status(500).send(e); // 500: Internal server error
    }
});

// Get a specific task by ID (only if it belongs to the authenticated user)
router.get("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id;

    try {
        // Fetch the task by ID and ensure it's owned by the authenticated user
        const task = await tasks.findOne({ _id, owner: req.user._id });

        if (!task) {
            return res.status(404).send(); // 404: Task not found
        }

        res.status(200).send(task); // 200: Task found and sent
    } catch (e) {
        res.status(500).send(e); // 500: Internal server error
    }
});

// Update specific task fields (only if owned by the authenticated user)
router.patch("/tasks/:id", auth, async (req, res) => {
    const updates = Object.keys(req.body); // Get fields to update
    const allowedUpdates = ['description', 'completed']; // Allowed fields to update
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!" }); // 400: Bad request (invalid update)
    }

    try {
        // Find the task by ID and ensure it belongs to the authenticated user
        const task = await tasks.findOne({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).send(); // 404: Task not found
        }

        // Apply the updates to the task
        updates.forEach((update) => task[update] = req.body[update]);
        await task.save(); // Save the updated task

        res.send(task); // Send the updated task
    } catch (e) {
        res.status(400).send(e); // 400: Bad request (validation error)
    }
});

// Delete a task by ID (only if it belongs to the authenticated user)
router.delete("/tasks/:id", auth, async (req, res) => {
    try {
        // Find and delete the task if it belongs to the authenticated user
        const task = await tasks.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).send(); // 404: Task not found
        }

        res.send(task); // Send the deleted task
    } catch (e) {
        res.status(500).send(); // 500: Internal server error
    }
});

module.exports = router;
