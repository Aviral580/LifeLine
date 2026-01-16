import natural from 'natural';

class QueryPredictor {
  constructor() {
    this.trie = new natural.Trie();
    this.tokenizer = new natural.WordTokenizer();
    
    [cite_start]// Initial Training Data [cite: 32-33]
    // In production, this would load from your database of recent searches
    const trainingData = [
      "earthquake safety tips",
      "flood evacuation routes",
      "emergency contact numbers",
      "verified news sources",
      "hospital availability near me",
      "fire department helpline",
      "tsunami warning signs",
      "shelter locations map"
    ];

    this.train(trainingData);
  }

  train(phrases) {
    phrases.forEach(phrase => {
      this.trie.addString(phrase.toLowerCase());
    });
    console.log("✅ N-gram Model Trained with " + phrases.length + " base queries.");
  }

  predict(prefix) {
    if (!prefix) return [];
    // Find all completions in the Trie
    const completions = this.trie.findPrefix(prefix.toLowerCase());
    
    // Return top 5 suggestions
    return completions.slice(0, 5).map(c => prefix + c.substring(prefix.length));
  }
}

export default new QueryPredictor();
