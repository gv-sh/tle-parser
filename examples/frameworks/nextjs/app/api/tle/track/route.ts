/**
 * Next.js API Route for Satellite Tracking
 * app/api/tle/track/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseTLE, calculatePosition, calculateLookAngles, type GroundLocation } from 'tle-parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { line1, line2, line0, groundLocation } = body;

    if (!line1 || !line2) {
      return NextResponse.json(
        { error: 'Missing required fields: line1 and line2' },
        { status: 400 }
      );
    }

    const tle = parseTLE(line1, line2, line0);
    const now = new Date();
    const position = calculatePosition(tle, now);

    let lookAngles = null;
    let isVisible = false;

    if (groundLocation) {
      lookAngles = calculateLookAngles(tle, groundLocation as GroundLocation, now);
      isVisible = lookAngles.elevation > 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        tle: tle.satelliteName,
        timestamp: now,
        position,
        lookAngles,
        isVisible
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 400 }
    );
  }
}
