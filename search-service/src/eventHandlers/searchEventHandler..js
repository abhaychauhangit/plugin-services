import { client } from './elasticSearchClient.js';
import Search from "../models/Search.js";


async function handlePostCreated(event) {
  try {
    
    const newSearchPost = new Search({
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });

    
    await newSearchPost.save();
    console.log(
      `Search post created in MongoDB: ${event.postId}, ${newSearchPost._id.toString()}`
    );

    
    const esDocument = {
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    };

    await client.index({
      index: 'posts', 
      id: event.postId, 
      body: esDocument, 
    });

    console.log(`Search post indexed in Elasticsearch: ${event.postId}`);

  } catch (e) {
    console.log(e, "Error handling post creation event");
  }
}

async function handlePostDeleted(event) {
  try {
    
    await Search.findOneAndDelete({ postId: event.postId });
    console.log(`Search post deleted from MongoDB: ${event.postId}`);

    
    await client.delete({
      index: 'posts',
      id: event.postId, // Post ID to delete
    });
    console.log(`Search post deleted from Elasticsearch: ${event.postId}`);

  } catch (error) {
    console.log(error, "Error handling post deletion event");
  }
}

export { handlePostCreated, handlePostDeleted };

































// async function handlePostCreated(event) {
//   try {
//     const newSearchPost = new Search({
//       postId: event.postId,
//       userId: event.userId,
//       content: event.content,
//       createdAt: event.createdAt,
//     });

//     await newSearchPost.save();
//     console.log(
//       `Search post created: ${event.postId}, ${newSearchPost._id.toString()}`
//     );
//   } catch (e) {
//     console.log(e, "Error handling post creation event");
//   }
// }

// async function handlePostDeleted(event) {
//   try {
//     await Search.findOneAndDelete({ postId: event.postId });
//     console.log(`Search post deleted: ${event.postId}}`);
//   } catch (error) {
//     console.log(error, "Error handling post deletion event");
//   }
// }

// export { handlePostCreated, handlePostDeleted };