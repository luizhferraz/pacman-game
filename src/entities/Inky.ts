import { Direction, Position } from '../types';
import { Ghost } from './Ghost';

export class Inky extends Ghost {
    private blinkyPos: Position = { x: 0, y: 0 }; // Initialize with default position

    constructor(startPosition: Position) {
        super(startPosition, '#00ffff'); // Cyan color
    }

    private calculateTargetPosition(pacmanPos: Position, pacmanDirection: Direction, blinkyPos: Position): Position {
        // First, get the position 2 tiles ahead of Pacman
        const intermediatePos = { ...pacmanPos };
        const offset = 2 * 30; // 2 tiles * tile size

        switch (pacmanDirection) {
            case 'up':
                intermediatePos.y -= offset;
                intermediatePos.x -= offset; // Mimics Pinky's targeting bug
                break;
            case 'down':
                intermediatePos.y += offset;
                break;
            case 'left':
                intermediatePos.x -= offset;
                break;
            case 'right':
                intermediatePos.x += offset;
                break;
        }

        // Then, draw a vector from Blinky to this position and double it
        return {
            x: intermediatePos.x + (intermediatePos.x - blinkyPos.x),
            y: intermediatePos.y + (intermediatePos.y - blinkyPos.y)
        };
    }

    public calculateNextMove(pacmanPos: Position, pacmanDirection: Direction = 'right', blinkyPos?: Position): void {
        if (blinkyPos) {
            this.blinkyPos = blinkyPos;
        }

        if (this.isVulnerable) {
            // Scatter behavior when vulnerable
            const random = Math.random();
            if (random < 0.25) this.direction = 'up';
            else if (random < 0.5) this.direction = 'down';
            else if (random < 0.75) this.direction = 'left';
            else this.direction = 'right';
        } else {
            // Calculate target based on both Pacman's and Blinky's positions
            const target = this.calculateTargetPosition(pacmanPos, pacmanDirection, this.blinkyPos);
            this.direction = this.getDirectionToTarget(target);
        }
    }
}