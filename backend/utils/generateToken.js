const jwt = require("jsonwebtoken");

const generateToken = (customerId) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("Missing JWT_SECRET environment variable");
  }

  return jwt.sign(
    {
      id: customerId,
    },
    secret,
    {
      expiresIn: "1d",
    }
  );
};

module.exports = generateToken;
