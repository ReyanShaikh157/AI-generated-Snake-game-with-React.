import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Terminal } from 'lucide-react';

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
const GAME_SPEED = 100;

const TRACKS = [
  { id: 1, title: 'SYS.INIT // NEON_NIGHTS', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'MEM.DUMP // CYBER_DRIFT', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'ERR.404 // GLITCH_CORE', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

type Point = { x: number; y: number };

export default function App() {
  // Game State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Point>({ x: 0, y: -1 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  
  // Audio State
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Game Logic
  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) });
    setDirection({ x: 0, y: -1 });
    setGameOver(false);
    setScore(0);
    setIsGameActive(true);
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!isGameActive && e.key === 'Enter') {
      resetGame();
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        if (direction.y === 0) setDirection({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
      case 's':
        if (direction.y === 0) setDirection({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
      case 'a':
        if (direction.x === 0) setDirection({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
      case 'd':
        if (direction.x === 0) setDirection({ x: 1, y: 0 });
        break;
    }
  }, [direction, isGameActive]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (!isGameActive || gameOver) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };

        // Wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setIsGameActive(false);
          return prevSnake;
        }

        // Self collision
        if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          setIsGameActive(false);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((s) => s + 10);
          setFood({
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
          });
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
  }, [direction, food, gameOver, isGameActive]);

  // Draw Game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }

    // Draw food
    ctx.fillStyle = '#FF00FF';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FF00FF';
    ctx.fillRect(food.x * CELL_SIZE + 2, food.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    ctx.shadowBlur = 0;

    // Draw snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#FFFFFF' : '#00FFFF';
      ctx.shadowBlur = index === 0 ? 15 : 5;
      ctx.shadowColor = '#00FFFF';
      ctx.fillRect(segment.x * CELL_SIZE + 1, segment.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    });
    ctx.shadowBlur = 0;

  }, [snake, food]);

  // Audio Controls
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipTrack = (forward: boolean) => {
    let newIndex = currentTrackIndex + (forward ? 1 : -1);
    if (newIndex >= TRACKS.length) newIndex = 0;
    if (newIndex < 0) newIndex = TRACKS.length - 1;
    setCurrentTrackIndex(newIndex);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  }, [currentTrackIndex]);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="scanlines"></div>
      <div className="crt-flicker"></div>

      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-end mb-8 z-10">
        <div>
          <h1 className="text-5xl font-bold glitch-text neon-text tracking-widest" data-text="CYBER_SNAKE">
            CYBER_SNAKE
          </h1>
          <p className="text-magenta neon-text-magenta text-xl mt-2 flex items-center gap-2">
            <Terminal size={20} /> v2.0.4 // SYSTEM_READY
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl text-cyan/70 uppercase tracking-widest">Score</p>
          <p className="text-6xl font-bold neon-text">{score.toString().padStart(4, '0')}</p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 z-10">
        
        {/* Left Panel: Info / Stats */}
        <div className="hidden md:flex flex-col gap-6">
          <div className="neon-border p-6 bg-black/80 backdrop-blur-sm">
            <h2 className="text-2xl text-magenta neon-text-magenta mb-4 border-b border-magenta/30 pb-2">
              CONTROLS
            </h2>
            <ul className="space-y-3 text-lg text-cyan/80">
              <li className="flex justify-between"><span>[W/UP]</span> <span>MOVE_UP</span></li>
              <li className="flex justify-between"><span>[S/DOWN]</span> <span>MOVE_DOWN</span></li>
              <li className="flex justify-between"><span>[A/LEFT]</span> <span>MOVE_LEFT</span></li>
              <li className="flex justify-between"><span>[D/RIGHT]</span> <span>MOVE_RIGHT</span></li>
              <li className="flex justify-between mt-4 pt-4 border-t border-cyan/20 text-white">
                <span>[ENTER]</span> <span>START_SYS</span>
              </li>
            </ul>
          </div>
          
          <div className="neon-border-magenta p-6 bg-black/80 backdrop-blur-sm flex-grow">
            <h2 className="text-2xl text-cyan neon-text mb-4 border-b border-cyan/30 pb-2">
              SYS_LOG
            </h2>
            <div className="space-y-2 text-sm text-magenta/80 font-mono">
              <p>&gt; INITIALIZING CORE...</p>
              <p>&gt; LOADING ASSETS: OK</p>
              <p>&gt; CONNECTING TO MAINFRAME...</p>
              <p className="text-cyan animate-pulse">&gt; AWAITING USER INPUT_</p>
            </div>
          </div>
        </div>

        {/* Center Panel: Game Canvas */}
        <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center">
          <div className="relative neon-border p-2 bg-black/90">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="bg-[#050505] block"
            />
            
            {/* Overlays */}
            {!isGameActive && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="text-center">
                  <p className="text-4xl text-cyan neon-text mb-4 animate-pulse">PRESS ENTER</p>
                  <p className="text-xl text-magenta">TO INITIALIZE</p>
                </div>
              </div>
            )}
            
            {gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md">
                <div className="text-center">
                  <h2 className="text-6xl text-magenta neon-text-magenta mb-2 glitch-text" data-text="SYSTEM_FAILURE">
                    SYSTEM_FAILURE
                  </h2>
                  <p className="text-2xl text-cyan mb-8">FINAL_SCORE: {score}</p>
                  <button 
                    onClick={resetGame}
                    className="px-6 py-3 neon-border text-cyan hover:bg-cyan hover:text-black transition-colors text-xl uppercase tracking-widest"
                  >
                    REBOOT_SEQUENCE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer: Music Player */}
      <footer className="w-full max-w-4xl mt-8 z-10">
        <div className="neon-border-magenta p-4 bg-black/80 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 w-full md:w-1/3">
            <div className="w-12 h-12 bg-cyan/20 border border-cyan flex items-center justify-center">
              <div className={`w-8 h-8 border-2 border-magenta rounded-full ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}>
                <div className="w-2 h-2 bg-cyan rounded-full mx-auto mt-1"></div>
              </div>
            </div>
            <div className="overflow-hidden whitespace-nowrap w-full">
              <p className="text-xs text-magenta mb-1 uppercase tracking-widest">AUDIO_STREAM_ACTIVE</p>
              <div className="inline-block animate-[marquee_10s_linear_infinite]">
                <p className="text-xl text-cyan neon-text">{TRACKS[currentTrackIndex].title}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => skipTrack(false)} className="text-cyan hover:text-magenta transition-colors">
              <SkipBack size={28} />
            </button>
            <button 
              onClick={togglePlay} 
              className="w-14 h-14 rounded-full border-2 border-cyan flex items-center justify-center text-cyan hover:bg-cyan hover:text-black transition-all shadow-[0_0_15px_rgba(0,255,255,0.5)]"
            >
              {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
            </button>
            <button onClick={() => skipTrack(true)} className="text-cyan hover:text-magenta transition-colors">
              <SkipForward size={28} />
            </button>
          </div>

          <div className="flex items-center gap-4 w-full md:w-1/3 justify-end">
            <button onClick={toggleMute} className="text-magenta hover:text-cyan transition-colors">
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            <div className="w-32 h-2 bg-black border border-magenta relative overflow-hidden">
              <div className="absolute top-0 left-0 h-full bg-magenta/50 w-full"></div>
              {isPlaying && (
                <div className="absolute top-0 left-0 h-full w-full flex">
                  {[...Array(16)].map((_, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-magenta border-r border-black"
                      style={{ 
                        opacity: Math.random() * 0.8 + 0.2,
                        transform: `scaleY(${Math.random() * 0.8 + 0.2})`,
                        transformOrigin: 'bottom'
                      }}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <audio 
            ref={audioRef} 
            src={TRACKS[currentTrackIndex].url} 
            onEnded={() => skipTrack(true)}
            loop={false}
          />
        </div>
      </footer>
    </div>
  );
}

