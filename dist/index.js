// ? Setup and configure the apollo server
import { ApolloServer } from '@apollo/server';
// ? Startup the server so we can listen for requests
import { startStandaloneServer } from '@apollo/server/standalone';
// ? Generate unique IDs
import { v4 as uuidv4 } from 'uuid';
let games = [
    { id: '1', title: 'Zelda, Tears of the Kingdom', platform: ['Switch'] },
    { id: '2', title: 'Final Fantasy 7 Remake', platform: ['PS5', 'Xbox'] },
    { id: '3', title: 'Elden Ring', platform: ['PS5', 'Xbox', 'PC'] },
    { id: '4', title: 'Mario Kart', platform: ['Switch'] },
    { id: '5', title: 'Pokemon Scarlet', platform: ['PS5', 'Xbox', 'PC'] },
];
let authors = [
    { id: '1', name: 'mario', verified: true },
    { id: '2', name: 'yoshi', verified: false },
    { id: '3', name: 'peach', verified: true },
];
let reviews = [
    { id: '1', rating: 9, content: 'lorem ipsum', author_id: '1', game_id: '2' },
    { id: '2', rating: 10, content: 'lorem ipsum', author_id: '2', game_id: '1' },
    { id: '3', rating: 7, content: 'lorem ipsum', author_id: '3', game_id: '3' },
    { id: '4', rating: 5, content: 'lorem ipsum', author_id: '2', game_id: '4' },
    { id: '5', rating: 8, content: 'lorem ipsum', author_id: '2', game_id: '5' },
    { id: '6', rating: 7, content: 'lorem ipsum', author_id: '1', game_id: '2' },
    { id: '7', rating: 10, content: 'lorem ipsum', author_id: '3', game_id: '1' },
];
// * Graphql schema types
const typeDefs = `#graphql
  # We describe the main fields on a game resource and the relationships with other resources (1 game may have many reviews) 
  type Game {
    # ! Signifies non nullable
    id: ID!
    title: String!
    platform: [String!]!  # A platform must have an array of at least 1
    reviews: [Review!]  # A game may have no reviews
  }
  # A Game is related to a Review by its game_id. A Review is also related to an Author (1 review has 1 author)
  type Review {
    id: ID!
    rating: Int!
    content: String!
    game_id: ID!
    game: Game!  # Related data so we will create nested resolver functions
    author: Author!  # Related data
  }
  # An Author writes a review
  type Author {
    id: ID!
    name: String!
    verified: Boolean!
    reviews: [Review!]  # An author may not have written any reviews yet
  }
  # Mandatory - Gateway for the graph and specifies the return types for those entry points
  type Query {
    # Currently these are all lists
    reviews: [Review]
    review(id: ID!): Review  # Takes a query variable so we can identify the retrieved review object
    games: [Game]
    game(id: ID!): Game
    authors: [Author]
    author(id: ID!): Author
  }
  # Delete a game and return an array of remaining games
  type Mutation {
    addGame(game: AddGameInput!): Game
    deleteGame(id: ID!): [Game]
    updateGame(id: ID!, edits: EditGameInput!): Game
  }
  # A collection of fileds to use inside our Mutation as a single argument
  input AddGameInput {
    title: String!
    platform: [String!]
  }
  # Update a game with optional fields to allow for updating one or both
  input EditGameInput {
    title: String
    platform: [String!]
  }
`;
// resolver functions for the typeDefs
// ? We don't have to create resolvers for each nested property
const resolvers = {
    // Entry point for our queries to the graph
    Query: {
        // List of games
        games() {
            return games;
        },
        // Single game by ID
        game(_, args) {
            return games.find((game) => game.id === args.id);
        },
        // List of reviews
        reviews() {
            return reviews;
        },
        // Single review by ID
        review(_, args) {
            return reviews.find((review) => review.id === args.id);
        },
        // List of authors
        authors() {
            return authors;
        },
        // Single author by ID
        author(_, args) {
            return authors.find((author) => author.id === args.id);
        },
    },
    // Nested request is related to the game object, so we add a new property caled Game: {}
    Game: {
        // List of reviews based on the parent query for a single game
        // ? 1. game(id) resolver - retrieve a single game
        // ? 2. reviews(parent) - (parent is game(id)) retrieve a list of reviews for that game
        reviews(parent) {
            // Filter out any game IDs which don't match the individual review ID
            return reviews.filter((review) => review.game_id === parent.id);
        }
    },
    Author: {
        reviews(parent) {
            // Filter out any author IDs which don't match the individual review ID
            return reviews.filter((review) => review.author_id === parent.id);
        }
    },
    // Nested author and games inside of the Review object
    Review: {
        author(parent) {
            // Get an author_id that matches the parent ID
            return authors.find((author) => author.id === parent.author_id);
        },
        game(parent) {
            // Get an game_id that matches the parent ID
            return games.find((game) => game.id === parent.game_id);
        }
    },
    // A resolver for deleting a game
    Mutation: {
        deleteGame(_, args) {
            games = games.filter((game) => game.id !== args.id);
            return games;
        },
        addGame(_, args) {
            let game = {
                ...args.game,
                id: uuidv4()
            };
            games.push(game);
            return game;
        },
        updateGame(_, args) {
            games = games.map((game) => {
                if (game.id === args.id) {
                    return { ...game, ...args.edits };
                }
                return game;
            });
            return games.find((game) => game.id === args.id);
        }
    }
};
// * A schema describes the shape of the graph and the data available on it
// ? Create an instance of ApolloServer
// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
    // ? descriptions of our data types and their relationships with eachother
    typeDefs,
    // ? resolvers - resolver functions that determine how we respond to different queries on the graph
    resolvers
});
// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
});
console.log(`🚀  Server ready at: ${url}`);
