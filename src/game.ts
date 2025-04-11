import { GameManager } from './managers/GameManager';

window.onload = () => {
    const game = new GameManager();
    game.start();
};