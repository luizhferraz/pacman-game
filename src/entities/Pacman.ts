import { Direction, Entity, Position, Size } from '../types';

export class Pacman implements Entity {
    public position: Position;
    public size: Size;
    private direction: Direction;
    private nextDirection: Direction | null;
    private mouthOpen: number;
    private mouthSpeed: number;
    private speed: number;
    public lives: number;
    public score: number;
    public powerMode: boolean;
    private powerModeTimer: number | null;

    constructor(startPosition: Position) {
        this.position = { ...startPosition };
        this.size = { width: 30, height: 30 };
        this.direction = 'right';
        this.nextDirection = null;
        this.mouthOpen = 0.2;
        this.mouthSpeed = 0.15;
        this.speed = 4; // Match GameManager's speed
        this.lives = 3;
        this.score = 0;
        this.powerMode = false;
        this.powerModeTimer = null;
    }

    public setNextDirection(direction: Direction): void {
        this.nextDirection = direction;
    }

    public getNextDirection(): Direction | null {
        return this.nextDirection;
    }

    public clearNextDirection(): void {
        this.nextDirection = null;
    }

    public getDirection(): Direction {
        return this.direction;
    }

    public activatePowerMode(): void {
        this.powerMode = true;
        if (this.powerModeTimer) {
            window.clearTimeout(this.powerModeTimer);
        }
        this.powerModeTimer = window.setTimeout(() => {
            this.powerMode = false;
            this.powerModeTimer = null;
        }, 10000); // 10 seconds power mode
    }

    public update(): void {
        // Update mouth animation
        this.mouthOpen += this.mouthSpeed;
        if (this.mouthOpen >= 0.7 || this.mouthOpen <= 0.2) {
            this.mouthSpeed = -this.mouthSpeed;
        }
    }

    public move(direction: Direction): void {
        this.direction = direction;
        switch (direction) {
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
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.fillStyle = 'yellow';
        ctx.beginPath();

        // Calculate mouth angles based on direction
        let startAngle = 0;
        let endAngle = 2 * Math.PI;
        const mouthAngle = this.mouthOpen * Math.PI;

        switch (this.direction) {
            case 'right':
                startAngle = mouthAngle;
                endAngle = 2 * Math.PI - mouthAngle;
                break;
            case 'left':
                startAngle = Math.PI + mouthAngle;
                endAngle = Math.PI - mouthAngle;
                break;
            case 'up':
                startAngle = 1.5 * Math.PI + mouthAngle;
                endAngle = 1.5 * Math.PI - mouthAngle;
                break;
            case 'down':
                startAngle = 0.5 * Math.PI + mouthAngle;
                endAngle = 0.5 * Math.PI - mouthAngle;
                break;
        }

        ctx.arc(
            this.position.x + this.size.width / 2,
            this.position.y + this.size.height / 2,
            this.size.width / 2,
            startAngle,
            endAngle
        );
        ctx.lineTo(this.position.x + this.size.width / 2, this.position.y + this.size.height / 2);
        ctx.fill();
        ctx.restore();
    }

    public reset(position: Position): void {
        this.position = { ...position };
        this.direction = 'right';
        this.nextDirection = null;
        this.powerMode = false;
        if (this.powerModeTimer) {
            window.clearTimeout(this.powerModeTimer);
            this.powerModeTimer = null;
        }
    }
}