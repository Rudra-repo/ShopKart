const jwt = require("jsonwebtoken");

const generateToken = (customerId) => {
  return jwt.sign(
    {
      id: customerId,
    },
    process.env.JWT_SECRET || "shopkart_super_secret_key_123",
    {
      expiresIn: "1d",
    }
  );
};

module.exports = generateToken;
