export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Entity {
    position: Position;
    size: Size;
    update(): void;
    draw(ctx: CanvasRenderingContext2D): void;
    reset(position?: Position): void;
}

export interface Ghost extends Entity {
    isVulnerable: boolean;
    setVulnerable(vulnerable: boolean): void;
    calculateNextMove(pacmanPos: Position, pacmanDirection?: Direction, blinkyPos?: Position): void;
}

export enum TileType {
    PATH = 0,
    WALL = 1,
    PELLET = 2,
    POWER_PELLET = 3,
    GHOST_HOUSE = 4
}