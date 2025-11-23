import { Game } from "./Game";

(async () => {
  console.log("Starting game...");
  const game = new Game();
  game
    .init()
    .then(() => {
      console.log("Game initialized");
    })
    .catch((err) => {
      console.error("Game initialization failed:", err);
    });
})();
