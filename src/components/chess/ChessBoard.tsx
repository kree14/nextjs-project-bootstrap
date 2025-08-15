'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChessUtils, squareToCoords, coordsToSquare, getPieceSymbol } from '@/lib/chessUtils';
import { cn } from '@/lib/utils';

interface ChessBoardProps {
  chessUtils: ChessUtils;
  onMove: (from: string, to: string) => void;
  flipped?: boolean;
  showArrows?: boolean;
  arrows?: Arrow[];
  highlightedSquares?: string[];
  className?: string;
}

interface Arrow {
  from: string;
  to: string;
  color: 'green' | 'yellow' | 'red';
  opacity?: number;
}

interface DragState {
  isDragging: boolean;
  piece: { type: string; color: string } | null;
  from: string | null;
  startX: number;
  startY: number;
}

export function ChessBoard({
  chessUtils,
  onMove,
  flipped = false,
  showArrows = true,
  arrows = [],
  highlightedSquares = [],
  className,
}: ChessBoardProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    piece: null,
    from: null,
    startX: 0,
    startY: 0,
  });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const board = chessUtils.getBoard();
  const gameState = chessUtils.getGameState();

  // Update arrows canvas when arrows change
  useEffect(() => {
    if (showArrows && canvasRef.current) {
      drawArrows();
    }
  }, [arrows, flipped, showArrows]);

  const drawArrows = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each arrow
    arrows.forEach(arrow => {
      drawArrow(ctx, arrow);
    });
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, arrow: Arrow) => {
    const squareSize = 60; // Should match CSS
    const fromCoords = squareToCoords(arrow.from);
    const toCoords = squareToCoords(arrow.to);

    // Adjust for flipped board
    const fromX = flipped ? (7 - fromCoords.file) * squareSize + squareSize / 2 : fromCoords.file * squareSize + squareSize / 2;
    const fromY = flipped ? fromCoords.rank * squareSize + squareSize / 2 : (7 - fromCoords.rank) * squareSize + squareSize / 2;
    const toX = flipped ? (7 - toCoords.file) * squareSize + squareSize / 2 : toCoords.file * squareSize + squareSize / 2;
    const toY = flipped ? toCoords.rank * squareSize + squareSize / 2 : (7 - toCoords.rank) * squareSize + squareSize / 2;

    // Arrow styling
    const colors = {
      green: '#22c55e',
      yellow: '#eab308',
      red: '#ef4444',
    };

    ctx.strokeStyle = colors[arrow.color];
    ctx.fillStyle = colors[arrow.color];
    ctx.globalAlpha = arrow.opacity || 0.8;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Draw arrow line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLength = 15;
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
  };

  const getSquareFromPosition = (x: number, y: number): string | null => {
    if (!boardRef.current) return null;

    const rect = boardRef.current.getBoundingClientRect();
    const squareSize = rect.width / 8;
    const file = Math.floor((x - rect.left) / squareSize);
    const rank = Math.floor((y - rect.top) / squareSize);

    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;

    const adjustedFile = flipped ? 7 - file : file;
    const adjustedRank = flipped ? rank : 7 - rank;

    return coordsToSquare(adjustedFile, adjustedRank);
  };

  const handleMouseDown = (e: React.MouseEvent, square: string) => {
    e.preventDefault();
    const piece = chessUtils.getPiece(square);
    
    if (piece && piece.color === gameState.turn) {
      setDragState({
        isDragging: true,
        piece,
        from: square,
        startX: e.clientX,
        startY: e.clientY,
      });
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragState.isDragging) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragState.isDragging && dragState.from) {
      const targetSquare = getSquareFromPosition(e.clientX, e.clientY);
      
      if (targetSquare && targetSquare !== dragState.from) {
        if (chessUtils.isLegalMove(dragState.from, targetSquare)) {
          onMove(dragState.from, targetSquare);
        }
      }
    }

    setDragState({
      isDragging: false,
      piece: null,
      from: null,
      startX: 0,
      startY: 0,
    });
  };

  const renderSquare = (piece: any, file: number, rank: number) => {
    const square = coordsToSquare(file, rank);
    const isLight = (file + rank) % 2 === 0;
    const isHighlighted = highlightedSquares.includes(square);
    const isDraggedFrom = dragState.from === square;
    
    return (
      <div
        key={square}
        className={cn(
          'relative flex items-center justify-center text-4xl font-bold cursor-pointer select-none transition-colors',
          'w-[60px] h-[60px]',
          isLight ? 'bg-amber-100' : 'bg-amber-800',
          isHighlighted && 'ring-2 ring-blue-500',
          isDraggedFrom && 'bg-opacity-50'
        )}
        onMouseDown={(e) => handleMouseDown(e, square)}
        data-square={square}
      >
        {piece && !isDraggedFrom && (
          <span className={cn(
            'pointer-events-none',
            piece.color === 'w' ? 'text-white drop-shadow-lg' : 'text-black'
          )}>
            {getPieceSymbol(piece)}
          </span>
        )}
        
        {/* Square label for debugging */}
        <span className="absolute bottom-0 right-0 text-xs opacity-30 pointer-events-none">
          {square}
        </span>
      </div>
    );
  };

  const renderBoard = () => {
    const squares = [];
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const displayRank = flipped ? rank : 7 - rank;
        const displayFile = flipped ? 7 - file : file;
        const piece = board[displayRank][displayFile];
        
        squares.push(renderSquare(piece, file, rank));
      }
    }
    
    return squares;
  };

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Main board */}
      <div
        ref={boardRef}
        className="relative grid grid-cols-8 gap-0 border-2 border-gray-800 bg-amber-900"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {renderBoard()}
        
        {/* Arrow overlay canvas */}
        {showArrows && (
          <canvas
            ref={canvasRef}
            width={480}
            height={480}
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>

      {/* Dragged piece */}
      {dragState.isDragging && dragState.piece && (
        <div
          className="fixed pointer-events-none z-50 text-4xl font-bold"
          style={{
            left: mousePosition.x - 30,
            top: mousePosition.y - 30,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span className={cn(
            dragState.piece.color === 'w' ? 'text-white drop-shadow-lg' : 'text-black drop-shadow-lg'
          )}>
            {getPieceSymbol(dragState.piece)}
          </span>
        </div>
      )}

      {/* Board coordinates */}
      <div className="absolute -left-4 top-0 h-full flex flex-col justify-around text-sm font-medium text-gray-600">
        {(flipped ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1']).map(rank => (
          <span key={rank}>{rank}</span>
        ))}
      </div>
      
      <div className="absolute -bottom-6 left-0 w-full flex justify-around text-sm font-medium text-gray-600">
        {(flipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']).map(file => (
          <span key={file}>{file}</span>
        ))}
      </div>

      {/* Game status */}
      <div className="mt-4 text-center">
        <div className="text-sm font-medium">
          {gameState.isCheckmate && 'Checkmate!'}
          {gameState.isStalemate && 'Stalemate!'}
          {gameState.isCheck && !gameState.isCheckmate && 'Check!'}
          {!gameState.isGameOver && `${gameState.turn === 'w' ? 'White' : 'Black'} to move`}
        </div>
      </div>
    </div>
  );
}
