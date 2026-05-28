// =========================================================
// Tile Memory Game
// =========================================================

const TileMemoryGame = {

    sequence: [],

    playerSequence: [],

    acceptingInput: false,

    async init() {

        this.createGrid();

        GiantCursor.init();

        await this.showTutorial();

        this.startRound();
    },

    createGrid() {

        const grid =
            document.getElementById("tile-grid");

        for (let i = 0; i < 9; i++) {

            const tile =
                document.createElement("div");

            tile.className = "tile";

            tile.id = `tile-${i}`;

            tile.onclick = () =>
                this.handleTileClick(i);

            grid.appendChild(tile);
        }
    },

    async showTutorial() {

        await TutorialEngine.show({

            title: "Tile Memory",

            text: `
                Watch the glowing tiles carefully.
                Then tap the same tiles
                in the same order.
            `,

            character:
                "/public/shared/assets/characters/assistant.png",

            voice: true,

            demo: async () => {

                GiantCursor.show();

                await GiantCursor.demoClick("#tile-0");

                await GiantCursor.demoClick("#tile-4");

                await GiantCursor.demoClick("#tile-8");

                GiantCursor.hide();
            }
        });
    },

    async startRound() {

        this.playerSequence = [];

        this.sequence = [];

        const config =
            DifficultyEngine.getTileMemoryConfig();

        for (
            let i = 0;
            i < config.sequenceLength;
            i++
        ) {
            this.sequence.push(
                Math.floor(Math.random() * 9)
            );
        }

        await this.playSequence(
            config.flashSpeed
        );

        this.acceptingInput = true;
    },

    async playSequence(speed) {

        for (const index of this.sequence) {

            const tile =
                document.getElementById(
                    `tile-${index}`
                );

            tile.classList.add("active");

            await this.sleep(speed);

            tile.classList.remove("active");

            await this.sleep(250);
        }
    },

    handleTileClick(index) {

        if (!this.acceptingInput) return;

        this.playerSequence.push(index);

        const current =
            this.playerSequence.length - 1;

        if (
            this.playerSequence[current]
            !==
            this.sequence[current]
        ) {

            this.endGame(false);

            return;
        }

        if (
            this.playerSequence.length
            ===
            this.sequence.length
        ) {

            this.endGame(true);
        }
    },

    endGame(success) {

        this.acceptingInput = false;

        AssessmentManager.completeModule({

            score: success ? 100 : 40,

            accuracy: success ? 100 : 40,

            errors: success ? 0 : 1,

            responseTime: 1200
        });
    },

    sleep(ms) {

        return new Promise(resolve =>
            setTimeout(resolve, ms)
        );
    }
};

TileMemoryGame.init();
