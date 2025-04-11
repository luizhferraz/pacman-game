import { Position } from '../types';
import { Ghost } from './Ghost';

export class Clyde extends Ghost {
    private readonly scatterCorner: Position = { x: 0, y: 550 }; // Bottom-left corner
    private readonly chaseTriggerDistance = 240; // 8 tiles * 30 pixels

    constructor(startPosition: Position) {
        super(startPosition, '#ffb851'); // Orange color
    }

    private getDistanceToPacman(pacmanPos: Position): number {
        const dx = this.position.x - pacmanPos.x;
        const dy = this.position.y - pacmanPos.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public calculateNextMove(pacmanPos: Position): void {
        if (this.isVulnerable) {
            // Random movement when vulnerable
            const random = Math.random();
            if (random < 0.25) this.direction = 'up';
            else if (random < 0.5) this.direction = 'down';
            else if (random < 0.75) this.direction = 'left';
            else this.direction = 'right';
        } else {
            // Clyde's unique behavior: chase if far, scatter if close
            const distanceToPacman = this.getDistanceToPacman(pacmanPos);
            
            if (distanceToPacman > this.chaseTriggerDistance) {
                // Chase Pacman when far away
                this.direction = this.getDirectionToTarget(pacmanPos);
            } else {
                // Return to scatter corner when close
                this.direction = this.getDirectionToTarget(this.scatterCorner);
            }
        }
    }
}