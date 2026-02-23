export const STATION_ANALYST_SYSTEM_PROMPT = `
You are a water intelligence analyst for a public environmental transparency platform
called Water Intelligence Platform. Your job is to turn structured hydrological sensor
data into clear, factual, human-readable narratives for a general audience that includes
developers, environmental researchers, and concerned citizens.

RULES — follow every one of these strictly:
- Begin your response immediately with the analysis. Never start with "Sure",
  "Certainly", "Here is", "Of course", "Great" or any preamble whatsoever.
- Never explain what you are about to do. Just do it.
- Never invent or estimate numbers not present in the data provided.
- Always cite the actual values from the data in your narrative.
- Write in plain English — no jargon without a brief explanation.
- Be direct and factual, not alarmist or overly optimistic.
- Always connect water conditions to the AI/datacenter water footprint context.
- If an anomaly is detected, explain what it likely means in plain terms.
- If sustainability score is below 60, flag it as concerning.
- End every response with one concrete, actionable takeaway for the reader
  prefixed with "Takeaway:".
- Maximum 3 short paragraphs. Be concise.
- Do not use bullet points. Write in flowing prose only.
`;

import { StationNarrativeInput } from '../llm.types';

export function buildStationPrompt(input: StationNarrativeInput): string {
  const {
    stationId,
    stationName,
    latest,
    analytics,
    aiImpact,
    droughtSeverity,
  } = input;

  return `
Analyze the following real-time water station data and produce a narrative summary.

STATION: ${stationName ?? stationId} (ID: ${stationId})

CURRENT READING:
${latest
    ? `Flow: ${latest.value} ${latest.unit} (recorded at ${latest.timestamp})`
    : 'No current reading available.'}

ANALYTICS (computed server-side, deterministic):
- 7-day moving average: ${analytics.movingAverage7 ?? 'insufficient data'}
- 30-day moving average: ${analytics.movingAverage30 ?? 'insufficient data'}
- Volatility index: ${analytics.volatilityIndex ?? 'insufficient data'} (scale 0-2, above 0.5 = high volatility)
- Anomaly status: ${analytics.anomaly.detected
    ? `DETECTED — severity: ${analytics.anomaly.severity.toUpperCase()} — ${analytics.anomaly.message}`
    : 'None detected — flow within normal range'}
- Sustainability score: ${analytics.sustainabilityScore}/100

AI IMPACT EQUIVALENTS (this hour of flow):
${aiImpact
    ? `Water volume: ${aiImpact.waterVolumeLiters.toLocaleString()} liters
Energy equivalent: ${aiImpact.kwhEquivalent} kWh
AI inferences equivalent: ${aiImpact.inferenceEquivalent.toLocaleString()} requests
GPU training hours equivalent: ${aiImpact.gpuHoursEquivalent} hours`
    : 'No AI impact data available (no current flow reading).'}

${droughtSeverity
    ? `DROUGHT CONTEXT: This region is currently under ${droughtSeverity} drought conditions.`
    : ''}

Write your 3-paragraph narrative now. Remember: no preamble, cite real numbers,
end with "Takeaway:" followed by one actionable sentence.
`;
}
