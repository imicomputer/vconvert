export declare const openApiDocument: {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
    };
    servers: {
        url: string;
        description: string;
    }[];
    tags: {
        name: string;
    }[];
    paths: {
        '/health': {
            get: {
                tags: string[];
                summary: string;
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/api/hardware-status': {
            get: {
                tags: string[];
                summary: string;
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/api/convert': {
            post: {
                tags: string[];
                summary: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        enum: string[];
                    };
                    description: string;
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    file: {
                                        type: string;
                                        format: string;
                                        description: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    '400': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    '413': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/api/progress/{jobId}': {
            get: {
                tags: string[];
                summary: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        format: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'text/event-stream': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    '404': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/api/download/{jobId}': {
            get: {
                tags: string[];
                summary: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        format: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                        headers: {
                            'Content-Disposition': {
                                description: string;
                                schema: {
                                    type: string;
                                };
                            };
                        };
                        content: {
                            'video/*': {
                                schema: {
                                    type: string;
                                    format: string;
                                };
                            };
                        };
                    };
                    '400': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    '404': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
    };
    components: {
        schemas: {
            HealthResponse: {
                type: string;
                required: string[];
                properties: {
                    status: {
                        type: string;
                        enum: string[];
                    };
                };
            };
            HardwareStatus: {
                type: string;
                required: string[];
                properties: {
                    status: {
                        type: string;
                        enum: string[];
                    };
                    nvidia: {
                        type: string;
                    };
                    amd: {
                        type: string;
                    };
                    timestamp: {
                        type: string;
                        format: string;
                    };
                };
            };
            JobCreated: {
                type: string;
                required: string[];
                properties: {
                    jobId: {
                        type: string;
                        format: string;
                    };
                };
            };
            ProgressEvent: {
                type: string;
                required: string[];
                properties: {
                    jobId: {
                        type: string;
                        format: string;
                    };
                    progress: {
                        type: string;
                        minimum: number;
                        maximum: number;
                    };
                    status: {
                        type: string;
                        enum: string[];
                    };
                    currentFrame: {
                        type: string;
                    };
                    totalFrames: {
                        type: string;
                    };
                    downloadUrl: {
                        type: string;
                    };
                    errorMessage: {
                        type: string;
                    };
                };
            };
            AppError: {
                type: string;
                required: string[];
                properties: {
                    error: {
                        type: string;
                    };
                    message: {
                        type: string;
                    };
                    code: {
                        type: string;
                    };
                    timestamp: {
                        type: string;
                        format: string;
                    };
                };
            };
        };
    };
};
