/**
 * Next.js API Route for TLE Parsing
 * app/api/tle/parse/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseTLE } from 'tle-parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { line1, line2, line0 } = body;

    if (!line1 || !line2) {
      return NextResponse.json(
        { error: 'Missing required fields: line1 and line2' },
        { status: 400 }
      );
    }

    const parsed = parseTLE(line1, line2, line0);

    return NextResponse.json({
      success: true,
      data: parsed
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
