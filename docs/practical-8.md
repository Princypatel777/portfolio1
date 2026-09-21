# Practical 8: Performance Optimization and Lazy Loading

## What changed

- The `/projects` and `/contact` route components now load with `React.lazy()`.
- The route area is wrapped in `Suspense`, which displays an accessible loading indicator while a lazy-loaded page is being downloaded.
- All other routes, UI behavior, and backend integration remain unchanged.

## Lazy loading and code splitting

`React.lazy()` converts a dynamic `import()` into a React component. Vite detects those dynamic imports during production builds and writes the imported components into separate JavaScript files (chunks). The initial page therefore does not download the Projects or Contact page code until the user opens the matching route. `Suspense` provides the temporary UI shown while that request completes.

## Measurements to record

Do not treat the build output below as a before/after comparison unless both builds were measured using the same settings. Record the values from your own baseline build and this lazy-loading build.

| Metric | Before lazy loading | After lazy loading | How to capture it |
| --- | --- | --- | --- |
| Initial JavaScript transferred on `/` | _[record]_ | _[record]_ | Chrome DevTools Network, Disable cache, reload `/`, sum JavaScript transfer sizes. |
| Initial page load time on Slow 3G | _[record]_ | _[record]_ | Network panel summary after a hard reload. |
| `/projects` route chunk transferred | N/A | _[record]_ | Filter Network by JS, then navigate from `/` to `/projects`. |
| `/contact` route chunk transferred | N/A | _[record]_ | Filter Network by JS, then navigate from `/` to `/contact`. |
| Production build chunk sizes | _[record]_ | _[record]_ | Save the `npm run build` output for each version. |

## Test with Chrome DevTools and Slow 3G

1. Run `npm run build`, then run `npm run preview`.
2. Open the preview URL in Chrome and open DevTools (`F12`) → **Network**.
3. Enable **Disable cache**, select **Slow 3G** from the throttling menu, and keep the Network panel open.
4. Hard reload the `/` route. Verify that the Projects and Contact JavaScript chunks are not requested yet, then record the initial load metrics.
5. Navigate to **Projects**. Verify the loading UI appears briefly and a new JavaScript chunk is requested. Record its transfer size and timing.
6. Repeat for **Contact**. Repeat an already visited route to observe that the browser cache avoids another download.

For a true before/after result, repeat steps 1–4 on the commit immediately before this practical (or temporarily remove only the two lazy imports and `Suspense` wrapper), then fill in the table.

## React DevTools Profiler

1. Install React Developer Tools and open its **Profiler** tab.
2. Click the record button, navigate from Home to Projects or Contact, and stop recording once the route renders.
3. Inspect the commit flamegraph/ranked view for render duration and which components rendered.
4. Save a screenshot or exported profile for the practical submission. Compare profiles under the same throttling and cache conditions.
