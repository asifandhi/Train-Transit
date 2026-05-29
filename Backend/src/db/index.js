import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log("::: Mongodb connected successfully :::");
    console.log(`::: Connected to database : ${connectionInstance.connection.name}`);
    console.log(`::: Database host : ${connectionInstance.connection.host}`);
    console.log(`::: Database port : ${connectionInstance.connection.port}`);
  } catch (error) {
    console.log(
      "::: Error while connecting to the database At(db/index.js) :::"
    );
    process.exit(1);
  }
};

export default connectDB;
