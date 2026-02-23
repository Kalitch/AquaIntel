import React from "react";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Typography,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import WaterIcon from "@mui/icons-material/Water";
import PsychologyIcon from "@mui/icons-material/Psychology";
import BoltIcon from "@mui/icons-material/Bolt";
import VerifiedIcon from "@mui/icons-material/Verified";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import StorageIcon from "@mui/icons-material/Storage";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const Section = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Box sx={{ color: "primary.main" }}>{icon}</Box>
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {children}
    </CardContent>
  </Card>
);

const InlineCode = ({ children }: { children: React.ReactNode }) => (
  <Box
    component="span"
    sx={{
      fontFamily: "monospace",
      fontSize: "0.82em",
      bgcolor: "rgba(255,255,255,0.08)",
      px: 0.6,
      py: 0.2,
      borderRadius: 0.5,
    }}
  >
    {children}
  </Box>
);

const BulletList = ({ items }: { items: React.ReactNode[] }) => (
  <List dense disablePadding sx={{ mb: 1 }}>
    {items.map((item, i) => (
      <ListItem key={i} sx={{ alignItems: "flex-start", py: 0.25, px: 0 }}>
        <Box
          sx={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            bgcolor: "primary.main",
            mt: "8px",
            mr: 1.5,
            flexShrink: 0,
          }}
        />
        <ListItemText
          primary={item}
          primaryTypographyProps={{ variant: "body2", color: "text.primary" }}
        />
      </ListItem>
    ))}
  </List>
);

