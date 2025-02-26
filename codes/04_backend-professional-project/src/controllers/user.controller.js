import { asyncHandler } from "../utils/asyncHandler.js"

const userRegister = asyncHandler(async(req, res) => {
   const {fullName, email, password} = req.body
   if ([fullName, email, password].some(fields => fields?.trim())) {
    
   }
})


export {userRegister}