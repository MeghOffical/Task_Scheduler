// authMiddleware.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // Get token from the 'Authorization' header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format is "Bearer TOKEN"

  if (token == null) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, 'your-secret-key-123'); // Use the same secret as in login

    // Add the user's info to the request object
    req.user = decoded; 

    // Move to the next step (the actual route)
    next(); 
  } catch (e) {
    res.status(400).json({ message: "Token is not valid" });
  }
}

module.exports = authMiddleware;