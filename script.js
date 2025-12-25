// Global Variables
let winners = [];
let gridCells = [];
let snake = [];
let snakeDirection = { x: 1, y: 0 }; // Initial direction: right
let gameInterval = null;
let isGameRunning = false;
let namesMap = new Map(); // Grid pozisyonu -> İsim mapping
let gameStartTime = null;
let elapsedTimeInterval = null;

let GRID_ROWS = 9; // Initial: 9 rows (16:9 ratio)
let GRID_COLS = 16; // Initial: 16 columns (16:9 ratio)
let TOTAL_CELLS = GRID_ROWS * GRID_COLS; // 144 cells
let gameSpeed = 1; // Game speed multiplier (0.5x - 5x)

// LocalStorage keys
const STORAGE_KEYS = {
    PARTICIPANT_LIST: 'lottery_participant_list',
    WINNER_COUNT: 'lottery_winner_count',
    GRID_SIZE: 'lottery_grid_size',
    SPEED: 'lottery_speed'
};

// DOM Elements
const namesInput = document.getElementById('names-input');
const winnerCountInput = document.getElementById('winner-count');
const gridSizeSelect = document.getElementById('grid-size');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const increaseBtn = document.getElementById('increase-btn');
const decreaseBtn = document.getElementById('decrease-btn');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const nameCountSpan = document.getElementById('name-count');
const charCountSpan = document.getElementById('char-count');
const winnersList = document.getElementById('winners-list');
const gridContainer = document.getElementById('grid-container');
const remainingWinnersSpan = document.getElementById('remaining-winners');
const elapsedTimeSpan = document.getElementById('elapsed-time');
const completionOverlay = document.getElementById('completion-overlay');
const overlayCopyBtn = document.getElementById('overlay-copy-btn');
const overlayCloseBtn = document.getElementById('overlay-close-btn');
const overlayWinnersList = document.getElementById('overlay-winners-list');
const modalOverlay = document.getElementById('modal-overlay');
const modalIcon = document.getElementById('modal-icon');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalOkBtn = document.getElementById('modal-ok-btn');

// LocalStorage Functions
function saveParticipantList() {
    const text = namesInput.value.trim();
    if (text) {
        localStorage.setItem(STORAGE_KEYS.PARTICIPANT_LIST, text);
    }
}

function loadParticipantList() {
    const savedList = localStorage.getItem(STORAGE_KEYS.PARTICIPANT_LIST);
    if (savedList && namesInput) {
        namesInput.value = savedList;
        updateCounters();
        updateStepperButtons();
    }
}

function saveSettings() {
    // Save winner count
    if (winnerCountInput) {
        localStorage.setItem(STORAGE_KEYS.WINNER_COUNT, winnerCountInput.value);
    }
    
    // Save grid size
    if (gridSizeSelect) {
        localStorage.setItem(STORAGE_KEYS.GRID_SIZE, gridSizeSelect.value);
    }
    
    // Save speed
    if (speedSlider) {
        localStorage.setItem(STORAGE_KEYS.SPEED, speedSlider.value);
    }
}

function loadSettings() {
    // Load winner count
    const savedWinnerCount = localStorage.getItem(STORAGE_KEYS.WINNER_COUNT);
    if (savedWinnerCount && winnerCountInput) {
        winnerCountInput.value = savedWinnerCount;
    }
    
    // Load grid size
    const savedGridSize = localStorage.getItem(STORAGE_KEYS.GRID_SIZE);
    if (savedGridSize && gridSizeSelect) {
        gridSizeSelect.value = savedGridSize;
        handleGridSizeChange();
    }
    
    // Load speed
    const savedSpeed = localStorage.getItem(STORAGE_KEYS.SPEED);
    if (savedSpeed && speedSlider) {
        speedSlider.value = savedSpeed;
        handleSpeedChange();
    }
}

// Check if mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Convert desktop grid size to mobile (swap dimensions for portrait)
function desktopToMobileGridSize(desktopSize) {
    const mapping = {
        '9x16': '16x9', 
        '12x21': '21x12',
        '18x32': '32x18',
        '21x42': '42x21'
    };
    return mapping[desktopSize] || '9x16';
}

// Convert mobile grid size to desktop (swap dimensions for landscape)
function mobileToDesktopGridSize(mobileSize) {
    const mapping = {
        '9x16': '16x9',
        '12x21': '21x12',
        '18x32': '32x18',
        '21x42': '42x21'
    };
    return mapping[mobileSize] || '16x9';
}

// Parse names from textarea
function parseNames(text) {
    if (!text || !text.trim()) return [];
    
    // Split by comma or newline
    let names = text.split(/[,\n]/);
    
    // Clean and filter
    names = names
        .map(name => name.trim())
        .filter(name => name.length > 0);
    
    // Remove duplicates
    return [...new Set(names)];
}

// Fisher-Yates shuffle
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Update grid size
function updateGridSize(size) {
    const [cols, rows] = size.split('x').map(Number); // width x height format
    GRID_COLS = cols; // Width
    GRID_ROWS = rows; // Height
    TOTAL_CELLS = cols * rows;
    
    // Update CSS grid template
    gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    
    // For mobile: set aspect ratio to keep cells square
    if (isMobile()) {
        updateMobileGridLayout(cols, rows);
    }
}

// Update mobile grid layout to keep cells square
function updateMobileGridLayout(cols, rows) {
    if (!gridContainer) return;
    
    const visualizationContainer = document.getElementById('visualization-container');
    if (!visualizationContainer) return;
    
    // Calculate available space
    const containerRect = visualizationContainer.getBoundingClientRect();
    const padding = 32; // 16px padding on each side
    const gridPadding = 8; // padding inside grid container
    const gridGap = cols > 30 ? 0 : 1; // gap between cells (0 for large grids)
    
    const availableWidth = containerRect.width - padding;
    const availableHeight = containerRect.height - padding;
    
    // Account for gaps in total size calculation
    const totalGapsWidth = gridGap * (cols - 1);
    const totalGapsHeight = gridGap * (rows - 1);
    
    // Calculate cell size to fit and keep square (accounting for gaps and padding)
    const maxCellWidth = Math.floor((availableWidth - gridPadding * 2 - totalGapsWidth) / cols);
    const maxCellHeight = Math.floor((availableHeight - gridPadding * 2 - totalGapsHeight) / rows);
    
    // Use the smaller dimension to keep cells square
    let cellSize = Math.min(maxCellWidth, maxCellHeight);
    
    // Ensure minimum cell size
    cellSize = Math.max(cellSize, 3);
    
    // Calculate exact grid dimensions (cells + gaps + padding)
    const gridWidth = (cellSize * cols) + totalGapsWidth + (gridPadding * 2);
    const gridHeight = (cellSize * rows) + totalGapsHeight + (gridPadding * 2);
    
    // Apply fixed size grid with square cells
    gridContainer.style.width = `${gridWidth}px`;
    gridContainer.style.height = `${gridHeight}px`;
    gridContainer.style.padding = `${gridPadding}px`;
    gridContainer.style.gap = `${gridGap}px`;
    gridContainer.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
    gridContainer.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
    
    // Update font sizes after layout change
    requestAnimationFrame(() => {
        updateCellFontSizes();
    });
}

