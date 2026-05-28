// =========================================================
// NeuroMetric Tutorial Engine
// Elderly-Friendly Guided Onboarding System
// =========================================================

const TutorialEngine = {

    overlay: null,

    async show(config) {

        // Remove old overlay if exists
        if (this.overlay) {
            this.overlay.remove();
        }

        // Create overlay
        this.overlay = document.createElement("div");

        this.overlay.id = "tutorial-overlay";

        this.overlay.innerHTML = `
            <div id="tutorial-card">

                <img
                    id="tutorial-character"
                    src="${config.character}"
                    alt="Guide Character"
                />

                <div id="tutorial-dialog">

                    <h2>${config.title}</h2>

                    <p>${config.text}</p>

                    <button id="tutorial-start-btn">
                        Start Practice
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(this.overlay);

        // Play narration if enabled
        if (config.voice === true) {

            const speech =
                new SpeechSynthesisUtterance(config.text);

            speech.rate = 0.9;
            speech.pitch = 1;

            speechSynthesis.speak(speech);
        }

        // Run demo if provided
        if (config.demo) {
            await config.demo();
        }

        // Wait for button click
        return new Promise((resolve) => {

            document
                .getElementById("tutorial-start-btn")
                .onclick = () => {

                    this.hide();

                    resolve();
                };
        });
    },

    hide() {

        if (this.overlay) {
            this.overlay.remove();
        }
    }
};

window.TutorialEngine = TutorialEngine;
