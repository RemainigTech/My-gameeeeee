// =========================================================
// NeuroMetric Giant Cursor Engine
// Animated Tutorial Demonstration System
// =========================================================

const GiantCursor = {

    cursor: null,

    init() {

        // Prevent duplicate cursor
        if (this.cursor) return;

        this.cursor = document.createElement("div");

        this.cursor.id = "giant-cursor";

        this.cursor.innerHTML = "👆";

        document.body.appendChild(this.cursor);
    },

    async moveToElement(selector) {

        const element = document.querySelector(selector);

        if (!element) {
            console.warn("Element not found:", selector);
            return;
        }

        const rect = element.getBoundingClientRect();

        const x = rect.left + rect.width / 2;

        const y = rect.top + rect.height / 2;

        this.cursor.style.left = `${x}px`;

        this.cursor.style.top = `${y}px`;

        await this.sleep(900);
    },

    async click() {

        this.cursor.classList.add("cursor-click");

        await this.sleep(300);

        this.cursor.classList.remove("cursor-click");

        await this.sleep(300);
    },

    async demoClick(selector) {

        await this.moveToElement(selector);

        await this.click();
    },

    hide() {

        if (this.cursor) {
            this.cursor.style.display = "none";
        }
    },

    show() {

        if (this.cursor) {
            this.cursor.style.display = "flex";
        }
    },

    sleep(ms) {

        return new Promise(resolve =>
            setTimeout(resolve, ms)
        );
    }
};

window.GiantCursor = GiantCursor;
