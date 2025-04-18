const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("../models/task");

// Define the schema for users
const Userschema = new mongoose.Schema(
  {
    // Name field (required and trimmed)
    name: {
      type: String,
      required: true,
      trim: true
    },

    // Email field (unique, required, trimmed, and validated)
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      }
    },

    // Age field (must be a positive number)
    age: {
      type: Number,
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be a positive number");
        }
      }
    },

    // Password field (required, trimmed, at least 7 characters, cannot contain "password")
    password: {
      required: true,
      trim: true,
      type: String,
      minlength: 7,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password cannot be 'password'");
        }
      }
    },

    // Avatar field for storing image buffer
    avatar: {
      type: Buffer
    },

    // Tokens array for storing JWT tokens
    tokens: [
      {
        token: {
          type: String,
          required: true
        }
      }
    ]
  },
  {
    // Adds createdAt and updatedAt timestamps
    timestamps: true
  }
);

// Virtual field for establishing relationship with tasks
Userschema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner"
});

// Customize JSON response to hide sensitive data
Userschema.methods.toJSON = function () {
  const user = this;
  const userobject = user.toObject();

  delete userobject.password;
  delete userobject.tokens;
  delete userobject.avatar;

  return userobject;
};

// Generate authentication token and store it in user's tokens array
Userschema.methods.generateauthtoken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.jwt_secret);
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

// Find user by credentials (email and password)
Userschema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email });

  if (!user) {
    throw new Error("Unable to login");
  }

  const ismatch = await bcrypt.compare(password, user.password);

  if (!ismatch) {
    throw new Error("Unable to login");
  }

  return user;
};

// Hash the password before saving, if modified
Userschema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// Delete user tasks when user is removed
Userschema.pre("remove", async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

// Create and export the User model
const User = mongoose.model("User", Userschema);
module.exports = User;
