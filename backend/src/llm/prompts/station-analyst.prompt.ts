import { StationNarrativeInput } from "../llm.types";

export const STATION_ANALYST_SYSTEM_PROMPT = `
You are a water intelligence analyst for AquaIntel, a public environmental
transparency platform. Your job is to write compelling, human narratives from
hydrological sensor data for developers, environmental researchers, and concerned citizens.

RULES — follow every one strictly:
- Begin immediately with the narrative. No labels, no "Analysis:", no preamble whatsoever.
- Never explain what you are about to do. Just write.
- Never invent numbers not in the data. Cite actual values.
- Write in flowing prose — no bullet points, no headers, no labels of any kind.
- Paragraph 1: Current conditions and what they mean in plain terms.
- Paragraph 2: Historical context — how today compares to the long-term record.
  Connect this to the AI/datacenter water footprint. Make the connection concrete.
- Paragraph 3: Trend and outlook — what the moving averages and volatility suggest.
  If sustainability score is below 60, flag it as concerning.
- End with exactly one sentence starting with "Takeaway:" — one specific,
  actionable thing the reader can do or watch.
- Maximum 3 paragraphs. Be direct. Be human. Not alarmist, not cheerful.
`;

export function buildStationPrompt(input: StationNarrativeInput): string {
  const {
    stationId,
    stationName,
    latest,
    analytics,
    aiImpact,
    droughtSeverity,
    enrichment,
  } = input;

  // Percentile context block — only if data available
  const percentileBlock = enrichment?.percentileInterpretation
    ? `HISTORICAL CONTEXT (vs ${enrichment.recordYears ?? "unknown"} years of records):
- Current percentile: ${enrichment.currentPercentile ?? "unknown"}th percentile
- Interpretation: ${enrichment.percentileInterpretation}
- Reference points: P10=${enrichment.p10 ?? "N/A"}, P50 (median)=${enrichment.p50 ?? "N/A"}, P90=${enrichment.p90 ?? "N/A"}`
    : "";

  // Station status block — only shown for inactive/decommissioned stations
  const statusBlock =
    enrichment && !enrichment.stationActive && enrichment.stationStatusMessage
      ? `STATION STATUS WARNING: ${enrichment.stationStatusMessage}`
      : "";

  return `
STATION: ${stationName ?? stationId} (ID: ${stationId})

CURRENT READING:
${
  latest
    ? `Flow: ${latest.value} ${latest.unit} (recorded at ${latest.timestamp})`
    : "No current reading available."
}

ANALYTICS (computed server-side, deterministic):
- 7-day moving average: ${analytics.movingAverage7 ?? "insufficient data"}
- 30-day moving average: ${analytics.movingAverage30 ?? "insufficient data"}
- Volatility index: ${analytics.volatilityIndex ?? "insufficient data"} (scale 0-2, above 0.5 = high volatility)
- Anomaly status: ${
    analytics.anomaly.detected
      ? `DETECTED — severity: ${analytics.anomaly.severity.toUpperCase()} — ${analytics.anomaly.message}`
      : "None detected — flow within normal range"
  }
- Sustainability score: ${analytics.sustainabilityScore}/100

${percentileBlock}

AI IMPACT EQUIVALENTS (this hour of flow):
${
  aiImpact
    ? `Water volume: ${aiImpact.waterVolumeLiters.toLocaleString()} liters
Energy equivalent: ${aiImpact.kwhEquivalent} kWh
AI inferences equivalent: ${aiImpact.inferenceEquivalent.toLocaleString()} requests
GPU training hours equivalent: ${aiImpact.gpuHoursEquivalent} hours`
    : "No AI impact data available (no current flow reading)."
}

${
  droughtSeverity
    ? `DROUGHT CONTEXT: This region is currently under ${droughtSeverity} drought conditions.`
    : ""
}

${statusBlock}

Write 3 paragraphs of flowing prose now. Start directly with the first sentence
about current conditions — no label, no "Analysis:", no introduction of any kind.
Paragraph 1: current conditions and plain-English meaning.
Paragraph 2: historical percentile context connected to the AI water footprint — make it concrete.
Paragraph 3: trend from moving averages and volatility, with outlook.
End with "Takeaway:" on its own line followed by exactly one actionable sentence.
`.trim();
}
