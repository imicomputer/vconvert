# Phase 1: Backend Infrastructure Setup

**Status**: ⬜ Pending  
**Effort**: 4 hours | **Tasks**: 5 tasks

---

## Phase Objective

Establish the foundational backend infrastructure including project structure, TypeScript configuration, Express server setup, logging system, and error handling middleware. This phase creates the scaffolding upon which all backend services will be built.

## Phase Prerequisites

- Node.js 18+ installed
- npm or yarn available
- Fresh project directory
- No dependencies on previous phases (this is the foundation)

---

## Tasks

### TASK-001: Initialize Node.js Project with TypeScript and ES Modules

**Objective**: Create a Node.js project with TypeScript, ES Modules, and essential development tools configured.

**Acceptance Criteria**:
- [ ] package.json created with "type": "module" for ES Modules
- [ ] TypeScript installed (version ^5.0) as dev dependency
- [ ] tsconfig.json configured for ES Modules compilation
- [ ] src/ directory structure exists
- [ ] Build script in package.json produces output to dist/
- [ ] Development script configured with auto-reload (tsx or similar)
- [ ] All dependencies pinned to exact versions (no ^ or ~ ranges)

**Implementation Steps**:
1. Initialize npm package.json with `npm init -y`
2. Add "type": "module" to package.json root
3. Install TypeScript: `npm install --save-dev typescript@^5.0`
4. Create tsconfig.json with ES Module target (ES2020+)
5. Configure compilerOptions:
   - module: "ES2020"
   - moduleResolution: "node"
   - target: "ES2020"
   - sourceMap: true
   - outDir: "./dist"
   - rootDir: "./src"
6. Install tsx for development: `npm install --save-dev tsx`
7. Create src/index.ts entry point (empty for now)
8. Add scripts:
   - "build": "tsc"
   - "dev": "tsx watch src/index.ts"
   - "start": "node dist/index.js"

**Correctness Properties Validated**:
- None specific to this task (infrastructure only)

**Testing Instructions**:
- Run `npm run build` → should produce dist/index.js
- Run `npm run dev` → should start watcher without errors
- Verify package.json has "type": "module"
- Verify tsconfig.json targets ES2020 modules

---

### TASK-002: Set Up Express Server with TypeScript

**Objective**: Create an Express server instance with TypeScript support, basic routing structure, and error handling middleware.

**Acceptance Criteria**:
- [ ] Express installed as production dependency
- [ ] Express app created in src/app.ts
- [ ] Root GET endpoint ("/") returns JSON {status: "ok"}
- [ ] 404 handler implemented for undefined routes
- [ ] Error handling middleware implemented
- [ ] Server listens on configurable port (default 3000)
- [ ] CORS enabled for localhost:5173 (frontend dev server)
- [ ] Server starts cleanly on `npm run dev`

**Implementation Steps**:
1. Install Express: `npm install express@^4.18`
2. Create src/app.ts:
   - Import express
   - Create express app instance
   - Add CORS middleware: `cors({origin: 'http://localhost:5173'})`
   - Add JSON body parser: `express.json()`
   - Add root route GET "/" returning {status: "ok"}
   - Add 404 handler (next middleware after routes)
   - Add error handler (4-param middleware)
3. Create src/index.ts:
   - Import app from src/app.ts
   - Create server instance with app
   - Listen on process.env.PORT || 3000
   - Log "Server running on port X"
4. Install cors: `npm install cors@^2.8`
5. Add types: `npm install --save-dev @types/express@^4.17 @types/cors@^2.8 @types/node@^20`

**Correctness Properties Validated**:
- None specific to this task (infrastructure only)

**Testing Instructions**:
- Run `npm run dev`
- Curl http://localhost:3000/ → should return {status: "ok"}
- Curl http://localhost:3000/nonexistent → should return 404 error
- Verify CORS headers present in response
- Verify no console errors on startup

---

### TASK-003: Implement Comprehensive Logging System

**Objective**: Create a modular Logger class with log levels, timestamps, and structured output for debugging and monitoring.

**Acceptance Criteria**:
- [ ] Logger class created in src/utils/Logger.ts
- [ ] Log levels: 'error', 'warn', 'info', 'debug' supported
- [ ] Log format includes: timestamp (ISO 8601), level, context, message, metadata
- [ ] Color-coded console output (error=red, warn=yellow, info=blue, debug=gray)
- [ ] Logger accepts context parameter (e.g., "HardwareDetector", "ConversionJob")
- [ ] Metadata logging for objects/errors
- [ ] Singleton pattern or default export for easy import
- [ ] Log level can be set globally (default: 'info')

**Implementation Steps**:
1. Create src/utils/ directory
2. Create src/utils/Logger.ts:
   - Define LogLevel enum: 'error' | 'warn' | 'info' | 'debug'
   - Create Logger class with:
     - constructor(context: string)
     - error(message, metadata?)
     - warn(message, metadata?)
     - info(message, metadata?)
     - debug(message, metadata?)
     - private formatLog(level, message, metadata)
   - Format: `[TIMESTAMP] [LEVEL] [CONTEXT] message {...metadata}`
   - Use console.log/error for output
   - Add ANSI color codes for terminal output
3. Create src/utils/index.ts to export Logger
4. Test Logger in src/index.ts with sample logs

