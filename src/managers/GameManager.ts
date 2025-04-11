import { Pacman } from '../entities/Pacman';
import { Blinky } from '../entities/Blinky';
import { Pinky } from '../entities/Pinky';
import { Inky } from '../entities/Inky';
import { Clyde } from '../entities/Clyde';
import { Ghost } from '../entities/Ghost';
import { Direction, Position, TileType } from '../types';

export class GameManager {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private pacman: Pacman;
    private ghosts: Ghost[];
    private score: number;
    private gameOver: boolean;
    private level: number;
    private map: number[][];
    private initialMap: number[][];
    private tileSize: number;
    private pelletCount: number;
    private gameLoop: number | null;
    private isPaused: boolean;
    private speed: number;
    private lastTime: number = 0;
    private readonly FPS = 60;
    private readonly frameTime = 1000 / 60;

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.tileSize = 30;
        this.score = 0;
        this.gameOver = false;
        this.level = 1;
        this.isPaused = false;
        this.pelletCount = 0;
        this.gameLoop = null;
        this.speed = 4; // Increased speed for smoother movement

        // Initialize game map (0: path, 1: wall, 2: pellet, 3: power pellet, 4: ghost house)
        this.initialMap = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,1,1,1,1,2,1,1,2,1],
            [1,3,2,2,2,2,2,2,2,2,2,2,2,3,1],
            [1,2,1,1,2,1,2,1,1,1,2,1,1,2,1],
            [1,2,2,2,2,1,2,2,2,1,2,2,2,2,1],
            [1,1,1,1,2,1,1,0,1,1,2,1,1,1,1],
            [0,0,0,1,2,1,4,4,4,1,2,1,0,0,0],
            [1,1,1,1,2,1,4,4,4,1,2,1,1,1,1],
            [0,0,0,0,2,0,4,4,4,0,2,0,0,0,0],
            [1,1,1,1,2,1,1,1,1,1,2,1,1,1,1],
            [0,0,0,1,2,1,0,0,0,1,2,1,0,0,0],
            [1,1,1,1,2,1,1,1,1,1,2,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,1,1,1,1,2,1,1,2,1],
            [1,3,2,1,2,2,2,2,2,2,2,1,2,3,1],
            [1,1,2,1,2,1,2,1,1,1,2,1,2,1,1],
            [1,2,2,2,2,1,2,2,2,1,2,2,2,2,1],
            [1,2,1,1,1,1,1,1,1,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        // Create a deep copy of the initial map
        this.map = this.initialMap.map(row => [...row]);

        // Count initial pellets
        this.pelletCount = this.map.flat().filter(tile => tile === TileType.PELLET || tile === TileType.POWER_PELLET).length;

        // Initialize entities
        const pacmanStart: Position = { x: 7 * this.tileSize, y: 15 * this.tileSize };
        const ghostHouse: Position = { x: 7 * this.tileSize, y: 8 * this.tileSize };
        
        this.pacman = new Pacman(pacmanStart);
        this.ghosts = [
            new Blinky({ x: ghostHouse.x, y: ghostHouse.y - this.tileSize }),
            new Pinky({ x: ghostHouse.x - this.tileSize, y: ghostHouse.y }),
            new Inky({ x: ghostHouse.x, y: ghostHouse.y }),
            new Clyde({ x: ghostHouse.x + this.tileSize, y: ghostHouse.y })
        ];

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) {
                if (e.key === 'Enter') {
                    this.resetGame();
                }
                return;
            }

            if (e.key === 'p') {
                this.togglePause();
                return;
            }

            if (this.isPaused) return;

            let direction: Direction | null = null;
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                    direction = 'up';
                    break;
                case 'ArrowDown':
                case 's':
                    direction = 'down';
                    break;
                case 'ArrowLeft':
                case 'a':
                    direction = 'left';
                    break;
                case 'ArrowRight':
                case 'd':
                    direction = 'right';
                    break;
            }

            // Always set the next direction if a valid key was pressed
            if (direction) {
                this.pacman.setNextDirection(direction);
            }
        });
    }

    private togglePause(): void {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
            this.drawPauseScreen();
        } else {
            this.gameLoop = requestAnimationFrame((time) => this.update(time));
        }
    }

    private drawPauseScreen(): void {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press P to continue', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    private checkCollisions(): void {
        // Check ghost collisions
        for (const ghost of this.ghosts) {
            const dx = this.pacman.position.x - ghost.position.x;
            const dy = this.pacman.position.y - ghost.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.tileSize * 0.8) { // Slightly more forgiving collision
                if (ghost.isVulnerable) {
                    // Eat ghost
                    this.score += 200;
                    ghost.reset();
                } else {
                    // Pacman dies
                    this.pacman.lives--;
                    if (this.pacman.lives <= 0) {
                        this.gameOver = true;
                    } else {
                        this.resetLevel(false); // Don't restore food when losing a life
                    }
                }
            }
        }

        // Check pellet collisions - improved to be more forgiving
        const centerX = this.pacman.position.x + this.pacman.size.width / 2;
        const centerY = this.pacman.position.y + this.pacman.size.height / 2;
        
        const tileX = Math.floor(centerX / this.tileSize);
        const tileY = Math.floor(centerY / this.tileSize);

        // Check surrounding tiles for pellets
        const tilesToCheck = [
            { x: tileX, y: tileY },
            { x: Math.floor((centerX + 10) / this.tileSize), y: tileY },
            { x: Math.floor((centerX - 10) / this.tileSize), y: tileY },
            { x: tileX, y: Math.floor((centerY + 10) / this.tileSize) },
            { x: tileX, y: Math.floor((centerY - 10) / this.tileSize) }
        ];

        for (const tile of tilesToCheck) {
            if (this.map[tile.y] && this.map[tile.y][tile.x] === TileType.PELLET) {
                this.map[tile.y][tile.x] = TileType.PATH;
                this.score += 10;
                this.pelletCount--;
                break;
            } else if (this.map[tile.y] && this.map[tile.y][tile.x] === TileType.POWER_PELLET) {
                this.map[tile.y][tile.x] = TileType.PATH;
                this.score += 50;
                this.pelletCount--;
                this.activatePowerMode();
                break;
            }
        }

        // Check if level is complete
        if (this.pelletCount <= 0) {
            this.level++;
            this.resetLevel(true); // Restore food for new level
        }
    }

    private activatePowerMode(): void {
        this.pacman.activatePowerMode();
        for (const ghost of this.ghosts) {
            ghost.setVulnerable(true);
        }

        setTimeout(() => {
            for (const ghost of this.ghosts) {
                ghost.setVulnerable(false);
            }
        }, 10000); // 10 seconds power mode
    }

    private resetLevel(restoreFood: boolean = false): void {
        // Reset positions
        const pacmanStart: Position = { x: 7 * this.tileSize, y: 15 * this.tileSize };
        this.pacman.reset(pacmanStart);
        
        for (const ghost of this.ghosts) {
            ghost.reset();
        }

        // Only restore food if explicitly requested (new level or game over)
        if (restoreFood) {
            this.map = this.initialMap.map(row => [...row]);
            this.pelletCount = this.map.flat().filter(tile => tile === TileType.PELLET || tile === TileType.POWER_PELLET).length;
        }
    }

    private resetGame(): void {
        // Reset map to initial state
        this.map = this.initialMap.map(row => [...row]);
        
        // Reset pellet count
        this.pelletCount = this.map.flat().filter(tile => tile === TileType.PELLET || tile === TileType.POWER_PELLET).length;
        
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.pacman.lives = 3;
        this.resetLevel(false); // Don't restore food since we just did it
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    private drawMap(): void {
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                const tile = this.map[y][x];
                const px = x * this.tileSize;
                const py = y * this.tileSize;

                switch (tile) {
                    case TileType.WALL:
                        this.ctx.fillStyle = '#2121ff';
                        this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
                        break;
                    case TileType.GHOST_HOUSE:
                        this.ctx.fillStyle = '#000000';
                        this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
                        break;
                    case TileType.PELLET:
                        this.ctx.fillStyle = '#ffb8ff';
                        this.ctx.beginPath();
                        this.ctx.arc(
                            px + this.tileSize / 2,
                            py + this.tileSize / 2,
                            2,
                            0,
                            Math.PI * 2
                        );
                        this.ctx.fill();
                        break;
                    case TileType.POWER_PELLET:
                        this.ctx.fillStyle = '#ffb8ff';
                        this.ctx.beginPath();
                        this.ctx.arc(
                            px + this.tileSize / 2,
                            py + this.tileSize / 2,
                            6,
                            0,
                            Math.PI * 2
                        );
                        this.ctx.fill();
                        break;
                }
            }
        }
    }

    private drawUI(): void {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, this.canvas.height - 10);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Level: ${this.level}`, this.canvas.width - 10, this.canvas.height - 10);

        // Draw lives
        for (let i = 0; i < this.pacman.lives; i++) {
            this.ctx.fillStyle = 'yellow';
            this.ctx.beginPath();
            this.ctx.arc(
                30 + i * 25,
                30,
                10,
                0.2 * Math.PI,
                1.8 * Math.PI
            );
            this.ctx.lineTo(30 + i * 25, 30);
            this.ctx.fill();
        }
    }

    private drawGameOver(): void {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'red';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(
            `Final Score: ${this.score}`,
            this.canvas.width / 2,
            this.canvas.height / 2 + 40
        );
        this.ctx.fillText(
            'Press ENTER to play again',
            this.canvas.width / 2,
            this.canvas.height / 2 + 80
        );
    }

    private isValidMove(position: Position, direction: Direction): boolean {
        // Calculate the next position based on direction
        const nextPos = { ...position };
        const step = this.speed;
        switch (direction) {
            case 'up':
                nextPos.y -= step;
                break;
            case 'down':
                nextPos.y += step;
                break;
            case 'left':
                nextPos.x -= step;
                break;
            case 'right':
                nextPos.x += step;
                break;
        }

        // Allow movement in tunnel areas
        const mapWidth = this.map[0].length * this.tileSize;
        if (nextPos.x < -this.tileSize || nextPos.x > mapWidth) {
            return true;
        }

        // Add a small buffer for smoother corner turning
        const buffer = 2;
        const corners = [
            { 
                x: Math.floor((nextPos.x + buffer) / this.tileSize), 
                y: Math.floor((nextPos.y + buffer) / this.tileSize) 
            },
            { 
                x: Math.floor((nextPos.x + this.pacman.size.width - buffer) / this.tileSize), 
                y: Math.floor((nextPos.y + buffer) / this.tileSize) 
            },
            { 
                x: Math.floor((nextPos.x + buffer) / this.tileSize), 
                y: Math.floor((nextPos.y + this.pacman.size.height - buffer) / this.tileSize) 
            },
            { 
                x: Math.floor((nextPos.x + this.pacman.size.width - buffer) / this.tileSize), 
                y: Math.floor((nextPos.y + this.pacman.size.height - buffer) / this.tileSize) 
            }
        ];

        // Check if position belongs to a ghost
        const isGhost = this.ghosts.some(ghost => ghost.position === position);

        // Check if any corner intersects with a wall or (if it's pacman) the ghost house
        return !corners.some(corner => 
            corner.y >= 0 && 
            corner.y < this.map.length && 
            corner.x >= 0 && 
            corner.x < this.map[0].length && 
            (this.map[corner.y][corner.x] === TileType.WALL || 
             (!isGhost && this.map[corner.y][corner.x] === TileType.GHOST_HOUSE))
        );
    }

    private getValidDirectionsFromPosition(position: Position): Direction[] {
        const validDirections: Direction[] = [];
        const directions: Direction[] = ['up', 'right', 'down', 'left'];
        
        for (const dir of directions) {
            const testPos = { ...position };
            switch (dir) {
                case 'up':
                    testPos.y -= this.tileSize / 2;
                    break;
                case 'down':
                    testPos.y += this.tileSize / 2;
                    break;
                case 'left':
                    testPos.x -= this.tileSize / 2;
                    break;
                case 'right':
                    testPos.x += this.tileSize / 2;
                    break;
            }
            
            if (this.isValidMove(position, dir)) {
                validDirections.push(dir);
            }
        }
        
        return validDirections;
    }

    private handleTeleport(): void {
        const mapWidth = this.map[0].length * this.tileSize;
        
        // Teleport from left to right
        if (this.pacman.position.x < -this.tileSize) {
            this.pacman.position.x = mapWidth;
        }
        // Teleport from right to left
        else if (this.pacman.position.x > mapWidth) {
            this.pacman.position.x = -this.tileSize;
        }
    }

    private update(currentTime: number = 0): void {
        if (!this.lastTime) {
            this.lastTime = currentTime;
        }

        const deltaTime = currentTime - this.lastTime;

        if (deltaTime >= this.frameTime) {
            this.lastTime = currentTime;

            if (this.gameOver) {
                this.drawGameOver();
            } else if (this.isPaused) {
                this.drawPauseScreen();
            } else {
                // Clear canvas
                this.ctx.fillStyle = 'black';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

                // Draw map
                this.drawMap();

                // Handle Pacman movement
                const nextDirection = this.pacman.getNextDirection();
                if (nextDirection && this.isValidMove(this.pacman.position, nextDirection)) {
                    this.pacman.move(nextDirection);
                    this.pacman.clearNextDirection();
                } else if (this.isValidMove(this.pacman.position, this.pacman.getDirection())) {
                    this.pacman.move(this.pacman.getDirection());
                }

                // Handle teleportation
                this.handleTeleport();

                // Update Pacman animation
                this.pacman.update();
                this.pacman.draw(this.ctx);

                // Update ghosts with improved movement
                for (const ghost of this.ghosts) {
                    const originalPos = { ...ghost.position };
                    
                    if (ghost instanceof Inky) {
                        ghost.calculateNextMove(
                            this.pacman.position,
                            this.pacman.getDirection(),
                            (this.ghosts[0] as Blinky).position
                        );
                    } else {
                        ghost.calculateNextMove(this.pacman.position);
                    }
                    
                    // Get valid directions from current position
                    const validDirections = this.getValidDirectionsFromPosition(ghost.position);
                    
                    if (validDirections.length > 0) {
                        // If current direction is valid, keep it with higher probability
                        const currentDirection = ghost.getDirection();
                        if (validDirections.includes(currentDirection) && Math.random() > 0.25) {
                            ghost.update();
                        } else {
                            // Otherwise choose a random valid direction
                            const randomDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
                            ghost.forceDirection(randomDirection);
                            ghost.update();
                        }
                    } else {
                        // If no valid directions, stay in place
                        ghost.position = originalPos;
                    }
                    
                    ghost.draw(this.ctx);
                }

                // Check collisions
                this.checkCollisions();

                // Draw UI
                this.drawUI();
            }
        }

        // Continue game loop
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    public start(): void {
        this.lastTime = performance.now();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }
}