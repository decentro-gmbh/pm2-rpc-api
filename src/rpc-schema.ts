/**
 * JSON schema for validating RPC requests
 * Taken from: https://github.com/fge/sample-json-schemas/blob/master/jsonrpc2.0/jsonrpc-request-2.0.json
 */

export const rpcRequestSchema = {
  description: 'A JSON RPC 2.0 request',
  oneOf: [
    {
      description: 'An individual request',
      $ref: '#/definitions/request',
    },
    {
      description: 'An array of requests',
      type: 'array',
      items: { $ref: '#/definitions/request' },
    },
  ],
  definitions: {
    request: {
      type: 'object',
      required: ['jsonrpc', 'method'],
      properties: {
        jsonrpc: { enum: ['2.0'] },
        method: {
          type: 'string',
        },
        id: {
          type: ['string', 'number', 'null'],
          note: [
            'While allowed, null should be avoided: http://www.jsonrpc.org/specification#id1',
            'While allowed, a number with a fractional part should be avoided: http://www.jsonrpc.org/specification#id2',
          ],
        },
        params: {
          type: ['array', 'object'],
        },
      },
    },
  },
};
