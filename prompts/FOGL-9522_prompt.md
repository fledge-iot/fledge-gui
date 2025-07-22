Context:
We are facing a performance bottleneck while importing configuration files for South services. The issue occurs when the imported file contains a large number of list, kvlist items (object type).

Problem:
When importing a file with ~499 outstations, the UI becomes significantly unresponsive. The lag worsens with files containing 1000–1500 entries. This makes it difficult to use the GUI for bulk configurations.

Repro Steps:
1. Add a south service
3. Import a configuration file with 499+ outstations.

Expected Result:
The file should be parsed and rendered quickly with no noticeable delay in the UI.

Actual Result:
The GUI takes a long time to load and becomes unresponsive, particularly as the number of entries increases.

Request:
- Diagnose potential causes for the unresponsiveness (e.g., large DOM updates, blocking JS operations, inefficient data binding).
- Optimize performance for large list/kvlist handling.
- Suggest strategies like:
  - Renders the visible portion, possibly with some rows around that portion and updates as it scrolls
  - Virtual scrolling / lazy rendering
  - Optimized change detection
  - Background file parsing

Expected Output:
Code improvements or refactoring strategy
Explanation of performance issues
Specific Angular performance techniques to apply