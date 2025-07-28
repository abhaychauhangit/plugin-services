import jwt from "jsonwebtoken";



export const validateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
  
    if (!token) {
      console.log("Access attempt without valid token!");
      return res.status(401).json({
        message: "Authentication required",
        success: false,
      });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.log("Invalid token!");
        return res.status(429).json({
          message: "Invalid token!",
          success: false,
        });
      }
  
      req.user = user;
      next();
    });
};
  
 