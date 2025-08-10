// require('dotenv').config({path:'./env'});
import  dotenv  from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import express from 'express';
import app from "./app.js";
dotenv.config({
   path:'./env'
})

// since connectDB is an asynchronous type function it will always return a res if we 
// do not have explicityly return it 
// the res sent will be undefined
connectDB()
.then((res)=>{

   app.on("error",(error)=>{
        console.log(' Server error ',error);
        throw error;
      })

   app.listen(process.env.PORT || 8000,()=>{
       console.log(`Server is running at port : ${process.env.PORT}`)
   })
})
.catch((error)=>{
   console.log('MongoDb connection failed !!',error)
})



















/*
import express from "express";
const app = express();
 ;(async ()=>{
    try{
      await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
      app.on("error",(error)=>{
        console.log('Error ',error);
        throw error;
      })

     app.listen(process.env.PORT,()=>{
        console.log(`App is listening on port${process.env.PORT}`)
     })

    }
    catch{
        console.log("ERROR: ",error);
        throw err;
    }
 })()   */