**Correctness Properties Validated**:
- None specific to this task (infrastructure only)

**Testing Instructions**:
- Instantiate Logger in index.ts: `const logger = new Logger('App')`
- Call all log levels: error, warn, info, debug
- Verify timestamp format is ISO 8601
- Verify colors in terminal (error=red, warn=yellow, etc.)
- Verify metadata objects are logged correctly
- Verify log level filtering works

---

### TASK-004: Implement Custom Error Classes and Error Handling Middleware

**Objective**: Create structured error classes for different failure scenarios and error handling middleware for Express.

**Acceptance Criteria**:
- [ ] BaseError class created (extends Error)
- [ ] Specific error classes: ValidationError, ConversionError, HardwareError, FileError
- [ ] All errors include code (string) and timestamp
- [ ] Error handler middleware catches all errors
- [ ] Error responses in format: {error, message, code, timestamp}
- [ ] HTTP status codes correctly mapped (400 for validation, 500 for server, 413 for upload size)
- [ ] Stack traces logged but not exposed to client
- [ ] Error handler added to Express in src/app.ts

**Implementation Steps**:
1. Create src/errors/ directory
2. Create src/errors/BaseError.ts:
   - Extend Error class
   - Add properties: code (string), statusCode (number), timestamp (Date)
   - Constructor accepts message, code, statusCode
3. Create specific error classes in src/errors/:
   - ValidationError (400)
   - ConversionError (500)
   - HardwareError (500)
   - FileError (500)
   - NotFoundError (404)
4. Create src/errors/errorHandler.ts middleware:
   - 4-param middleware: (err, req, res, next)
   - Log full error with stack trace
   - Respond with sanitized error (no stack trace to client)
5. Register error handler in src/app.ts after all routes
6. Update src/app.ts to use new error classes in 404 handler

**Correctness Properties Validated**:
- None specific to this task (infrastructure only)

**Testing Instructions**:
- Manually throw ValidationError in route
- Curl endpoint → should return 400 with proper error format
- Verify console has full error with stack trace
- Verify response to client does NOT include stack trace
- Test all error types mapped correctly to HTTP status codes
- Verify timestamp in error response is ISO 8601

---

### TASK-005: Set Up Project Directory Structure and Configuration

**Objective**: Create standardized directory structure and environment configuration system.

**Acceptance Criteria**:
- [ ] Directory structure created: src/{services,controllers,routes,utils,errors,config}
- [ ] .env.example file created with all required env variables
- [ ] .env file created (local development)
- [ ] .gitignore configured to ignore .env, node_modules, dist/
- [ ] Config module created in src/config/ for centralized configuration
- [ ] Config exports: PORT, LOG_LEVEL, MAX_UPLOAD_SIZE, TEMP_DIR, etc.
- [ ] Environment variables loaded safely (with defaults)
- [ ] No hardcoded paths or secrets in code

**Implementation Steps**:
1. Create directory structure:
   ```
   src/
     ├── config/
     ├── controllers/
     ├── services/
     ├── routes/
     ├── errors/
     ├── utils/
     └── index.ts
   dist/ (will be created by build)
   uploads/ (temp directory)
   ```
2. Create src/config/config.ts:
   - Define Config interface
   - Load from process.env with defaults:
     - PORT: 3000
     - LOG_LEVEL: 'info'
     - MAX_UPLOAD_SIZE: 2GB (in bytes)
     - TEMP_DIR: './uploads'
     - NODE_ENV: 'development'
   - Export const config = { PORT, LOG_LEVEL, ... }
3. Create .env.example:
   ```
   PORT=3000
   LOG_LEVEL=info
   MAX_UPLOAD_SIZE=2147483648
   TEMP_DIR=./uploads
   NODE_ENV=development
   ```
4. Create .env (copy .env.example for development)
5. Create/update .gitignore:
   ```
   node_modules/
   dist/
   .env
   uploads/
   *.log
   .DS_Store
   ```
6. Update src/index.ts to use config.PORT

**Correctness Properties Validated**:
- None specific to this task (infrastructure only)

**Testing Instructions**:
- Verify all directories created
- Verify .env.example contains all keys
- Verify .env file ignored by git: `git check-ignore .env`
- Verify config module loads correctly
- Verify PORT from config used in server startup
- Verify LOG_LEVEL from config controls logger output
- Verify uploads directory can be created

---

## Phase Completion Checklist

- [ ] TASK-001: Node.js + TypeScript + ES Modules configured
- [ ] TASK-002: Express server running with basic routes
- [ ] TASK-003: Logger system implemented and tested
- [ ] TASK-004: Error classes and error handler middleware working
- [ ] TASK-005: Directory structure and config system in place
- [ ] All acceptance criteria verified
- [ ] No TypeScript compilation errors
- [ ] No console errors on `npm run dev`
- [ ] project builds successfully with `npm run build`

## Next Phase

After completing all tasks in Phase 1:
1. Update EXECUTION_PROGRESS.md: Mark Phase 1 as ✅ completed with current timestamp
2. Verify all infrastructure files are in place
3. Commit all changes to git
4. Review Phase 2 objectives in task02.md
5. Continue execution with Phase 2

**Next Phase**: Backend Hardware & Codec Detection (task02.md)