// Create grid
function createGrid() {
    gridContainer.innerHTML = '';
    gridCells = [];
    
    for (let i = 0; i < TOTAL_CELLS; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.index = i;
        gridContainer.appendChild(cell);
        gridCells.push(cell);
    }
    
    // Update font sizes after grid is created
    requestAnimationFrame(() => {
        updateCellFontSizes();
    });
}

// Calculate and update font sizes based on cell dimensions
function updateCellFontSizes() {
    if (gridCells.length === 0) return;
    
    // Get actual cell size from the first cell
    const firstCell = gridCells[0];
    if (!firstCell) return;
    
    const cellRect = firstCell.getBoundingClientRect();
    const cellWidth = cellRect.width;
    const cellHeight = cellRect.height;
    
    // Calculate font size based on cell dimensions
    // Use the smaller dimension to ensure text fits
    const minDimension = Math.min(cellWidth, cellHeight);
    
    // Font size should be proportional to cell size
    // Smaller cells need smaller fonts, larger cells can have bigger fonts
    let fontSize;
    if (minDimension < 15) {
        fontSize = Math.max(4, minDimension * 0.35); // Very small cells
    } else if (minDimension < 25) {
        fontSize = Math.max(5, minDimension * 0.3); // Small cells
    } else if (minDimension < 40) {
        fontSize = Math.max(6, minDimension * 0.25); // Medium cells
    } else {
        fontSize = Math.max(8, Math.min(minDimension * 0.2, 14)); // Large cells
    }
    
    // Apply font size to all cells using CSS custom property
    gridContainer.style.setProperty('--cell-font-size', `${fontSize}px`);
    
    // Also apply directly to cells for browsers that don't support CSS variables well
    gridCells.forEach(cell => {
        cell.style.fontSize = `${fontSize}px`;
    });
}

// Place names on grid
function placeNamesOnGrid(names) {
    namesMap.clear();
    
    // Clear all cells
    gridCells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'grid-cell';
        cell.classList.remove('has-name', 'food', 'snake', 'snake-head', 'eaten');
    });
    
    // Place names randomly on cells
    const shuffledIndices = shuffleArray([...Array(TOTAL_CELLS).keys()]);
    
    names.forEach((name, index) => {
        if (index < shuffledIndices.length) {
            const cellIndex = shuffledIndices[index];
            const cell = gridCells[cellIndex];
            cell.textContent = name;
            cell.classList.add('has-name');
            namesMap.set(cellIndex, name);
            }
        });
    }
    
// No initial food placement - food appears when snake reaches a named cell

// Initialize snake
function initSnake() {
    // Start snake from top-left corner with 3 segments
    const startPos = 0;
    snake = [
        startPos,           // Head (position 0)
        startPos + 1,       // Body segment 1 (position 1)
        startPos + 2        // Body segment 2 (position 2)
    ];
    
    // Set initial direction to right
    snakeDirection = { x: 1, y: 0 };
    
    // Show snake
    updateSnakeDisplay();
}

// Update snake display - Optimized version
function updateSnakeDisplay() {
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
        // Clear previous snake display only for changed cells
        gridCells.forEach(cell => {
            if (cell.classList.contains('snake') || cell.classList.contains('snake-head')) {
                cell.classList.remove('snake', 'snake-head');
            }
        });
        
        // Show snake with batch DOM updates
        const fragment = document.createDocumentFragment();
        snake.forEach((pos, index) => {
            const cell = gridCells[pos];
            if (index === 0) {
                cell.classList.add('snake-head');
            } else {
                cell.classList.add('snake');
            }
        });
    });
}

// Calculate next snake position
function getNextSnakePosition() {
    const head = snake[0];
    const row = Math.floor(head / GRID_COLS);
    const col = head % GRID_COLS;
    
    let newRow = row + snakeDirection.y;
    let newCol = col + snakeDirection.x;
    
    // Wrap around walls
    if (newRow < 0) newRow = GRID_ROWS - 1;
    if (newRow >= GRID_ROWS) newRow = 0;
    if (newCol < 0) newCol = GRID_COLS - 1;
    if (newCol >= GRID_COLS) newCol = 0;
    
    return newRow * GRID_COLS + newCol;
}

// Move snake
function moveSnake() {
    if (!isGameRunning) return;
    
    let nextPos = getNextSnakePosition();
    
    // If snake will hit its own tail, change direction
    // (excluding tail end - because tail will move)
    if (snake.includes(nextPos) && nextPos !== snake[snake.length - 1]) {
        // Will hit itself, find a safe direction
        const directions = [
            { x: 0, y: -1 }, // Up
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }, // Left
            { x: 1, y: 0 }   // Right
        ];
        
        // Exclude opposite of current direction
        const oppositeDir = { x: -snakeDirection.x, y: -snakeDirection.y };
        const availableDirs = directions.filter(dir => 
            dir.x !== oppositeDir.x || dir.y !== oppositeDir.y
        );
        
        // Find a safe direction
        const shuffledDirs = shuffleArray(availableDirs);
        let foundSafeDir = false;
        const originalDirection = { ...snakeDirection };
        
        for (const dir of shuffledDirs) {
            snakeDirection = dir;
            const testPos = getNextSnakePosition();
            // Safe direction: doesn't hit own tail (excluding tail end)
            if (!snake.includes(testPos) || testPos === snake[snake.length - 1]) {
                foundSafeDir = true;
                nextPos = testPos;
                break;
            }
        }
        
        // If no safe direction found, move towards tail end
        if (!foundSafeDir) {
            // Move towards snake's tail end
            const tail = snake[snake.length - 1];
            const tailRow = Math.floor(tail / GRID_COLS);
            const tailCol = tail % GRID_COLS;
            const headRow = Math.floor(snake[0] / GRID_COLS);
            const headCol = snake[0] % GRID_COLS;
            
            // Calculate direction towards tail
            let dirToTail = { x: 0, y: 0 };
            if (tailCol !== headCol) {
                dirToTail.x = tailCol > headCol ? 1 : -1;
            }
            if (tailRow !== headRow) {
                dirToTail.y = tailRow > headRow ? 1 : -1;
            }
            
            // Move horizontally first, then vertically
            if (dirToTail.x !== 0) {
                snakeDirection = { x: dirToTail.x, y: 0 };
            } else if (dirToTail.y !== 0) {
                snakeDirection = { x: 0, y: dirToTail.y };
            } else {
                // Tail and head at same position, choose random direction
                const randomDirs = shuffleArray(availableDirs);
                if (randomDirs.length > 0) {
                    snakeDirection = randomDirs[0];
                } else {
                    snakeDirection = originalDirection;
                }
            }
            
            nextPos = getNextSnakePosition();
        }
    }
    
    moveSnakeWithPosition(nextPos);
}

