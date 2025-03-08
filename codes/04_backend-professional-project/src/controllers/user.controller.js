import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// generate access and refresh token
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch {
    throw new ApiError(
      405,
      "Something went wrong while generation access and refresh Token"
    );
  }
};

const userRegister = asyncHandler(async (req, res) => {
  // 1. get user details from frontend || postman
  const { fullName, email, password, username } = req.body;

  // 2. validation check : empty or not
  if ([fullName, email, password].some((fields) => fields?.trim() === "")) {
    throw new ApiError(400, "All Fields are required.");
  }

  // 3. Check if user already exists: username, email
  // why User, only User can talk with Database.

  // findout username & email in Database first
  // if we don'T write await before User.findOne
  // [Error: Username or Email are already exist]:will be displayed
  let existUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  // check username or password, if exist then throw Error
  if (existUser) {
    throw new ApiError(409, "Username or Email are already exist");
  }

  //  to Check coverImage & avatar : save in variable

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  // if cover Image is empty, then it check files, array, and array length.
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // console.log(avatarLocalPath);
  // console.log(coverImageLocalPath);

  // 4. Check coverImage & avatar
  if (!avatarLocalPath) {
    throw new ApiError(406, "Avatar is required");
  }

  // 5. Upload to Cloudinary(Avatar and coverImage)

  let avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // console.log(`coverImage: ${coverImage}`);
  // console.log(`avatar: ${avatar}`);

  // check avatar from cloudinary, bcoz avatar is required
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  // 6. Create User Object - Create entry in DB
  // User is only one communate to DB

  const user = await User.create({
    fullName,
    email,
    password,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // 6. Check User Creation
  // '-' minus sign remove password and refreshtoken
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken "
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while register the user.");
  }

  // 6. Return Response
  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const userLogin = asyncHandler(async (req, res) => {
  // ===================== USER LOGIN ==========================

  // req.body = data
  // username or email
  // find user
  // password check
  // access and refresh token
  // send Cookie

  const { email, username, password } = req.body;
  // correction if (!email || !username) => !(email || username)
  if (!(email || username)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(401, "user is not found.");
  }

  // password checking
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(403, "password is not correct");
  }

  // access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Send Cookies

  // for json response while return res
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // for security reason.
  const options = {
    httpOnly: true,
    secure: true,
  };

  // send cookie as res.
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully "
      )
    );
});

const userLogOut = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
        // This removes the field from document
      },
    },
    {
      new: true,
    }
  );
  const option = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "User LoggedOut"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // Get refreshToken from either request body or cookies
  const incomingRefreshToken =
    req.body.refreshToken || req.cookies.refreshToken;

  // Check if refreshToken is provided
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    // Verify the incoming refresh token using the secret key
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!decodedToken) {
      throw new ApiError(404, "Refresh Token verification failed");
    }

    // Find the user by ID extracted from the decoded token
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(405, "Invalid Refresh Token");
    }

    // Compare the provided refresh token with the one stored in the database
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(405, "Refresh Token is expired or already used");
    }

    // Options for secure HTTP-only cookies
    const options = {
      httpOnly: true,
      secure: true,
    };

    // Generate a new access token and refresh token
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    // Set new tokens in cookies and return response
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(402, error?.message || "Invalid Refresh Token");
  }
});

// Change Password Controller

const changePassword = asyncHandler(async (req, res) => {
  // get old password and new password
  const { oldPassword, newPassword } = req.body;

  // if confirm Password required condition
  // const { oldPassword, newPassword, confirmPassword } = req.body;
  //  if(!(newPassword === confirmPassword)){

  //    throw new ApiError(400, "Passwrod is not match")
  //  }

  //it isnot reset password, so we can access password from req.user(user is loggedIn)
  const user = await User.findById(req.user?._id);
  // check the old password with isPasswordCorrect function
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  //password is correct or not
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old Password");
  }
  // now set new password as newPassword & replace Old password
  user.password = newPassword;
  // next, save and remaining validation should not run so vaidateBefore : false
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(200, req.user, "Current User Fetch");
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!(fullName || email)) {
    throw new ApiError(401, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details updated successFully"));
});

const updateUserAvatar = asyncHandler(async(req, res)=> {
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is misssing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar) {
    throw new ApiError(406, "Error while uploading avatar")
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set : {
        avatar : avatar.url
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user, "Avatar image updated Successfully")
  )
})


const updateUserCoverImage = asyncHandler(async(req, res)=> {
  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover Image file is misssing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage) {
    throw new ApiError(406, "Error while uploading Cover Image")
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set : {
        coverImage : coverImage.url
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user, "Cover image updated Successfully")
  )
})


export {
  userRegister,
  userLogin,
  userLogOut,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage
};
