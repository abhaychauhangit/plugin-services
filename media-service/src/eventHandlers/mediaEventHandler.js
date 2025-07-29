import Media from "../models/Media.js";
import { deleteMediaFromCloudinary } from "../utils/cloudinary.js";


const handlePostDeleted = async (event) => {
  console.log(event, "eventeventevent");
  const { postId, mediaIds } = event;
  try {
    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });

    for (const media of mediaToDelete) {
      await deleteMediaFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);

      console.log(
        `Deleted medua ${media._id} associated with this deleted post ${postId}`
      );
    }

    console.log(`Processed deletion of media for post id ${postId}`);
  } catch (e) {
    console.log(e, "Error occured while media deletion");
  }
};

export { handlePostDeleted };
