import { Direction, Ghost as IGhost, Position, Size } from '../types';

export abstract class Ghost implements IGhost {
    public position: Position;
    public size: Size;
    public isVulnerable: boolean;
    protected direction: Direction;
    protected speed: number;
    protected startPosition: Position;
    protected color: string;
    protected inGhostHouse: boolean;
    
    constructor(startPosition: Position, color: string) {
        this.startPosition = { ...startPosition };
        this.position = { ...startPosition };
        this.size = { width: 30, height: 30 };
        this.direction = 'left';
        this.speed = 2.2; // Increased base speed
        this.isVulnerable = false;
        this.color = color;
        this.inGhostHouse = true;
    }

    public abstract calculateNextMove(pacmanPos: Position): void;

    public update(): void {
        switch (this.direction) {
            case 'up':
                this.position.y -= this.speed;
                break;
            case 'down':
                this.position.y += this.speed;
                break;
            case 'left':
                this.position.x -= this.speed;
                break;
            case 'right':
                this.position.x += this.speed;
                break;
        }

        // Check if ghost has left the ghost house
        if (this.inGhostHouse && this.position.y < 9 * 30) { // 9 * tileSize
            this.inGhostHouse = false;
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.fillStyle = this.isVulnerable ? '#2121ff' : this.color;
        
        // Draw ghost body
        ctx.beginPath();
        ctx.arc(
            this.position.x + this.size.width / 2,
            this.position.y + this.size.height / 2,
            this.size.width / 2,
            Math.PI,
            0,
            false
        );
        
        // Draw the bottom part of the ghost
        const bottomY = this.position.y + this.size.height;
        ctx.lineTo(this.position.x + this.size.width, bottomY);
        
        // Draw wavy bottom
        const waves = 4;
        const waveHeight = 5;
        const waveWidth = this.size.width / waves;
        
        for (let i = waves; i >= 0; i--) {
            const x = this.position.x + (i * waveWidth);
            const y = bottomY - (i % 2 === 0 ? 0 : waveHeight);
            ctx.lineTo(x, y);
        }
        
        ctx.fill();
        
        // Draw eyes
        const eyeRadius = 4;
        const eyeOffsetX = 8;
        const eyeOffsetY = -5;
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(
            this.position.x + this.size.width / 2 - eyeOffsetX,
            this.position.y + this.size.height / 2 + eyeOffsetY,
            eyeRadius,
            0,
            Math.PI * 2
        );
        ctx.arc(
            this.position.x + this.size.width / 2 + eyeOffsetX,
            this.position.y + this.size.height / 2 + eyeOffsetY,
            eyeRadius,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw pupils
        ctx.fillStyle = 'black';
        const pupilOffset = 2;
        ctx.beginPath();
        ctx.arc(
            this.position.x + this.size.width / 2 - eyeOffsetX + pupilOffset,
            this.position.y + this.size.height / 2 + eyeOffsetY,
            2,
            0,
            Math.PI * 2
        );
        ctx.arc(
            this.position.x + this.size.width / 2 + eyeOffsetX + pupilOffset,
            this.position.y + this.size.height / 2 + eyeOffsetY,
            2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        ctx.restore();
    }

    public reset(): void {
        this.position = { ...this.startPosition };
        this.direction = 'left';
        this.isVulnerable = false;
        this.inGhostHouse = true;
    }

    public setVulnerable(vulnerable: boolean): void {
        this.isVulnerable = vulnerable;
        this.speed = vulnerable ? 1.8 : 2.2; // Slower when vulnerable
    }

    public getDirection(): Direction {
        return this.direction;
    }

    public forceDirection(direction: Direction): void {
        this.direction = direction;
    }

    protected getDirectionToTarget(target: Position): Direction {
        const dx = target.x - this.position.x;
        const dy = target.y - this.position.y;

        // If in ghost house, prioritize moving up to exit
        if (this.inGhostHouse) {
            if (Math.abs(dy) > 2) { // If not aligned with exit
                return 'up';
            }
            // If aligned with exit, move normally
        }
        
        // Normal targeting logic with slight randomization for more aggressive behavior
        if (Math.random() < 0.8) { // 80% chance to choose optimal direction
            if (Math.abs(dx) > Math.abs(dy)) {
                return dx > 0 ? 'right' : 'left';
            } else {
                return dy > 0 ? 'down' : 'up';
            }
        } else { // 20% chance to choose perpendicular direction for more unpredictable movement
            if (Math.abs(dx) > Math.abs(dy)) {
                return dy > 0 ? 'down' : 'up';
            } else {
                return dx > 0 ? 'right' : 'left';
            }
        }
    }
}