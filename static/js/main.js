// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 NeuralMaze initializing...");
    
    // Check if React and ReactDOM are loaded
    if (typeof React === 'undefined') {
        console.error("React is not loaded!");
        document.getElementById('app').innerHTML = '<div style="color:#ff4466; padding:20px;">Error: React not loaded</div>';
        return;
    }
    
    if (typeof ReactDOM === 'undefined') {
        console.error("ReactDOM is not loaded!");
        document.getElementById('app').innerHTML = '<div style="color:#ff4466; padding:20px;">Error: ReactDOM not loaded</div>';
        return;
    }
    
    console.log("✅ React and ReactDOM loaded successfully!");
    console.log("React version:", React.version);

    // ─────────────────────────────────────────────────────────────────────────────
    // CONSTANTS
    // ─────────────────────────────────────────────────────────────────────────────
    const ROWS = 20;
    const COLS = 28;
    const CELL_SIZE = 28;

    const CELL_TYPE = {
        EMPTY: 0,
        WALL: 1,
        START: 2,
        GOAL: 3,
        VISITED: 4,
        FRONTIER: 5,
        PATH: 6
    };

    const COLORS = {
        empty: "#0d1117",
        wall: "#1a1a2e",
        start: "#00ff88",
        goal: "#ff4466",
        visited: "#1e3a5f",
        frontier: "#0066cc",
        path: "#ffd700",
        grid: "#1c2a3a"
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // UTILITY FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────────────
    const checkWinner = (board) => {
        const lines = [
            [0,1,2], [3,4,5], [6,7,8],  // rows
            [0,3,6], [1,4,7], [2,5,8],  // cols
            [0,4,8], [2,4,6]            // diagonals
        ];
        
        for (const [a,b,c] of lines) {
            if (board[a] && board[a] === board[b] && board[b] === board[c]) {
                return board[a];
            }
        }
        
        return board.includes(null) ? null : "draw";
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // SHARED COMPONENTS
    // ─────────────────────────────────────────────────────────────────────────────
    const Panel = ({ title, children }) => {
        return React.createElement('div', { className: 'panel' },
            React.createElement('div', { className: 'panel-header' }, title),
            React.createElement('div', { className: 'panel-body' }, children)
        );
    };

    const Metric = ({ label, value, color }) => {
        return React.createElement('div', { className: 'metric' },
            React.createElement('span', { className: 'metric-label' }, label),
            React.createElement('span', { className: 'metric-value', style: { color } }, value)
        );
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // COMPARISON RESULTS COMPONENT
    // ─────────────────────────────────────────────────────────────────────────────
    const ComparisonResults = ({ results }) => {
        const maxExplored = Math.max(...results.map(r => r.explored)) || 1;
        
        return React.createElement('div', { className: 'mt-20' },
            React.createElement('div', { className: 'section-header' },
                React.createElement('span', null, 'ALGORITHM COMPARISON RESULTS'),
                React.createElement('div', { className: 'section-header-line' })
            ),
            
            React.createElement('table', { className: 'table' },
                React.createElement('thead', null,
                    React.createElement('tr', null,
                        ['Algorithm', 'Nodes Explored', 'Path Length', 'Time (ms)', 'Status'].map(h =>
                            React.createElement('th', { key: h }, h)
                        )
                    )
                ),
                React.createElement('tbody', null,
                    results.map((row, i) =>
                        React.createElement('tr', { key: i },
                            React.createElement('td', { style: { fontWeight: 'bold' } }, row.name),
                            React.createElement('td', { className: 'text-info' }, row.explored),
                            React.createElement('td', { className: 'text-warning' }, row.found ? row.pathLen : '—'),
                            React.createElement('td', { className: 'text-success' }, row.time),
                            React.createElement('td', { className: row.found ? 'text-success' : 'text-danger' },
                                row.found ? '✓ Found' : '✗ Not found'
                            )
                        )
                    )
                )
            ),
            
            React.createElement('div', { className: 'bar-chart' },
                React.createElement('div', { className: 'bar-chart-title' }, 'NODES EXPLORED ▸'),
                results.map((row, i) =>
                    React.createElement('div', { key: i, className: 'bar-item' },
                        React.createElement('span', { className: 'bar-label' }, row.name),
                        React.createElement('div', { className: 'bar-container' },
                            React.createElement('div', {
                                className: 'bar-fill',
                                style: {
                                    width: `${(row.explored / maxExplored) * 100}%`,
                                    background: `hsl(${200 - i * 30}, 80%, 50%)`
                                }
                            })
                        ),
                        React.createElement('span', { className: 'bar-value' }, row.explored)
                    )
                )
            )
        );
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // MINI DECISION TREE COMPONENT
    // ─────────────────────────────────────────────────────────────────────────────
    const MiniDecisionTree = ({ algo }) => {
        const nodes = algo === "mcts"
            ? [
                { label: "Root", y: 0, x: 80, color: "#00c8ff" },
                { label: "Sim×600", y: 40, x: 80, color: "#ffd700" },
                { label: "UCB1", y: 80, x: 80, color: "#00ff88" },
                { label: "Best Move", y: 120, x: 80, color: "#ff4466" }
            ]
            : [
                { label: algo === "alphabeta" ? "α=-∞ β=+∞" : "MAX", y: 0, x: 80, color: "#00c8ff" },
                { label: "MIN", y: 50, x: 40, color: "#ff4466" },
                { label: "MIN", y: 50, x: 120, color: "#ff4466" },
                { label: algo === "alphabeta" ? "✂ prune" : "MAX", y: 100, x: 20, color: "#ffd700" },
                { label: "+10", y: 100, x: 70, color: "#00ff88" },
                { label: "-10", y: 100, x: 120, color: "#ff4466" }
            ];

        return React.createElement('svg', { width: "160", height: "140", style: { display: 'block' } },
            algo !== "mcts" && React.createElement(React.Fragment, null,
                React.createElement('line', { x1: "80", y1: "16", x2: "40", y2: "44", stroke: "#1a3a5c", strokeWidth: "1.5" }),
                React.createElement('line', { x1: "80", y1: "16", x2: "120", y2: "44", stroke: "#1a3a5c", strokeWidth: "1.5" }),
                React.createElement('line', { 
                    x1: "40", y1: "66", x2: "20", y2: "90", 
                    stroke: algo === "alphabeta" ? "#ff4466" : "#1a3a5c", 
                    strokeWidth: "1.5",
                    strokeDasharray: algo === "alphabeta" ? "4,2" : "0"
                }),
                React.createElement('line', { x1: "40", y1: "66", x2: "70", y2: "90", stroke: "#1a3a5c", strokeWidth: "1.5" }),
                React.createElement('line', { x1: "120", y1: "66", x2: "120", y2: "90", stroke: "#1a3a5c", strokeWidth: "1.5" })
            ),
            algo === "mcts" && React.createElement(React.Fragment, null,
                React.createElement('line', { x1: "80", y1: "16", x2: "80", y2: "34", stroke: "#1a3a5c", strokeWidth: "1.5" }),
                React.createElement('line', { x1: "80", y1: "56", x2: "80", y2: "74", stroke: "#1a3a5c", strokeWidth: "1.5" }),
                React.createElement('line', { x1: "80", y1: "96", x2: "80", y2: "114", stroke: "#1a3a5c", strokeWidth: "1.5" })
            ),
            nodes.map((n, i) =>
                React.createElement('g', { key: i },
                    React.createElement('circle', {
                        cx: n.x, cy: n.y + 10, r: "14",
                        fill: "rgba(0,30,60,0.8)",
                        stroke: n.color,
                        strokeWidth: "1.5"
                    }),
                    React.createElement('text', {
                        x: n.x, y: n.y + 14,
                        textAnchor: "middle",
                        fontSize: "7",
                        fill: n.color,
                        fontFamily: "monospace"
                    }, n.label)
                )
            )
        );
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // NAVIGATION BAR
    // ─────────────────────────────────────────────────────────────────────────────
    const NavBar = ({ activeTab, setActiveTab }) => {
        const tabs = [
            { id: "maze", icon: "◈", label: "MAZE SOLVER" },
            { id: "game", icon: "◉", label: "AI GAME" },
            { id: "dashboard", icon: "◆", label: "COMPARISON" }
        ];

        return React.createElement('nav', { className: 'nav' },
            React.createElement('div', { className: 'nav-brand' },
                React.createElement('span', { className: 'nav-brand-icon' }, '⬡'),
                React.createElement('span', { className: 'nav-brand-title' }, 'NeuralMaze'),
                React.createElement('span', { className: 'nav-brand-subtitle' }, 'AI SIMULATOR')
            ),
            tabs.map(tab =>
                React.createElement('button', {
                    key: tab.id,
                    className: `nav-tab ${activeTab === tab.id ? 'active' : ''}`,
                    onClick: () => setActiveTab(tab.id)
                },
                    React.createElement('span', { style: { marginRight: '6px' } }, tab.icon),
                    tab.label
                )
            )
        );
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // MAZE SOLVER MODULE
    // ─────────────────────────────────────────────────────────────────────────────
    const MazeSolverModule = () => {
        const [grid, setGrid] = React.useState(null);
        const [algo, setAlgo] = React.useState("astar");
        const [running, setRunning] = React.useState(false);
        const [drawMode, setDrawMode] = React.useState("wall");
        const [metrics, setMetrics] = React.useState(null);
        const [compResults, setCompResults] = React.useState(null);
        
        const mouseDownRef = React.useRef(false);
        const animIntervalRef = React.useRef(null);

        React.useEffect(() => {
            generateMaze();
            return () => {
                if (animIntervalRef.current) clearInterval(animIntervalRef.current);
            };
        }, []);

        const generateMaze = async () => {
            try {
                const response = await fetch('/api/maze/generate', { method: 'POST' });
                const data = await response.json();
                setGrid(data.grid);
                setMetrics(null);
                setCompResults(null);
            } catch (error) {
                console.error('Failed to generate maze:', error);
            }
        };

        const emptyGrid = async () => {
            try {
                const response = await fetch('/api/maze/empty', { method: 'POST' });
                const data = await response.json();
                setGrid(data.grid);
                setMetrics(null);
                setCompResults(null);
            } catch (error) {
                console.error('Failed to create empty grid:', error);
            }
        };

        const runAlgorithm = async () => {
            if (!grid || running) return;
            
            setRunning(true);
            setMetrics(null);
            
            try {
                const response = await fetch('/api/maze/solve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ grid, algorithm: algo })
                });
                
                const result = await response.json();
                
                const cleanGrid = grid.map(row => 
                    row.map(cell => 
                        [CELL_TYPE.VISITED, CELL_TYPE.FRONTIER, CELL_TYPE.PATH].includes(cell) 
                            ? CELL_TYPE.EMPTY 
                            : cell
                    )
                );
                
                let i = 0;
                const animGrid = cleanGrid.map(row => [...row]);
                
                if (animIntervalRef.current) clearInterval(animIntervalRef.current);
                
                animIntervalRef.current = setInterval(() => {
                    if (i >= result.steps.length) {
                        clearInterval(animIntervalRef.current);
                        
                        const pathGrid = animGrid.map(row => [...row]);
                        result.path.forEach(([r, c]) => {
                            if (pathGrid[r][c] !== CELL_TYPE.START && 
                                pathGrid[r][c] !== CELL_TYPE.GOAL) {
                                pathGrid[r][c] = CELL_TYPE.PATH;
                            }
                        });
                        setGrid(pathGrid);
                        
                        setMetrics({
                            pathLen: result.path.length,
                            explored: result.steps.filter(s => s.type === "visit").length,
                            time: result.time,
                            found: result.found
                        });
                        
                        setRunning(false);
                        return;
                    }
                    
                    const step = result.steps[i];
                    const [r, c] = step.cell;
                    
                    if (animGrid[r][c] !== CELL_TYPE.START && 
                        animGrid[r][c] !== CELL_TYPE.GOAL) {
                        animGrid[r][c] = step.type === "visit" 
                            ? CELL_TYPE.VISITED 
                            : CELL_TYPE.FRONTIER;
                    }
                    
                    setGrid(animGrid.map(row => [...row]));
                    i++;
                }, 50);
                
            } catch (error) {
                console.error('Failed to run algorithm:', error);
                setRunning(false);
            }
        };

        const runAll = async () => {
            if (!grid || running) return;
            
            try {
                const response = await fetch('/api/maze/compare', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ grid })
                });
                
                const data = await response.json();
                setCompResults(data.results);
                
            } catch (error) {
                console.error('Failed to compare algorithms:', error);
            }
        };

        const handleCellInteract = (r, c) => {
            if (running || !grid) return;
            
            setGrid(prev => {
                const g = prev.map(row => [...row]);
                
                if (drawMode === "wall") {
                    g[r][c] = g[r][c] === CELL_TYPE.WALL ? CELL_TYPE.EMPTY : CELL_TYPE.WALL;
                } else if (drawMode === "erase") {
                    g[r][c] = CELL_TYPE.EMPTY;
                } else if (drawMode === "start") {
                    for (let i = 0; i < ROWS; i++) {
                        for (let j = 0; j < COLS; j++) {
                            if (g[i][j] === CELL_TYPE.START) g[i][j] = CELL_TYPE.EMPTY;
                        }
                    }
                    g[r][c] = CELL_TYPE.START;
                } else if (drawMode === "goal") {
                    for (let i = 0; i < ROWS; i++) {
                        for (let j = 0; j < COLS; j++) {
                            if (g[i][j] === CELL_TYPE.GOAL) g[i][j] = CELL_TYPE.EMPTY;
                        }
                    }
                    g[r][c] = CELL_TYPE.GOAL;
                }
                
                return g;
            });
        };

        const cellColor = (type) => {
            switch(type) {
                case CELL_TYPE.WALL: return COLORS.wall;
                case CELL_TYPE.START: return COLORS.start;
                case CELL_TYPE.GOAL: return COLORS.goal;
                case CELL_TYPE.VISITED: return COLORS.visited;
                case CELL_TYPE.FRONTIER: return COLORS.frontier;
                case CELL_TYPE.PATH: return COLORS.path;
                default: return COLORS.empty;
            }
        };

        if (!grid) return React.createElement('div', null, 'Loading...');

        return React.createElement('div', { className: 'maze-layout' },
            React.createElement('div', { className: 'maze-sidebar' },
                React.createElement(Panel, { title: "ALGORITHM" },
                    [
                        { id: "bfs", label: "BFS", tag: "O(V+E)" },
                        { id: "dfs", label: "DFS", tag: "O(V+E)" },
                        { id: "ucs", label: "UCS", tag: "O((V+E)logV)" },
                        { id: "bestfirst", label: "Best-First", tag: "O(b^m)" },
                        { id: "astar", label: "A* Search", tag: "Optimal" }
                    ].map(a =>
                        React.createElement('button', {
                            key: a.id,
                            className: `btn btn-block ${algo === a.id ? 'btn-primary' : ''}`,
                            style: { marginBottom: '4px', display: 'flex', justifyContent: 'space-between' },
                            onClick: () => setAlgo(a.id)
                        },
                            React.createElement('span', null, a.label),
                            React.createElement('span', { style: { fontSize: '9px', opacity: 0.6 } }, a.tag)
                        )
                    )
                ),
                
                React.createElement(Panel, { title: "DRAW MODE" },
                    [
                        { id: "wall", icon: "■", label: "Wall", color: "#1a1a2e" },
                        { id: "erase", icon: "□", label: "Erase", color: "#0d1117" },
                        { id: "start", icon: "◉", label: "Start", color: "#00ff88" },
                        { id: "goal", icon: "◎", label: "Goal", color: "#ff4466" }
                    ].map(m =>
                        React.createElement('button', {
                            key: m.id,
                            className: `btn btn-block ${drawMode === m.id ? 'btn-primary' : ''}`,
                            style: { marginBottom: '4px', display: 'flex', gap: '8px', alignItems: 'center' },
                            onClick: () => setDrawMode(m.id)
                        },
                            React.createElement('span', { style: { color: m.color, fontSize: '14px' } }, m.icon),
                            React.createElement('span', null, m.label)
                        )
                    )
                ),
                
                React.createElement(Panel, { title: "CONTROLS" },
                    React.createElement('button', {
                        className: 'btn btn-primary btn-block',
                        style: { marginBottom: '6px' },
                        onClick: runAlgorithm,
                        disabled: running
                    }, running ? "⟳ RUNNING..." : "▶ RUN"),
                    
                    React.createElement('button', {
                        className: 'btn btn-block',
                        style: { marginBottom: '6px' },
                        onClick: generateMaze,
                        disabled: running
                    }, "⊞ GENERATE MAZE"),
                    
                    React.createElement('button', {
                        className: 'btn btn-block',
                        style: { marginBottom: '6px' },
                        onClick: emptyGrid,
                        disabled: running
                    }, "○ CLEAR GRID"),
                    
                    React.createElement('button', {
                        className: 'btn btn-block',
                        style: { color: '#f0a040' },
                        onClick: runAll,
                        disabled: running
                    }, "◈ COMPARE ALL")
                ),
                
                metrics && React.createElement(Panel, { title: "METRICS" },
                    React.createElement(Metric, { label: "Path Length", value: metrics.found ? metrics.pathLen : "N/A", color: "#ffd700" }),
                    React.createElement(Metric, { label: "Nodes Explored", value: metrics.explored, color: "#00c8ff" }),
                    React.createElement(Metric, { label: "Time (ms)", value: metrics.time, color: "#00ff88" }),
                    React.createElement(Metric, { 
                        label: "Status", 
                        value: metrics.found ? "FOUND ✓" : "NO PATH ✗", 
                        color: metrics.found ? "#00ff88" : "#ff4466" 
                    })
                ),
                
                React.createElement(Panel, { title: "LEGEND" },
                    [
                        { color: COLORS.start, label: "Start" },
                        { color: COLORS.goal, label: "Goal" },
                        { color: COLORS.wall, label: "Wall" },
                        { color: COLORS.visited, label: "Visited" },
                        { color: COLORS.frontier, label: "Frontier" },
                        { color: COLORS.path, label: "Path" }
                    ].map(({ color, label }) =>
                        React.createElement('div', { key: label, className: 'legend-item' },
                            React.createElement('div', { className: 'legend-color', style: { background: color } }),
                            React.createElement('span', { className: 'legend-label' }, label)
                        )
                    )
                )
            ),
            
            React.createElement('div', { className: 'maze-canvas' },
                React.createElement('div', {
                    className: 'grid-canvas',
                    style: {
                        gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
                        cursor: drawMode === "erase" ? "crosshair" : "pointer"
                    },
                    onMouseLeave: () => { mouseDownRef.current = false; }
                },
                    grid.map((row, r) =>
                        row.map((cell, c) =>
                            React.createElement('div', {
                                key: `${r}-${c}`,
                                className: 'grid-cell',
                                style: { background: cellColor(cell) },
                                onMouseDown: () => { mouseDownRef.current = true; handleCellInteract(r, c); },
                                onMouseUp: () => { mouseDownRef.current = false; },
                                onMouseEnter: () => { if (mouseDownRef.current) handleCellInteract(r, c); }
                            })
                        )
                    )
                ),
                
                compResults && React.createElement(ComparisonResults, { results: compResults })
            )
        );
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // GAME MODULE
    // ─────────────────────────────────────────────────────────────────────────────
    const GameModule = () => {
        const [board, setBoard] = React.useState(Array(9).fill(null));
        const [xIsNext, setXIsNext] = React.useState(true);
        const [algo, setAlgo] = React.useState("alphabeta");
        const [status, setStatus] = React.useState("Your turn (X)");
        const [thinking, setThinking] = React.useState(false);
        const [history, setHistory] = React.useState([]);
        const [lastAIMove, setLastAIMove] = React.useState(null);
        const [stats, setStats] = React.useState({ wins: 0, losses: 0, draws: 0 });

        const handleClick = async (i) => {
            if (board[i] || !xIsNext || thinking) return;
            
            const winner = checkWinner(board);
            if (winner) return;
            
            const newBoard = [...board];
            newBoard[i] = "X";
            setBoard(newBoard);
            setLastAIMove(null);
            
            const w = checkWinner(newBoard);
            if (w) {
                setStatus(w === "draw" ? "It's a draw!" : "You win! 🎉");
                setHistory(h => [...h, w === "draw" ? "Draw" : "You won"]);
                setStats(s => ({ ...s, wins: s.wins + 1 }));
                return;
            }
            
            setXIsNext(false);
            setStatus("AI is thinking...");
            setThinking(true);
        };

        React.useEffect(() => {
            if (xIsNext || !thinking) return;
            
            const getAIMove = async () => {
                try {
                    const response = await fetch('/api/game/move', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ board, algorithm: algo })
                    });
                    
                    const data = await response.json();
                    const aiMove = data.move;
                    
                    if (aiMove === null || aiMove === undefined) {
                        setThinking(false);
                        return;
                    }
                    
                    const newBoard = [...board];
                    newBoard[aiMove] = "O";
                    setBoard(newBoard);
                    setLastAIMove(aiMove);
                    
                    const w = checkWinner(newBoard);
                    if (w) {
                        setStatus(w === "draw" ? "It's a draw!" : "AI wins! 🤖");
                        setHistory(h => [...h, w === "draw" ? "Draw" : "AI won"]);
                        setStats(s => w === "draw" 
                            ? { ...s, draws: s.draws + 1 }
                            : { ...s, losses: s.losses + 1 }
                        );
                    } else {
                        setStatus("Your turn (X)");
                    }
                    
                    setXIsNext(true);
                    setThinking(false);
                    
                } catch (error) {
                    console.error('Failed to get AI move:', error);
                    setThinking(false);
                }
            };
            
            const timer = setTimeout(getAIMove, 400);
            return () => clearTimeout(timer);
            
        }, [xIsNext, thinking, board, algo]);

        const reset = () => {
            setBoard(Array(9).fill(null));
            setXIsNext(true);
            setStatus("Your turn (X)");
            setThinking(false);
            setLastAIMove(null);
        };

        const winner = checkWinner(board);

        return React.createElement('div', { className: 'game-layout' },
            React.createElement('div', { className: 'game-sidebar' },
                React.createElement(Panel, { title: "AI ALGORITHM" },
                    [
                        { id: "minimax", label: "Minimax", desc: "Complete tree search" },
                        { id: "alphabeta", label: "Alpha-Beta Pruning", desc: "Optimized minimax" },
                        { id: "mcts", label: "Monte Carlo", desc: "Simulation-based" }
                    ].map(a =>
                        React.createElement('button', {
                            key: a.id,
                            className: `btn btn-block ${algo === a.id ? 'btn-primary' : ''}`,
                            style: { marginBottom: '6px', textAlign: 'left' },
                            onClick: () => { setAlgo(a.id); reset(); }
                        },
                            React.createElement('div', { style: { fontWeight: 'bold' } }, a.label),
                            React.createElement('div', { style: { fontSize: '10px', opacity: 0.6, marginTop: '2px' } }, a.desc)
                        )
                    )
                ),
                
                React.createElement(Panel, { title: "SCORE" },
                    React.createElement(Metric, { label: "Your Wins", value: stats.wins, color: "#00ff88" }),
                    React.createElement(Metric, { label: "AI Wins", value: stats.losses, color: "#ff4466" }),
                    React.createElement(Metric, { label: "Draws", value: stats.draws, color: "#ffd700" })
                ),
                
                React.createElement(Panel, { title: "GAME LOG" },
                    React.createElement('div', { style: { maxHeight: '120px', overflow: 'auto' } },
                        history.length === 0
                            ? React.createElement('span', { style: { fontSize: '11px', color: '#446688' } }, 'No games yet')
                            : history.slice().reverse().map((h, i) =>
                                React.createElement('div', {
                                    key: i,
                                    style: {
                                        fontSize: '11px',
                                        color: h.includes('You') ? '#00ff88' : h === 'Draw' ? '#ffd700' : '#ff4466',
                                        marginBottom: '2px'
                                    }
                                }, `#${history.length - i} ${h}`)
                            )
                    )
                )
            ),
            
            React.createElement('div', { className: 'game-center' },
                React.createElement('div', {
                    className: `game-status ${thinking ? 'thinking' : 'normal'}`
                }, status),
                
                React.createElement('div', { className: 'game-board' },
                    board.map((cell, i) =>
                        React.createElement('button', {
                            key: i,
                            className: `game-cell ${cell ? cell : ''} ${lastAIMove === i ? 'highlight' : ''}`,
                            onClick: () => handleClick(i),
                            disabled: !(!cell && xIsNext && !winner)
                        }, cell === "X" ? "✕" : cell === "O" ? "○" : "")
                    )
                ),
                
                React.createElement('button', {
                    className: 'btn btn-primary',
                    style: { minWidth: '180px' },
                    onClick: reset
                }, "↺ NEW GAME"),
                
                React.createElement('div', { className: 'game-explanation' },
                    algo === "minimax" &&
                        React.createElement(React.Fragment, null,
                            React.createElement('strong', { style: { color: '#00c8ff' } }, 'Minimax'),
                            ": Explores the complete game tree. MAX player (AI) picks moves to maximize score, MIN player (you) minimizes it. Always finds optimal play but evaluates every possible position."
                        ),
                    algo === "alphabeta" &&
                        React.createElement(React.Fragment, null,
                            React.createElement('strong', { style: { color: '#00c8ff' } }, 'Alpha-Beta Pruning'),
                            ": Optimized Minimax. Alpha tracks best MAX score, Beta tracks best MIN score. When α ≥ β, branches are pruned — up to 2× deeper search in same time."
                        ),
                    algo === "mcts" &&
                        React.createElement(React.Fragment, null,
                            React.createElement('strong', { style: { color: '#00c8ff' } }, 'Monte Carlo Tree Search'),
                            ": Runs 600 random game simulations. Uses UCB1 formula to balance exploration vs exploitation. No heuristics needed — learns purely from simulated outcomes."
                        )
                )
            ),
            
            React.createElement('div', { className: 'game-sidebar' },
                React.createElement(Panel, { title: "HOW IT WORKS" },
                    React.createElement(MiniDecisionTree, { algo })
                )
            )
        );
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // DASHBOARD MODULE
    // ─────────────────────────────────────────────────────────────────────────────
    const DashboardModule = () => {
        const [benchResults, setBenchResults] = React.useState(null);
        const [running, setRunning] = React.useState(false);

        const runBenchmark = async () => {
            setRunning(true);
            
            try {
                const mazeResponse = await fetch('/api/maze/generate', { method: 'POST' });
                const mazeData = await mazeResponse.json();
                
                const response = await fetch('/api/maze/compare', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ grid: mazeData.grid })
                });
                
                const data = await response.json();
                setBenchResults(data.results);
                
            } catch (error) {
                console.error('Benchmark failed:', error);
            } finally {
                setRunning(false);
            }
        };

        const algoInfo = [
            { name: "BFS", category: "Uninformed", complete: "Yes", optimal: "Yes", time: "O(b^d)", space: "O(b^d)", notes: "Guarantees shortest path in unweighted graphs" },
            { name: "DFS", category: "Uninformed", complete: "No", optimal: "No", time: "O(b^m)", space: "O(bm)", notes: "Memory efficient but may not find shortest path" },
            { name: "UCS", category: "Uninformed", complete: "Yes", optimal: "Yes", time: "O(b^⌈C/ε⌉)", space: "O(b^⌈C/ε⌉)", notes: "Optimal for weighted graphs (Dijkstra variant)" },
            { name: "Best-First", category: "Informed", complete: "No", optimal: "No", time: "O(b^m)", space: "O(b^m)", notes: "Greedy: fast but can be misled by heuristic" },
            { name: "A*", category: "Informed", complete: "Yes", optimal: "Yes", time: "O(b^d)", space: "O(b^d)", notes: "Optimal with admissible heuristic. Gold standard." },
            { name: "Minimax", category: "Game AI", complete: "Yes", optimal: "Yes", time: "O(b^m)", space: "O(bm)", notes: "Perfect play in adversarial zero-sum games" },
            { name: "Alpha-Beta", category: "Game AI", complete: "Yes", optimal: "Yes", time: "O(b^(m/2))", space: "O(bm)", notes: "Prunes redundant branches — 2× deeper than Minimax" },
            { name: "MCTS", category: "Game AI", complete: "No", optimal: "No", time: "O(i×b×d)", space: "O(i×b×d)", notes: "Simulation-based; no heuristic needed. Used in AlphaGo." }
        ];

        return React.createElement('div', { className: 'dashboard' },
            React.createElement('div', { className: 'dashboard-header' },
                React.createElement('div', { className: 'dashboard-title' }, 'ALGORITHM COMPARISON DASHBOARD'),
                React.createElement('div', { className: 'dashboard-subtitle' }, 'Reference guide + live benchmark on generated maze')
            ),
            
            React.createElement('div', { style: { marginBottom: '28px' } },
                React.createElement('div', { className: 'section-header' },
                    React.createElement('span', null, 'ALGORITHM PROPERTIES'),
                    React.createElement('div', { className: 'section-header-line' })
                ),
                React.createElement('div', { style: { overflowX: 'auto' } },
                    React.createElement('table', { className: 'table' },
                        React.createElement('thead', null,
                            React.createElement('tr', null,
                                ['Algorithm', 'Category', 'Complete', 'Optimal', 'Time', 'Space', 'Description'].map(h =>
                                    React.createElement('th', { key: h, style: { whiteSpace: 'nowrap' } }, h)
                                )
                            )
                        ),
                        React.createElement('tbody', null,
                            algoInfo.map((row, i) =>
                                React.createElement('tr', { key: i },
                                    React.createElement('td', { style: { fontWeight: 'bold' } }, row.name),
                                    React.createElement('td', null,
                                        React.createElement('span', {
                                            className: `badge ${
                                                row.category === 'Game AI' ? 'badge-game-ai' :
                                                row.category === 'Informed' ? 'badge-informed' : 'badge-uninformed'
                                            }`
                                        }, row.category)
                                    ),
                                    React.createElement('td', { className: row.complete === 'Yes' ? 'text-success' : 'text-danger' }, row.complete),
                                    React.createElement('td', { className: row.optimal === 'Yes' ? 'text-success' : 'text-danger' }, row.optimal),
                                    React.createElement('td', { className: 'text-warning', style: { fontFamily: 'monospace', fontSize: '11px' } }, row.time),
                                    React.createElement('td', { style: { color: '#66aacc', fontFamily: 'monospace', fontSize: '11px' } }, row.space),
                                    React.createElement('td', { style: { color: '#8ab0c8', maxWidth: '260px' } }, row.notes)
                                )
                            )
                        )
                    )
                )
            ),
            
            React.createElement('div', { style: { marginBottom: '28px' } },
                React.createElement('div', { className: 'section-header' },
                    React.createElement('span', null, 'LIVE BENCHMARK'),
                    React.createElement('div', { className: 'section-header-line' })
                ),
                React.createElement('button', {
                    className: 'btn btn-primary',
                    style: { marginBottom: '16px' },
                    onClick: runBenchmark,
                    disabled: running
                }, running ? "⟳ RUNNING BENCHMARK..." : "▶ RUN BENCHMARK ON MAZE"),
                
                benchResults && React.createElement(ComparisonResults, { results: benchResults })
            ),
            
            React.createElement('div', { className: 'section-header' },
                React.createElement('span', null, 'KEY CONCEPTS'),
                React.createElement('div', { className: 'section-header-line' })
            ),
            React.createElement('div', { className: 'concept-grid' },
                [
                    { 
                        title: "Uninformed Search", 
                        color: "#0066cc", 
                        icon: "⊕",
                        desc: "Explore without domain knowledge. Only knows start/goal/transitions. BFS guarantees shortest path; DFS is memory efficient; UCS handles weighted edges." 
                    },
                    { 
                        title: "Informed Search", 
                        color: "#00aa44", 
                        icon: "◈",
                        desc: "Uses heuristics to guide exploration. Best-First greedily minimizes h(n). A* optimally combines g(n)+h(n) — the gold standard of pathfinding algorithms." 
                    },
                    { 
                        title: "Game AI", 
                        color: "#cc6600", 
                        icon: "◉",
                        desc: "Adversarial search for competitive games. Minimax evaluates full game trees. Alpha-Beta prunes impossible branches. MCTS uses simulations instead of evaluation functions." 
                    }
                ].map((card, i) =>
                    React.createElement('div', {
                        key: i,
                        className: 'concept-card',
                        style: { borderColor: `${card.color}33`, background: `rgba(${i===0?'0,80,150':i===1?'0,120,60':'150,80,0'},0.1)` }
                    },
                        React.createElement('div', { className: 'concept-icon' }, card.icon),
                        React.createElement('div', { className: 'concept-title', style: { color: card.color } }, card.title),
                        React.createElement('div', { className: 'concept-desc' }, card.desc)
                    )
                )
            )
        );
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // MAIN APP COMPONENT
    // ─────────────────────────────────────────────────────────────────────────────
    const App = () => {
        const [activeTab, setActiveTab] = React.useState("maze");

        return React.createElement('div', { className: 'app-container' },
            React.createElement(NavBar, { activeTab, setActiveTab }),
            React.createElement('div', { className: 'main-content' },
                activeTab === "maze" && React.createElement(MazeSolverModule),
                activeTab === "game" && React.createElement(GameModule),
                activeTab === "dashboard" && React.createElement(DashboardModule)
            )
        );
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER APP WITH REACT 18's createRoot
    // ─────────────────────────────────────────────────────────────────────────────
    try {
        const container = document.getElementById('app');
        const root = ReactDOM.createRoot(container);
        root.render(React.createElement(App));
        console.log("✅ App rendered successfully with React 18!");
    } catch (error) {
        console.error("❌ Error rendering app:", error);
        document.getElementById('app').innerHTML = `<div style="color:#ff4466; padding:20px;">Error: ${error.message}</div>`;
    }
});