import * as cheerio from "cheerio";
import type { KeywordAnalysisResult, KeywordMetric } from "@/types/seo";

/**
 * Standard comprehensive English stop words list.
 */
const STOP_WORDS = new Set<string>([
  "a", "about", "above", "after", "again", "against", "all", "almost", "also", "although", "always",
  "am", "among", "an", "and", "another", "any", "anyhow", "anyone", "anything", "anyway", "are",
  "aren't", "around", "as", "at", "back", "be", "became", "because", "become", "becomes", "been",
  "before", "beforehand", "behind", "being", "below", "beside", "besides", "between", "beyond", "both",
  "but", "by", "can", "cannot", "can't", "co", "could", "couldn't", "did", "didn't", "do", "does",
  "doesn't", "doing", "done", "don't", "down", "due", "during", "each", "eg", "either", "else",
  "elsewhere", "empty", "enough", "etc", "even", "ever", "every", "everyone", "everything", "everywhere",
  "few", "first", "for", "former", "formerly", "from", "further", "get", "gets", "getting", "give",
  "given", "gives", "go", "goes", "going", "gone", "got", "had", "hadn't", "has", "hasn't", "have",
  "haven't", "having", "he", "he'd", "he'll", "he's", "hence", "her", "here", "hereafter", "hereby",
  "herein", "here's", "hereupon", "hers", "herself", "him", "himself", "his", "how", "how's", "however",
  "i", "i'd", "i'll", "i'm", "i've", "ie", "if", "in", "inc", "indeed", "into", "is", "isn't", "it",
  "it's", "its", "itself", "just", "keep", "keeps", "kept", "last", "latter", "latterly", "least",
  "less", "let", "let's", "like", "likely", "ltd", "made", "make", "makes", "many", "may", "maybe",
  "me", "meanwhile", "might", "more", "moreover", "most", "mostly", "much", "must", "mustn't", "my",
  "myself", "name", "namely", "neither", "never", "nevertheless", "next", "no", "nobody", "none",
  "noone", "nor", "not", "nothing", "now", "nowhere", "of", "off", "often", "on", "once", "one",
  "ones", "only", "onto", "or", "other", "others", "otherwise", "ought", "our", "ours", "ourselves",
  "out", "over", "own", "per", "perhaps", "please", "put", "rather", "re", "same", "say", "saying",
  "says", "see", "seem", "seemed", "seeming", "seems", "several", "shall", "shan't", "she", "she'd",
  "she'll", "she's", "should", "shouldn't", "since", "so", "some", "somebody", "somehow", "someone",
  "something", "sometime", "sometimes", "somewhere", "still", "such", "than", "that", "that's", "the",
  "their", "theirs", "them", "themselves", "then", "thence", "there", "thereafter", "thereby", "therefore",
  "therein", "there's", "thereupon", "these", "they", "they'd", "they'll", "they're", "they've", "this",
  "those", "though", "through", "throughout", "thru", "thus", "to", "together", "too", "toward", "towards",
  "under", "until", "unto", "up", "upon", "us", "use", "used", "useful", "uses", "using", "usually",
  "value", "various", "very", "via", "viz", "vs", "want", "wants", "was", "wasn't", "way", "we", "we'd",
  "we'll", "we're", "we've", "well", "were", "weren't", "what", "what's", "whatever", "when", "when's",
  "whence", "whenever", "where", "where's", "whereafter", "whereas", "whereby", "wherein", "whereupon",
  "wherever", "whether", "which", "while", "whither", "who", "who's", "whoever", "whole", "whom",
  "whose", "why", "why's", "will", "with", "within", "without", "won't", "would", "wouldn't", "yes",
  "yet", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves",
]);

// Recognized 2-letter technical terms and acronyms that should be retained as valid keywords
const VALID_TWO_LETTER_TERMS = new Set<string>([
  "ai", "ui", "ux", "ip", "os", "db", "js", "ts", "go", "qa", "hr", "pr", "id", "ar", "vr", "ml", "io"
]);

/**
 * Escapes characters for regex usage.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Checks if a phrase exists in a text zone with word boundaries.
 */
function checkZonePresence(term: string, zoneText: string): boolean {
  if (!zoneText || !term) return false;
  const escaped = escapeRegex(term.toLowerCase());
  const regex = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, "i");
  return regex.test(zoneText);
}

/**
 * Normalizes text and breaks it into valid word tokens.
 * Strips numeric formatting, currency figures, and pure numbers so keywords
 * and n-grams represent meaningful natural language & technical terms.
 */
