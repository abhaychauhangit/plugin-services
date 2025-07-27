import { client } from './elasticSearchClient.js';





const searchPostController = async (req, res) => {
  const redis = req.redisClient;

  console.log("Search endpoint hit!");
  try {
    const { query, autocomplete } = req.query;

   
    const cachedResults = await redis.get(query);
    if (cachedResults) {
      console.log('Returning cached results from Redis...');
      return res.json(JSON.parse(cachedResults)); // Parse the cached JSON
    }

 
    if (autocomplete) {
      const { body } = await client.search({
        index: 'posts',
        body: {
          query: {
            prefix: {
              content: {
                value: query,
                boost: 2.0
              }
            }
          },
          _source: ['postId', 'userId', 'content', 'createdAt'],
          size: 5, 
        }
      });

      const results = body.hits.hits.map(hit => hit._source);


      await redis.setex(query, 300, JSON.stringify(results)); 

      return res.json(results);
    }

    
    const { body } = await client.search({
      index: 'posts',
      body: {
        query: {
          match: {
            content: query
          }
        },
        _source: ['postId', 'userId', 'content', 'createdAt'],
        size: 10, 
      },
    });

    const results = body.hits.hits.map(hit => hit._source);

    
    await redis.setex(query, 300, JSON.stringify(results)); 
    res.json(results);
  } catch (e) {
    console.log("Error while searching post", e);
    res.status(500).json({
      success: false,
      message: "Error while searching post",
    });
  }
};

export { searchPostController };


































































// const Search = require("../models/Search");


// //implement caching here for 2 to 5 min
// const searchPostController = async (req, res) => {
//   console.log("Search endpoint hit!");
//   try {
//     const { query } = req.query;

//     const results = await Search.find(
//       {
//         $text: { $search: query },
//       },
//       {
//         score: { $meta: "textScore" },
//       }
//     )
//       .sort({ score: { $meta: "textScore" } })
//       .limit(10);

//     res.json(results);
//   } catch (e) {
//     console.log("Error while searching post", error);
//     res.status(500).json({
//       success: false,
//       message: "Error while searching post",
//     });
//   }
// };

// export { searchPostController };