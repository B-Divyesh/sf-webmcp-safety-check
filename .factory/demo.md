# Demo sandbox

Open `/demo/`, `/?demo=1`, or choose **Try it with sample data** on the landing page. The legacy query URL redirects to the dedicated demo route. The checker immediately analyzes a shipped manifest with intentionally missing declarations, so the review card shows its blocking findings in the first viewport.

The demo uses no storage namespace because it writes no browser storage at all. Its input and report live only in page memory. **Reset demo** reloads the shipped sample; **Start for real** returns to the empty inspector and discards the sample.

The offline shell precaches the sample and application assets after the first visit, so the same demo remains runnable without a connection.

The standalone CLI has the matching sample path: `node webmcp-safety-check.mjs --demo`. It writes the bundled manifest and review to a new temporary directory, prints that path, and exits 1 because the sample intentionally has blocking declarations.
