/**
 * Cloudflare Workers Function for TLE Parser
 */

import * as TLEParser from '../../../src/index';

export interface Env {
  API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: 'Only POST method is allowed',
          },
        }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      // Validate API key
      const apiKey = request.headers.get('X-API-Key');
      if (env.API_KEY && apiKey !== env.API_KEY) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'INVALID_API_KEY',
              message: 'Invalid API key',
            },
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Parse request body
      const body = await request.json() as any;
      const { tle, strict = true } = body;

      if (!tle) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'MISSING_TLE',
              message: 'TLE data is required',
            },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Parse TLE
      const parser = new TLEParser.TLEParser({ strict });
      const result = parser.parse(tle);

      if (result.error) {
        return new Response(
          JSON.stringify({
            error: {
              code: result.error.code,
              message: result.error.message,
            },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify(result.data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
