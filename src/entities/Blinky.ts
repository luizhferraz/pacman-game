import { Position } from '../types';
import { Ghost } from './Ghost';

export class Blinky extends Ghost {
    private readonly SPEED_BOOST = 2.6; // Slightly faster than other ghosts

    constructor(startPosition: Position) {
        super(startPosition, '#ff0000'); // Red color
        this.speed = this.SPEED_BOOST; // Override default speed
    }

    public calculateNextMove(pacmanPos: Position): void {
        if (this.isVulnerable) {
            // When vulnerable, move randomly or away from Pacman
            const random = Math.random();
            if (random < 0.25) this.direction = 'up';
            else if (random < 0.5) this.direction = 'down';
            else if (random < 0.75) this.direction = 'left';
            else this.direction = 'right';
        } else {
            // Always aggressively target Pacman's position with high persistence
            if (Math.random() < 0.9) { // 90% chance to choose optimal direction
                this.direction = this.getDirectionToTarget(pacmanPos);
            }
            // 10% chance to keep current direction for smoother pursuit
        }
    }

    public setVulnerable(vulnerable: boolean): void {
        this.isVulnerable = vulnerable;
        this.speed = vulnerable ? 1.8 : this.SPEED_BOOST;
    }
}