import RefreshToken from "../models/RefreshToken.js"
import User from "../models/User.js";
import generateTokens from "../utils/generateToken.js";
import { validateRegistration, validatelogin } from "../utils/validation.js";



// const setCookies = (accessToken, refreshToken, res) => {
//   res.cookie("accessToken", accessToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 15 * 60 * 1000,
//   });

//   res.cookie("refreshToken", refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//   });
// }




const resgiterUser = async (req, res) => {
  console.log("Registration endpoint hit...");
  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      console.log("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password, username, fullName } = req.body;

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      console.log("User already exists");
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    user = new User({ username, email, password, fullName });
    await user.save();
    console.log("User saved successfully", user._id);

    const { accessToken, refreshToken } = await generateTokens(user);
    // setCookies(accessToken, refreshToken, res);

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
      userId: user._id,
      email: user.email,
      username: user.username,
      refreshToken,
      accessToken
    });
  } catch (e) {
    console.log("Registration error occured", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const loginUser = async (req, res) => {
  console.log("Login endpoint hit...");
  try {
    const { error } = validatelogin(req.body);
    if (error) {
      console.log("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      console.log("Invalid user");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }


    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      console.log("Invalid password");
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    const { accessToken, refreshToken } = await generateTokens(user);
    // setCookies(accessToken, refreshToken, res);

    res.json({
      success: true,
      message: "User logged in successfully!",
      userId: user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      refreshToken,
      accessToken
    });
  } catch (e) {
    console.log("Login error occured", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const refreshTokenUser = async (req, res) => {
  console.log("Refresh token endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      console.log("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    
    if (!storedToken) {
      console.log("Invalid refresh token provided");
      return res.status(400).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (!storedToken || storedToken.expiresAt < new Date()) {
      console.log("Invalid or expired refresh token");

      return res.status(401).json({
        success: false,
        message: `Invalid or expired refresh token`,
      });
    }

    const user = await User.findById(storedToken.user);

    if (!user) {
      console.log("User not found");

      return res.status(401).json({
        success: false,
        message: `User not found`,
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateTokens(user);

   
    await RefreshToken.deleteOne({ _id: storedToken._id });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (e) {
    console.log("Refresh token error occured", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const logoutUser = async (req, res) => {
  console.log("Logout endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      console.log("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

   const storedToken = await RefreshToken.findOneAndDelete({
      token: refreshToken,
    });
    if (!storedToken) {
      console.log("Invalid refresh token provided");
      return res.status(400).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
    console.log("Refresh token deleted for logout");
    

    res.json({
      success: true,
      message: "Logged out successfully!",
    });
  } catch (e) {
    console.log("Error while logging out", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user.userId;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { resgiterUser, loginUser, refreshTokenUser, logoutUser, getUsersForSidebar };