// Move snake to a specific position
function moveSnakeWithPosition(nextPos) {
    // Don't move if game is stopped
    if (!isGameRunning) return;
    
    const cell = gridCells[nextPos];
    
    // Check if reached a named cell (mark as food and eat)
    if (cell.classList.contains('has-name') && !cell.classList.contains('eaten')) {
        const name = namesMap.get(nextPos);
        if (name) {
            // Mark as food (visual effect)
            cell.classList.add('food');
            
            // Food eaten - process immediately
            addToWinnersList(name, winners.length);
            
            // Remove food and mark as eaten
            setTimeout(() => {
                cell.classList.remove('food');
                cell.classList.add('eaten');
                cell.textContent = ''; // Remove name
                namesMap.delete(nextPos);
            }, 100); // Short duration for visual effect
            
            // Check if enough winners selected (after food eaten)
            // winners.length is now updated (push done in addToWinnersList)
            const targetCount = parseInt(winnerCountInput.value) || 1;
            if (winners.length >= targetCount) {
                // Snake grows
                snake.unshift(nextPos);
                updateSnakeDisplay();
                // Stop game
                stopGame();
                return;
            }
        }
        
        // Snake grows
        snake.unshift(nextPos);
    } else {
        // Normal movement
        snake.unshift(nextPos);
        snake.pop();
    }
    
    updateSnakeDisplay();
}

// Change snake direction (random movement)
function updateSnakeDirection() {
    const head = snake[0];
    const headRow = Math.floor(head / GRID_COLS);
    const headCol = head % GRID_COLS;
    
    // 70% chance to continue in current direction, 30% to change direction
    if (Math.random() < 0.3) {
        // Change direction
        const directions = [
            { x: 0, y: -1 }, // Up
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }, // Left
            { x: 1, y: 0 }   // Right
        ];
        
        // Exclude opposite of current direction
        const oppositeDir = { x: -snakeDirection.x, y: -snakeDirection.y };
        const availableDirs = directions.filter(dir => 
            dir.x !== oppositeDir.x || dir.y !== oppositeDir.y
        );
        
        // Choose random direction
        const randomDir = availableDirs[Math.floor(Math.random() * availableDirs.length)];
        snakeDirection = randomDir;
    }
    
    // If obstacle exists (will hit own tail), change direction
    const nextPos = getNextSnakePosition();
    if (snake.includes(nextPos) && nextPos !== snake[snake.length - 1]) {
        // Obstacle exists, try alternative direction
        const directions = [
            { x: 0, y: -1 }, // Up
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }, // Left
            { x: 1, y: 0 }   // Right
        ];
        
        const shuffledDirs = shuffleArray(directions);
        for (const dir of shuffledDirs) {
            snakeDirection = dir;
            const testPos = getNextSnakePosition();
            if (!snake.includes(testPos) || testPos === snake[snake.length - 1]) {
                break;
            }
        }
    }
}

// Start game
function startGame(names, foodCount) {
    if (isGameRunning) {
        stopGame();
    }
    
    // Create grid
    createGrid();
    
    // Place names
    placeNamesOnGrid(names);
    
    // No initial food placement - food appears when snake reaches a named cell
    
    // Initialize snake
    initSnake();
    
    // Start game
    isGameRunning = true;
    
    // Start elapsed time counter
    startElapsedTimeUpdate();
    
    // Snake movement loop - adjust according to speed multiplier
    const baseInterval = 200; // Base interval (for 1x speed)
    const adjustedInterval = baseInterval / gameSpeed; // Adjust according to speed multiplier
    
    gameInterval = setInterval(() => {
        updateSnakeDirection();
        moveSnake();
    }, adjustedInterval);
}

// Disable header controls (except speed slider - speed can be changed during game)
function disableHeaderControls() {
    winnerCountInput.disabled = true;
    gridSizeSelect.disabled = true;
    // speedSlider remains active - speed can be changed during draw
    increaseBtn.disabled = true;
    decreaseBtn.disabled = true;
    resetBtn.disabled = true;
    namesInput.disabled = true;
}

// Enable header controls
function enableHeaderControls() {
    winnerCountInput.disabled = false;
    gridSizeSelect.disabled = false;
    speedSlider.disabled = false;
    increaseBtn.disabled = false;
    decreaseBtn.disabled = false;
    resetBtn.disabled = false;
    namesInput.disabled = false;
}

// Stop game - Enhanced cleanup
function stopGame() {
    isGameRunning = false;
    
    // Clear all intervals with proper cleanup
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    if (elapsedTimeInterval) {
        clearInterval(elapsedTimeInterval);
        elapsedTimeInterval = null;
    }
    
    // Re-enable header controls
    enableHeaderControls();
    
    // Restore start button
    startBtn.textContent = 'Start Draw';
    startBtn.disabled = false;
    startBtn.classList.remove('running');
    
    // Show overlay if draw completed
    const targetCount = parseInt(winnerCountInput.value) || 1;
    if (winners.length >= targetCount && winners.length > 0) {
        // Use setTimeout to prevent blocking
        setTimeout(() => showCompletionOverlay(), 100);
    }
    
    gameStartTime = null;
}

// Update remaining winners count
function updateRemainingWinners() {
    const targetCount = parseInt(winnerCountInput.value) || 1;
    const remaining = Math.max(0, targetCount - winners.length);
    remainingWinnersSpan.textContent = remaining;
}

