import { createRequire } from "module";
const require = createRequire(import.meta.url);
import express from "express";
import fileupload from "express-fileupload";
// import dotenv from "dotenv";
const dotenv = require("dotenv")
import bodyParser from "body-parser";
import cors from "cors";

dotenv.config();
import usersRoutes from "./routes/users.js";
import booksRoutes from "./routes/books.js";
import mongoose from "mongoose";
const app = express();
const uri =
  `mongodb+srv://${process.env.DB_ADMIN}:${process.env.DB_PWD}@bookshopper.ojvk0.mongodb.net/bookshopper?retryWrites=true&w=majority`;


try {
    mongoose
        .connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => {
            console.log("connected to db");
        })
        .catch((err) => {
            console.log(err);
        });
} catch (e) {
    console.log(e)
}

app.use(cors());
app.use(
  fileupload({
    useTempFiles: true,
  })
);
app.use(bodyParser.json());
app.use(`/api/v1/users`, usersRoutes);
app.use("/api/v1/books", booksRoutes);

const PORT = process.env.PORT || 3200;

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});

// function base64_encode(file) {
//     // read binary data
//     const bitmap = fs.readFileSync(file);
//     // convert binary data to base64 encoded string
//     return new Buffer(bitmap).toString('base64');
// }
