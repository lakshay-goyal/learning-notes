# Open-source repository analysis

Use for substantial deep/production topics when code clarifies the mechanism, and always for codebase mode.

## Select

Evaluate relevance, implementation depth, category, documentation, tests, maintenance evidence, adoption context, readability, license/access, deployment artifacts, and fit to the learning objective. Classify each selected repository as educational example, reference implementation, SDK/library, production-oriented application, full production system, or experimental. Stars and README claims are weak signals, not proof.

Prefer at most the configured number of primary repositories. If no strong candidate exists, say so.

## Inspect

Pin a release tag or commit before citing paths. Inspect the tree, dependency manifests, entry points, main modules/interfaces, state/data structures, request/background flow, persistence/external integrations, errors, retries/caching/concurrency, authentication, tests, and deployment/configuration relevant to the plan.

For a complex implementation, trace one end-to-end path. At each stage record:

- exact repository-relative file path at the pinned revision
- input/output and state transitions
- called component and control/data handoff
- design decision and failure conditions
- difference from a minimal tutorial

Use commit-pinned web links when practical. Cite symbols and lines only after verification; prefer stable symbol/file descriptions over brittle line numbers.

## Teach from it

Write a reading itinerary: entry point, handler/dispatcher, core service, storage/integration, tests, deployment, then a small modification. For every repository record purpose, maintainer, URL, why selected, architecture, technologies, patterns, learning goals, exact paths, exercises, limitations, revision, and verification status.

If source retrieval fails, label it `DISCOVERED_NOT_SOURCE_INSPECTED` and do not make internal-architecture claims.
