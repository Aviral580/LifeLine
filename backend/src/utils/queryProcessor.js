import natural from 'natural';

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// A robust list of "Noise" words that don't add value to a search
const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
    'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up',
    'down', 'of', 'and', 'or', 'but', 'if', 'so', 'my', 'your', 'his', 'her', 'its'
]);

export const processQuery = (query) => {
    if (!query || typeof query !== 'string') return [];

    // 1. CLEANING: Remove punctuation and extra spaces, convert to lowercase
    const cleanQuery = query
        .replace(/[^\w\s]/gi, ' ') // Remove non-alphanumeric characters
        .replace(/\s+/g, ' ')      // Collapse multiple spaces into one
        .trim()
        .toLowerCase();

    // 2. TOKENIZATION: Break into individual words
    const rawTokens = tokenizer.tokenize(cleanQuery);

    // 3. FILTERING & STEMMING
    const processedTokens = rawTokens
        .filter(word => !STOP_WORDS.has(word)) // Remove stopwords
        .map(word => stemmer.stem(word));      // Reduce to root (stemming)

    // 4. DEDUPLICATION: Remove duplicates (fixes "my my my home")
    return [...new Set(processedTokens)];
};