// Update elapsed time
function updateElapsedTime() {
    if (!gameStartTime) {
        elapsedTimeSpan.textContent = '00:00';
        return;
    }
    
    const elapsed = Math.floor((Date.now() - gameStartTime) / 1000); // in seconds
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    elapsedTimeSpan.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Start elapsed time update loop
function startElapsedTimeUpdate() {
    gameStartTime = Date.now();
    updateElapsedTime(); // First update
    
    elapsedTimeInterval = setInterval(() => {
        updateElapsedTime();
    }, 1000); // Update every second
}

// Add to winners list - Optimized version
function addToWinnersList(name, index) {
    winners.push({ name, index: index + 1 });
    
    // Update remaining winners count
    updateRemainingWinners();
    
    // Use requestAnimationFrame for smooth DOM updates
    requestAnimationFrame(() => {
        // Clear empty message
        const emptyMsg = winnersList.querySelector('.empty-message');
        if (emptyMsg) {
            emptyMsg.remove();
        }
        
        // Create winner card
        const card = document.createElement('div');
        card.className = 'winner-card';
        
        const number = document.createElement('div');
        number.className = 'winner-number';
        number.textContent = `${index + 1}.`;
        
        const nameEl = document.createElement('div');
        nameEl.className = 'winner-name';
        nameEl.textContent = name;
        
        card.appendChild(number);
        card.appendChild(nameEl);
        winnersList.appendChild(card);
        
        // Smooth scroll to bottom
        winnersList.scrollTo({
            top: winnersList.scrollHeight,
            behavior: 'smooth'
        });
    });
}

// Start draw
async function startDraw() {
    // If game is running, stop it
    if (isGameRunning) {
        stopGame();
        return;
    }
    
    const text = namesInput.value;
    const names = parseNames(text);
    
    if (names.length === 0) {
        showModal('No Names Entered', 'Please enter at least one name!', 'warning');
        return;
    }
    
    const count = parseInt(winnerCountInput.value) || 1;
    
    if (count > names.length) {
        showModal('Invalid Winner Count', `Number of winners (${count}) cannot be greater than total number of names (${names.length})!`, 'error');
        return;
    }
    
    if (count < 1) {
        showModal('Invalid Winner Count', 'Number of winners must be at least 1!', 'error');
        return;
    }
    
    // Save participant list and settings to localStorage
    saveParticipantList();
    saveSettings();
    
    // Hide overlay
    hideCompletionOverlay();
    
    // Disable header controls
    disableHeaderControls();
    
    // Change start button to "Stop Draw" and keep it enabled
    startBtn.textContent = 'Stop Draw';
    startBtn.disabled = false;
    startBtn.classList.add('running');
    
    // Clear previous winners
    winners = [];
    winnersList.innerHTML = '<p class="empty-message">Draw starting...</p>';
    
    // Reset statistics
    remainingWinnersSpan.textContent = count;
    elapsedTimeSpan.textContent = '00:00';
    
    // Start snake game
    startGame(names, count);
    
    // Wait until game ends (or timeout)
    const maxWaitTime = 60000; // 60 seconds maximum
    const startTime = Date.now();
    
    const checkCompletion = setInterval(() => {
        // Only check timeout, winner check is done in moveSnakeWithPosition
        if (!isGameRunning || Date.now() - startTime > maxWaitTime) {
            clearInterval(checkCompletion);
            if (isGameRunning) {
                stopGame();
            }
        }
    }, 100);
}

// Reset draw
function resetDraw() {
    stopGame();
    hideCompletionOverlay();
    winners = [];
    winnersList.innerHTML = '<p class="empty-message">Draw results will appear here...</p>';
    // Don't clear namesInput.value - keep participant list
    // Don't reset winnerCountInput.value - keep winner count setting
    
    // Recreate grid with existing names if any
    const text = namesInput.value;
    const names = parseNames(text);
    createGrid();
    if (names.length > 0) {
        placeNamesOnGrid(names);
    }
    
    updateCounters();
    updateStepperButtons();
    
    // Reset statistics
    remainingWinnersSpan.textContent = '-';
    elapsedTimeSpan.textContent = '00:00';
    
    // Make sure controls are enabled (stopGame already does this but extra assurance)
    enableHeaderControls();
}

// Copy results
function copyResults(buttonElement = null) {
    if (winners.length === 0) {
        showModal('No Results', 'No results to copy!', 'warning');
        return;
    }
    
    const text = winners.map(w => `${w.index}. ${w.name}`).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback - use provided button or find a default one
        const targetBtn = buttonElement || document.querySelector('.btn-primary');
        if (targetBtn) {
            const originalText = targetBtn.textContent;
            const originalBackground = targetBtn.style.background;
            
            targetBtn.textContent = '✓ Copied!';
            targetBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            
            setTimeout(() => {
                targetBtn.textContent = originalText;
                targetBtn.style.background = originalBackground;
            }, 2000);
        }
    }).catch(err => {
        console.error('Copy error:', err);
        showModal('Copy Failed', 'Failed to copy results to clipboard. Please try again.', 'error');
    });
}

// Populate overlay winners list
function populateOverlayWinnersList() {
    if (!overlayWinnersList) return;
    
    overlayWinnersList.innerHTML = '';
    
    if (winners.length === 0) {
        overlayWinnersList.innerHTML = '<p class="empty-message">No winners yet.</p>';
        return;
    }
    
    winners.forEach((winner) => {
        const item = document.createElement('div');
        item.className = 'overlay-winner-item';
        
        const number = document.createElement('span');
        number.className = 'overlay-winner-number';
        number.textContent = `${winner.index}.`;
        
        const name = document.createElement('span');
        name.className = 'overlay-winner-name';
        name.textContent = winner.name;
        
        item.appendChild(number);
        item.appendChild(name);
        overlayWinnersList.appendChild(item);
    });
}

// Show overlay
function showCompletionOverlay() {
    if (completionOverlay) {
        populateOverlayWinnersList();
        completionOverlay.classList.add('show');
    }
}

// Hide overlay
function hideCompletionOverlay() {
    if (completionOverlay) {
        completionOverlay.classList.remove('show');
    }
}

// Show modal
function showModal(title, message, type = 'warning') {
    if (!modalOverlay || !modalTitle || !modalMessage || !modalIcon) return;
    
    // Set content
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    // Set type and icon
    modalOverlay.querySelector('.modal-content').className = 'modal-content ' + type;
    
    switch(type) {
        case 'error':
            modalIcon.textContent = '❌';
            break;
        case 'success':
            modalIcon.textContent = '✅';
            break;
        case 'warning':
        default:
            modalIcon.textContent = '⚠️';
            break;
    }
    
    // Show modal
    modalOverlay.classList.add('show');
    
    // Focus OK button for accessibility
    if (modalOkBtn) {
        setTimeout(() => modalOkBtn.focus(), 100);
    }
}

// Hide modal
function hideModal() {
    if (modalOverlay) {
        modalOverlay.classList.remove('show');
    }
}

// Copy results from overlay
function copyResultsFromOverlay() {
    copyResults(overlayCopyBtn);
}

// Close overlay
function closeCompletionOverlay() {
    hideCompletionOverlay();
}

