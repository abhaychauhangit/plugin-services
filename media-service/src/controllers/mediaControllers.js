import Media from "../models/Media.js";
import { uploadMediaToCloudinary } from "../utils/cloudinary.js";


const uploadMedia = async (req, res) => {
  console.log("Starting media upload");
  try {
    console.log(req.file, "req.filereq.file");

    if (!req.file) {
      console.log("No file found. Please add a file and try again!");
      return res.status(400).json({
        success: false,
        message: "No file found. Please add a file and try again!",
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.userId;

    console.log(`File details: name=${originalname}, type=${mimetype}`);
    console.log("Uploading to cloudinary starting...");

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    console.log(
      `Cloudinary upload successfully. Public Id: - ${cloudinaryUploadResult.public_id}`
    );

    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    await newlyCreatedMedia.save();

    res.status(201).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      message: "Media upload is successfully",
    });
  } catch (error) {
    console.log("Error creating media", error);
    res.status(500).json({
      success: false,
      message: "Error creating media",
    });
  }
};

const getAllMedias = async (req, res) => {
  try {
     const result =  await Media.find({userId : req.user.userId});

        if(result.length ===0){
           return res.status(404).json({
                success:false,
                message:"Cann't find any media for this user"
            })
        }
  } catch (e) {
    console.log("Error fetching medias", error);
    res.status(500).json({
      success: false,
      message: "Error fetching medias",
    });
  }
};

export { uploadMedia, getAllMedias };