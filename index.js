const express = require("express");
const mongoose = require("mongoose");
const multer = require('multer');
const cloudinary = require("cloudinary").v2;
const bodyParse = require('body-parser');
const dotenv = require("dotenv");
const cors = require("cors");
const fileUpload = require("express-fileupload");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Mongo Error", err));

// Schema
const imageSchema = new mongoose.Schema({
  url: {
    type: String,
  },
});

const Image = mongoose.model("Image", imageSchema);

app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/", // Temporary directory for file uploads
  })
);

// Get all images
app.get("/", async (req, res) => {
  const allUrls = await Image.find({});
  return res.json(allUrls);
});

// Upload route
app.post("/upload", async (req, res) => {
    try {
      // Check if file exists in the request
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
      }
  
      const file = req.files.photo; // 'photo' should match the frontend form key
  
      // Upload file to Cloudinary
      cloudinary.uploader.upload(file.tempFilePath, async (err, result) => {
        if (err) {
          return res.status(500).send("Cloudinary upload failed");
        }
  
        // Save image URL to MongoDB
        const newImage = await Image.create({
          url: result.url,
        });
  
        return res.json(newImage);
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  });
  

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