// Update counters
function updateCounters() {
    const text = namesInput.value;
    const names = parseNames(text);
    const charCount = text.length;
    
    nameCountSpan.textContent = names.length;
    charCountSpan.textContent = charCount;
    
    // Enable/disable start button based on names
    if (names.length > 0) {
        startBtn.disabled = false;
    } else {
        startBtn.disabled = true;
    }
    
    // Update grid (if names exist)
    if (names.length > 0 && !isGameRunning) {
        createGrid();
        placeNamesOnGrid(names);
    } else if (names.length === 0 && !isGameRunning) {
        createGrid();
    }
}

// When grid size changes
function handleGridSizeChange() {
    const selectedSize = gridSizeSelect.value;
    updateGridSize(selectedSize);
    
    // Recreate grid if game is not running
    if (!isGameRunning) {
        const text = namesInput.value;
        const names = parseNames(text);
        createGrid();
        if (names.length > 0) {
            placeNamesOnGrid(names);
        }
    }
    
    // Update mobile grid layout after grid is created
    if (isMobile()) {
        setTimeout(() => {
            updateMobileGridLayout(GRID_COLS, GRID_ROWS);
            updateCellFontSizes();
        }, 50);
    } else {
        // Update font sizes for desktop after layout change
        setTimeout(() => {
            updateCellFontSizes();
        }, 50);
    }
}

// Stepper Functions
function increaseWinnerCount() {
    const currentValue = parseInt(winnerCountInput.value) || 1;
    const maxValue = parseNames(namesInput.value).length || 999;
    const newValue = Math.min(currentValue + 1, maxValue);
    winnerCountInput.value = newValue;
    updateStepperButtons();
}

function decreaseWinnerCount() {
    const currentValue = parseInt(winnerCountInput.value) || 1;
    const minValue = parseInt(winnerCountInput.min) || 1;
    const newValue = Math.max(currentValue - 1, minValue);
    winnerCountInput.value = newValue;
    updateStepperButtons();
}

function updateStepperButtons() {
    const currentValue = parseInt(winnerCountInput.value) || 1;
    const minValue = parseInt(winnerCountInput.min) || 1;
    const names = parseNames(namesInput.value);
    const maxValue = names.length > 0 ? names.length : 999;
    
    decreaseBtn.disabled = currentValue <= minValue;
    increaseBtn.disabled = currentValue >= maxValue;
}

// When speed slider changes
function handleSpeedChange() {
    gameSpeed = parseFloat(speedSlider.value);
    speedValue.textContent = `${gameSpeed}x`;
    
    // If game is running, restart interval
    if (isGameRunning && gameInterval) {
        clearInterval(gameInterval);
        const baseInterval = 200; // Base interval (for 1x speed)
        const adjustedInterval = baseInterval / gameSpeed;
        
        gameInterval = setInterval(() => {
            updateSnakeDirection();
            moveSnake();
        }, adjustedInterval);
    }
}

// Event Listeners
namesInput.addEventListener('input', () => {
    updateCounters();
    updateStepperButtons();
    // Save participant list when typing
    saveParticipantList();
});

winnerCountInput.addEventListener('input', () => {
    updateStepperButtons();
    saveSettings();
});
winnerCountInput.addEventListener('change', () => {
    updateStepperButtons();
    saveSettings();
});

gridSizeSelect.addEventListener('change', () => {
    handleGridSizeChange();
    saveSettings();
});

speedSlider.addEventListener('input', () => {
    handleSpeedChange();
    saveSettings();
});
speedSlider.addEventListener('change', () => {
    handleSpeedChange();
    saveSettings();
});

increaseBtn.addEventListener('click', () => {
    increaseWinnerCount();
    saveSettings();
});
decreaseBtn.addEventListener('click', () => {
    decreaseWinnerCount();
    saveSettings();
});

startBtn.addEventListener('click', startDraw);
resetBtn.addEventListener('click', resetDraw);

// Event listeners for overlay buttons (after DOM is loaded)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const overlayCopyBtnEl = document.getElementById('overlay-copy-btn');
        const overlayCloseBtnEl = document.getElementById('overlay-close-btn');
        
        if (overlayCopyBtnEl) {
            overlayCopyBtnEl.addEventListener('click', copyResultsFromOverlay);
        }
        if (overlayCloseBtnEl) {
            overlayCloseBtnEl.addEventListener('click', closeCompletionOverlay);
        }
        
        // Close overlay on backdrop click
        if (completionOverlay) {
            completionOverlay.addEventListener('click', (e) => {
                if (e.target === completionOverlay) {
                    closeCompletionOverlay();
                }
            });
        }
        
        // Modal event listeners
        if (modalOkBtn) {
            modalOkBtn.addEventListener('click', hideModal);
        }
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    hideModal();
                }
            });
        }
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (modalOverlay && modalOverlay.classList.contains('show')) {
                    hideModal();
                }
                if (completionOverlay && completionOverlay.classList.contains('show')) {
                    closeCompletionOverlay();
                }
            }
        });
    });
} else {
    if (overlayCopyBtn) {
        overlayCopyBtn.addEventListener('click', copyResultsFromOverlay);
    }
    if (overlayCloseBtn) {
        overlayCloseBtn.addEventListener('click', closeCompletionOverlay);
    }
    
    // Close overlay on backdrop click
    if (completionOverlay) {
        completionOverlay.addEventListener('click', (e) => {
            if (e.target === completionOverlay) {
                closeCompletionOverlay();
            }
        });
    }
    
    // Modal event listeners
    if (modalOkBtn) {
        modalOkBtn.addEventListener('click', hideModal);
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                hideModal();
            }
        });
    }
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modalOverlay && modalOverlay.classList.contains('show')) {
                hideModal();
            }
            if (completionOverlay && completionOverlay.classList.contains('show')) {
                closeCompletionOverlay();
            }
        }
    });
}

// Initialize
function initializeApp() {
    // Load saved settings and participant list first
    loadSettings();
    loadParticipantList();
    
    // Set initial grid size based on device
    if (isMobile()) {
        // For mobile: use portrait grid size
        const desktopSize = gridSizeSelect.value;
        const mobileSize = desktopToMobileGridSize(desktopSize);
        const [cols, rows] = mobileSize.split('x').map(Number);
        GRID_COLS = cols;
        GRID_ROWS = rows;
        TOTAL_CELLS = cols * rows;
        gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    } else {
        // For desktop: use landscape grid size
        const initialSize = gridSizeSelect.value;
        updateGridSize(initialSize);
    }
    
    createGrid();
    updateCounters();
    updateStepperButtons();
    
    // Set speed slider initial value (after loading settings)
    if (speedSlider && speedValue) {
        gameSpeed = parseFloat(speedSlider.value);
        speedValue.textContent = `${gameSpeed}x`;
    }
}

// ============================================
// MOBILE FUNCTIONALITY
// ============================================