function tokenizeBlock(text: string): string[] {
  // 1. Remove currency symbols with amounts (e.g., $250,000.00, €50,000, £10.00)
  let cleaned = text.replace(/[$€£¥₹]\s*[\d,]+(?:\.\d+)?/g, " ");

  // 2. Remove formatted numbers with thousands separators / decimals (e.g., 250,000 or 050,000)
  cleaned = cleaned.replace(/\b\d{1,3}(?:[,\s]\d{3})+(?:\.\d+)?\b/g, " ");

  // 3. Remove standalone decimals or percentages (e.g., 12.50% or 0.00)
  cleaned = cleaned.replace(/\b\d+\.\d+%?\b/g, " ");

  // 4. Remove standalone pure zeros or leading-zero numbers (e.g., 00, 000, 050)
  cleaned = cleaned.replace(/\b0\d*\b/g, " ");

  // 5. Normalize accented characters, replace special characters and punctuation with space
  const normalized = cleaned
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return [];

  const rawWords = normalized.split(" ");
  const tokens: string[] = [];

  for (const raw of rawWords) {
    const word = raw.replace(/^-+|-+$/g, ""); // strip leading/trailing hyphens
    if (!word) continue;

    // Filter out stop words
    if (STOP_WORDS.has(word)) continue;

    // CRITICAL: An SEO keyword token MUST contain at least one alphabetic character (a-z).
    // Standalone numbers (e.g., 250, 000, 050, 00, 100) are data/quantities, not SEO keywords.
    // Alphanumeric technical terms (e.g., ipv6, web3, b2b, 4k, 3d, win11, oauth2) are preserved.
    if (!/[a-z]/i.test(word)) {
      continue;
    }

    // Filter out single-character tokens
    if (word.length < 2) continue;

    // Filter out 2-character tokens unless they are recognized technical acronyms
    if (word.length === 2 && !VALID_TWO_LETTER_TERMS.has(word)) continue;

    tokens.push(word);
  }

  return tokens;
}

/**
 * Extracts visible sentences/text blocks from HTML while stripping non-content noise.
 */
function extractCleanBlocks($: cheerio.CheerioAPI): string[] {
  // Strip non-content elements
  $("script, style, noscript, svg, iframe, nav, footer, noscript, header, symbol, canvas").remove();

  const blocks: string[] = [];

  // Traverse content-bearing elements
  $("body")
    .find("h1, h2, h3, h4, h5, h6, p, li, td, th, blockquote, dt, dd, span, div")
    .each((_, el) => {
      // If element contains block children, let children provide text to avoid duplications
      if ($(el).children("p, div, h1, h2, h3, h4, h5, h6, li").length > 0) {
        return;
      }

      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text.length > 0) {
        blocks.push(text);
      }
    });

  // If no structured blocks were found, fallback to full body text
  if (blocks.length === 0) {
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    if (bodyText) {
      blocks.push(bodyText);
    }
  }

  return blocks;
}

/**
 * Extracts keyword density metrics (1-gram, 2-gram, 3-gram) from raw HTML.
 */
export function extractKeywordMetrics(html: string): KeywordAnalysisResult {
  const $ = cheerio.load(html);

  // 1. Extract High-Weight SEO Zones before removing elements
  const titleZone = $("head > title, title").first().text().replace(/\s+/g, " ").trim();
  const h1Zone = $("h1")
    .map((_, el) => $(el).text())
    .get()
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const metaDescZone = (
    $('meta[name="description" i]').attr("content") ||
    $('meta[property="description" i]').attr("content") ||
    ""
  )
    .replace(/\s+/g, " ")
    .trim();

  // 2. Extract clean content blocks from body
  const blocks = extractCleanBlocks($);

  // 3. Tokenize blocks and count 1-grams, 2-grams, 3-grams
  const oneGramFreq = new Map<string, number>();
  const twoGramFreq = new Map<string, number>();
  const threeGramFreq = new Map<string, number>();

  let totalValidWords = 0;

  for (const block of blocks) {
    // Split block into sentence-level chunks so n-grams don't span sentence boundaries
    const sentences = block.split(/[.?!:;\n\r\t]+/);

    for (const sentence of sentences) {
      const tokens = tokenizeBlock(sentence);
      if (tokens.length === 0) continue;

      totalValidWords += tokens.length;

      // 1-Gram calculation
      for (let i = 0; i < tokens.length; i++) {
        const word = tokens[i];
        oneGramFreq.set(word, (oneGramFreq.get(word) || 0) + 1);

        // 2-Gram calculation
        if (i < tokens.length - 1) {
          const bigram = `${word} ${tokens[i + 1]}`;
          twoGramFreq.set(bigram, (twoGramFreq.get(bigram) || 0) + 1);
        }

        // 3-Gram calculation
        if (i < tokens.length - 2) {
          const trigram = `${word} ${tokens[i + 1]} ${tokens[i + 2]}`;
          threeGramFreq.set(trigram, (threeGramFreq.get(trigram) || 0) + 1);
        }
      }
    }
  }

  const denominator = Math.max(1, totalValidWords);

  // 4. Build top metric entries with prominence flags
  const formatMetrics = (
    map: Map<string, number>,
    limit: number,
    minCount = 1
  ): KeywordMetric[] => {
    return Array.from(map.entries())
      .filter(([term, count]) => {
        // Enforce safeguards: must meet frequency threshold and contain alphabetic characters
        if (count < minCount) return false;
        if (!/[a-z]/i.test(term)) return false;
        if (/^\d+(\s+\d+)*$/.test(term)) return false;
        return true;
      })
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([term, count]) => {
        const density = Number(((count / denominator) * 100).toFixed(2));
        return {
          term,
          count,
          density,
          inTitle: checkZonePresence(term, titleZone),
          inH1: checkZonePresence(term, h1Zone),
          inMetaDescription: checkZonePresence(term, metaDescZone),
        };
      });
  };

  const oneGrams = formatMetrics(oneGramFreq, 15, 1);
  const twoGrams = formatMetrics(twoGramFreq, 10, 1);
  const threeGrams = formatMetrics(threeGramFreq, 10, 1);

  return {
    totalWordCount: totalValidWords,
    uniqueWordCount: oneGramFreq.size,
    oneGrams,
    twoGrams,
    threeGrams,
  };
}
