import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Chip,
  IconButton,
  CircularProgress,
  Typography,
  Alert,
} from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkRemoveIcon from "@mui/icons-material/BookmarkRemove";
import WarningIcon from "@mui/icons-material/Warning";
import { useWatchlist } from "../../hooks/useWatchlist";
import { apiClient } from "../../config/api";
import { IntelligenceResponse } from "../../types/api.types";
import { DroughtBadge } from "../shared/DroughtBadge";

function scoreToColor(score: number): string {
  if (score >= 80) return "#66bb6a";
  if (score >= 60) return "#29b6f6";
  if (score >= 40) return "#ffa726";
  return "#c62828";
}

export function WatchlistPanel() {
  const { watched, removeStation } = useWatchlist();
  const [stationData, setStationData] = useState<
    Record<
      string,
      { data?: IntelligenceResponse; loading: boolean; error?: string }
    >
  >({});
  //const { get } = useApi();
  const get = useCallback(
    <T,>(url: string) => apiClient.get<T>(url).then((r) => r.data),
    [],
  );
  // Fetch intelligence data for each watched station on mount
  useEffect(() => {
    const fetchStationData = async () => {
      const newData: typeof stationData = {};

      for (const station of watched) {
        newData[station.id] = { loading: true };

        try {
          const response = await get<IntelligenceResponse>(
            `/intelligence?stationId=${station.id}`,
          );
          newData[station.id] = { data: response, loading: false };
        } catch (err) {
          newData[station.id] = {
            loading: false,
            error: (err as Error).message || "Failed to load",
          };
        }
      }

      setStationData(newData);
    };

    if (watched.length > 0) {
      fetchStationData();
    } else {
      setStationData({});
    }
  }, [watched, get]);

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        avatar={<BookmarkIcon />}
        title="Watched Stations"
        titleTypographyProps={{ variant: "h6" }}
      />
      <CardContent>
        {watched.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No stations watched yet. Click the bookmark icon on any station to
            watch it.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {watched.map((station) => {
              const item = stationData[station.id];
              const data = item?.data;
              const loading = item?.loading;
              const error = item?.error;

              return (
                <Box
                  key={station.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.5,
                    backgroundColor: "rgba(41, 182, 246, 0.05)",
                    borderRadius: 1,
                  }}
                >
                  {/* Station name and ID */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2">{station.name}</Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {station.id}
                    </Typography>
                  </Box>

                  {/* Loading spinner */}
                  {loading && <CircularProgress size={20} />}

                  {/* Error icon */}
                  {error && !loading && (
                    <WarningIcon sx={{ color: "#c62828", fontSize: 20 }} />
                  )}

                  {/* Metrics if data loaded */}
                  {data && !loading && (
                    <Box
                      sx={{ display: "flex", gap: 0.5, alignItems: "center" }}
                    >
                      {/* Sustainability score */}
                      <Chip
                        label={`${Math.round(data.analytics.sustainabilityScore)}%`}
                        size="small"
                        sx={{
                          backgroundColor: scoreToColor(
                            data.analytics.sustainabilityScore,
                          ),
                          color: "white",
                        }}
                      />

                      {/* Anomaly indicator */}
                      {data.analytics.anomaly.detected && (
                        <Chip
                          label={data.analytics.anomaly.severity}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor:
                              data.analytics.anomaly.severity === "severe"
                                ? "#c62828"
                                : "#ffa726",
                            color:
                              data.analytics.anomaly.severity === "severe"
                                ? "#c62828"
                                : "#ffa726",
                          }}
                        />
                      )}

                      {/* Drought badge */}
                      <DroughtBadge drought={data.droughtStatus} />
                    </Box>
                  )}

                  {/* Remove button */}
                  <IconButton
                    size="small"
                    onClick={() => removeStation(station.id)}
                    sx={{ color: "action.active" }}
                  >
                    <BookmarkRemoveIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
