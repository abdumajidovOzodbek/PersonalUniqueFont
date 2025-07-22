import {
  UserModel,
  GameModel,
  GameMoveModel,
  ChatMessageModel,
  MatchmakingQueueModel,
  type User,
  type UpsertUser,
  type Game,
  type InsertGame,
  type GameMove,
  type InsertGameMove,
  type ChatMessage,
  type InsertChatMessage,
  type MatchmakingEntry,
  type InsertMatchmakingEntry,
} from "@shared/schema";
import { connectToMongoDB } from "./mongoose";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: string): Promise<Game | undefined>;
  getGameWithPlayers(id: string): Promise<Game & { whitePlayer: User | null; blackPlayer: User | null } | undefined>;
  updateGame(id: string, updates: Partial<InsertGame>): Promise<Game>;
  getUserGames(userId: string, limit?: number): Promise<Game[]>;
  
  // Game move operations
  addGameMove(move: InsertGameMove): Promise<GameMove>;
  getGameMoves(gameId: string): Promise<GameMove[]>;
  
  // Chat operations
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(gameId: string): Promise<(ChatMessage & { player: User })[]>;
  
  // Matchmaking operations
  addToMatchmaking(entry: InsertMatchmakingEntry): Promise<MatchmakingEntry>;
  findMatchmakingOpponent(playerId: string, timeControl: number, ratingRange: number): Promise<MatchmakingEntry | undefined>;
  removeFromMatchmaking(playerId: string): Promise<void>;
  isPlayerInQueue(playerId: string): Promise<boolean>;
  
  // User stats
  updateUserStats(userId: string, result: 'win' | 'loss' | 'draw'): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    connectToMongoDB().catch(console.error);
  }

  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ id }).exec();
    if (!user) return undefined;
    const userObj = user.toObject();
    return {
      ...userObj,
      _id: userObj._id.toString(),
      email: userObj.email || undefined,
      firstName: userObj.firstName || undefined,
      lastName: userObj.lastName || undefined,
      profileImageUrl: userObj.profileImageUrl || undefined,
    } as User;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user = await UserModel.findOneAndUpdate(
      { id: userData.id },
      { ...userData, updatedAt: new Date() },
      { upsert: true, new: true }
    ).exec();
    const userObj = user.toObject();
    return {
      ...userObj,
      _id: userObj._id.toString(),
      email: userObj.email || undefined,
      firstName: userObj.firstName || undefined,
      lastName: userObj.lastName || undefined,
      profileImageUrl: userObj.profileImageUrl || undefined,
    } as User;
  }

  // Game operations
  async createGame(game: InsertGame): Promise<Game> {
    const newGame = new GameModel({
      ...game,
      status: 'active',
      currentTurn: 'white',
      moveCount: 0,
      pgn: '',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await newGame.save();
    const gameObj = newGame.toObject();
    return {
      ...gameObj,
      id: gameObj._id.toString(),
      _id: gameObj._id.toString(),
    } as Game;
  }

  async getGame(id: string): Promise<Game | undefined> {
    const game = await GameModel.findById(id).exec();
    if (!game) return undefined;
    const gameObj = game.toObject();
    return {
      ...gameObj,
      _id: gameObj._id.toString(),
    } as Game;
  }

  async getGameWithPlayers(id: string): Promise<Game & { whitePlayer: User | null; blackPlayer: User | null } | undefined> {
    const game = await GameModel.findById(id).exec();
    if (!game) return undefined;

    const whitePlayer = game.whitePlayerId 
      ? await UserModel.findOne({ id: game.whitePlayerId }).exec()
      : null;
    const blackPlayer = game.blackPlayerId 
      ? await UserModel.findOne({ id: game.blackPlayerId }).exec()
      : null;

    const gameObj = game.toObject();
    return {
      ...gameObj,
      _id: gameObj._id.toString(),
      whitePlayer: whitePlayer ? {
        ...whitePlayer.toObject(),
        _id: whitePlayer.toObject()._id.toString(),
        email: whitePlayer.email || undefined,
        firstName: whitePlayer.firstName || undefined,
        lastName: whitePlayer.lastName || undefined,
        profileImageUrl: whitePlayer.profileImageUrl || undefined,
      } as User : null,
      blackPlayer: blackPlayer ? {
        ...blackPlayer.toObject(),
        _id: blackPlayer.toObject()._id.toString(),
        email: blackPlayer.email || undefined,
        firstName: blackPlayer.firstName || undefined,
        lastName: blackPlayer.lastName || undefined,
        profileImageUrl: blackPlayer.profileImageUrl || undefined,
      } as User : null,
    } as Game & { whitePlayer: User | null; blackPlayer: User | null };
  }

  async updateGame(id: string, updates: Partial<InsertGame>): Promise<Game> {
    const updatedGame = await GameModel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).exec();
    
    if (!updatedGame) {
      throw new Error('Game not found');
    }
    
    const gameObj = updatedGame.toObject();
    return {
      ...gameObj,
      _id: gameObj._id.toString(),
    } as Game;
  }

  async getUserGames(userId: string, limit = 10): Promise<Game[]> {
    const games = await GameModel
      .find({
        $or: [
          { whitePlayerId: userId },
          { blackPlayerId: userId }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
      
    return games.map(game => {
      const gameObj = game.toObject();
      return {
        ...gameObj,
        _id: gameObj._id.toString(),
      } as Game;
    });
  }

  // Game move operations
  async addGameMove(move: InsertGameMove): Promise<GameMove> {
    const newMove = new GameMoveModel(move);
    await newMove.save();
    const moveObj = newMove.toObject();
    return {
      ...moveObj,
      _id: moveObj._id.toString(),
      gameId: moveObj.gameId.toString(),
    } as GameMove;
  }

  async getGameMoves(gameId: string): Promise<GameMove[]> {
    const moves = await GameMoveModel
      .find({ gameId })
      .sort({ moveNumber: 1 })
      .exec();
      
    return moves.map(move => {
      const moveObj = move.toObject();
      return {
        ...moveObj,
        _id: moveObj._id.toString(),
        gameId: moveObj.gameId.toString(),
      } as GameMove;
    });
  }

  // Chat operations
  async addChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const newMessage = new ChatMessageModel(message);
    await newMessage.save();
    const messageObj = newMessage.toObject();
    return {
      ...messageObj,
      _id: messageObj._id.toString(),
      gameId: messageObj.gameId.toString(),
    } as ChatMessage;
  }

  async getChatMessages(gameId: string): Promise<(ChatMessage & { player: User })[]> {
    const messages = await ChatMessageModel
      .find({ gameId })
      .sort({ createdAt: 1 })
      .exec();

    const messagesWithPlayers = [];
    for (const msg of messages) {
      const player = await UserModel.findOne({ id: msg.playerId }).exec();
      if (player) {
        const msgObj = msg.toObject();
        const playerObj = player.toObject();
        messagesWithPlayers.push({
          ...msgObj,
          _id: msgObj._id.toString(),
          gameId: msgObj.gameId.toString(),
          player: {
            ...playerObj,
            _id: playerObj._id.toString(),
            email: playerObj.email || undefined,
            firstName: playerObj.firstName || undefined,
            lastName: playerObj.lastName || undefined,
            profileImageUrl: playerObj.profileImageUrl || undefined,
          }
        });
      }
    }

    return messagesWithPlayers;
  }

  // Matchmaking operations
  async addToMatchmaking(entry: InsertMatchmakingEntry): Promise<MatchmakingEntry> {
    const newEntry = new MatchmakingQueueModel(entry);
    await newEntry.save();
    const entryObj = newEntry.toObject();
    return {
      ...entryObj,
      _id: entryObj._id.toString(),
    } as MatchmakingEntry;
  }

  async findMatchmakingOpponent(
    playerId: string,
    timeControl: number,
    ratingRange: number
  ): Promise<MatchmakingEntry | undefined> {
    const currentUser = await this.getUser(playerId);
    if (!currentUser) return undefined;

    // Find any available opponent with same time control
    const opponent = await MatchmakingQueueModel
      .findOne({
        playerId: { $ne: playerId },
        timeControl,
      })
      .sort({ createdAt: 1 }) // First in queue gets matched first
      .exec();

    if (!opponent) return undefined;
    
    const opponentObj = opponent.toObject();
    return {
      ...opponentObj,
      _id: opponentObj._id.toString(),
    } as MatchmakingEntry;
  }

  async removeFromMatchmaking(playerId: string): Promise<void> {
    await MatchmakingQueueModel.deleteMany({ playerId }).exec();
  }

  async isPlayerInQueue(playerId: string): Promise<boolean> {
    const entry = await MatchmakingQueueModel.findOne({ playerId }).exec();
    return !!entry;
  }

  // User stats
  async updateUserStats(userId: string, result: 'win' | 'loss' | 'draw'): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const updates: any = {
      gamesPlayed: user.gamesPlayed + 1,
      updatedAt: new Date(),
    };

    if (result === 'win') {
      updates.wins = user.wins + 1;
      updates.rating = user.rating + 25;
    } else if (result === 'loss') {
      updates.losses = user.losses + 1;
      updates.rating = Math.max(800, user.rating - 25);
    } else {
      updates.draws = user.draws + 1;
      updates.rating = user.rating + 5;
    }

    await UserModel.updateOne({ id: userId }, updates).exec();
  }
}

export const storage = new DatabaseStorage();
