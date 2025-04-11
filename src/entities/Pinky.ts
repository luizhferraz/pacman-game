import { Direction, Position } from '../types';
import { Ghost } from './Ghost';

export class Pinky extends Ghost {
    constructor(startPosition: Position) {
        super(startPosition, '#ffb8ff'); // Pink color
    }

    private calculateAmbushPosition(pacmanPos: Position, pacmanDirection: Direction): Position {
        // Target 4 tiles ahead of Pacman
        const target = { ...pacmanPos };
        const offset = 4 * 30; // 4 tiles * tile size

        switch (pacmanDirection) {
            case 'up':
                target.y -= offset;
                target.x -= offset; // Famous Pinky targeting bug/feature
                break;
            case 'down':
                target.y += offset;
                break;
            case 'left':
                target.x -= offset;
                break;
            case 'right':
                target.x += offset;
                break;
        }

        return target;
    }

    public calculateNextMove(pacmanPos: Position, pacmanDirection: Direction = 'right'): void {
        if (this.isVulnerable) {
            // Scatter behavior when vulnerable
            const random = Math.random();
            if (random < 0.25) this.direction = 'up';
            else if (random < 0.5) this.direction = 'down';
            else if (random < 0.75) this.direction = 'left';
            else this.direction = 'right';
        } else {
            // Target 4 tiles ahead of Pacman
            const ambushPos = this.calculateAmbushPosition(pacmanPos, pacmanDirection);
            this.direction = this.getDirectionToTarget(ambushPos);
        }
    }
}