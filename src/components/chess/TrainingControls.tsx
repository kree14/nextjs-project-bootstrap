'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { EngineConfig } from '@/lib/chessEngine';

interface TrainingControlsProps {
  config: EngineConfig;
  onConfigChange: (newConfig: Partial<EngineConfig>) => void;
  showHints: boolean;
  onShowHintsChange: (show: boolean) => void;
  boardFlipped: boolean;
  onBoardFlipChange: (flipped: boolean) => void;
  autoFlip: boolean;
  onAutoFlipChange: (auto: boolean) => void;
  onNewGame: () => void;
  onUndoMove: () => void;
  onLoadPgn: (pgn: string) => void;
  onLoadFen: (fen: string) => void;
  className?: string;
}

export function TrainingControls({
  config,
  onConfigChange,
  showHints,
  onShowHintsChange,
  boardFlipped,
  onBoardFlipChange,
  autoFlip,
  onAutoFlipChange,
  onNewGame,
  onUndoMove,
  onLoadPgn,
  onLoadFen,
  className,
}: TrainingControlsProps) {
  const handleEloChange = (value: number[]) => {
    onConfigChange({ eloRating: value[0] });
  };

  const handleAccuracyChange = (value: number[]) => {
    onConfigChange({ accuracy: value[0] });
  };

  const handleTimePerMoveChange = (value: number[]) => {
    onConfigChange({ timePerMove: value[0] });
  };

  const handleSkillLevelChange = (value: number[]) => {
    onConfigChange({ skillLevel: value[0] });
  };

  const handleContemptChange = (value: number[]) => {
    onConfigChange({ contempt: value[0] });
  };

  const getEloDescription = (elo: number): string => {
    if (elo < 800) return 'Beginner';
    if (elo < 1200) return 'Novice';
    if (elo < 1600) return 'Intermediate';
    if (elo < 2000) return 'Advanced';
    if (elo < 2400) return 'Expert';
    return 'Master';
  };

  const getAccuracyDescription = (accuracy: number): string => {
    if (accuracy < 70) return 'Very Human-like (Many mistakes)';
    if (accuracy < 80) return 'Human-like (Some mistakes)';
    if (accuracy < 90) return 'Strong Human (Few mistakes)';
    if (accuracy < 95) return 'Near Perfect (Rare mistakes)';
    return 'Perfect Play (No mistakes)';
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Training Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ELO Rating */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">ELO Rating</Label>
              <span className="text-sm text-gray-600">
                {config.eloRating} ({getEloDescription(config.eloRating)})
              </span>
            </div>
            <Slider
              value={[config.eloRating]}
              onValueChange={handleEloChange}
              min={600}
              max={2500}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>600 (Beginner)</span>
              <span>2500 (Master)</span>
            </div>
          </div>

          <Separator />

          {/* Accuracy Level */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Playing Accuracy</Label>
              <span className="text-sm text-gray-600">
                {config.accuracy}%
              </span>
            </div>
            <Slider
              value={[config.accuracy]}
              onValueChange={handleAccuracyChange}
              min={60}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="text-xs text-gray-500">
              {getAccuracyDescription(config.accuracy)}
            </div>
          </div>

          <Separator />

          {/* Advanced Engine Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Advanced Settings</Label>
            
            {/* Thinking Time */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs">Thinking Time (ms)</Label>
                <span className="text-xs text-gray-600">{config.timePerMove}ms</span>
              </div>
              <Slider
                value={[config.timePerMove]}
                onValueChange={handleTimePerMoveChange}
                min={500}
                max={5000}
                step={250}
                className="w-full"
              />
            </div>

            {/* Skill Level */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs">Engine Skill Level</Label>
                <span className="text-xs text-gray-600">{config.skillLevel}/20</span>
              </div>
              <Slider
                value={[config.skillLevel]}
                onValueChange={handleSkillLevelChange}
                min={0}
                max={20}
                step={1}
                className="w-full"
              />
            </div>

            {/* Contempt */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs">Contempt Factor</Label>
                <span className="text-xs text-gray-600">{config.contempt}</span>
              </div>
              <Slider
                value={[config.contempt]}
                onValueChange={handleContemptChange}
                min={-100}
                max={100}
                step={10}
                className="w-full"
              />
            </div>
          </div>

          <Separator />

          {/* Training Features */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Training Features</Label>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-hints" className="text-sm">Show Move Hints</Label>
              <Switch
                id="show-hints"
                checked={showHints}
                onCheckedChange={onShowHintsChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="board-flipped" className="text-sm">Flip Board</Label>
              <Switch
                id="board-flipped"
                checked={boardFlipped}
                onCheckedChange={onBoardFlipChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-flip" className="text-sm">Auto Flip Board</Label>
              <Switch
                id="auto-flip"
                checked={autoFlip}
                onCheckedChange={onAutoFlipChange}
              />
            </div>
          </div>

          <Separator />

          {/* Game Controls */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Game Controls</Label>
            
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={onNewGame} variant="outline" size="sm">
                New Game
              </Button>
              <Button onClick={onUndoMove} variant="outline" size="sm">
                Undo Move
              </Button>
            </div>
          </div>

          <Separator />

          {/* Load Game */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Load Position</Label>
            
            <div className="space-y-2">
              <Button
                onClick={() => {
                  const pgn = prompt('Enter PGN:');
                  if (pgn) onLoadPgn(pgn);
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Load PGN
              </Button>
              
              <Button
                onClick={() => {
                  const fen = prompt('Enter FEN:');
                  if (fen) onLoadFen(fen);
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Load FEN
              </Button>
            </div>
          </div>

          {/* Preset Configurations */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Presets</Label>
            
            <Select onValueChange={(value) => {
              const presets: { [key: string]: Partial<EngineConfig> } = {
                beginner: { eloRating: 800, accuracy: 65, timePerMove: 1000 },
                intermediate: { eloRating: 1400, accuracy: 75, timePerMove: 1500 },
                advanced: { eloRating: 1800, accuracy: 85, timePerMove: 2000 },
                expert: { eloRating: 2200, accuracy: 92, timePerMove: 2500 },
              };
              
              if (presets[value]) {
                onConfigChange(presets[value]);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose preset..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner (800 ELO)</SelectItem>
                <SelectItem value="intermediate">Intermediate (1400 ELO)</SelectItem>
                <SelectItem value="advanced">Advanced (1800 ELO)</SelectItem>
                <SelectItem value="expert">Expert (2200 ELO)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
