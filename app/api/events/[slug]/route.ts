import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Event, { IEvent } from '@/database/event.model';

type Params = { params: Promise<{ slug?: string | string[] }> };

/**
 * GET /api/events/[slug]
 * Returns the event document that matches the provided `slug` route parameter.
 * - Validates the slug parameter
 * - Ensures a DB connection is established
 * - Returns JSON with appropriate HTTP status codes
 */
export async function GET(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    // Ensure DB connection (cached helper handles multiple calls)
    await connectToDatabase();
    
    const {slug: rawSlug} = await params
    
    // Validate presence and type of slug
    if (!rawSlug || Array.isArray(rawSlug)) {
      return NextResponse.json({ error: 'Missing or invalid "slug" parameter' }, { status: 400 });
    }

    const slug = String(rawSlug).trim().toLowerCase();

    // Basic slug format validation: lowercase letters, numbers and hyphens
    const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slug || !SLUG_REGEX.test(slug)) {
      return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 });
    }

    

    // Query the Event model for the slug
    const eventDoc = await Event.findOne({ slug }).exec();

    if (!eventDoc) {
      return NextResponse.json({ error: `Event not found for slug: ${slug}` }, { status: 404 });
    }

    // Convert mongoose Document to plain object for safe JSON serialization
    const event: Partial<IEvent> = eventDoc.toObject();

    return NextResponse.json(
      { message: 'Event fetched successfully', event },
      { status: 200 }
    );
  } catch (error) {
    // Log server-side error for diagnostics; do not expose internals to clients
    // eslint-disable-next-line no-console
    console.error('Error in GET /api/events/[slug]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
