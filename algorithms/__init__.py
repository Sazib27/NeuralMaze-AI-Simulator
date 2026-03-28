"""
NEURALMAZE Algorithms Package
============================
This package contains all AI algorithms used in the NeuralMaze simulator:
- Maze solving algorithms (BFS, DFS, UCS, Best-First, A*)
- Game AI algorithms (Minimax, Alpha-Beta Pruning, Monte Carlo Tree Search)
"""

# You can optionally expose key functions at package level
from .maze import (
    run_bfs, run_dfs, run_ucs, 
    run_best_first, run_astar,
    generate_maze, empty_grid
)

from .game import (
    minimax, alpha_beta, mcts,
    check_winner
)

# Define what gets imported with "from algorithms import *"
__all__ = [
    # Maze algorithms
    'run_bfs', 'run_dfs', 'run_ucs',
    'run_best_first', 'run_astar',
    'generate_maze', 'empty_grid',
    
    # Game algorithms
    'minimax', 'alpha_beta', 'mcts',
    'check_winner'
]