export function AboutPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        About This Platform
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={1}>
        Transparency, explainability, and real data — no black boxes.
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        mb={3}
        sx={{
          fontStyle: "italic",
          borderLeft: "3px solid",
          borderColor: "primary.main",
          pl: 2,
        }}
      >
        Every query has a cost. Every model has a thirst. Fresh water covers
        less than 3% of Earth's surface — yet AI infrastructure has quietly
        become one of its most water-intensive industries. This platform exists
        to make that connection visible.
      </Typography>

      {/* ── USGS Data Source ── */}
      <Section icon={<WaterIcon />} title="USGS Data Source">
        <Typography variant="body2" paragraph>
          All water measurements come from the U.S. Geological Survey (USGS)
          Water Data API — a federal service providing real-time and historical
          hydrological data for thousands of monitoring stations across the
          United States.
        </Typography>
        <Typography variant="body2" paragraph>
          The API endpoint used is the OGC-compliant interface at{" "}
          <InlineCode>api.waterdata.usgs.gov/ogcapi/v0</InlineCode>. No data is
          mocked or simulated. Each query returns real measurements from
          physical stream gauges and monitoring sites. Stations are pre-filtered
          to only show those with active streamflow data (parameter code 00060 —
          mean daily discharge) in the last 30 days.
        </Typography>
        <Typography variant="body2" paragraph>
          Station IDs follow the USGS format (e.g.{" "}
          <InlineCode>USGS-01646500</InlineCode>). The platform normalises these
          automatically — you can enter bare numeric IDs and the system will
          resolve them correctly against the API.
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip label="Real-time data" size="small" color="primary" />
          <Chip label="Federal open data" size="small" color="primary" />
          <Chip label="No mock data" size="small" color="success" />
          <Chip
            label="Pre-filtered for active stations"
            size="small"
            color="success"
          />
        </Box>
      </Section>

      {/* ── Deterministic Intelligence Engine ── */}
      <Section
        icon={<PsychologyIcon />}
        title="Deterministic Intelligence Engine"
      >
        <Typography variant="body2" paragraph>
          The core analytics engine is fully deterministic — there are no neural
          networks, no probabilistic black boxes, and every result is
          reproducible from the raw data alone. All calculations run server-side
          in NestJS and are never delegated to the frontend or to an external AI
          service.
        </Typography>
        <Typography variant="body2" gutterBottom>
          The engine computes the following for every station query:
        </Typography>
        <BulletList
          items={[
            <>
              <Box component="span" sx={{ fontWeight: 700 }}>
                7-day moving average:
              </Box>{" "}
              arithmetic mean of the last 7 daily values. If fewer than 7
              readings exist, all available values are used.
            </>,
            <>
              <Box component="span" sx={{ fontWeight: 700 }}>
                30-day moving average:
              </Box>{" "}
              arithmetic mean of the last 30 daily values, used to surface
              longer-term trends.
            </>,
            <>
              <Box component="span" sx={{ fontWeight: 700 }}>
                Volatility index:
              </Box>{" "}
              coefficient of variation (stdDev / mean), capped at 2.0. Values
              above 0.5 indicate high hydrological instability.
            </>,
            <>
              <Box component="span" sx={{ fontWeight: 700 }}>
                Anomaly detection (rule-based):
              </Box>{" "}
              if today &gt; MA7 × 1.5 → moderate anomaly; if today &gt; MA7 ×
              2.0 → severe anomaly. Anomalies are also tagged per-day across the
              full 90-day series shown in the Historical view.
            </>,
          ]}
        />
        <Alert severity="success" sx={{ mt: 1 }}>
          Every number on this platform can be traced back to a specific formula
          applied to a specific USGS reading. There is no inference you cannot
          verify yourself.
        </Alert>
      </Section>

      {/* ── Sustainability Score ── */}
      <Section icon={<BoltIcon />} title="Sustainability Score Logic">
        <Typography variant="body2" paragraph>
          The sustainability score (0–100) reflects the hydrological stability
          of a station at the moment of query. It starts at 100 and deductions
          are applied based on conditions detected by the intelligence engine:
        </Typography>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
            mb: 2,
          }}
        >
          <Box component="thead">
            <Box component="tr">
              <Box
                component="th"
                sx={{ textAlign: "left", p: "4px 8px", opacity: 0.7 }}
              >
                Condition
              </Box>
              <Box
                component="th"
                sx={{ textAlign: "right", p: "4px 8px", opacity: 0.7 }}
              >
                Deduction
              </Box>
            </Box>
          </Box>
          <Box component="tbody">
            {[
              ["High volatility (index > 0.5)", "−20"],
              ["Severe anomaly detected", "−30"],
              ["Moderate anomaly detected", "−15"],
              ["Flow below 10th percentile of recent series", "−15"],
            ].map(([condition, deduction]) => (
              <Box component="tr" key={condition}>
                <Box
                  component="td"
                  sx={{
                    p: "6px 8px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {condition}
                </Box>
                <Box
                  component="td"
                  sx={{
                    p: "6px 8px",
                    textAlign: "right",
                    color: "#ef5350",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    fontWeight: 700,
                  }}
                >
                  {deduction}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Score bands: 80–100 = Excellent · 60–79 = Moderate · 40–59 =
          Concerning · 0–39 = Critical
        </Typography>
      </Section>

      {/* ── AI Sustainability Equivalents ── */}
      <Section icon={<VerifiedIcon />} title="AI Sustainability Equivalents">
        <Typography variant="body2" paragraph>
          The AI impact module converts real streamflow into meaningful
          sustainability equivalents using a transparent, deterministic
          pipeline. No external AI APIs are involved in this calculation — it is
          pure arithmetic applied to configurable constants.
        </Typography>
        <Typography variant="body2" paragraph>
          Conversion pipeline:{" "}
          <InlineCode>
            ft³/s → liters/hour → kWh equivalent → AI operations
          </InlineCode>
        </Typography>
        <BulletList
          items={[
            <>
              <Box component="span" sx={{ fontWeight: 700 }}>
                Water per kWh:
              </Box>{" "}
              1.8 L/kWh — average water consumed for data center cooling
              (industry average; varies significantly by facility and climate)
            </>,
            <>
              <Box component="span" sx={{ fontWeight: 700 }}>
                kWh per AI inference:
              </Box>{" "}
              0.001 kWh — estimated energy per large-model inference request
              (varies by model size and hardware)
            </>,
            <>
              <Box component="span" sx={{ fontWeight: 700 }}>
                kWh per GPU training hour:
              </Box>{" "}
              1.2 kWh — A100-class GPU at approximately 80% utilisation
            </>,
          ]}
        />
        <Alert severity="info" sx={{ mt: 1 }}>
          All three constants are configurable via environment variables (
          <InlineCode>WATER_PER_KWH</InlineCode>,{" "}
          <InlineCode>KWH_PER_AI_INFERENCE</InlineCode>,{" "}
          <InlineCode>KWH_PER_GPU_TRAINING_HOUR</InlineCode>). Estimates are
          derived from published research including Uptime Institute, Lawrence
          Berkeley National Laboratory, and NRDC reports.
        </Alert>
      </Section>

      {/* ── LLM Narrative Analysis ── */}
      <Section icon={<AutoAwesomeIcon />} title="LLM Narrative Analysis">
        <Typography variant="body2" paragraph>
          The Intelligence page includes an optional AI narrative feature that
          generates plain-English interpretations of the current station's
          analytics. This is intentionally opt-in — it never fires automatically
          — and the LLM is never in the critical path. If it is unavailable, all
          other platform features continue working normally.
        </Typography>
        <Typography variant="body2" paragraph>
          The LLM receives the fully computed analytics payload (numbers already
          calculated by the deterministic engine) and is instructed only to
          narrate them — never to invent, estimate, or replace any figure.
          Temperature is fixed at 0.3 across all providers to keep outputs
          factual and consistent.
        </Typography>
        <Typography variant="body2" gutterBottom>
          Three providers are supported, switchable via a single environment
          variable with zero code changes:
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
          {[
            {
              label: "LM Studio (Local)",
              color: "#80cbc4",
              description:
                "Runs mistral-7b-instruct-v0.3 (or any compatible model) entirely on your machine. Free, private, no data leaves your network. Requires LM Studio with the Local Server running.",
            },
            {
              label: "OpenAI",
              color: "#74aa9c",
              description:
                "Uses the OpenAI API with your own key. Default model: gpt-4o-mini. Set LLM_PROVIDER=openai and OPENAI_API_KEY in your .env.",
            },
            {
              label: "Anthropic",
              color: "#ce93d8",
              description:
                "Uses the Anthropic API with your own key. Default model: claude-3-haiku-20240307. Set LLM_PROVIDER=anthropic and ANTHROPIC_API_KEY in your .env.",
            },
          ].map((p) => (
            <Box
              key={p.label}
              sx={{
                p: 1.5,
                borderRadius: 1,
                border: "1px solid",
                borderColor: `${p.color}44`,
                bgcolor: `${p.color}0d`,
              }}
            >
              <Chip
                label={p.label}
                size="small"
                sx={{
                  bgcolor: `${p.color}22`,
                  color: p.color,
                  fontWeight: 700,
                  mb: 0.5,
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                {p.description}
              </Typography>
            </Box>
          ))}
        </Box>
        <Alert severity="warning" icon={<WarningAmberIcon />}>
          The narrative is clearly labelled with the provider and model that
          generated it. It should be treated as interpretive context, not
          authoritative analysis. Always refer to the deterministic analytics
          values for decisions.
        </Alert>
      </Section>

      {/* ── Datacenter Hub Context ── */}
      <Section icon={<StorageIcon />} title="Datacenter Hub Estimates">
        <Typography variant="body2" paragraph>
          The Dashboard displays estimated water usage, AI inference capacity,
          and power capacity for the five largest U.S. AI datacenter hubs. These
          figures are industry estimates derived from Uptime Institute, Lawrence
          Berkeley National Laboratory, and NRDC public reports — they are not
          metered data.
        </Typography>
        <Typography variant="body2" gutterBottom>
          The five hubs covered:
        </Typography>
        <BulletList
          items={[
            <>
              <Box component="span" sx={{ fontWeight: 700 }}>
                Northern Virginia (Ashburn):
              </Box>{" "}
              ~70% of world internet traffic, ~3,200 MW installed capacity
            </>,
            <>
              <Box component="span" sx={{ fontWeight: 700 }}>
                Dallas / Fort Worth:
              </Box>{" "}
              Rapidly expanding AI infrastructure hub with major cloud
              investments
            </>,
            <>
              <Box component="span" sx={{ fontWeight: 700 }}>
                Phoenix, Arizona:
              </Box>{" "}
              Low natural disaster risk and high solar energy adoption potential
            </>,
            <>
              <Box component="span" sx={{ fontWeight: 700 }}>
                Silicon Valley / Bay Area:
              </Box>{" "}
              Founding hub for tech giants and AI research organisations
            </>,
            <>
              <Box component="span" sx={{ fontWeight: 700 }}>
                Columbus, Ohio:
              </Box>{" "}
              Fastest-growing Midwest cloud and AI infrastructure market
            </>,
          ]}
        />
        <Alert severity="info">
          These are contextual estimates to illustrate the scale of AI water
          consumption relative to natural water systems — not verified
          operational figures. Actual datacenter water usage is rarely disclosed
          publicly.
        </Alert>
      </Section>
    </Box>
  );
}
