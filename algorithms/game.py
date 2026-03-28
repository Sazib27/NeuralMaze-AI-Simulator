import random
import math

# ─────────────────────────────────────────────────────────────────────────────
# TIC-TAC-TOE CONSTANTS AND UTILITIES
# ─────────────────────────────────────────────────────────────────────────────

WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],  # rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8],  # cols
    [0, 4, 8], [2, 4, 6]               # diagonals
]

def check_winner(board):
    """Check if there's a winner or draw"""
    for a, b, c in WIN_LINES:
        if board[a] and board[a] == board[b] == board[c]:
            return board[a]
    if None not in board:
        return "draw"
    return None

# ─────────────────────────────────────────────────────────────────────────────
# MINIMAX
# ─────────────────────────────────────────────────────────────────────────────

def minimax(board, is_maximizing, depth=0):
    """
    Minimax: game tree search where MAX player maximizes score,
    MIN player minimizes score.
    """
    winner = check_winner(board)
    if winner == "O":
        return (10 - depth, None)
    if winner == "X":
        return (depth - 10, None)
    if winner == "draw":
        return (0, None)

    best_move = None
    
    if is_maximizing:  # AI (O) turn
        best_score = -float('inf')
        for i in range(9):
            if board[i] is None:
                board[i] = "O"
                score, _ = minimax(board, False, depth + 1)
                board[i] = None
                if score > best_score:
                    best_score = score
                    best_move = i
        return (best_score, best_move)
    
    else:  # Human (X) turn
        best_score = float('inf')
        for i in range(9):
            if board[i] is None:
                board[i] = "X"
                score, _ = minimax(board, True, depth + 1)
                board[i] = None
                if score < best_score:
                    best_score = score
                    best_move = i
        return (best_score, best_move)

# ─────────────────────────────────────────────────────────────────────────────
# ALPHA-BETA PRUNING
# ─────────────────────────────────────────────────────────────────────────────

def alpha_beta(board, is_maximizing, alpha=-float('inf'), beta=float('inf'), depth=0):
    """
    Alpha-Beta Pruning: optimized minimax that prunes branches that cannot
    affect the final decision.
    """
    winner = check_winner(board)
    if winner == "O":
        return (10 - depth, None)
    if winner == "X":
        return (depth - 10, None)
    if winner == "draw":
        return (0, None)

    best_move = None
    
    if is_maximizing:  # AI (O) turn
        best_score = -float('inf')
        for i in range(9):
            if board[i] is None:
                board[i] = "O"
                score, _ = alpha_beta(board, False, alpha, beta, depth + 1)
                board[i] = None
                if score > best_score:
                    best_score = score
                    best_move = i
                alpha = max(alpha, best_score)
                if beta <= alpha:  # Prune
                    break
        return (best_score, best_move)
    
    else:  # Human (X) turn
        best_score = float('inf')
        for i in range(9):
            if board[i] is None:
                board[i] = "X"
                score, _ = alpha_beta(board, True, alpha, beta, depth + 1)
                board[i] = None
                if score < best_score:
                    best_score = score
                    best_move = i
                beta = min(beta, best_score)
                if beta <= alpha:  # Prune
                    break
        return (best_score, best_move)

# ─────────────────────────────────────────────────────────────────────────────
# MONTE CARLO TREE SEARCH
# ─────────────────────────────────────────────────────────────────────────────

def mcts(board, iterations=500):
    """
    Monte Carlo Tree Search: builds a search tree using random simulations.
    """
    empty = [i for i, v in enumerate(board) if v is None]
    if not empty:
        return None
    if len(empty) == 1:
        return empty[0]

    scores = [0] * 9
    counts = [0] * 9

    for _ in range(iterations):
        # UCB1 selection
        total_plays = sum(counts) or 1
        best_ucb = -float('inf')
        move = empty[0]
        
        for m in empty:
            if counts[m] == 0:
                ucb = float('inf')
            else:
                ucb = (scores[m] / counts[m]) + 1.41 * math.sqrt(math.log(total_plays) / counts[m])
            if ucb > best_ucb:
                best_ucb = ucb
                move = m
        
        # Simulate random playout
        sim = board.copy()
        sim[move] = "O"
        turn = "X"
        remaining = [i for i, v in enumerate(sim) if v is None]
        
        while remaining:
            idx = random.choice(remaining)
            sim[idx] = turn
            remaining.remove(idx)
            turn = "X" if turn == "O" else "O"
            if check_winner(sim):
                break
        
        result = check_winner(sim)
        counts[move] += 1
        # Reward: win=1, draw=0.5, loss=0
        if result == "O":
            scores[move] += 1
        elif result == "draw":
            scores[move] += 0.5

    # Choose move with best win rate
    best_move = empty[0]
    best_rate = -1
    for m in empty:
        rate = scores[m] / counts[m] if counts[m] > 0 else 0
        if rate > best_rate:
            best_rate = rate
            best_move = m
    
    return best_move