from flask import Flask, render_template, jsonify, request
from algorithms.maze import (
    run_bfs, run_dfs, run_ucs, 
    run_best_first, run_astar,
    generate_maze, empty_grid, ROWS, COLS
)
from algorithms.game import (
    minimax, alpha_beta, mcts,
    check_winner
)
import time

app = Flask(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# MAZE SOLVER ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    """Render the main application page"""
    return render_template('index.html')

@app.route('/api/maze/generate', methods=['POST'])
def api_generate_maze():
    """Generate a new random maze"""
    maze = generate_maze()
    return jsonify({'grid': maze})

@app.route('/api/maze/empty', methods=['POST'])
def api_empty_grid():
    """Create an empty grid with start and goal"""
    grid = empty_grid()
    return jsonify({'grid': grid})

@app.route('/api/maze/solve', methods=['POST'])
def api_solve_maze():
    """Solve maze with specified algorithm"""
    data = request.json
    grid = data['grid']
    algorithm = data['algorithm']
    
    # Find start and goal positions
    start = None
    goal = None
    for r in range(ROWS):
        for c in range(COLS):
            if grid[r][c] == 2:  # START
                start = (r, c)
            elif grid[r][c] == 3:  # GOAL
                goal = (r, c)
    
    if not start or not goal:
        return jsonify({'error': 'Start or goal not found'}), 400
    
    # Run selected algorithm
    start_time = time.time()
    
    if algorithm == 'bfs':
        result = run_bfs(grid, start, goal)
    elif algorithm == 'dfs':
        result = run_dfs(grid, start, goal)
    elif algorithm == 'ucs':
        result = run_ucs(grid, start, goal)
    elif algorithm == 'bestfirst':
        result = run_best_first(grid, start, goal)
    elif algorithm == 'astar':
        result = run_astar(grid, start, goal)
    else:
        return jsonify({'error': 'Unknown algorithm'}), 400
    
    execution_time = (time.time() - start_time) * 1000  # Convert to ms
    
    return jsonify({
        'steps': result['steps'],
        'path': result['path'],
        'found': result['found'],
        'time': round(execution_time, 2)
    })

@app.route('/api/maze/compare', methods=['POST'])
def api_compare_algorithms():
    """Run all algorithms and compare results"""
    data = request.json
    grid = data['grid']
    
    # Find start and goal
    start = None
    goal = None
    for r in range(ROWS):
        for c in range(COLS):
            if grid[r][c] == 2:
                start = (r, c)
            elif grid[r][c] == 3:
                goal = (r, c)
    
    if not start or not goal:
        return jsonify({'error': 'Start or goal not found'}), 400
    
    algorithms = [
        ('bfs', 'BFS'),
        ('dfs', 'DFS'),
        ('ucs', 'UCS'),
        ('bestfirst', 'Best-First'),
        ('astar', 'A*')
    ]
    
    results = []
    for algo_id, algo_name in algorithms:
        start_time = time.time()
        
        if algo_id == 'bfs':
            result = run_bfs(grid, start, goal)
        elif algo_id == 'dfs':
            result = run_dfs(grid, start, goal)
        elif algo_id == 'ucs':
            result = run_ucs(grid, start, goal)
        elif algo_id == 'bestfirst':
            result = run_best_first(grid, start, goal)
        elif algo_id == 'astar':
            result = run_astar(grid, start, goal)
        
        execution_time = (time.time() - start_time) * 1000
        
        results.append({
            'name': algo_name,
            'explored': len([s for s in result['steps'] if s['type'] == 'visit']),
            'pathLen': len(result['path']),
            'time': round(execution_time, 3),
            'found': result['found']
        })
    
    return jsonify({'results': results})

# ─────────────────────────────────────────────────────────────────────────────
# GAME AI ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/game/move', methods=['POST'])
def api_game_move():
    """Get AI move for current board state"""
    data = request.json
    board = data['board']
    algorithm = data['algorithm']
    
    if algorithm == 'minimax':
        _, move = minimax(board, True)
    elif algorithm == 'alphabeta':
        _, move = alpha_beta(board, True)
    elif algorithm == 'mcts':
        move = mcts(board, 600)
    else:
        return jsonify({'error': 'Unknown algorithm'}), 400
    
    return jsonify({'move': move})

@app.route('/api/game/check', methods=['POST'])
def api_game_check():
    """Check winner of current board"""
    data = request.json
    board = data['board']
    winner = check_winner(board)
    return jsonify({'winner': winner})

if __name__ == '__main__':
    app.run(debug=True, port=5000)