// Mobile DOM Elements
const mobileNamesBtn = document.getElementById('mobile-names-btn');
const mobileSettingsBtn = document.getElementById('mobile-settings-btn');
const mobileWinnersBtn = document.getElementById('mobile-winners-btn');
const mobileStartBtn = document.getElementById('mobile-start-btn');
const mobileNamesPanel = document.getElementById('mobile-names-panel');
const mobileSettingsPanel = document.getElementById('mobile-settings-panel');
const mobileWinnersPanel = document.getElementById('mobile-winners-panel');
const mobilePanelBackdrop = document.getElementById('mobile-panel-backdrop');
const mobileFloatingStats = document.getElementById('mobile-floating-stats');

// Mobile input elements
const mobileNamesInput = document.getElementById('mobile-names-input');
const mobileNameCount = document.getElementById('mobile-name-count');
const mobileCharCount = document.getElementById('mobile-char-count');
const mobileWinnerCount = document.getElementById('mobile-winner-count');
const mobileGridSize = document.getElementById('mobile-grid-size');
const mobileSpeedSlider = document.getElementById('mobile-speed-slider');
const mobileSpeedValue = document.getElementById('mobile-speed-value');
const mobileIncreaseBtn = document.getElementById('mobile-increase-btn');
const mobileDecreaseBtn = document.getElementById('mobile-decrease-btn');
const mobileResetBtn = document.getElementById('mobile-reset-btn');
const mobileWinnersList = document.getElementById('mobile-winners-list');
const mobileRemainingWinners = document.getElementById('mobile-remaining-winners');
const mobileElapsedTime = document.getElementById('mobile-elapsed-time');
const floatingWinnersCount = document.getElementById('floating-winners-count');
const floatingElapsedTime = document.getElementById('floating-elapsed-time');

// Close panel buttons
const closeNamesPanel = document.getElementById('close-names-panel');
const closeSettingsPanel = document.getElementById('close-settings-panel');
const closeWinnersPanel = document.getElementById('close-winners-panel');

// Open mobile panel
function openMobilePanel(panel) {
    closeAllMobilePanels();
    if (panel) {
        panel.classList.add('open');
        mobilePanelBackdrop.classList.add('show');
    }
}

// Close all mobile panels
function closeAllMobilePanels() {
    [mobileNamesPanel, mobileSettingsPanel, mobileWinnersPanel].forEach(panel => {
        if (panel) panel.classList.remove('open');
    });
    if (mobilePanelBackdrop) mobilePanelBackdrop.classList.remove('show');
}

// Sync desktop to mobile
function syncDesktopToMobile() {
    if (mobileNamesInput && namesInput) {
        mobileNamesInput.value = namesInput.value;
        updateMobileCounters();
    }
    if (mobileWinnerCount && winnerCountInput) {
        mobileWinnerCount.value = winnerCountInput.value;
    }
    if (mobileGridSize && gridSizeSelect) {
        // Convert desktop size to mobile (portrait) size
        mobileGridSize.value = desktopToMobileGridSize(gridSizeSelect.value);
    }
    if (mobileSpeedSlider && speedSlider) {
        mobileSpeedSlider.value = speedSlider.value;
        if (mobileSpeedValue) {
            mobileSpeedValue.textContent = `${speedSlider.value}x`;
        }
    }
    updateMobileStepperButtons();
}

// Sync mobile to desktop
function syncMobileToDesktop() {
    if (namesInput && mobileNamesInput) {
        namesInput.value = mobileNamesInput.value;
        updateCounters();
    }
    if (winnerCountInput && mobileWinnerCount) {
        winnerCountInput.value = mobileWinnerCount.value;
        updateStepperButtons();
    }
    if (gridSizeSelect && mobileGridSize) {
        // Convert mobile size to desktop (landscape) size
        gridSizeSelect.value = mobileToDesktopGridSize(mobileGridSize.value);
        handleGridSizeChange();
    }
    if (speedSlider && mobileSpeedSlider) {
        speedSlider.value = mobileSpeedSlider.value;
        handleSpeedChange();
    }
}

// Update mobile counters
function updateMobileCounters() {
    if (!mobileNamesInput || !mobileNameCount || !mobileCharCount) return;
    
    const text = mobileNamesInput.value;
    const names = parseNames(text);
    
    mobileNameCount.textContent = names.length;
    mobileCharCount.textContent = text.length;
}

// Update mobile stepper buttons
function updateMobileStepperButtons() {
    if (!mobileWinnerCount || !mobileDecreaseBtn || !mobileIncreaseBtn) return;
    
    const currentValue = parseInt(mobileWinnerCount.value) || 1;
    const minValue = 1;
    const namesText = mobileNamesInput ? mobileNamesInput.value : '';
    const names = parseNames(namesText);
    const maxValue = names.length > 0 ? names.length : 999;
    
    mobileDecreaseBtn.disabled = currentValue <= minValue;
    mobileIncreaseBtn.disabled = currentValue >= maxValue;
}

// Mobile start/stop draw
function mobileStartDraw() {
    // Sync names and settings but NOT grid size (keep mobile portrait grid)
    if (namesInput && mobileNamesInput) {
        namesInput.value = mobileNamesInput.value;
        updateCounters();
    }
    if (winnerCountInput && mobileWinnerCount) {
        winnerCountInput.value = mobileWinnerCount.value;
        updateStepperButtons();
    }
    if (speedSlider && mobileSpeedSlider) {
        speedSlider.value = mobileSpeedSlider.value;
        handleSpeedChange();
    }
    
    // Apply mobile grid size directly (portrait) - don't convert to desktop
    if (mobileGridSize) {
        const mobileSize = mobileGridSize.value;
        const [cols, rows] = mobileSize.split('x').map(Number);
        GRID_COLS = cols;
        GRID_ROWS = rows;
        TOTAL_CELLS = cols * rows;
        
        gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    }
    
    closeAllMobilePanels();
    
    // Start draw with current mobile settings
    const text = mobileNamesInput ? mobileNamesInput.value : namesInput.value;
    const names = parseNames(text);
    
    if (names.length === 0) {
        showModal('No Names Entered', 'Please enter at least one name!', 'warning');
        return;
    }
    
    const count = parseInt(mobileWinnerCount ? mobileWinnerCount.value : winnerCountInput.value) || 1;
    
    if (count > names.length) {
        showModal('Invalid Winner Count', `Number of winners (${count}) cannot be greater than total number of names (${names.length})!`, 'error');
        return;
    }
    
    if (count < 1) {
        showModal('Invalid Winner Count', 'Number of winners must be at least 1!', 'error');
        return;
    }
    
    // Save settings
    saveParticipantList();
    saveSettings();
    
    // Hide overlay
    hideCompletionOverlay();
    
    // Disable header controls
    disableHeaderControls();
    
    // Change start button
    startBtn.textContent = 'Stop Draw';
    startBtn.disabled = false;
    
    // Clear previous winners
    winners = [];
    winnersList.innerHTML = '<p class="empty-message">Draw starting...</p>';
    if (mobileWinnersList) {
        mobileWinnersList.innerHTML = '<p class="empty-message">Draw starting...</p>';
    }
    
    // Reset statistics
    remainingWinnersSpan.textContent = count;
    elapsedTimeSpan.textContent = '00:00';
    
    // Start snake game directly (bypassing startDraw to avoid grid size change)
    startGame(names, count);
    
    // Update mobile UI immediately after game starts
    updateMobileGameUI();
    
    // Update mobile grid layout after game starts
    setTimeout(() => {
        updateMobileGridLayout(GRID_COLS, GRID_ROWS);
    }, 50);
}

