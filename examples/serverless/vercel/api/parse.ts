/**
 * Vercel Serverless Function for TLE Parser
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as TLEParser from '../../../../src/index';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
      },
    });
  }

  try {
    const { tle, strict = true } = req.body;

    if (!tle) {
      return res.status(400).json({
        error: {
          code: 'MISSING_TLE',
          message: 'TLE data is required',
        },
      });
    }

    const parser = new TLEParser.TLEParser({ strict });
    const result = parser.parse(tle);

    if (result.error) {
      return res.status(400).json({
        error: {
          code: result.error.code,
          message: result.error.message,
        },
      });
    }

    return res.status(200).json(result.data);
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
}
