import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertGameSchema, 
  insertGameMoveSchema, 
  insertChatMessageSchema,
  insertMatchmakingQueueSchema 
} from "@shared/schema";
import { Chess } from "chess.js";
import { ChessBot } from "./bot";
import multer from "multer";
import { Client } from "@replit/object-storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Only allow image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
  });

  // Initialize Object Storage client
  const objectStorageClient = new Client();

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/guest", async (req, res) => {
    try {
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Force session creation if it doesn't exist
      if (!req.session) {
        return res.status(500).json({ message: "Session middleware not properly configured" });
      }

      // Regenerate session to ensure we have a valid session ID
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err: any) => {
          if (err) {
            console.error("Error regenerating session:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Verify session ID exists after regeneration
      if (!req.sessionID) {
        console.error("Session ID still null after regeneration");
        return res.status(500).json({ message: "Failed to create session ID" });
      }

      console.log("Creating guest user with session ID:", req.sessionID);

      const guestUser = await storage.upsertUser({
        id: guestId,
        email: undefined,
        firstName: "Guest",
        lastName: "Player",
        profileImageUrl: undefined,
      });

      // Save guest user to session
      req.session.passport = { user: guestUser.id };

      // Force save the session with retry logic
      let saveAttempts = 0;
      const maxAttempts = 3;

      while (saveAttempts < maxAttempts) {
        try {
          await new Promise<void>((resolve, reject) => {
            req.session.save((err: any) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
          console.log("Guest session saved successfully");
          break;
        } catch (saveError) {
          saveAttempts++;
          console.error(`Error saving guest session (attempt ${saveAttempts}):`, saveError);

          if (saveAttempts >= maxAttempts) {
            throw saveError;
          }

          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      res.json(guestUser);
    } catch (error) {
      console.error("Error creating guest user:", error);
      res.status(500).json({ message: "Failed to create guest session" });
    }
  });

  // Game routes
  app.post('/api/games', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gameData = insertGameSchema.parse(req.body);

      const game = await storage.createGame({
        ...gameData,
        whitePlayerId: userId,
        whiteTimeRemaining: gameData.timeControl || 600,
        blackTimeRemaining: gameData.timeControl || 600,
      });

      res.json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  // Create bot game
  app.post('/api/games/bot', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { difficulty = 'medium', timeControl = 600, playerColor = 'white' } = req.body;

      const botId = `bot_${difficulty}_${Date.now()}`;

      const game = await storage.createGame({
        whitePlayerId: playerColor === 'white' ? userId : botId,
        blackPlayerId: playerColor === 'white' ? botId : userId,
        timeControl: timeControl,
        whiteTimeRemaining: timeControl,
        blackTimeRemaining: timeControl,
      });

      // If bot is white, make first move
      if (playerColor === 'black') {
        const bot = new ChessBot(difficulty);
        const botMove = bot.getBestMove("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");

        const chess = new Chess();
        const move = chess.move(botMove.move);

        if (move) {
          await storage.addGameMove({
            gameId: game._id?.toString() || game.id,
            moveNumber: 1,
            move: move.san,
            fen: chess.fen(),
            timeRemaining: timeControl,
          });

          await storage.updateGame(game._id?.toString() || game.id, {
            fen: chess.fen(),
            currentTurn: 'black',
            moveCount: 1,
          });
        }
      }

      res.json(game);
    } catch (error) {
      console.error("Error creating bot game:", error);
      res.status(500).json({ message: "Failed to create bot game" });
    }
  });

  app.get('/api/games/:id', isAuthenticated, async (req, res) => {
    try {
      const gameId = req.params.id;

      if (!gameId || gameId === 'undefined') {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const game = await storage.getGameWithPlayers(gameId);

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      res.json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.get('/api/users/:userId/games', isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const games = await storage.getUserGames(userId, limit, page);
      res.json(games);
    } catch (error) {
      console.error("Error fetching user games:", error);
      res.status(500).json({ message: "Failed to fetch user games" });
    }
  });

  // Game move routes
  app.post('/api/games/:id/moves', isAuthenticated, async (req: any, res) => {
    try {
      const gameId = req.params.id;
      const userId = req.user.claims.sub;

      if (!gameId || gameId === 'undefined') {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      if (!req.body.move || !req.body.moveNumber || !req.body.fen) {
        return res.status(400).json({ message: "Missing required move data" });
      }

      const moveData = insertGameMoveSchema.parse({
        gameId,
        moveNumber: req.body.moveNumber,
        move: req.body.move,
        fen: req.body.fen,
        timeRemaining: req.body.timeRemaining,
      });

      // Get current game state
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Verify it's the player's turn
      const isWhitePlayer = game.whitePlayerId === userId;
      const isBlackPlayer = game.blackPlayerId === userId;

      if (!isWhitePlayer && !isBlackPlayer) {
        return res.status(403).json({ message: "Not a player in this game" });
      }

      const isPlayerTurn = (game.currentTurn === 'white' && isWhitePlayer) || 
                          (game.currentTurn === 'black' && isBlackPlayer);

      if (!isPlayerTurn) {
        return res.status(400).json({ message: "Not your turn" });
      }

      // Validate move with chess.js
      const chess = new Chess(game.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
      const move = chess.move(moveData.move);

      if (!move) {
        return res.status(400).json({ message: "Invalid move" });
      }

      // Add move to database
      const gameMove = await storage.addGameMove({
        gameId,
        moveNumber: (game.moveCount || 0) + 1,
        move: move.san,
        fen: chess.fen(),
        timeRemaining: moveData.timeRemaining,
      });

      // Update game state
      const gameStatus = chess.isGameOver() ? 'completed' : 'active';
      let result = null;

      if (chess.isCheckmate()) {
        result = game.currentTurn === 'white' ? 'black_wins' : 'white_wins';
      } else if (chess.isDraw() || chess.isStalemate()) {
        result = 'draw';
      }

      const updatedGame = await storage.updateGame(gameId, {
        fen: chess.fen(),
        currentTurn: game.currentTurn === 'white' ? 'black' : 'white',
        moveCount: (game.moveCount || 0) + 1,
        status: gameStatus,
        result: result || undefined,
        whiteTimeRemaining: isWhitePlayer ? moveData.timeRemaining : game.whiteTimeRemaining,
        blackTimeRemaining: isBlackPlayer ? moveData.timeRemaining : game.blackTimeRemaining,
      });

      // Update player stats if game is over
      if (result) {
        if (result === 'white_wins') {
          if (game.whitePlayerId && !game.whitePlayerId.startsWith('bot_')) {
            await storage.updateUserStats(game.whitePlayerId, 'win');
          }
          if (game.blackPlayerId && !game.blackPlayerId.startsWith('bot_')) {
            await storage.updateUserStats(game.blackPlayerId, 'loss');
          }
        } else if (result === 'black_wins') {
          if (game.blackPlayerId && !game.blackPlayerId.startsWith('bot_')) {
            await storage.updateUserStats(game.blackPlayerId, 'win');
          }
          if (game.whitePlayerId && !game.whitePlayerId.startsWith('bot_')) {
            await storage.updateUserStats(game.whitePlayerId, 'loss');
          }
        } else {
          if (game.whitePlayerId && !game.whitePlayerId.startsWith('bot_')) {
            await storage.updateUserStats(game.whitePlayerId, 'draw');
          }
          if (game.blackPlayerId && !game.blackPlayerId.startsWith('bot_')) {
            await storage.updateUserStats(game.blackPlayerId, 'draw');
          }
        }
      }

      // Make bot move if it's bot's turn and game is still active
      let botMove = null;
      if (updatedGame.status === 'active') {
        const opponentId = updatedGame.currentTurn === 'white' ? 
          updatedGame.whitePlayerId : updatedGame.blackPlayerId;

        if (opponentId && opponentId.startsWith('bot_')) {
          const difficulty = opponentId.split('_')[1] as 'easy' | 'medium' | 'hard';
          const bot = new ChessBot(difficulty);

          try {
            const botMoveData = bot.getBestMove(updatedGame.fen);
            const chessForBot = new Chess(updatedGame.fen);
            const move = chessForBot.move(botMoveData.move);

            if (move) {
              const botGameMove = await storage.addGameMove({
                gameId: gameId,
                moveNumber: (updatedGame.moveCount || 0) + 1,
                move: move.san,
                fen: chessForBot.fen(),
                timeRemaining: updatedGame.currentTurn === 'white' ? 
                  updatedGame.whiteTimeRemaining : updatedGame.blackTimeRemaining,
              });

              const botGameStatus = chessForBot.isGameOver() ? 'completed' : 'active';
              let botResult = null;

              if (chessForBot.isCheckmate()) {
                botResult = updatedGame.currentTurn === 'white' ? 'white_wins' : 'black_wins';
              } else if (chessForBot.isDraw() || chessForBot.isStalemate()) {
                botResult = 'draw';
              }

              const finalGame = await storage.updateGame(gameId, {
                fen: chessForBot.fen(),
                currentTurn: updatedGame.currentTurn === 'white' ? 'black' : 'white',
                moveCount: (updatedGame.moveCount || 0) + 1,
                status: botGameStatus,
                result: botResult || undefined,
              });

              botMove = { move: botGameMove, game: finalGame };
            }
          } catch (error) {
            console.error("Error making bot move:", error);
          }
        }
      }

      res.json({ 
        move: gameMove, 
        game: botMove ? botMove.game : updatedGame,
        botMove: botMove ? botMove.move : null 
      });
    } catch (error) {
      console.error("Error making move:", error);
      res.status(500).json({ message: "Failed to make move" });
    }
  });

  app.get('/api/games/:id/moves', isAuthenticated, async (req, res) => {
    try {
      const gameId = req.params.id;

      if (!gameId || gameId === 'undefined') {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const moves = await storage.getGameMoves(gameId);
      res.json(moves);
    } catch (error) {
      console.error("Error fetching game moves:", error);
      res.status(500).json({ message: "Failed to fetch game moves" });
    }
  });

  // Game control routes
  app.post('/api/games/:id/resign', isAuthenticated, async (req: any, res) => {
    try {
      const gameId = req.params.id;
      const userId = req.user.claims.sub;

      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const isPlayer = game.whitePlayerId === userId || game.blackPlayerId === userId;
      if (!isPlayer) {
        return res.status(403).json({ message: "Not a player in this game" });
      }

      const result = game.whitePlayerId === userId ? 'black_wins' : 'white_wins';

      const updatedGame = await storage.updateGame(gameId, {
        status: 'completed',
        result: result,
      });

      // Update player stats
      if (result === 'white_wins') {
        if (game.whitePlayerId && !game.whitePlayerId.startsWith('bot_')) {
          await storage.updateUserStats(game.whitePlayerId, 'win');
        }
        if (game.blackPlayerId && !game.blackPlayerId.startsWith('bot_')) {
          await storage.updateUserStats(game.blackPlayerId, 'loss');
        }
      } else {
        if (game.blackPlayerId && !game.blackPlayerId.startsWith('bot_')) {
          await storage.updateUserStats(game.blackPlayerId, 'win');
        }
        if (game.whitePlayerId && !game.whitePlayerId.startsWith('bot_')) {
          await storage.updateUserStats(game.whitePlayerId, 'loss');
        }
      }

      res.json(updatedGame);
    } catch (error) {
      console.error("Error resigning game:", error);
      res.status(500).json({ message: "Failed to resign game" });
    }
  });

  app.post('/api/games/:id/draw-offer', isAuthenticated, async (req: any, res) => {
    try {
      const gameId = req.params.id;
      const userId = req.user.claims.sub;

      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.status !== 'active') {
        return res.status(400).json({ message: "Game is not active" });
      }

      const isPlayer = game.whitePlayerId === userId || game.blackPlayerId === userId;
      if (!isPlayer) {
        return res.status(403).json({ message: "Not a player in this game" });
      }

      // Store draw offer
      await storage.addDrawOffer(gameId, userId);
      res.json({ message: "Draw offer sent" });
    } catch (error) {
      console.error("Error offering draw:", error);
      res.status(500).json({ message: "Failed to offer draw" });
    }
  });

  app.post('/api/games/:id/draw-response', isAuthenticated, async (req: any, res) => {
    try {
      const gameId = req.params.id;
      const userId = req.user.claims.sub;
      const { accept } = req.body;

      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.status !== 'active') {
        return res.status(400).json({ message: "Game is not active" });
      }

      const isPlayer = game.whitePlayerId === userId || game.blackPlayerId === userId;
      if (!isPlayer) {
        return res.status(403).json({ message: "Not a player in this game" });
      }

      // Remove draw offers
      await storage.removeDrawOffers(gameId);

      if (accept) {
        // End game in draw
        const updatedGame = await storage.updateGame(gameId, {
          status: 'completed',
          result: 'draw',
        });

        // Update player stats
        if (game.whitePlayerId && !game.whitePlayerId.startsWith('bot_')) {
          await storage.updateUserStats(game.whitePlayerId, 'draw');
        }
        if (game.blackPlayerId && !game.blackPlayerId.startsWith('bot_')) {
          await storage.updateUserStats(game.blackPlayerId, 'draw');
        }

        res.json({ accepted: true, game: updatedGame });
      } else {
        res.json({ accepted: false });
      }
    } catch (error) {
      console.error("Error responding to draw:", error);
      res.status(500).json({ message: "Failed to respond to draw" });
    }
  });

  app.get('/api/games/:id/draw-offers', isAuthenticated, async (req: any, res) => {
    try {
      const gameId = req.params.id;
      const userId = req.user.claims.sub;

      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const isPlayer = game.whitePlayerId === userId || game.blackPlayerId === userId;
      if (!isPlayer) {
        return res.status(403).json({ message: "Not a player in this game" });
      }

      // Get draw offers from opponent
      const opponentId = game.whitePlayerId === userId ? game.blackPlayerId : game.whitePlayerId;
      const drawOffers = await storage.getDrawOffers(gameId, opponentId);
      
      res.json(drawOffers);
    } catch (error) {
      console.error("Error fetching draw offers:", error);
      res.status(500).json({ message: "Failed to fetch draw offers" });
    }
  });

  // Chat routes
  app.post('/api/games/:id/chat', isAuthenticated, async (req: any, res) => {
    try {
      const gameId = req.params.id;
      const userId = req.user.claims.sub;

      if (!gameId || gameId === 'undefined') {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const messageData = insertChatMessageSchema.parse({
        gameId,
        playerId: userId,
        message: req.body.message,
      });

      const chatMessage = await storage.addChatMessage(messageData);
      res.json(chatMessage);
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/games/:id/chat', isAuthenticated, async (req, res) => {
    try {
      const gameId = req.params.id;
      const messages = await storage.getChatMessages(gameId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Matchmaking routes
  app.post('/api/matchmaking', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entryData = insertMatchmakingQueueSchema.parse({
        playerId: userId,
        timeControl: req.body.timeControl || 600,
        ratingRange: req.body.ratingRange || 200,
      });

      // Check for existing opponent
      const opponent = await storage.findMatchmakingOpponent(
        userId,
        entryData.timeControl!,
        entryData.ratingRange!
      );

      if (opponent) {
        // Randomly assign colors to make it fair
        const isCurrentPlayerWhite = Math.random() > 0.5;
        
        // Create game with found opponent
        const game = await storage.createGame({
          whitePlayerId: isCurrentPlayerWhite ? userId : opponent.playerId,
          blackPlayerId: isCurrentPlayerWhite ? opponent.playerId : userId,
          timeControl: entryData.timeControl,
          whiteTimeRemaining: entryData.timeControl,
          blackTimeRemaining: entryData.timeControl,
        });

        // Remove both players from queue
        await storage.removeFromMatchmaking(userId);
        await storage.removeFromMatchmaking(opponent.playerId);

        res.json({ 
          matched: true, 
          game: { 
            ...game, 
            id: game._id?.toString() || game.id,
            _id: game._id?.toString() || game.id 
          } 
        });
      } else {
        // Add to queue
        const entry = await storage.addToMatchmaking(entryData);
        res.json({ matched: false, entry });
      }
    } catch (error) {
      console.error("Error with matchmaking:", error);
      res.status(500).json({ message: "Failed to process matchmaking" });
    }
  });

  app.get('/api/matchmaking/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if player is still in queue
      const inQueue = await storage.isPlayerInQueue(userId);
      
      if (!inQueue) {
        // Player might have been matched, check for recent games
        const recentGames = await storage.getUserGames(userId, 1);
        if (recentGames.length > 0) {
          const latestGame = recentGames[0];
          // Check if this game was created in the last 30 seconds (indicating a fresh match)
          const gameAge = Date.now() - new Date(latestGame.createdAt).getTime();
          if (gameAge < 30000) {
            return res.json({ 
              matched: true, 
              game: { 
                ...latestGame, 
                id: latestGame._id?.toString() || latestGame.id,
                _id: latestGame._id?.toString() || latestGame.id 
              } 
            });
          }
        }
      }
      
      res.json({ matched: false, inQueue });
    } catch (error) {
      console.error("Error checking matchmaking status:", error);
      res.status(500).json({ message: "Failed to check matchmaking status" });
    }
  });

  app.delete('/api/matchmaking', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.removeFromMatchmaking(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing from matchmaking:", error);
      res.status(500).json({ message: "Failed to remove from matchmaking" });
    }
  });

  // Image upload route
  app.post('/api/upload/profile-image', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const userId = req.user.claims.sub;
      const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
      const fileName = `profile-images/${userId}-${Date.now()}.${fileExtension}`;

      // Upload to Object Storage
      const { ok, error } = await objectStorageClient.uploadFromBytes(fileName, req.file.buffer);

      if (!ok) {
        console.error("Error uploading to Object Storage:", error);
        return res.status(500).json({ message: "Failed to upload image" });
      }

      // Generate the URL for the uploaded image
      const imageUrl = `/api/images/${fileName}`;

      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  // Serve images from Object Storage
  app.get('/api/images/*', async (req, res) => {
    try {
      const fileName = req.params[0];
      
      // Download from Object Storage
      const { ok, value, error } = await objectStorageClient.downloadAsBytes(fileName);

      if (!ok) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Set appropriate content type
      const extension = fileName.split('.').pop()?.toLowerCase();
      let contentType = 'image/jpeg'; // default
      
      switch (extension) {
        case 'png':
          contentType = 'image/png';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'webp':
          contentType = 'image/webp';
          break;
        default:
          contentType = 'image/jpeg';
      }

      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(value);
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).json({ message: "Failed to serve image" });
    }
  });

  // Profile update routes
  app.put('/api/profile/username', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName } = req.body;

      if (!firstName || firstName.trim().length === 0) {
        return res.status(400).json({ message: "First name is required" });
      }

      if (firstName.trim().length > 50 || (lastName && lastName.trim().length > 50)) {
        return res.status(400).json({ message: "Names must be 50 characters or less" });
      }

      const updatedUser = await storage.updateUserProfile(userId, {
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : undefined,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating username:", error);
      res.status(500).json({ message: "Failed to update username" });
    }
  });

  app.put('/api/profile/picture', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { profileImageUrl } = req.body;

      if (!profileImageUrl || typeof profileImageUrl !== 'string') {
        return res.status(400).json({ message: "Valid profile image URL is required" });
      }

      const updatedUser = await storage.updateUserProfile(userId, {
        profileImageUrl,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ message: "Failed to update profile picture" });
    }
  });

  // Leaderboard route
  app.get('/api/leaderboard', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}