'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export interface LogEntry {
  id: string;
  timestamp: Date;
  moveNumber: number;
  player: 'white' | 'black' | 'engine';
  move: string;
  san: string;
  evaluation?: number;
  type: 'move' | 'blunder' | 'mistake' | 'inaccuracy' | 'good' | 'excellent' | 'brilliant';
  explanation?: string;
  engineSuggestion?: string;
  wasDeliberate?: boolean; // For engine moves that were intentionally suboptimal
}

interface TrainingLogsProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  onExportLogs: () => void;
  className?: string;
}

export function TrainingLogs({
  logs,
  onClearLogs,
  onExportLogs,
  className,
}: TrainingLogsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  const getTypeColor = (type: LogEntry['type']): string => {
    switch (type) {
      case 'brilliant': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'move': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'inaccuracy': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'mistake': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'blunder': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeSymbol = (type: LogEntry['type']): string => {
    switch (type) {
      case 'brilliant': return '!!';
      case 'excellent': return '!';
      case 'good': return '';
      case 'move': return '';
      case 'inaccuracy': return '?!';
      case 'mistake': return '?';
      case 'blunder': return '??';
      default: return '';
    }
  };

  const formatEvaluation = (evaluation: number): string => {
    if (Math.abs(evaluation) > 1000) {
      return evaluation > 0 ? '+M' : '-M';
    }
    return (evaluation / 100).toFixed(1);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getPlayerIcon = (player: LogEntry['player']): string => {
    switch (player) {
      case 'white': return '♔';
      case 'black': return '♚';
      case 'engine': return '🤖';
      default: return '';
    }
  };

  const recentLogs = logs.slice(-50).reverse(); // Show last 50 entries, most recent first
  const stats = {
    totalMoves: logs.filter(log => log.type === 'move').length,
    blunders: logs.filter(log => log.type === 'blunder').length,
    mistakes: logs.filter(log => log.type === 'mistake').length,
    inaccuracies: logs.filter(log => log.type === 'inaccuracy').length,
    goodMoves: logs.filter(log => ['good', 'excellent', 'brilliant'].includes(log.type)).length,
  };

  return (
    <div className={className}>
      <Card>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Training Log</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {logs.length} entries
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Statistics */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Moves:</span>
                  <span className="font-medium">{stats.totalMoves}</span>
                </div>
                <div className="flex justify-between">
                  <span>Good Moves:</span>
                  <span className="font-medium text-green-600">{stats.goodMoves}</span>
                </div>
                <div className="flex justify-between">
                  <span>Inaccuracies:</span>
                  <span className="font-medium text-yellow-600">{stats.inaccuracies}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mistakes:</span>
                  <span className="font-medium text-orange-600">{stats.mistakes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Blunders:</span>
                  <span className="font-medium text-red-600">{stats.blunders}</span>
                </div>
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span className="font-medium">
                    {stats.totalMoves > 0 
                      ? Math.round((stats.goodMoves / stats.totalMoves) * 100)
                      : 0}%
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <Button onClick={onClearLogs} variant="outline" size="sm">
                  Clear Log
                </Button>
                <Button onClick={onExportLogs} variant="outline" size="sm">
                  Export
                </Button>
              </div>

              {/* Log entries */}
              <ScrollArea className="h-64 w-full border rounded-md">
                <div className="p-2 space-y-1">
                  {recentLogs.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No moves logged yet. Start playing to see analysis!
                    </div>
                  ) : (
                    recentLogs.map((entry) => (
                      <div
                        key={entry.id}
                        className={cn(
                          'p-2 rounded-md border cursor-pointer transition-colors hover:bg-gray-50',
                          selectedEntry === entry.id && 'ring-2 ring-blue-500'
                        )}
                        onClick={() => setSelectedEntry(
                          selectedEntry === entry.id ? null : entry.id
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {getPlayerIcon(entry.player)}
                            </span>
                            <span className="font-mono text-sm font-medium">
                              {entry.moveNumber}.{entry.player === 'black' ? '..' : ''} {entry.san}
                              {getTypeSymbol(entry.type)}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={cn('text-xs', getTypeColor(entry.type))}
                            >
                              {entry.type}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {entry.evaluation !== undefined && (
                              <span className="font-mono">
                                {formatEvaluation(entry.evaluation)}
                              </span>
                            )}
                            <span>{formatTime(entry.timestamp)}</span>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {selectedEntry === entry.id && (
                          <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                            {entry.explanation && (
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">Analysis: </span>
                                {entry.explanation}
                              </div>
                            )}
                            
                            {entry.engineSuggestion && (
                              <div className="text-sm text-blue-700">
                                <span className="font-medium">Suggested: </span>
                                <span className="font-mono">{entry.engineSuggestion}</span>
                              </div>
                            )}
                            
                            {entry.wasDeliberate && (
                              <div className="text-xs text-purple-600 italic">
                                Engine played human-like move (not best)
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-500">
                              Move: {entry.move} | Position after: {entry.san}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Recent activity summary */}
              {logs.length > 0 && (
                <div className="text-xs text-gray-500 text-center">
                  Showing last {Math.min(50, logs.length)} of {logs.length} total entries
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}

// Utility function to create log entries
export function createLogEntry(
  moveNumber: number,
  player: LogEntry['player'],
  move: string,
  san: string,
  type: LogEntry['type'] = 'move',
  evaluation?: number,
  explanation?: string,
  engineSuggestion?: string,
  wasDeliberate?: boolean
): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    moveNumber,
    player,
    move,
    san,
    evaluation,
    type,
    explanation,
    engineSuggestion,
    wasDeliberate,
  };
}

// Utility function to analyze move quality based on evaluation change
export function analyzeMoveQuality(
  prevEval: number,
  currentEval: number,
  isPlayerMove: boolean
): { type: LogEntry['type']; explanation: string } {
  const evalChange = isPlayerMove ? currentEval - prevEval : prevEval - currentEval;
  
  if (evalChange > 200) {
    return { type: 'brilliant', explanation: 'Brilliant move! Significant advantage gained.' };
  } else if (evalChange > 100) {
    return { type: 'excellent', explanation: 'Excellent move! Clear improvement.' };
  } else if (evalChange > 0) {
    return { type: 'good', explanation: 'Good move, maintaining or improving position.' };
  } else if (evalChange > -50) {
    return { type: 'move', explanation: 'Reasonable move.' };
  } else if (evalChange > -100) {
    return { type: 'inaccuracy', explanation: 'Inaccuracy. A better move was available.' };
  } else if (evalChange > -200) {
    return { type: 'mistake', explanation: 'Mistake! This loses some advantage.' };
  } else {
    return { type: 'blunder', explanation: 'Blunder! This significantly worsens the position.' };
  }
}
