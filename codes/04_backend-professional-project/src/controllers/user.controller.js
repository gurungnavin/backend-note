import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const userRegister = asyncHandler(async(req, res) => {
   // 1. get user details from frontend || postman
   const {fullName, email, password} = req.body
   console.log(password)

   // 2. validation check : empty or not
   if ([fullName, email, password].some(fields => fields?.trim())) {   throw new ApiError(400, "All Fields are required.")
   }

   // 3. Check if user already exists: username, email
   // why User, only User can talk with Database.

   // findout username & email in Database first
   let existUser = User.findOne({
      $or : [ {username}, {email} ]
   })

   // check username or password, if exist then throw Error
   if(existUser) {
      throw new ApiError(409, "Username or Email are already exist")
   }

   //  to Check coverImage & avatar : save in variable

   const avatarLocalPath = req.files?.avatar[0]?.path;
   const coverImageLocalPath = req.files?.coverImage[0]?.path;

  // 4. Check coverImage & avatar 
  if(!avatarLocalPath) {
      throw new ApiError(406, "Avatar is required")
  }

  // 5. Upload to Cloudinary(Avatar and coverImage)
  
   let avatar = uploadOnCloudinary(avatarLocalPath)
   let coverImage = uploadOnCloudinary(coverImageLocalPath)
})


export {userRegister}