// Disable/enable mobile controls during game
function updateMobileControlsState() {
    const disabled = isGameRunning;
    
    // Disable inputs that shouldn't change during game
    if (mobileNamesInput) mobileNamesInput.disabled = disabled;
    if (mobileWinnerCount) mobileWinnerCount.disabled = disabled;
    if (mobileGridSize) mobileGridSize.disabled = disabled;
    if (mobileIncreaseBtn) mobileIncreaseBtn.disabled = disabled;
    if (mobileDecreaseBtn) mobileDecreaseBtn.disabled = disabled;
    if (mobileResetBtn) mobileResetBtn.disabled = disabled;
    
    // Speed slider remains enabled during game
}

// Update mobile UI during game
function updateMobileGameUI() {
    if (!isMobile()) return;
    
    // Update controls state
    updateMobileControlsState();
    
    // Update floating stats
    if (floatingWinnersCount) {
        floatingWinnersCount.textContent = winners.length;
    }
    if (floatingElapsedTime && gameStartTime) {
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        floatingElapsedTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    // Update winners panel stats
    if (mobileRemainingWinners) {
        const targetCount = parseInt(winnerCountInput.value) || 1;
        const remaining = Math.max(0, targetCount - winners.length);
        mobileRemainingWinners.textContent = remaining;
    }
    if (mobileElapsedTime && gameStartTime) {
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        mobileElapsedTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    // Update start button
    if (mobileStartBtn) {
        if (isGameRunning) {
            mobileStartBtn.classList.add('running');
        } else {
            mobileStartBtn.classList.remove('running');
        }
    }
    
    // Show/hide floating stats
    if (mobileFloatingStats) {
        if (isGameRunning) {
            mobileFloatingStats.classList.add('show');
        } else {
            mobileFloatingStats.classList.remove('show');
        }
    }
}

// Add winner to mobile list
function addToMobileWinnersList(name, index) {
    if (!mobileWinnersList) return;
    
    // Clear empty message
    const emptyMsg = mobileWinnersList.querySelector('.empty-message');
    if (emptyMsg) {
        emptyMsg.remove();
    }
    
    // Create winner card
    const card = document.createElement('div');
    card.className = 'winner-card';
    
    const number = document.createElement('div');
    number.className = 'winner-number';
    number.textContent = `${index + 1}.`;
    
    const nameEl = document.createElement('div');
    nameEl.className = 'winner-name';
    nameEl.textContent = name;
    
    card.appendChild(number);
    card.appendChild(nameEl);
    mobileWinnersList.appendChild(card);
    
    // Scroll to bottom
    mobileWinnersList.scrollTo({
        top: mobileWinnersList.scrollHeight,
        behavior: 'smooth'
    });
    
    // Update floating counter
    if (floatingWinnersCount) {
        floatingWinnersCount.textContent = winners.length;
    }
}

// Initialize mobile event listeners
function initializeMobileEventListeners() {
    // Panel open buttons
    if (mobileNamesBtn) {
        mobileNamesBtn.addEventListener('click', () => openMobilePanel(mobileNamesPanel));
    }
    if (mobileSettingsBtn) {
        mobileSettingsBtn.addEventListener('click', () => openMobilePanel(mobileSettingsPanel));
    }
    if (mobileWinnersBtn) {
        mobileWinnersBtn.addEventListener('click', () => openMobilePanel(mobileWinnersPanel));
    }
    
    // Start button
    if (mobileStartBtn) {
        mobileStartBtn.addEventListener('click', () => {
            // Check button state instead of isGameRunning for immediate response
            if (mobileStartBtn.classList.contains('running')) {
                stopGame();
                // Update button immediately
                mobileStartBtn.classList.remove('running');
            } else {
                mobileStartDraw();
                // Button will be updated by updateMobileGameUI in mobileStartDraw
            }
        });
    }
    
    // Close buttons
    if (closeNamesPanel) {
        closeNamesPanel.addEventListener('click', closeAllMobilePanels);
    }
    if (closeSettingsPanel) {
        closeSettingsPanel.addEventListener('click', closeAllMobilePanels);
    }
    if (closeWinnersPanel) {
        closeWinnersPanel.addEventListener('click', closeAllMobilePanels);
    }
    
    // Backdrop close
    if (mobilePanelBackdrop) {
        mobilePanelBackdrop.addEventListener('click', closeAllMobilePanels);
    }
    
    // Mobile names input
    if (mobileNamesInput) {
        mobileNamesInput.addEventListener('input', () => {
            // Don't allow changes during game
            if (isGameRunning) return;
            
            updateMobileCounters();
            updateMobileStepperButtons();
            
            // Only sync names, not grid size
            if (namesInput) {
                namesInput.value = mobileNamesInput.value;
                updateCounters();
            }
            
            // Update grid with names (keep mobile portrait orientation)
            const text = mobileNamesInput.value;
            const names = parseNames(text);
            createGrid();
            if (names.length > 0) {
                placeNamesOnGrid(names);
            }
            
            // Re-apply mobile grid layout
            setTimeout(() => {
                updateMobileGridLayout(GRID_COLS, GRID_ROWS);
            }, 50);
            
            saveParticipantList();
        });
    }
    
    // Mobile winner count
    if (mobileWinnerCount) {
        mobileWinnerCount.addEventListener('input', () => {
            // Don't allow changes during game
            if (isGameRunning) return;
            
            updateMobileStepperButtons();
            // Only sync winner count, not grid size
            if (winnerCountInput) {
                winnerCountInput.value = mobileWinnerCount.value;
                updateStepperButtons();
            }
            saveSettings();
        });
        mobileWinnerCount.addEventListener('change', () => {
            // Don't allow changes during game
            if (isGameRunning) return;
            
            updateMobileStepperButtons();
            // Only sync winner count, not grid size
            if (winnerCountInput) {
                winnerCountInput.value = mobileWinnerCount.value;
                updateStepperButtons();
            }
            saveSettings();
        });
    }
    
    // Mobile stepper buttons
    if (mobileIncreaseBtn) {
        mobileIncreaseBtn.addEventListener('click', () => {
            // Don't allow changes during game
            if (isGameRunning) return;
            
            const currentValue = parseInt(mobileWinnerCount.value) || 1;
            const namesText = mobileNamesInput ? mobileNamesInput.value : '';
            const maxValue = parseNames(namesText).length || 999;
            mobileWinnerCount.value = Math.min(currentValue + 1, maxValue);
            updateMobileStepperButtons();
            // Only sync winner count, not grid size
            if (winnerCountInput) {
                winnerCountInput.value = mobileWinnerCount.value;
                updateStepperButtons();
            }
            saveSettings();
        });
    }
    if (mobileDecreaseBtn) {
        mobileDecreaseBtn.addEventListener('click', () => {
            // Don't allow changes during game
            if (isGameRunning) return;
            
            const currentValue = parseInt(mobileWinnerCount.value) || 1;
            mobileWinnerCount.value = Math.max(currentValue - 1, 1);
            updateMobileStepperButtons();
            // Only sync winner count, not grid size
            if (winnerCountInput) {
                winnerCountInput.value = mobileWinnerCount.value;
                updateStepperButtons();
            }
            saveSettings();
        });
    }
    
    // Mobile grid size
    if (mobileGridSize) {
        mobileGridSize.addEventListener('change', () => {
            // Don't allow changes during game
            if (isGameRunning) return;
            
            // Apply mobile grid size directly (portrait orientation)
            const mobileSize = mobileGridSize.value;
            const [cols, rows] = mobileSize.split('x').map(Number);
            GRID_COLS = cols;
            GRID_ROWS = rows;
            TOTAL_CELLS = cols * rows;
            
            // Update grid
            gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
            
            // Recreate grid
            const text = mobileNamesInput ? mobileNamesInput.value : namesInput.value;
            const names = parseNames(text);
            createGrid();
            if (names.length > 0) {
                placeNamesOnGrid(names);
            }
            
            // Update mobile grid layout
            setTimeout(() => {
                updateMobileGridLayout(GRID_COLS, GRID_ROWS);
            }, 50);
            
            // Sync to desktop (convert to landscape)
            if (gridSizeSelect) {
                gridSizeSelect.value = mobileToDesktopGridSize(mobileSize);
            }
            
            saveSettings();
        });
    }
    
    // Mobile speed slider - only update speed, don't change grid
    if (mobileSpeedSlider) {
        mobileSpeedSlider.addEventListener('input', () => {
            if (mobileSpeedValue) {
                mobileSpeedValue.textContent = `${mobileSpeedSlider.value}x`;
            }
            // Only update speed value, don't call syncMobileToDesktop which changes grid
            gameSpeed = parseFloat(mobileSpeedSlider.value);
            if (speedSlider) {
                speedSlider.value = mobileSpeedSlider.value;
            }
            if (speedValue) {
                speedValue.textContent = `${mobileSpeedSlider.value}x`;
            }
            
            // If game is running, update interval
            if (isGameRunning && gameInterval) {
                clearInterval(gameInterval);
                const baseInterval = 200;
                const adjustedInterval = baseInterval / gameSpeed;
                
                gameInterval = setInterval(() => {
                    updateSnakeDirection();
                    moveSnake();
                }, adjustedInterval);
            }
            
            saveSettings();
        });
        mobileSpeedSlider.addEventListener('change', () => {
            // Same as input - only speed, no grid change
            gameSpeed = parseFloat(mobileSpeedSlider.value);
            if (speedSlider) {
                speedSlider.value = mobileSpeedSlider.value;
            }
            if (speedValue) {
                speedValue.textContent = `${mobileSpeedSlider.value}x`;
            }
            saveSettings();
        });
    }
    
    // Mobile reset button
    if (mobileResetBtn) {
        mobileResetBtn.addEventListener('click', () => {
            closeAllMobilePanels();
            resetDraw();
            syncDesktopToMobile();
            
            // Reset mobile winners list
            if (mobileWinnersList) {
                mobileWinnersList.innerHTML = '<p class="empty-message">Draw results will appear here...</p>';
            }
            if (mobileRemainingWinners) {
                mobileRemainingWinners.textContent = '-';
            }
            if (mobileElapsedTime) {
                mobileElapsedTime.textContent = '00:00';
            }
        });
    }
    
    // Window resize handler - sync values and update grid
    // Debounced resize handler for better performance
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (isMobile()) {
                syncDesktopToMobile();
                updateMobileGridLayout(GRID_COLS, GRID_ROWS);
            } else {
                // Reset grid to desktop style
                if (gridContainer) {
                    gridContainer.style.width = '';
                    gridContainer.style.height = '';
                    gridContainer.style.gridTemplateColumns = `repeat(${GRID_COLS}, 1fr)`;
                    gridContainer.style.gridTemplateRows = `repeat(${GRID_ROWS}, 1fr)`;
                }
            }
            // Update font sizes after resize
            updateCellFontSizes();
        }, 100);
    });
    
    // Initial mobile grid layout
    if (isMobile()) {
        // Small delay to ensure container is rendered
        setTimeout(() => {
            updateMobileGridLayout(GRID_COLS, GRID_ROWS);
        }, 100);
    }
}

// Override addToWinnersList to also update mobile
const originalAddToWinnersList = addToWinnersList;
addToWinnersList = function(name, index) {
    originalAddToWinnersList(name, index);
    addToMobileWinnersList(name, index);
    updateMobileGameUI();
};

// Override stopGame to update mobile UI
const originalStopGame = stopGame;
stopGame = function() {
    originalStopGame();
    updateMobileGameUI();
};

// Override startGame to update mobile UI
const originalStartGame = startGame;
startGame = function(names, foodCount) {
    // Reset mobile winners list
    if (mobileWinnersList) {
        mobileWinnersList.innerHTML = '<p class="empty-message">Draw starting...</p>';
    }
    originalStartGame(names, foodCount);
    updateMobileGameUI();
};

// Update mobile elapsed time during game
const originalUpdateElapsedTime = updateElapsedTime;
updateElapsedTime = function() {
    originalUpdateElapsedTime();
    updateMobileGameUI();
};

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeApp();
        initializeMobileEventListeners();
        syncDesktopToMobile();
    });
} else {
    initializeApp();
    initializeMobileEventListeners();
    syncDesktopToMobile();
}
