import { pipeline } from '@xenova/transformers';

class VectorService {
    constructor() {
        this.model = null;
        this.isReady = false;
        // We trigger the load immediately so it's ready when the first search hits
        this.initialize();
    }

    async initialize() {
        console.log("🧠 Vector Engine: Loading local model (all-MiniLM-L6-v2)...");
        try {
            // This downloads the model to your cache once, then runs locally
            this.model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            this.isReady = true;
            console.log("✅ Vector Engine: Online and ready to embed.");
        } catch (error) {
            console.error("❌ Vector Model Failed to Load:", error.message);
        }
    }

    async getEmbedding(text) {
        if (!this.isReady || !this.model) {
            console.warn("⚠️ Vector Engine not ready yet. Skipping embedding.");
            return null;
        }

        try {
            // Generate the embedding
            const output = await this.model(text, { pooling: 'mean', normalize: true });
            // Convert Tensor to standard JS Array
            return Array.from(output.data);
        } catch (error) {
            console.error("Embedding Generation Error:", error.message);
            return null;
        }
    }
}

// Export a singleton instance
export default new VectorService();