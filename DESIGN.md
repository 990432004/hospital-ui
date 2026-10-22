# Design

Operate mode: readable tables and evidence, clear keyboard accessible controls, honest empty/error/loading states. Vuexy 9.0.0 supplies the layout, components and customizer imagery; hospital business content comes from ../decision-app.

## Typography (user correction, 2026-10-21)
Follow Ant Design font guidance: system font stack; body 14px / 22px; auxiliary text no smaller than 12px / 20px. Five text levels only: 12/20, 14/22, 16/24, 20/28, 24/32. Titles 500–600, body 400, control labels 500. Scope includes tables, menus, badges, customizer, form labels/counters and page footers. Do not reintroduce 10/11px text through component size defaults.
Source: https://ant.design/docs/spec/font/

## Colors
Primary accent remains user selectable, stored separately for light and dark. Solid primary buttons and active navigation always have white text; derive a darker fill in the same hue when the selected accent is too light to meet 4.5:1 against white. Tonal/outline controls retain accent text. Avoid changing label color from white to black when switching presets.

Dark mode is hospital-specific neutral gray/black: canvas #141414, card/navigation surface #1F1F1F, neutral gray borders and off-white text. Do not inherit Vuexy's navy/purple surface palette. Functional brand and risk colors remain accents; general evidence/preview/navigation panels use neutral backgrounds in dark mode.

## Layout
252px expanded navigation / 76px collapsed rail. Icon-to-label gap 12px; collapsed icons centered on the rail, with hidden content/spacers/append badges. Sticky 64px toolbar, 24px content rhythm, 6px radii. Theme Customizer includes persisted colors, theme, skin, navigation mode, content width and RTL. Its reset clears appearance only, not business data.

## Module navigation (user correction, 2026-10-21)
Five peer modules occupy the primary navigation: perioperative alerts, national indicators, data sources, Gantt review, and command dispatch. Alerts (center/reporting/rules), indicators (monitor/config), and sources (data/bindings) consistently use nested page links; horizontal layout exposes those same children through menus. Gantt and command remain direct module links. Table schema/records, API/database categories, and Gantt resource views remain local content tabs. Route page tabs must not duplicate the navigation. Preserve existing URLs; page selection, expanded parent and breadcrumbs derive from the same navigation hierarchy.

## Gantt synchronized workspace (2026-10-21)
Gantt, surgery details and the spatial iframe belong to one workspace, with independent panel scrolling and a shared selection/date/time context. Do not replace either panel with a blocking modal or navigate away to see the spatial scene. Keep the 3D integration placeholder honest. Draw the I–IV and planned/actual legend into the Canvas so PNG exports preserve it.
