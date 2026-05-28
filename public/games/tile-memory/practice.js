// =========================================================
// Tile Memory Practice Mode
// =========================================================

const TileMemoryPractice = {

    async start() {

        alert(
            "Practice Round Starting"
        );

        await this.practiceRound();

        alert(
            "Great Job! Now the real assessment begins."
        );

        TileMemoryGame.startRound();
    },

    async practiceRound() {

        const practiceSequence =
            [0, 4, 8];

        await TileMemoryGame.playSequence(700);

        TileMemoryGame.sequence =
            practiceSequence;

        TileMemoryGame.playerSequence = [];

        TileMemoryGame.acceptingInput = true;
    }
};

window.TileMemoryPractice =
    TileMemoryPractice;
