const mongoose = require("mongoose");
const validator = require("validator");

// Define the schema for tasks
const taskschema = mongoose.Schema(
  {
    // Description of the task (required and trimmed)
    description: {
      type: String,
      required: true,
      trim: true
    },

    // Status of task completion (default is false)
    completed: {
      type: Boolean,
      default: false
    },

    // Reference to the user who owns the task
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    }
  },
  {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true
  }
);

// Create the Task model
const Task = mongoose.model("Task", taskschema);

// Export the model
module.exports = Task;
