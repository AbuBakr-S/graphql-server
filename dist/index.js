// ? Setup and configure the apollo server
import { ApolloServer } from '@apollo/server';
// ? Startup the server so we can listen for requests
import { startStandaloneServer } from '@apollo/server/standalone';
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
// types
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  type Game {
    # ! Signifies non nullable
    id: ID!
    title: String!
    platform: [String!]!
    reviews: [Review!]  # A game may have no reviews
  }
  type Review {
    id: ID!
    rating: Int!
    content: String!
    game_id: ID!
    game: Game!  # Related data
    author: Author!  # Related data
  }
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
`;
// resolver functions for the typeDefs
// ? We don't have to create resolvers for each nested property
const resolvers = {
    // Entry point for our queries
    Query: {
        games() {
            return games;
        },
        game(_, args) {
            return games.find((game) => game.id === args.id);
        },
        reviews() {
            return reviews;
        },
        // resolver(parent, args, context)
        review(_, args) {
            return reviews.find((review) => review.id === args.id);
        },
        authors() {
            return authors;
        },
        author(_, args) {
            return authors.find((author) => author.id === args.id);
        },
    },
    // Nested
    Game: {
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
            return authors.find((author) => author.id === parent.author_id);
        },
        game(parent) {
            return games.find((game) => game.id === parent.game_id);
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
