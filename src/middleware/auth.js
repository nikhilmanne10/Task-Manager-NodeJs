const jwt = require('jsonwebtoken');
const User = require('../models/users');

// Middleware to authenticate incoming requests using JWT
const auth = async (req, res, next) => {
  try {
    // Extract token from the Authorization header
    const token = req.header('Authorization').replace('Bearer ', '');

    // Verify the token using the secret key from environment variables
    const decoded = jwt.verify(token, process.env.jwt_secret);

    // Find the user with a matching ID and token
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

    // If no user is found, throw an error
    if (!user) {
      throw new Error();
    }

    // Attach token and user to the request object for future use
    req.token = token;
    req.user = user;
    
    // Proceed to the next middleware or route handler
    next();
  } catch (e) {
    // Send error if authentication fails
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

// Export the middleware function
module.exports = auth;
