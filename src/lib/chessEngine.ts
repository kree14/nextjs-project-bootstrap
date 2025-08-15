import { ChessUtils } from './chessUtils';

export interface EngineConfig {
  eloRating: number;
  skillLevel: number;
  contempt: number;
  moveOverhead: number;
  nodesPerMove: number;
  timePerMove: number;
  accuracy: number; // 0-100, where 100 is perfect play
}

export interface MoveEvaluation {
  move: string;
  score: number;
  depth: number;
  confidence: 'best' | 'good' | 'questionable' | 'blunder';
  explanation?: string;
}

export interface EngineMove {
  move: string;
  evaluation: MoveEvaluation;
  isDeliberate: boolean; // true if intentionally not the best move
}

export class ChessEngine {
  private stockfish: any;
  private config: EngineConfig;
  private isReady: boolean = false;
  private currentPosition: string = '';
  private moveHistory: string[] = [];

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = {
      eloRating: 1500,
      skillLevel: 10,
      contempt: 0,
      moveOverhead: 100,
      nodesPerMove: 1000000,
      timePerMove: 1000,
      accuracy: 85, // Default to 85% accuracy for human-like play
      ...config,
    };

    this.initializeEngine();
  }

  private async initializeEngine(): Promise<void> {
    try {
      // Dynamic import for Stockfish.js
      const Stockfish = await import('stockfish.js');
      this.stockfish = new Stockfish.default();
      
      this.stockfish.onmessage = (event: MessageEvent) => {
        this.handleEngineMessage(event.data);
      };

      // Initialize engine settings
      this.sendCommand('uci');
      this.sendCommand('isready');
    } catch (error) {
      console.error('Failed to initialize Stockfish engine:', error);
    }
  }

  private handleEngineMessage(message: string): void {
    if (message === 'uciok') {
      this.configureEngine();
    } else if (message === 'readyok') {
      this.isReady = true;
    }
  }

  private sendCommand(command: string): void {
    if (this.stockfish) {
      this.stockfish.postMessage(command);
    }
  }

  private configureEngine(): void {
    // Configure engine based on ELO and settings
    this.sendCommand(`setoption name Skill Level value ${this.config.skillLevel}`);
    this.sendCommand(`setoption name Contempt value ${this.config.contempt}`);
    this.sendCommand(`setoption name Move Overhead value ${this.config.moveOverhead}`);
    
    // Adjust skill level based on ELO rating
    const adjustedSkillLevel = this.calculateSkillLevel(this.config.eloRating);
    this.sendCommand(`setoption name Skill Level value ${adjustedSkillLevel}`);
    
    this.sendCommand('isready');
  }

  private calculateSkillLevel(elo: number): number {
    // Map ELO to Stockfish skill level (0-20)
    if (elo < 800) return 0;
    if (elo < 1000) return 2;
    if (elo < 1200) return 4;
    if (elo < 1400) return 6;
    if (elo < 1600) return 8;
    if (elo < 1800) return 10;
    if (elo < 2000) return 12;
    if (elo < 2200) return 15;
    if (elo < 2400) return 18;
    return 20;
  }

  public updateConfig(newConfig: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.configureEngine();
  }

  public async getBestMove(fen: string, chessUtils: ChessUtils): Promise<EngineMove | null> {
    if (!this.isReady) {
      await this.waitForReady();
    }

    return new Promise((resolve) => {
      const moves = chessUtils.getLegalMoves();
      if (moves.length === 0) {
        resolve(null);
        return;
      }

      // Set position
      this.sendCommand(`position fen ${fen}`);
      
      // Calculate search parameters based on config
      const searchCommand = this.buildSearchCommand();
      
      let bestMove = '';
      let evaluation = 0;
      let depth = 0;

      const messageHandler = (event: MessageEvent) => {
        const message = event.data;
        
        if (message.startsWith('info depth')) {
          const depthMatch = message.match(/depth (\d+)/);
          const scoreMatch = message.match(/score cp (-?\d+)/);
          
          if (depthMatch) depth = parseInt(depthMatch[1]);
          if (scoreMatch) evaluation = parseInt(scoreMatch[1]);
        }
        
        if (message.startsWith('bestmove')) {
          this.stockfish.onmessage = null;
          const moveMatch = message.match(/bestmove (\w+)/);
          
          if (moveMatch) {
            bestMove = moveMatch[1];
            
            // Apply human-like inaccuracies
            const finalMove = this.applyHumanLikeInaccuracy(bestMove, moves, chessUtils);
            
            const moveEvaluation: MoveEvaluation = {
              move: finalMove,
              score: evaluation,
              depth,
              confidence: this.evaluateConfidence(evaluation, depth),
              explanation: this.generateExplanation(finalMove, evaluation, chessUtils),
            };

            const engineMove: EngineMove = {
              move: finalMove,
              evaluation: moveEvaluation,
              isDeliberate: finalMove !== bestMove,
            };

            // Add natural delay
            setTimeout(() => {
              resolve(engineMove);
            }, this.calculateMoveDelay());
          } else {
            resolve(null);
          }
        }
      };

      this.stockfish.onmessage = messageHandler;
      this.sendCommand(searchCommand);
    });
  }

  private buildSearchCommand(): string {
    if (this.config.timePerMove > 0) {
      return `go movetime ${this.config.timePerMove}`;
    } else {
      return `go nodes ${this.config.nodesPerMove}`;
    }
  }

  private applyHumanLikeInaccuracy(bestMove: string, legalMoves: string[], chessUtils: ChessUtils): string {
    // If accuracy is 100%, always return best move
    if (this.config.accuracy >= 100) {
      return bestMove;
    }

    // Calculate probability of playing the best move
    const accuracyFactor = this.config.accuracy / 100;
    const randomFactor = Math.random();

    // Higher ELO = more likely to play best move
    const eloFactor = Math.min(this.config.eloRating / 2500, 1);
    const finalAccuracy = accuracyFactor * eloFactor;

    if (randomFactor < finalAccuracy) {
      return bestMove;
    }

    // Choose a suboptimal move
    return this.selectSuboptimalMove(bestMove, legalMoves, chessUtils);
  }

  private selectSuboptimalMove(bestMove: string, legalMoves: string[], chessUtils: ChessUtils): string {
    // Filter out the best move
    const alternativeMoves = legalMoves.filter(move => move !== bestMove);
    
    if (alternativeMoves.length === 0) {
      return bestMove;
    }

    // Bias towards reasonable moves rather than completely random ones
    const eloBasedSelection = this.config.eloRating / 2500;
    
    if (eloBasedSelection > 0.6) {
      // Higher ELO players make smaller mistakes
      return alternativeMoves[Math.floor(Math.random() * Math.min(3, alternativeMoves.length))];
    } else if (eloBasedSelection > 0.3) {
      // Medium ELO players make moderate mistakes
      return alternativeMoves[Math.floor(Math.random() * Math.min(5, alternativeMoves.length))];
    } else {
      // Lower ELO players can make bigger mistakes
      return alternativeMoves[Math.floor(Math.random() * alternativeMoves.length)];
    }
  }

  private calculateMoveDelay(): number {
    // Base delay between 500ms to 3000ms
    const baseDelay = 500;
    const maxDelay = 3000;
    
    // Higher ELO = faster thinking (generally)
    const eloFactor = 1 - (this.config.eloRating / 2500);
    const randomFactor = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
    
    return baseDelay + (maxDelay - baseDelay) * eloFactor * randomFactor;
  }

  private evaluateConfidence(score: number, depth: number): 'best' | 'good' | 'questionable' | 'blunder' {
    const absScore = Math.abs(score);
    
    if (absScore > 500) return 'best';
    if (absScore > 200) return 'good';
    if (absScore > -100) return 'questionable';
    return 'blunder';
  }

  private generateExplanation(move: string, score: number, chessUtils: ChessUtils): string {
    // Simple move evaluation explanations
    if (score > 300) return 'Excellent move!';
    if (score > 100) return 'Good move';
    if (score > -50) return 'Reasonable move';
    if (score > -200) return 'Questionable move';
    return 'This might not be the best';
  }

  private async waitForReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (this.isReady) {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  }

  public async getMultipleMoves(fen: string, chessUtils: ChessUtils, count: number = 3): Promise<MoveEvaluation[]> {
    if (!this.isReady) {
      await this.waitForReady();
    }

    return new Promise((resolve) => {
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth 15 multipv ${count}`);

      const moves: MoveEvaluation[] = [];

      const messageHandler = (event: MessageEvent) => {
        const message = event.data;
        
        if (message.startsWith('info depth') && message.includes('multipv')) {
          const pvMatch = message.match(/multipv (\d+)/);
          const moveMatch = message.match(/pv (\w+)/);
          const scoreMatch = message.match(/score cp (-?\d+)/);
          const depthMatch = message.match(/depth (\d+)/);
          
          if (pvMatch && moveMatch && scoreMatch && depthMatch) {
            const pvIndex = parseInt(pvMatch[1]) - 1;
            const move = moveMatch[1];
            const score = parseInt(scoreMatch[1]);
            const depth = parseInt(depthMatch[1]);
            
            moves[pvIndex] = {
              move,
              score,
              depth,
              confidence: this.evaluateConfidence(score, depth),
              explanation: this.generateExplanation(move, score, chessUtils),
            };
          }
        }
        
        if (message.startsWith('bestmove')) {
          this.stockfish.onmessage = null;
          resolve(moves.filter(move => move !== undefined));
        }
      };

      this.stockfish.onmessage = messageHandler;
    });
  }

  public destroy(): void {
    if (this.stockfish) {
      this.stockfish.terminate();
    }
  }
}

// Utility function to create engine with preset configurations
export function createEngineForELO(elo: number): ChessEngine {
  const config: Partial<EngineConfig> = {
    eloRating: elo,
    accuracy: Math.max(60, Math.min(95, 60 + (elo - 800) / 20)), // Scale accuracy with ELO
  };

  if (elo < 1000) {
    config.timePerMove = 500;
    config.accuracy = 65;
  } else if (elo < 1500) {
    config.timePerMove = 1000;
    config.accuracy = 75;
  } else if (elo < 2000) {
    config.timePerMove = 1500;
    config.accuracy = 85;
  } else {
    config.timePerMove = 2000;
    config.accuracy = 92;
  }

  return new ChessEngine(config);
}
