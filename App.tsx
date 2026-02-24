import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Chess } from 'chess.js';
import { Peer } from 'peerjs';
import { ChessBoard3D } from './components/ChessBoard3D';
import { getBestMove } from './services/geminiService';
import { PeerMessage, GameMode } from './types';
import { Bot, RefreshCw, ChevronLeft, BrainCircuit, Users, Wifi, Copy, Check, Play, X, Monitor, Globe } from 'lucide-react';

const App = () => {
  // Game State
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [aiThinking, setAiThinking] = useState(false);
  const [gameStatus, setGameStatus] = useState<string>("New Game");
  const [playerColor, setPlayerColor] = useState<'w'|'b'>('w'); // In Online mode: 'w' = Host, 'b' = Guest
  const [mode, setMode] = useState<GameMode>('AI');

  // Multiplayer State
  const [peerId, setPeerId] = useState<string>('');
  const [connStatus, setConnStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [remotePeerId, setRemotePeerId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Refs for PeerJS to avoid stale closures
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<any>(null);

  // Helper to safely update game state
  const safeGameMutate = useCallback((modify: (g: Chess) => void) => {
    setGame((g) => {
      const update = new Chess(g.fen());
      modify(update);
      setFen(update.fen());
      return update;
    });
  }, []);

  // Check Game Status
  useEffect(() => {
    if (game.isCheckmate()) setGameStatus(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins.`);
    else if (game.isDraw()) setGameStatus("Draw!");
    else if (game.isCheck()) setGameStatus("Check!");
    else {
      const isMyTurn = mode === 'ONLINE' ? (game.turn() === playerColor) : true;
      const turnMsg = game.turn() === 'w' ? "White" : "Black";
      setGameStatus(`${turnMsg}'s turn ${mode === 'ONLINE' ? (isMyTurn ? "(You)" : "(Opponent)") : ""}`);
    }
  }, [fen, game, mode, playerColor]);

  // AI Turn Handling
  // FIXED: Removed 'game' from dependency array to prevent infinite loop (black screen issue)
  useEffect(() => {
    let isMounted = true;

    if (mode === 'AI' && game.turn() !== playerColor && !game.isGameOver()) {
      const makeAiMove = async () => {
        setAiThinking(true);
        try {
          const moves = game.moves();
          // Small delay for realism
          await new Promise(r => setTimeout(r, 500));

          if (!isMounted) return; // Stop if unmounted or consistency changed

          const bestMove = await getBestMove(game.fen(), moves);

          if (!isMounted) return; // Check again after await

          safeGameMutate((g) => {
            // Apply the AI move inside the queued mutation. 'isMounted' and the
            // effect conditions handle most cases where the component or mode changes.
            try {
               g.move(bestMove);
            } catch (e) {
               // Fallback random move
               const randomMove = moves[Math.floor(Math.random() * moves.length)];
               if(randomMove) g.move(randomMove);
            }
          });
        } catch (error) {
          if (isMounted) console.error("AI Error", error);
        } finally {
          if (isMounted) setAiThinking(false);
        }
      };
      makeAiMove();
    }

    return () => {
        isMounted = false;
        // If the component re-renders or unmounts (e.g. mode change),
        // we want to ensure any pending AI thinking visualization is cleared
        // immediately if we are switching away from AI mode.
        // However, we can't inspect the 'next' mode here easily.
        // We rely on 'isMounted' to stop the state update.
    };
  }, [fen, mode, playerColor, safeGameMutate]); // Removed 'game' here

  // Initialize Peer
  const initPeer = () => {
    if (peerRef.current) return;

    // Create a new peer with a random ID
    const peer = new Peer();

    peer.on('open', (id) => {
      setPeerId(id);
      setConnStatus('idle');
    });

    peer.on('connection', (conn) => {
      connRef.current = conn;
      setConnStatus('connected');
      // I am Host, so I am White
      setPlayerColor('w');
      // Reset game for both
      resetGame(true);

      setupConnListeners(conn);
    });

    peerRef.current = peer;
  };

  const joinGame = () => {
    if (!peerRef.current || !remotePeerId) return;
    setConnStatus('connecting');
    const conn = peerRef.current.connect(remotePeerId);
    connRef.current = conn;

    conn.on('open', () => {
      setConnStatus('connected');
      setPlayerColor('b'); // Guest is Black
      setupConnListeners(conn);
    });
  };

  const setupConnListeners = (conn: any) => {
    conn.on('data', (data: PeerMessage) => {
      if (data.type === 'MOVE') {
        safeGameMutate((g) => {
          try {
            g.move({ from: data.data.from, to: data.data.to, promotion: 'q' });
          } catch (e) {
            console.error("Sync error:", e);
          }
        });
      } else if (data.type === 'RESET') {
        const newGame = new Chess();
        setGame(newGame);
        setFen(newGame.fen());
        setGameStatus("New Game");
      }
    });

    conn.on('close', () => {
      alert("Opponent disconnected");
      setConnStatus('idle');
      // Remain in Online mode but disconnected
      setPlayerColor('w');
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(peerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Switch Mode Logic with Confirmation
  const switchMode = (targetMode: GameMode) => {
    if (mode === targetMode) return;

    // If game is in progress, ask for confirmation
    if (game.history().length > 0 && !game.isGameOver()) {
        const confirmSwitch = window.confirm("Current game is in progress. Switching modes will reset the board. Continue?");
        if (!confirmSwitch) return;
    }

    // Cleanup previous mode
    if (mode === 'ONLINE') {
        connRef.current?.close();
        setConnStatus('idle');
    }

    // Set new mode
    setMode(targetMode);

    // Stop any AI thinking
    setAiThinking(false);

    // Reset Board
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setPlayerColor('w'); // Default to white for new modes

    // Initialize logic for new mode
    if (targetMode === 'ONLINE') {
        initPeer();
    }
  };

  // Handle Human Move
  const onMove = (from: string, to: string) => {
    // 1. Basic Validation
    if (aiThinking || game.isGameOver()) return;

    // 2. Turn Validation
    // AI Mode: Can only move my color
    if (mode === 'AI' && game.turn() !== playerColor) return;
    // Online Mode: Can only move my color
    if (mode === 'ONLINE' && game.turn() !== playerColor) return;

    // 3. Execution & Validation (Sync)
    const tempGame = new Chess(game.fen());
    let moveResult = null;
    try {
      moveResult = tempGame.move({ from, to, promotion: 'q' });
    } catch (e) {
      return;
    }

    if (!moveResult) return;

    // 4. Update Local State
    safeGameMutate((g) => {
      g.move({ from, to, promotion: 'q' });
    });

    // 5. Send Move if Online
    if (mode === 'ONLINE' && connRef.current) {
      connRef.current.send({
        type: 'MOVE',
        data: { from, to }
      });
    }
  };

  const resetGame = (isOnlineTrigger = false) => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setGameStatus("New Game");

    if (mode === 'ONLINE' && !isOnlineTrigger && connRef.current) {
      connRef.current.send({ type: 'RESET', data: {} });
    }
  };

  const undoMove = () => {
    if (mode === 'ONLINE') return;
    safeGameMutate((g) => {
      g.undo();
      if (mode === 'AI') g.undo(); // Undo AI move as well
    });
  };

  // Track current game instance for async checks
  const gameRef = useRef(game);
  useEffect(() => { gameRef.current = game; }, [game]);

  const askAiForHelp = async () => {
    const invokingGame = game;
    if (aiThinking || game.isGameOver()) return;

    setAiThinking(true);
    try {
        const bestMove = await getBestMove(game.fen(), game.moves());

        // If game position/context changed (e.g. a move, reset, or mode switch), ignore result
        if (gameRef.current !== invokingGame) return;

        alert(`Gemini suggests: ${bestMove}`);
    } catch (e) {
        if (gameRef.current !== invokingGame) return;
        alert("Gemini couldn't find a move.");
    } finally {
        // Only reset if we are still in same game context
        if (gameRef.current === invokingGame) {
            setAiThinking(false);
        }
    }
  };

  // Cleanup peer on unmount
  useEffect(() => {
    return () => {
      peerRef.current?.destroy();
    };
  }, []);

  return (
    <div className="w-full h-screen relative bg-zinc-900 overflow-hidden">

      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 10, 15], fov: 45 }}>
          <color attach="background" args={['#111']} />
          <ChessBoard3D
            game={game}
            onMove={onMove}
            validMoves={game.moves()}
            playerColor={playerColor} // Pass player color for camera update
            mode={mode}
          />
        </Canvas>
      </div>

      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 z-10 pointer-events-none flex justify-between items-start">
        <div className="pointer-events-auto bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/10 text-white shadow-2xl max-w-sm w-full">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Gemini 3D Chess
          </h1>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${game.turn() === 'w' ? 'bg-white' : 'bg-gray-600 border border-white'}`} />
            <span className="font-mono text-sm tracking-wider uppercase">{gameStatus}</span>
          </div>

          {aiThinking && (
            <div className="flex items-center gap-2 text-blue-400 text-sm animate-pulse mb-2">
              <BrainCircuit size={16} />
              <span>Gemini is thinking...</span>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-white/10 pt-2">
            {/* Mode Selector */}
            <div className="flex gap-1 bg-black/40 p-1 rounded-lg mb-2">
                <button
                    onClick={() => switchMode('AI')}
                    className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-2 rounded font-bold transition-colors ${
                      mode === 'AI' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Bot size={12} /> AI
                  </button>
                  <button
                    onClick={() => switchMode('LOCAL')}
                    className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-2 rounded font-bold transition-colors ${
                      mode === 'LOCAL' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Users size={12} /> Local
                  </button>
                  <button
                    onClick={() => switchMode('ONLINE')}
                    className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-2 rounded font-bold transition-colors ${
                      mode === 'ONLINE' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Globe size={12} /> Online
                  </button>
            </div>

            {/* AI Settings */}
            {mode === 'AI' && (
                <div className="flex items-center justify-between text-xs text-gray-400 bg-white/5 p-2 rounded">
                  <span>Playing as:</span>
                  <button
                      onClick={() => {
                        setPlayerColor(prev => prev === 'w' ? 'b' : 'w');
                        resetGame();
                      }}
                      className="text-white hover:text-blue-400 font-bold uppercase transition-colors"
                    >
                      {playerColor === 'w' ? "White" : "Black"}
                    </button>
                </div>
            )}

             {/* Online Settings Panel - Only visible in Online Mode */}
            {mode === 'ONLINE' && (
              <div className="flex flex-col gap-2 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
                  {connStatus === 'connected' ? (
                    <div className="flex items-center gap-2 text-green-400 bg-green-500/10 p-2 rounded border border-green-500/20">
                        <Wifi size={14} />
                        <span>Connected to Opponent</span>
                        <button onClick={() => {
                          connRef.current?.close();
                          setConnStatus('idle');
                          setPlayerColor('w');
                        }} className="ml-auto text-white hover:text-red-400 p-1"><X size={14}/></button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 p-2 bg-white/5 rounded border border-white/5">
                      <div className="flex items-center justify-between">
                          <span className="text-gray-400">My ID:</span>
                          <div className="flex gap-1 items-center">
                            {peerId ? (
                                <>
                                    <code className="bg-black/50 px-2 py-1 rounded text-blue-300 max-w-[100px] truncate select-all">{peerId}</code>
                                    <button onClick={copyToClipboard} className="text-gray-400 hover:text-white p-1">
                                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                    </button>
                                </>
                            ) : (
                                <span className="text-gray-500 italic">Initializing...</span>
                            )}
                          </div>
                      </div>

                      <div className="flex gap-1 mt-1">
                          <input
                            type="text"
                            placeholder="Enter Friend's ID"
                            value={remotePeerId}
                            onChange={(e) => setRemotePeerId(e.target.value)}
                            className="bg-black/50 border border-white/20 rounded px-2 py-1 text-white flex-1 focus:outline-none focus:border-blue-500"
                          />
                          <button
                            onClick={joinGame}
                            disabled={!remotePeerId || connStatus === 'connecting'}
                            className="bg-blue-600 hover:bg-blue-500 text-white rounded px-3 disabled:opacity-50 transition-colors"
                          >
                            {connStatus === 'connecting' ? '...' : <Play size={14} />}
                          </button>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
        <div className="flex items-center gap-4 bg-black/80 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-2xl">
          <button
            onClick={() => resetGame()}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors group"
          >
            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/20 transition-colors">
              <RefreshCw size={20} />
            </div>
            <span className="text-[10px] uppercase tracking-wide font-bold">Restart</span>
          </button>

          {mode !== ('ONLINE' as GameMode) && (
            <button
              onClick={undoMove}
              disabled={game.history().length === 0 || aiThinking}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors group disabled:opacity-50"
            >
              <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/20 transition-colors">
                <ChevronLeft size={20} />
              </div>
              <span className="text-[10px] uppercase tracking-wide font-bold">Undo</span>
            </button>
          )}

          <div className="w-px h-8 bg-white/10 mx-2"></div>

          <button
            onClick={askAiForHelp}
            disabled={aiThinking || game.isGameOver()}
            className="flex flex-col items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors group disabled:opacity-50"
          >
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 border border-blue-500/50 transition-colors">
              <Bot size={20} />
            </div>
            <span className="text-[10px] uppercase tracking-wide font-bold">Ask AI</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default App;