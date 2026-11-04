import { ImageSeoData } from "./image-seo"

export interface ScoreItem {
  id: string
  label: string
  status: "green" | "yellow" | "red"
  score: number
  maxScore: number
  message: string
  fixSuggestion?: string
}

export interface ScoreResult {
  totalScore: number
  checklist: ScoreItem[]
  grade: "A+" | "A" | "B" | "C" | "Needs Work"
}

export function calculateImageSeoScore(data: Partial<ImageSeoData>): ScoreResult {
  const checklist: ScoreItem[] = []

  // 1. Alt Text Assessment (Max 25 pts)
  if (data.isDecorative) {
    checklist.push({
      id: "alt_text",
      label: "Alt Text (Decorative)",
      status: "green",
      score: 25,
      maxScore: 25,
      message: 'Marked as decorative (alt="" correctly output for accessibility screen-readers).',
    })
  } else if (!data.alt || data.alt.trim().length === 0) {
    checklist.push({
      id: "alt_text",
      label: "Alt Text",
      status: "red",
      score: 0,
      maxScore: 25,
      message: "Missing alt text. Crucial for Google Image search and accessibility.",
      fixSuggestion: "Add descriptive alt text between 20 and 125 characters summarizing the visual contents.",
    })
  } else {
    const len = data.alt.trim().length
    // Keyword stuffing check
    const words = data.alt.toLowerCase().split(/\s+/)
    const wordCounts = new Map<string, number>()
    let maxRepeated = 0
    for (const w of words) {
      if (w.length > 3) {
        const count = (wordCounts.get(w) || 0) + 1
        wordCounts.set(w, count)
        if (count > maxRepeated) maxRepeated = count
      }
    }

    if (maxRepeated > 3) {
      checklist.push({
        id: "alt_text",
        label: "Alt Text (Keyword Stuffing)",
        status: "yellow",
        score: 12,
        maxScore: 25,
        message: "Repeated words detected in alt text. Avoid keyword stuffing.",
        fixSuggestion: "Use natural phrasing without repeating the same word more than twice.",
      })
    } else if (len > 125) {
      checklist.push({
        id: "alt_text",
        label: "Alt Text Length",
        status: "yellow",
        score: 18,
        maxScore: 25,
        message: `Alt text is ${len} chars (recommended under 125 chars for screen-readers).`,
        fixSuggestion: "Trim alt text down to under 125 characters focusing on the key visual subject.",
      })
    } else if (len < 15) {
      checklist.push({
        id: "alt_text",
        label: "Alt Text Length",
        status: "yellow",
        score: 15,
        maxScore: 25,
        message: `Alt text is quite brief (${len} chars). Add more descriptive architectural context.`,
        fixSuggestion: "Describe what is shown in the image (e.g. materials, orientation, room layout).",
      })
    } else {
      checklist.push({
        id: "alt_text",
        label: "Alt Text",
        status: "green",
        score: 25,
        maxScore: 25,
        message: `Excellent alt text (${len} chars, natural phrasing).`,
      })
    }
  }

  // 2. SEO File Name (Max 15 pts)
  const fileName = data.seoFileName || (data.url ? data.url.split("/").pop() || "" : "")
  const isGeneric = /^(img|image|photo|pic|screenshot|dsc|upload|estate)[\-_0-9.]+/i.test(fileName)
  if (!fileName || isGeneric) {
    checklist.push({
      id: "file_name",
      label: "SEO File Name",
      status: "yellow",
      score: 6,
      maxScore: 15,
      message: `File name "${fileName}" is generic or timestamped.`,
      fixSuggestion: "Rename to lowercase hyphenated words matching property & room (e.g. royal-seafront-master-suite.webp).",
    })
  } else if (!/^[a-z0-9\-]+\.[a-z0-9]+$/i.test(fileName)) {
    checklist.push({
      id: "file_name",
      label: "SEO File Name Formatting",
      status: "yellow",
      score: 10,
      maxScore: 15,
      message: "File name contains uppercase or special characters.",
      fixSuggestion: "Use lowercase-with-hyphens only.",
    })
  } else {
    checklist.push({
      id: "file_name",
      label: "SEO File Name",
      status: "green",
      score: 15,
      maxScore: 15,
      message: `Descriptive, clean file name: ${fileName}`,
    })
  }

  // 3. AI Description for AEO / GEO (Max 15 pts)
  if (!data.aiDescription || data.aiDescription.trim().length < 20) {
    checklist.push({
      id: "ai_description",
      label: "AEO / GEO Description",
      status: "red",
      score: 0,
      maxScore: 15,
      message: "Missing AI contextual description for Perplexity, ChatGPT & Google AI Overviews.",
      fixSuggestion: "Provide 1-2 plain sentences explaining what this image proves or illustrates on the page.",
    })
  } else {
    checklist.push({
      id: "ai_description",
      label: "AEO / GEO Description",
      status: "green",
      score: 15,
      maxScore: 15,
      message: "Rich AI description available for generative citation engines.",
    })
  }

  // 4. Entities & Knowledge Graph (Max 10 pts)
  const hasEntities = data.entities && (data.entities.brand || data.entities.product || data.entities.place)
  if (!hasEntities) {
    checklist.push({
      id: "entities",
      label: "Entity Linking",
      status: "yellow",
      score: 4,
      maxScore: 10,
      message: "No brand, product, or place entities attached to this visual asset.",
      fixSuggestion: "Specify the Brand, Estate Title, and City to anchor in search entity graphs.",
    })
  } else {
    checklist.push({
      id: "entities",
      label: "Entity Linking",
      status: "green",
      score: 10,
      maxScore: 10,
      message: "Entities clearly specified for schema Knowledge Graph integration.",
    })
  }

  // 5. Image Format & Compression (Max 15 pts)
  const format = (data.format || (data.url?.split(".").pop() || "")).toLowerCase()
  const isModern = format === "webp" || format === "avif"
  const size = data.fileSizeBytes || 150000

  if (!isModern) {
    checklist.push({
      id: "format",
      label: "Modern Image Format",
      status: "yellow",
      score: 7,
      maxScore: 15,
      message: `Image is in older format (.${format}). WebP or AVIF recommended for Core Web Vitals.`,
      fixSuggestion: "Convert to WebP or AVIF to save 40-70% bandwidth.",
    })
  } else if (size > 400 * 1024) {
    checklist.push({
      id: "format",
      label: "Image File Size",
      status: "yellow",
      score: 9,
      maxScore: 15,
      message: `File size (${(size / 1024).toFixed(0)} KB) exceeds 400 KB target.`,
      fixSuggestion: "Compress using client optimizer to maintain <250 KB without visual loss.",
    })
  } else {
    checklist.push({
      id: "format",
      label: "Format & Compression",
      status: "green",
      score: 15,
      maxScore: 15,
      message: `Lightweight modern format (${format.toUpperCase()}, ${(size / 1024).toFixed(0)} KB).`,
    })
  }

  // 6. Transcript for Charts / Infographics / Screenshots (Max 10 pts)
  const needsTranscript = ["infographic", "chart", "diagram", "screenshot"].includes(data.imageType || "")
  if (needsTranscript) {
    if (!data.transcript || data.transcript.trim().length < 10) {
      checklist.push({
        id: "transcript",
        label: "Visual Text Transcript",
        status: "red",
        score: 0,
        maxScore: 10,
        message: `Image type is "${data.imageType}" but no text transcript was provided.`,
        fixSuggestion: "Transcribe data points, text, and labels so search crawlers can index the facts.",
      })
    } else {
      checklist.push({
        id: "transcript",
        label: "Visual Text Transcript",
        status: "green",
        score: 10,
        maxScore: 10,
        message: "Visible transcript present for indexation.",
      })
    }
  } else {
    checklist.push({
      id: "transcript",
      label: "Visual Transcript",
      status: "green",
      score: 10,
      maxScore: 10,
      message: "Standard photographic asset; raw transcript not mandatory.",
    })
  }

  // 7. Creator / Credit / Copyright (Max 10 pts)
  if (!data.creator && !data.credit && !data.copyright) {
    checklist.push({
      id: "copyright",
      label: "Authorship & Rights",
      status: "yellow",
      score: 4,
      maxScore: 10,
      message: "Missing creator, credit, or copyright notices in schema.",
      fixSuggestion: "Specify the photographer or brokerage credit to support Google Image Licensable badge.",
    })
  } else {
    checklist.push({
      id: "copyright",
      label: "Authorship & Rights",
      status: "green",
      score: 10,
      maxScore: 10,
      message: "Creator and copyright metadata properly assigned.",
    })
  }

  const totalScore = checklist.reduce((sum, item) => sum + item.score, 0)

  let grade: ScoreResult["grade"] = "Needs Work"
  if (totalScore >= 92) grade = "A+"
  else if (totalScore >= 80) grade = "A"
  else if (totalScore >= 65) grade = "B"
  else if (totalScore >= 50) grade = "C"

  return {
    totalScore,
    checklist,
    grade,
  }
}

