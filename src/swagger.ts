export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Video Converter API',
    version: '1.0.0',
    description: 'REST and Server-Sent Events API for the video conversion application.'
  },
  servers: [{ url: '/', description: 'Application server' }],
  tags: [
    { name: 'System' },
    { name: 'Conversion' },
    { name: 'Progress' }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Application health check',
        responses: {
          '200': {
            description: 'Application is healthy',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } }
          }
        }
      }
    },
    '/api/hardware-status': {
      get: {
        tags: ['System'],
        summary: 'Get detected hardware accelerator',
        responses: {
          '200': {
            description: 'Current hardware status',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HardwareStatus' } } }
          }
        }
      }
    },
    '/api/convert': {
      post: {
        tags: ['Conversion'],
        summary: 'Upload and start a video conversion',
        parameters: [
          {
            name: 'targetFormat',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['mp4', 'mkv', 'webm', 'avi', 'mov', 'flv', 'wmv', '3gp']
            },
            description: 'Target output format'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary', description: 'Video file to convert' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Conversion job created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/JobCreated' } } }
          },
          '400': { description: 'Invalid upload or target format', content: { 'application/json': { schema: { $ref: '#/components/schemas/AppError' } } } },
          '413': { description: 'Uploaded file exceeds the configured size limit', content: { 'application/json': { schema: { $ref: '#/components/schemas/AppError' } } } }
        }
      }
    },
    '/api/progress/{jobId}': {
      get: {
        tags: ['Progress'],
        summary: 'Stream conversion progress using Server-Sent Events',
        parameters: [{ name: 'jobId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'SSE stream with processing, done, or error events',
            content: { 'text/event-stream': { schema: { $ref: '#/components/schemas/ProgressEvent' } } }
          },
          '404': { description: 'Job not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/AppError' } } } }
        }
      }
    },
    '/api/download/{jobId}': {
      get: {
        tags: ['Conversion'],
        summary: 'Download a completed converted video',
        parameters: [{ name: 'jobId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Converted video file',
            headers: { 'Content-Disposition': { description: 'Attachment filename', schema: { type: 'string' } } },
            content: { 'video/*': { schema: { type: 'string', format: 'binary' } } }
          },
          '400': { description: 'Job is not ready', content: { 'application/json': { schema: { $ref: '#/components/schemas/AppError' } } } },
          '404': { description: 'Job or converted file not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/AppError' } } } }
        }
      }
    }
  },
  components: {
    schemas: {
      HealthResponse: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['ok'] } } },
      HardwareStatus: {
        type: 'object', required: ['status', 'nvidia', 'amd', 'timestamp'],
        properties: {
          status: { type: 'string', enum: ['nvidia', 'amd', 'cpu'] },
          nvidia: { type: 'boolean' },
          amd: { type: 'boolean' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      JobCreated: { type: 'object', required: ['jobId'], properties: { jobId: { type: 'string', format: 'uuid' } } },
      ProgressEvent: {
        type: 'object', required: ['jobId', 'progress', 'status'],
        properties: {
          jobId: { type: 'string', format: 'uuid' },
          progress: { type: 'integer', minimum: 0, maximum: 100 },
          status: { type: 'string', enum: ['processing', 'done', 'error'] },
          currentFrame: { type: 'integer' },
          totalFrames: { type: 'integer' },
          downloadUrl: { type: 'string' },
          errorMessage: { type: 'string' }
        }
      },
      AppError: {
        type: 'object', required: ['error', 'message', 'code', 'timestamp'],
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
};
