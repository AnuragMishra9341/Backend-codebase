import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadonCloudinary from "../utils/cloudnary.js";
import ApiResponse from "../utils/ApiResponse.js";
import  jsonwebtoken  from "jsonwebtoken";
const jwt = jsonwebtoken;

const generateAcessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAcessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access Token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - > not empty
  // check if user already exists : username,email
  // check for images , check for avatar
  // upload them to cloudinary , avatar check
  // create user object -> create entry in db
  // remove password and refresh token field from response
  // check for user creation wheter creation happend or not
  // return res
  // res.status(200).json({ message: "ok" });

  const { fullName, email, username, password } = req.body; // when the data comes from form or json
  console.log("email: ", email);

  if (
    [fullName, email, username, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required.");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "user with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadonCloudinary(avatarLocalPath);
  const coverImage = await uploadonCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});


// login controlllers



const loginUser = asyncHandler(async (req, res) => {
  // req.body-> data
  // username or email
  // find the user in database
  // password check
  // access and refreshToken
  //  send access and refresToken with secure cookies

  const { email, username, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password); // used await because of bcrypt

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAcessAndRefreshTokens(
    user._id
  );

  // the user that I have used here have some unwanted field and it also
  // is not updated after doing generateAcessandRefreshTokens hence it will not have acces and refresh TOkens

  // so either I can directly update the use or I can make a database query

  // dataabse query

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // These are the options for cookies

  // cokkies are modifiable from fronend also but form these options now they are only modified from backend only

  // this is nothing but an object
  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        "user loggedIn succesfully",
        200
      )
    );
});




const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
       req.user._id,
       {
         $unset: { refreshToken: 1 } 
       },
       {
          new : true
       }
     )

     const options = {
    httpOnly: true,
    secure: true,
  };

    return res.status(200).clearCookie('accessToken',options).json(new ApiResponse(200,{},"User logged out successfully"))
})


const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshAccessToken || req.body?.refreshAccessToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request');
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (incomingRefreshToken !== user?.refreshAccessToken) {
      throw new ApiError(401, 'Refresh token is expired or already used');
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await  generateAcessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshAccessToken', newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          'Access token refreshed'
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid refresh token');
  }
});




export { registerUser, loginUser,logoutUser,refreshAccessToken};
