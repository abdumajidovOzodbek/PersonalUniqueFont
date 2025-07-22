import { Schema, model, Document } from "mongoose";
import { z } from "zod";

// Mongoose Schema Definitions

// User Schema
const userSchema = new Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  firstName: { type: String },
  lastName: { type: String },
  profileImageUrl: { type: String },
  rating: { type: Number, default: 1200 },
  gamesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Game Schema
const gameSchema = new Schema({
  whitePlayerId: { type: String, ref: 'User' },
  blackPlayerId: { type: String, ref: 'User' },
  status: { type: String, default: "active" }, // active, completed, resigned, draw
  result: { type: String }, // white_wins, black_wins, draw
  timeControl: { type: Number, default: 600 }, // seconds
  whiteTimeRemaining: { type: Number },
  blackTimeRemaining: { type: Number },
  currentTurn: { type: String, default: "white" }, // white, black
  moveCount: { type: Number, default: 0 },
  pgn: { type: String, default: "" },
  fen: { type: String, default: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Game Move Schema
const gameMoveSchema = new Schema({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  moveNumber: { type: Number, required: true },
  move: { type: String, required: true }, // algebraic notation
  fen: { type: String, required: true },
  timeRemaining: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

// Chat Message Schema
const chatMessageSchema = new Schema({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  playerId: { type: String, ref: 'User', required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Matchmaking Queue Schema
const matchmakingQueueSchema = new Schema({
  playerId: { type: String, ref: 'User', required: true },
  timeControl: { type: Number, default: 600 },
  ratingRange: { type: Number, default: 200 },
  createdAt: { type: Date, default: Date.now },
});

// Session Schema (for Replit Auth)
const sessionSchema = new Schema({
  sid: { type: String, required: true, unique: true },
  sess: { type: Schema.Types.Mixed, required: true },
  expire: { type: Date, required: true },
});

// Create Mongoose Models
export const UserModel = model('User', userSchema);
export const GameModel = model('Game', gameSchema);
export const GameMoveModel = model('GameMove', gameMoveSchema);
export const ChatMessageModel = model('ChatMessage', chatMessageSchema);
export const MatchmakingQueueModel = model('MatchmakingQueue', matchmakingQueueSchema);
export const SessionModel = model('Session', sessionSchema);

// TypeScript Interfaces
export interface User extends Document {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Game extends Document {
  _id: string;
  whitePlayerId?: string;
  blackPlayerId?: string;
  status: string;
  result?: string;
  timeControl: number;
  whiteTimeRemaining?: number;
  blackTimeRemaining?: number;
  currentTurn: string;
  moveCount: number;
  pgn: string;
  fen: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameMove extends Document {
  _id: string;
  gameId: string;
  moveNumber: number;
  move: string;
  fen: string;
  timeRemaining?: number;
  createdAt: Date;
}

export interface ChatMessage extends Document {
  _id: string;
  gameId: string;
  playerId: string;
  message: string;
  createdAt: Date;
}

export interface MatchmakingEntry extends Document {
  _id: string;
  playerId: string;
  timeControl: number;
  ratingRange: number;
  createdAt: Date;
}

// Zod Validation Schemas
export const insertUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
});

export const insertGameSchema = z.object({
  whitePlayerId: z.string().optional(),
  blackPlayerId: z.string().optional(),
  status: z.string().optional(),
  result: z.string().optional(),
  timeControl: z.number().optional(),
  whiteTimeRemaining: z.number().optional(),
  blackTimeRemaining: z.number().optional(),
  currentTurn: z.string().optional(),
  moveCount: z.number().optional(),
  pgn: z.string().optional(),
  fen: z.string().optional(),
});

export const insertGameMoveSchema = z.object({
  gameId: z.string(),
  moveNumber: z.number(),
  move: z.string(),
  fen: z.string(),
  timeRemaining: z.number().optional(),
});

export const insertChatMessageSchema = z.object({
  gameId: z.string(),
  playerId: z.string(),
  message: z.string(),
});

export const insertMatchmakingQueueSchema = z.object({
  playerId: z.string(),
  timeControl: z.number().optional(),
  ratingRange: z.number().optional(),
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertGameMove = z.infer<typeof insertGameMoveSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertMatchmakingEntry = z.infer<typeof insertMatchmakingQueueSchema>;
