# Demo sandbox

Open `/?demo=1#inspector` or choose **Try it with sample data** on the landing page. The checker immediately analyzes a shipped manifest with intentionally missing declarations, so the review card shows its blocking findings.

The demo uses no storage namespace because it writes no browser storage at all. Its input and report live only in page memory. **Reset demo** reloads the shipped sample; **Start for real** returns to the empty inspector and discards the sample.

The offline shell precaches the sample and application assets after the first visit, so the same demo remains runnable without a connection.
