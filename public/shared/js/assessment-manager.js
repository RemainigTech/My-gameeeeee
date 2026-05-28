// =========================================================
// NeuroMetric Assessment Manager
// Central Cognitive Session Controller
// =========================================================

const AssessmentManager = {

    currentModuleIndex: 0,

    modules: [

        {
            id: "tile-memory",
            title: "Tile Memory"
        },

        {
            id: "attention-vigilance",
            title: "Attention Vigilance"
        },

        {
            id: "pathfinder",
            title: "Pathfinder"
        },

        {
            id: "recognition-memory",
            title: "Recognition Memory"
        },

        {
            id: "spatial-reasoning",
            title: "Spatial Reasoning"
        },

        {
            id: "clock-drawing",
            title: "Clock Drawing"
        },

        {
            id: "kitchen-rush",
            title: "Kitchen Rush"
        }
    ],

    sessionData: {

        startedAt: null,

        completedModules: [],

        scores: [],

        errors: [],

        responseTimes: []
    },

    init() {

        this.sessionData.startedAt =
            new Date();

        console.log(
            "Assessment session started"
        );

        this.loadCurrentModule();
    },

    async loadCurrentModule() {

        const module =
            this.modules[this.currentModuleIndex];

        if (!module) {

            this.finishAssessment();

            return;
        }

        console.log(
            "Loading Module:",
            module.title
        );

        // Update UI
        const container =
            document.getElementById("game-container");

        container.innerHTML = `
            <iframe
                id="game-frame"
                src="/public/games/${module.id}/index.html"
                width="100%"
                height="900px"
                style="
                    border:none;
                    border-radius:20px;
                "
            ></iframe>
        `;
    },

    completeModule(result) {

        const module =
            this.modules[this.currentModuleIndex];

        this.sessionData.completedModules.push(
            module.id
        );

        this.sessionData.scores.push(
            result.score || 0
        );

        this.sessionData.errors.push(
            result.errors || 0
        );

        this.sessionData.responseTimes.push(
            result.responseTime || 0
        );

        // Adaptive difficulty update
        DifficultyEngine.record({
            accuracy:
                result.accuracy || 0
        });

        console.log(
            "Module Complete:",
            module.title
        );

        this.currentModuleIndex++;

        this.loadCurrentModule();
    },

    async finishAssessment() {

        console.log(
            "Assessment completed"
        );

        // Future:
        // Save results to backend
        // Generate reports
        // Show radar charts

        alert(
            "Assessment Completed!"
        );

        window.location.href =
            "/public/dashboard.html";
    }
};

window.AssessmentManager =
    AssessmentManager;
