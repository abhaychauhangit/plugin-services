import { client } from './elasticSearchClient.js';


export async function createIndex() {
  const indexName = 'posts';

  try {
 
    const exists = await client.indices.exists({ index: indexName });

    if (!exists) {
      
      await client.indices.create({
        index: indexName,
        body: {
          settings: {
            analysis: {
              analyzer: {
                autocomplete_analyzer: {
                  type: 'custom',
                  tokenizer: 'autocomplete_tokenizer',
                  filter: ['lowercase']
                },
                autocomplete_search_analyzer: {
                  tokenizer: 'lowercase'
                }
              },
              tokenizer: {
                autocomplete_tokenizer: {
                  type: 'edge_ngram',
                  min_gram: 1,
                  max_gram: 20,
                  token_chars: ['letter', 'digit']
                }
              }
            }
          },
          mappings: {
            properties: {
              postId: { type: 'keyword' },
              userId: { type: 'keyword' },
              content: {
                type: 'text',
                analyzer: 'autocomplete_analyzer',
                search_analyzer: 'autocomplete_search_analyzer'
              },
              createdAt: { type: 'date' },
            }
          }
        }
      });

      console.log(`Index '${indexName}' created successfully`);
    } else {
      console.log(`Index '${indexName}' already exists`);
    }
  } catch (error) {
    console.error('Error creating index:', error);
    throw error;
  }
}
