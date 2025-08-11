import asyncHandler from "../utils/asyncHandler.js"
import  jsonwebtoken  from "jsonwebtoken";
const jwt = jsonwebtoken
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

export const verifyJWT = asyncHandler(async(req,res,next)=>{
  
   try {
    const token = req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer","")
 
    if(!token){
     throw new ApiError(401,'Unauthorized request')
    }
 
    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
 
   const user =  await User.findById(decodedToken?._id).select(
     "-password -refreshToken"
    )
 
    if(!user){
     throw new ApiError(401,'Invalid Acess Token')
    }
 
    req.user = user;   // adding a user key in the request so that I can have it during logout
    next();
   } catch (error) {
     throw new ApiError(401,error?.message || 'Invalid access token')
   }

})