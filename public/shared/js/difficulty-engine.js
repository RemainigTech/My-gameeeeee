// =========================================================
// NeuroMetric Difficulty Engine
// Adaptive Cognitive Scaling System
// =========================================================

const DifficultyEngine = {

    level: 2,

    history: [],

    labels: {
        1: "Easy",
        2: "Normal",
        3: "Hard"
    },

    record(result) {

        this.history.push(result);

        if (this.history.length > 10) {
            this.history.shift();
        }

        this.adjustDifficulty();
    },

    adjustDifficulty() {

        if (this.history.length < 3) {
            return;
        }

        const recent = this.history.slice(-3);

        const avgAccuracy =
            recent.reduce((sum, r) => sum + r.accuracy, 0)
            / recent.length;

        if (avgAccuracy > 85 && this.level < 3) {
            this.level++;
        }

        else if (avgAccuracy < 50 && this.level > 1) {
            this.level--;
        }

        console.log(
            "Difficulty:",
            this.labels[this.level]
        );
    },

    getLevel() {
        return this.level;
    },

    getLabel() {
        return this.labels[this.level];
    },

    getTileMemoryConfig() {

        const configs = {

            1: {
                sequenceLength: 3,
                flashSpeed: 700
            },

            2: {
                sequenceLength: 5,
                flashSpeed: 500
            },

            3: {
                sequenceLength: 7,
                flashSpeed: 350
            }
        };

        return configs[this.level];
    }
};

window.DifficultyEngine = DifficultyEngine;
