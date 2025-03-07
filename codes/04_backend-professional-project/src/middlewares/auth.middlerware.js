import jwt from "jsonwebtoken"
import {User} from "../models/user.models.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"

export const verifyJwt = asyncHandler(async(req, _, next)=> {
  // NOTE: if res is not used, we can write underScore '_'
  try {
    //access token from cookie of req., because loggedIn user has token
    const token = req.cookie?.accessToken || req.header("Authorization")?.replace("Bearer ", "")


    //check that token if not throw error
    if(!token){
      throw new ApiError(409, "Unauthorized request" )
    }

    // if token, now verify that token with access_secret_token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    //next ->search by _id and delete password and refresh token 

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    )

    if(!user) {
      throw new ApiError(410, "Invalid Access Token")
    }

    // if all okay, save user on req.user

    req.user = user

    
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token")
  }
  next()
})