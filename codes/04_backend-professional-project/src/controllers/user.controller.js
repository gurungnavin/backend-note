import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path
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
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while register the user.");
  }

  // 6. Return Response
  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

export { userRegister };
