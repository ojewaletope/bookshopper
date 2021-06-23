import { createRequire } from "module";
const require = createRequire(import.meta.url);
const dotenv = require("dotenv");
import { v2 } from "cloudinary";

dotenv.config();

v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export const singleUpload = async (file, path) => {
  const uniqueFilename = new Date().toISOString();
  try {
    return await v2.uploader.upload(
      file,
      { public_id: `bookshopper/${path}/${uniqueFilename}` }
    )
  } catch (e) {
    console.log(e);
  }
};

export const multipleUpload = async (files) => {
  const urls = [];
  for (const file of files) {
    const uploadResponse = await singleUpload(file, 'books');
    urls.push(uploadResponse.secure_url)
  }
  return urls;
}
