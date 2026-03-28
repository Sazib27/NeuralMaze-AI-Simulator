import random
from collections import deque
import heapq

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────
ROWS = 20
COLS = 28

CELL_TYPE = {
    'EMPTY': 0,
    'WALL': 1,
    'START': 2,
    'GOAL': 3,
    'VISITED': 4,
    'FRONTIER': 5,
    'PATH': 6
}

# ─────────────────────────────────────────────────────────────────────────────
# UTILITY FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def get_neighbors(grid, row, col):
    """Returns valid neighbors [row, col] for a given cell"""
    dirs = [(0, 1), (1, 0), (0, -1), (-1, 0)]
    neighbors = []
    for dr, dc in dirs:
        nr, nc = row + dr, col + dc
        if (0 <= nr < ROWS and 0 <= nc < COLS and 
            grid[nr][nc] != CELL_TYPE['WALL']):
            neighbors.append((nr, nc))
    return neighbors

def reconstruct_path(parents, start, goal):
    """Reconstructs path by following parent map from goal back to start"""
    path = []
    current = f"{goal[0]},{goal[1]}"
    start_key = f"{start[0]},{start[1]}"
    
    while current != start_key:
        r, c = map(int, current.split(','))
        path.insert(0, [r, c])
        current = parents.get(current)
        if not current:
            return []
    path.insert(0, [start[0], start[1]])
    return path

def heuristic(r, c, goal):
    """Manhattan distance heuristic for informed search"""
    return abs(r - goal[0]) + abs(c - goal[1])

# ─────────────────────────────────────────────────────────────────────────────
# SEARCH ALGORITHMS
# ─────────────────────────────────────────────────────────────────────────────

def run_bfs(grid, start, goal):
    """
    Breadth-First Search: explores nodes level by level using a FIFO queue.
    Guarantees shortest path in unweighted graphs.
    """
    visited = set()
    parents = {}
    queue = deque([start])
    steps = []
    start_key = f"{start[0]},{start[1]}"
    goal_key = f"{goal[0]},{goal[1]}"
    visited.add(start_key)

    while queue:
        r, c = queue.popleft()
        key = f"{r},{c}"
        steps.append({"type": "visit", "cell": [r, c]})

        if key == goal_key:
            return {
                "steps": steps,
                "path": reconstruct_path(parents, start, goal),
                "found": True
            }
        
        for nr, nc in get_neighbors(grid, r, c):
            nk = f"{nr},{nc}"
            if nk not in visited:
                visited.add(nk)
                parents[nk] = key
                queue.append((nr, nc))
                steps.append({"type": "frontier", "cell": [nr, nc]})
    
    return {"steps": steps, "path": [], "found": False}

def run_dfs(grid, start, goal):
    """
    Depth-First Search: explores as far as possible using a LIFO stack.
    Does not guarantee shortest path.
    """
    visited = set()
    parents = {}
    stack = [start]
    steps = []
    goal_key = f"{goal[0]},{goal[1]}"

    while stack:
        r, c = stack.pop()
        key = f"{r},{c}"
        if key in visited:
            continue
        visited.add(key)
        steps.append({"type": "visit", "cell": [r, c]})

        if key == goal_key:
            return {
                "steps": steps,
                "path": reconstruct_path(parents, start, goal),
                "found": True
            }
        
        for nr, nc in get_neighbors(grid, r, c):
            nk = f"{nr},{nc}"
            if nk not in visited:
                parents[nk] = key
                stack.append((nr, nc))
                steps.append({"type": "frontier", "cell": [nr, nc]})
    
    return {"steps": steps, "path": [], "found": False}

def run_ucs(grid, start, goal):
    """
    Uniform Cost Search: expands node with lowest cumulative cost first.
    Equivalent to Dijkstra's algorithm.
    """
    # Priority queue simulation using heapq
    pq = [(0, start)]  # (cost, (r, c))
    costs = {f"{start[0]},{start[1]}": 0}
    parents = {}
    steps = []
    goal_key = f"{goal[0]},{goal[1]}"

    while pq:
        cost, (r, c) = heapq.heappop(pq)
        key = f"{r},{c}"
        steps.append({"type": "visit", "cell": [r, c]})

        if key == goal_key:
            return {
                "steps": steps,
                "path": reconstruct_path(parents, start, goal),
                "found": True
            }
        
        for nr, nc in get_neighbors(grid, r, c):
            nk = f"{nr},{nc}"
            new_cost = cost + 1  # uniform cost = 1 per step
            if nk not in costs or new_cost < costs[nk]:
                costs[nk] = new_cost
                parents[nk] = key
                heapq.heappush(pq, (new_cost, (nr, nc)))
                steps.append({"type": "frontier", "cell": [nr, nc]})
    
    return {"steps": steps, "path": [], "found": False}

