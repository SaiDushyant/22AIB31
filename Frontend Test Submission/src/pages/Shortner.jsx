import React, { useMemo, useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  TextField,
  Stack,
  Button,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Link as MuiLink,
  Chip,
  Tooltip,
  Box,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

function isValidHttpUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

const ResultCard = ({ shortLink, expire, onReset }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortLink);
      setCopied(true);
    } catch (e) {
      setCopied(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Short URL created 🎉</Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems="center"
        >
          <TextField
            label="Short Link"
            value={shortLink}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <Tooltip title={"Copy to clipboard"}>
            <IconButton onClick={handleCopy} aria-label="copy short link">
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={"Open in new tab"}>
            <IconButton
              component={"a"}
              href={shortLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="open short link"
            >
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2">Expires (UTC):</Typography>
          <Chip label={expire} variant="outlined" />
        </Stack>
        <Box>
          <Button
            startIcon={<RestartAltIcon />}
            variant="text"
            onClick={onReset}
          >
            Create another
          </Button>
        </Box>
        <Snackbar
          open={copied}
          autoHideDuration={2000}
          onClose={() => setCopied(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity="success" onClose={() => setCopied(false)}>
            Copied to clipboard
          </Alert>
        </Snackbar>
      </Stack>
    </Paper>
  );
};

export default function Shortener() {
  const [url, setUrl] = useState("");
  const [validity, setValidity] = useState(30); // minutes
  const [prefix, setPrefix] = useState("go-");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Persist basic form state locally so a refresh doesn't clear inputs
  useEffect(() => {
    const saved = localStorage.getItem("url-form");
    if (saved) {
      try {
        const { url, validity, prefix } = JSON.parse(saved);
        if (url) setUrl(url);
        if (validity) setValidity(validity);
        if (prefix) setPrefix(prefix);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("url-form", JSON.stringify({ url, validity, prefix }));
  }, [url, validity, prefix]);

  const urlError = useMemo(() => {
    if (!url) return "Enter a URL";
    if (!isValidHttpUrl(url)) return "Must be a valid http/https URL";
    return "";
  }, [url]);

  const validityError = useMemo(() => {
    if (validity === "" || validity === null) return "Enter minutes";
    const n = Number(validity);
    if (!Number.isFinite(n) || n <= 0) return "Minutes must be > 0";
    if (n > 60 * 24 * 30) return "Too long (max ~30 days)";
    return "";
  }, [validity]);

  const prefixError = useMemo(() => {
    if (!prefix) return "Enter a prefix";
    if (!/^[a-zA-Z0-9-_]+$/.test(prefix))
      return "Only letters, numbers, - and _";
    if (prefix.length > 20) return "Keep it under 20 chars";
    return "";
  }, [prefix]);

  const disabled = !!(urlError || validityError || prefixError);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/shorturls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          validity: Number(validity),
          shortcode: prefix,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create short URL");
      }

      // Expecting: { shortLink: string, expire: string }
      setResult({ shortLink: data.shortLink, expire: data.expire });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
  };

  return (
    <Box
      sx={{ minHeight: "100vh", bgcolor: (t) => t.palette.background.default }}
    >
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            URL Shortener
          </Typography>
          <Box sx={{ flex: 1 }} />
          <MuiLink
            href="https://mui.com/"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            color="inherit"
          >
            Built with Material UI
          </MuiLink>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper elevation={4} sx={{ p: 4, borderRadius: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight={700}>
            Create a short link
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Enter your long URL, set validity in minutes, and optionally choose
            a prefix for the shortcode. We'll keep generating until it's unique.
          </Typography>

          <Divider sx={{ my: 2 }} />

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                label="Long URL"
                placeholder="https://example.com/very/long/path?with=query"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                error={!!urlError}
                helperText={urlError || ""}
                fullWidth
                required
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Validity (minutes)"
                  type="number"
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                  error={!!validityError}
                  helperText={validityError || ""}
                  inputProps={{ min: 1 }}
                  required
                  fullWidth
                />

                <TextField
                  label="Shortcode prefix"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  error={!!prefixError}
                  helperText={prefixError || ""}
                  fullWidth
                  required
                />
              </Stack>

              <Box>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={disabled || loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? "Creating..." : "Create short URL"}
                </Button>
              </Box>

              {error && (
                <Alert severity="error" onClose={() => setError("")}>
                  {error}
                </Alert>
              )}

              {result && (
                <ResultCard
                  shortLink={result.shortLink}
                  expire={result.expire}
                  onReset={resetForm}
                />
              )}
            </Stack>
          </form>
        </Paper>

        <Typography
          variant="caption"
          display="block"
          color="text.secondary"
          sx={{ mt: 2 }}
        >
          API: POST {API_BASE}/shorturls → expects{" "}
          {{ url, validity, shortcode }}; returns {{ shortLink, expire }}
        </Typography>
      </Container>
    </Box>
  );
}
