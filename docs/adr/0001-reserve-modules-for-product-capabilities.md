# Reserve modules for product capabilities

A module represents a coherent product capability that serves an independently meaningful visitor goal, not merely a self-contained collection of code. Modules may contain their own views, components, utilities, data, and other implementation details, while generic UI, technical capabilities, development tooling, application-wide configuration, and cross-cutting experience preferences belong outside `src/modules`; this keeps the top-level structure aligned with what the website offers rather than with incidental technical groupings. Portfolio is one module: about, experience, education, projects, achievements, bookmarks, and social profiles are parts of that capability rather than peer modules. Appearance is a cross-cutting capability because it supports the overall experience rather than an independent visitor goal.

Code is owned by the module whose capability it serves, regardless of whether it is a view, component, hook, utility, type, or data file. Code belongs outside modules only when it is product-neutral and shared across independent modules or by the application shell; global folders organized by code type are not default destinations for module-owned code.

Shared placement requires evidence rather than a fixed consumer count: code may start shared when it is deliberately foundational, has multiple independent consumers, or has a current consumer and a named near-term consumer behind a product-neutral contract. Shared code never imports from a product module.

The Next.js `src/app` tree remains a thin framework boundary for routes, layouts, metadata, loading and error states, and application composition. Route files compose module entry points; product implementation remains in `src/modules`, so a module may own behavior exposed through multiple routes.

Source code has three ownership zones: `src/app` for the Next.js boundary and app-wide composition, `src/modules` for visitor-facing product capabilities, and `src/shared` for product-neutral foundations. Dependencies flow from app to modules and shared, and from modules to shared; shared code does not depend on either app or modules.

Product modules are independent peers and do not import one another. Experiences spanning multiple modules are composed by `src/app`, which prevents hidden lateral dependencies between visitor capabilities.

Each module exposes a deliberate public API to `src/app`; module internals are private and are not imported by path from outside the module. A root entry point is the default, with explicit sub-entrypoints allowed when preserving client/server boundaries requires them.

Modules start with a flat internal structure and add responsibility-based subfolders as they grow. They do not receive a mandatory template of technical folders; technical grouping inside a module is introduced only for code genuinely shared across that module's sub-capabilities.

Module-specific content and configuration remain owned by their module even when app-wide UI presents them. Social profiles belong to Portfolio and are exposed through its public API for the app shell to consume; they are not generic shared configuration.

Navigation ownership follows the destinations it describes. Cross-module navigation belongs to the app shell, while navigation within a product capability belongs to that module and is exposed through its public API for the shell to compose.

Shared owns reusable mechanisms, while the consuming responsibility owns concrete policy, configuration, and assets. The generic audio engine, types, and hook belong to `src/shared`; a sound asset used only by Appearance remains owned by `src/app/_appearance` until broader reuse is deliberate.

Shared code is organized primarily by cohesive technical responsibility, such as `ui`, `audio`, or `browser`, rather than by artifact-type buckets such as `hooks`, `utils`, or `types`. Hooks, utilities, and types live beside the shared concept they support.

The initial product modules are Portfolio and Blog. Existing Site, Appearance, Devtools, Socials, and Sounds folders are not peer product modules: shell, appearance, and development wiring are app-owned; social profiles are Portfolio-owned; and the reusable sound mechanism is shared.

Whether a concern serves an independently meaningful visitor goal remains a design and review judgment. After the source migration, tooling should enforce the mechanical boundaries: shared imports neither app nor modules, modules import neither app nor peer modules, and external consumers access modules only through their designated public entrypoints.

Private app-wide implementation lives in responsibility-based folders inside `src/app`, such as `_shell`, `_appearance`, and `_devtools`. These folders hold application composition and cross-cutting behavior; they are not product modules and are not grouped globally by technical types such as components or providers.
