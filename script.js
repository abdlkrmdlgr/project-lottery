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
const copyBtn = document.getElementById('copy-btn');
const nameCountSpan = document.getElementById('name-count');
const charCountSpan = document.getElementById('char-count');
const winnersList = document.getElementById('winners-list');
const gridContainer = document.getElementById('grid-container');
const remainingWinnersSpan = document.getElementById('remaining-winners');
const elapsedTimeSpan = document.getElementById('elapsed-time');
const completionOverlay = document.getElementById('completion-overlay');
const overlayCopyBtn = document.getElementById('overlay-copy-btn');
const overlayRestartBtn = document.getElementById('overlay-restart-btn');
const modalOverlay = document.getElementById('modal-overlay');
const modalIcon = document.getElementById('modal-icon');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalOkBtn = document.getElementById('modal-ok-btn');

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
    // Start snake from top-left corner
    const startPos = 0;
    snake = [startPos];
    
    // Show snake head
    updateSnakeDisplay();
}

// Update snake display
function updateSnakeDisplay() {
    // Clear previous snake display
    gridCells.forEach(cell => {
        cell.classList.remove('snake', 'snake-head');
    });
    
    // Show snake
    snake.forEach((pos, index) => {
        const cell = gridCells[pos];
        if (index === 0) {
            cell.classList.add('snake-head');
        } else {
            cell.classList.add('snake');
        }
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
    copyBtn.disabled = true;
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
    copyBtn.disabled = false;
    namesInput.disabled = false;
}

// Stop game
function stopGame() {
    isGameRunning = false;
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
    
    // Show overlay if draw completed
    const targetCount = parseInt(winnerCountInput.value) || 1;
    if (winners.length >= targetCount && winners.length > 0) {
        showCompletionOverlay();
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

// Add to winners list
function addToWinnersList(name, index) {
    winners.push({ name, index: index + 1 });
    
    // Update remaining winners count
    updateRemainingWinners();
    
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
    
    // Scroll to bottom
    winnersList.scrollTop = winnersList.scrollHeight;
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
    
    // Hide overlay
    hideCompletionOverlay();
    
    // Disable header controls
    disableHeaderControls();
    
    // Change start button to "Stop Draw" and keep it enabled
    startBtn.textContent = 'Stop Draw';
    startBtn.disabled = false;
    
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
    namesInput.value = '';
    winnerCountInput.value = '3';
    createGrid();
    updateCounters();
    updateStepperButtons();
    
    // Reset statistics
    remainingWinnersSpan.textContent = '-';
    elapsedTimeSpan.textContent = '00:00';
    
    // Make sure controls are enabled (stopGame already does this but extra assurance)
    enableHeaderControls();
}

// Copy results
function copyResults() {
    if (winners.length === 0) {
        showModal('No Results', 'No results to copy!', 'warning');
        return;
    }
    
    const text = winners.map(w => `${w.index}. ${w.name}`).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copied!';
        copyBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Copy error:', err);
        showModal('Copy Failed', 'Failed to copy results to clipboard. Please try again.', 'error');
    });
}

// Show overlay
function showCompletionOverlay() {
    if (completionOverlay) {
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
    copyResults();
    // Show feedback for overlay button too
    if (overlayCopyBtn) {
        const originalText = overlayCopyBtn.textContent;
        overlayCopyBtn.textContent = '✓ Copied!';
        overlayCopyBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        
        setTimeout(() => {
            overlayCopyBtn.textContent = originalText;
            overlayCopyBtn.style.background = '';
        }, 2000);
    }
}

// Restart from overlay
function restartFromOverlay() {
    hideCompletionOverlay();
    resetDraw();
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
});

winnerCountInput.addEventListener('input', updateStepperButtons);
winnerCountInput.addEventListener('change', updateStepperButtons);

gridSizeSelect.addEventListener('change', handleGridSizeChange);

speedSlider.addEventListener('input', handleSpeedChange);
speedSlider.addEventListener('change', handleSpeedChange);

increaseBtn.addEventListener('click', increaseWinnerCount);
decreaseBtn.addEventListener('click', decreaseWinnerCount);

startBtn.addEventListener('click', startDraw);
resetBtn.addEventListener('click', resetDraw);
copyBtn.addEventListener('click', copyResults);

// Event listeners for overlay buttons (after DOM is loaded)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const overlayCopyBtnEl = document.getElementById('overlay-copy-btn');
        const overlayRestartBtnEl = document.getElementById('overlay-restart-btn');
        if (overlayCopyBtnEl) {
            overlayCopyBtnEl.addEventListener('click', copyResultsFromOverlay);
        }
        if (overlayRestartBtnEl) {
            overlayRestartBtnEl.addEventListener('click', restartFromOverlay);
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
            if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('show')) {
                hideModal();
            }
        });
    });
} else {
    if (overlayCopyBtn) {
        overlayCopyBtn.addEventListener('click', copyResultsFromOverlay);
    }
    if (overlayRestartBtn) {
        overlayRestartBtn.addEventListener('click', restartFromOverlay);
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
        if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('show')) {
            hideModal();
        }
    });
}

// Initialize
function initializeApp() {
    // Set initial grid size
    const initialSize = gridSizeSelect.value;
    updateGridSize(initialSize);
    createGrid();
    updateCounters();
    updateStepperButtons();
    
    // Set speed slider initial value
    if (speedSlider && speedValue) {
        gameSpeed = parseFloat(speedSlider.value);
        speedValue.textContent = `${gameSpeed}x`;
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
