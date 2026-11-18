# VConvert documentation

This folder contains the project documentation, written against the implementation currently checked into the repository. The README at the repository root provides a brief project overview in English and Indonesian.

## Documents

| Document | Purpose |
|---|---|
| [Business Requirements Document (BRD)](./BRD.md) | Business need, scope, stakeholders, and acceptance criteria |
| [Functional Specification (FSD)](./FSD.md) | User workflows, functional requirements, and quality requirements |
| [Architecture & Application Documentation](./ARCHITECTURE.md) | Components, conversion lifecycle, configuration, and known limitations |
| [API Reference](./API.md) | HTTP endpoints, multipart upload, SSE, and errors |
| [User Guide / How to Use](./USER_GUIDE.md) | Browser workflow and user troubleshooting |
| [Development & Deployment Guide](./DEVELOPMENT_AND_DEPLOYMENT.md) | Prerequisites, local setup, Docker Compose, Coolify, configuration, operations, and GitHub workflow |
| [Test Plan & Results](./TEST_RESULTS.md) | Verification results from this checkout and recommended test coverage |

## Source-of-truth note

Some older guides remain at the repository root. They describe endpoint parameters, test coverage, and deployment options that do not consistently match the current code. Use the documents in this folder and the source code as the authoritative references. In particular, `npm test` is a placeholder rather than an automated test suite.

## Document maintenance

Update the relevant specification and user/API documentation when a behavior or endpoint changes. Record the exact command and outcome in the test report; do not claim a test passed unless it actually ran assertions.