def run_best_first(grid, start, goal):
    """
    Best-First (Greedy) Search: always expands the node closest to goal by heuristic.
    """
    pq = [(heuristic(start[0], start[1], goal), start)]
    visited = set()
    parents = {}
    steps = []
    goal_key = f"{goal[0]},{goal[1]}"

    while pq:
        _, (r, c) = heapq.heappop(pq)
        key = f"{r},{c}"
        if key in visited:
            continue
        visited.add(key)
        steps.append({"type": "visit", "cell": [r, c]})

        if key == goal_key:
            return {
                "steps": steps,
                "path": reconstruct_path(parents, start, goal),
                "found": True
            }
        
        for nr, nc in get_neighbors(grid, r, c):
            nk = f"{nr},{nc}"
            if nk not in visited:
                parents[nk] = key
                heapq.heappush(pq, (heuristic(nr, nc, goal), (nr, nc)))
                steps.append({"type": "frontier", "cell": [nr, nc]})
    
    return {"steps": steps, "path": [], "found": False}

def run_astar(grid, start, goal):
    """
    A* Search: combines actual cost g(n) + heuristic h(n) = f(n).
    Optimal and complete when heuristic is admissible.
    """
    start_key = f"{start[0]},{start[1]}"
    goal_key = f"{goal[0]},{goal[1]}"
    
    g = {start_key: 0}
    f = {start_key: heuristic(start[0], start[1], goal)}
    pq = [(f[start_key], start)]
    parents = {}
    closed = set()
    steps = []

    while pq:
        _, (r, c) = heapq.heappop(pq)
        key = f"{r},{c}"
        if key in closed:
            continue
        closed.add(key)
        steps.append({"type": "visit", "cell": [r, c]})

        if key == goal_key:
            return {
                "steps": steps,
                "path": reconstruct_path(parents, start, goal),
                "found": True
            }
        
        for nr, nc in get_neighbors(grid, r, c):
            nk = f"{nr},{nc}"
            if nk in closed:
                continue
            tentative_g = g.get(key, 0) + 1
            if nk not in g or tentative_g < g[nk]:
                parents[nk] = key
                g[nk] = tentative_g
                f[nk] = tentative_g + heuristic(nr, nc, goal)
                heapq.heappush(pq, (f[nk], (nr, nc)))
                steps.append({"type": "frontier", "cell": [nr, nc]})
    
    return {"steps": steps, "path": [], "found": False}

# ─────────────────────────────────────────────────────────────────────────────
# MAZE GENERATION
# ─────────────────────────────────────────────────────────────────────────────

def generate_maze():
    """Generate a random maze using recursive backtracker algorithm"""
    # Start with all walls
    grid = [[CELL_TYPE['WALL'] for _ in range(COLS)] for _ in range(ROWS)]
    
    def carve(r, c):
        grid[r][c] = CELL_TYPE['EMPTY']
        dirs = [(0, 2), (2, 0), (0, -2), (-2, 0)]
        random.shuffle(dirs)
        
        for dr, dc in dirs:
            nr, nc = r + dr, c + dc
            if (0 < nr < ROWS-1 and 0 < nc < COLS-1 and 
                grid[nr][nc] == CELL_TYPE['WALL']):
                # Carve the wall between
                grid[r + dr//2][c + dc//2] = CELL_TYPE['EMPTY']
                carve(nr, nc)
    
    carve(1, 1)
    
    # Ensure start and goal are accessible
    grid[1][1] = CELL_TYPE['START']
    grid[ROWS-2][COLS-2] = CELL_TYPE['GOAL']
    return grid

def empty_grid():
    """Create an empty grid with start and goal positions"""
    grid = [[CELL_TYPE['EMPTY'] for _ in range(COLS)] for _ in range(ROWS)]
    grid[1][1] = CELL_TYPE['START']
    grid[ROWS-2][COLS-2] = CELL_TYPE['GOAL']
    return grid