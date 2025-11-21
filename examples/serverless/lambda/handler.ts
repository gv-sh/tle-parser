/**
 * AWS Lambda Handler for TLE Parser
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import * as TLEParser from '../../../src/index';

/**
 * Parse TLE Lambda Handler
 */
export async function parseTLE(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { tle, strict = true } = body;

    if (!tle) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: {
            code: 'MISSING_TLE',
            message: 'TLE data is required',
          },
        }),
      };
    }

    // Parse TLE
    const parser = new TLEParser.TLEParser({ strict });
    const result = parser.parse(tle);

    if (result.error) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: {
            code: result.error.code,
            message: result.error.message,
          },
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result.data),
    };
  } catch (error: any) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      }),
    };
  }
}

/**
 * Calculate Position Lambda Handler
 */
export async function calculatePosition(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    const { tle, timestamp } = body;

    if (!tle || !timestamp) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'TLE and timestamp are required',
          },
        }),
      };
    }

    const calculator = new TLEParser.OrbitalCalculator();
    const date = new Date(timestamp);
    const position = calculator.calculatePosition(tle, date);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        timestamp: date.toISOString(),
        position: position.position,
        velocity: position.velocity,
        altitude: position.altitude,
        latitude: position.latitude,
        longitude: position.longitude,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: {
          code: 'CALCULATION_ERROR',
          message: error.message,
        },
      }),
    };
  }
}
