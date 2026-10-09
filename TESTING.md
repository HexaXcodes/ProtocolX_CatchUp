# Integration test record — 9 October 2026

The supplied Stitch export is integrated into the local app. Design samples and fabricated metrics are not production data. Screenshots are in `test-artifacts/` and original design references are excluded from Git.

## Verified

- Production TypeScript/Vite build passes. The lazily loaded WebLLM runtime is large; Vite reports a bundle-size warning.
- All 17 automated core tests pass: export parsing, multiline/iOS timestamps, ambiguous and invalid dates, size/message limits, role ranking, time selection, source/quote validation, cancellation and citation-repair retry.
- Browser file chooser imported the labelled synthetic `.txt` fixture and parsed five messages / three participants.
- Browser checks: ambiguous-date prompt, extractive results, role-sensitive ranking, source expansion and source highlighting, safe text rendering of an HTML-like message, profile opt-in persistence and forgetting, plain-text time controls, clear-session removal, and model-load cancellation.
- Desktop and mobile layouts inspected; tested import/privacy pages had no horizontal document overflow at the tested widths.
- Metadata service: GET /health returned 200; POST /summarize returned 404.
- Real WebGPU inference ran with the 1.5B model. A two-message case produced a valid brief, but a timestamped case showed inconsistent deadline attribution. The validator rejected the unsupported citation. This is a smoke test, not an accuracy benchmark.
- The 3B model loaded and returned a non-empty, schema-valid action with a known source ID on the timestamped synthetic case. This confirms an inference path, not general semantic accuracy; its urgency explanation still deserves human review.

## Remaining

- Verify the default Qwen2.5 3B model on the actual demo conversation. Its catalog estimates about 2.5 GB of VRAM and its initial download is substantial.
- A consented real WhatsApp export has not been supplied. Synthetic fixtures do not prove locale/device compatibility or production accuracy.
- Deployment-domain CSP, captured network-request inspection and offline inference have not been verified. No deployment or security certification is claimed.
- Test broader contextual accuracy (changed plans, ambiguous owners, multilingual messages and long conversations) before claiming reliability.

## Reproduce

Run `npm test`, `npm run build`, then `npm run dev` from the repository root. The development-only `/testing/model.html` runs one explicitly labelled fixed synthetic model diagnostic; it is not included in `dist`. Never add real chat data to test fixtures or prompt logs.
