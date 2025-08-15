declare module 'stockfish.js' {
  interface StockfishEngine {
    postMessage(command: string): void;
    onmessage: ((event: MessageEvent) => void) | null;
    terminate(): void;
  }

  const Stockfish: {
    new (): StockfishEngine;
    default: {
      new (): StockfishEngine;
    };
  };

  export = Stockfish;
}
