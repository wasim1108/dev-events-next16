import connectToDatabase from '@/lib/mongodb';
import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';
import Event from '@/database/event.model';

export async function POST(req: NextRequest) {
  
    try {
        await connectToDatabase();

        const formData = await req.formData();

        let event;

        try {
            // Convert FormData to a plain object
            event = Object.fromEntries(formData.entries());
        } catch(e) {
            return NextResponse.json({ 
                message: 'Invalid JSON form data'
            }, 
            { status: 400 }
        );
        }

        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json({ 
                message: 'Image file is required'
            }, 
            { status: 400 }
        );
        }

        let tags = JSON.parse(formData.get('tags') as string);
        let agenda = JSON.parse(formData.get('agenda') as string);

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ 
                message: 'Unsupported image format. Allowed formats: JPEG, JPG, PNG, WEBP'
            }, 
            { status: 400 }
        );
        }

        // Validate file size (max 5MB)
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ 
                message: 'Image size exceeds the 5MB limit'
            }, 
            { status: 400 }
        );
        }

        if(!cloudinary.config().api_key || !cloudinary.config().api_secret) {
            return NextResponse.json({ 
                message: 'Cloudinary configuration is missing'
            },
            { status: 500 }
        );
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { resource_type: 'image', folder: 'events' },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            ).end(buffer);
        });
            

        event.image = (uploadResult as {secure_url:string}).secure_url;


        const createdEvent = await Event.create(
            {
                ...event,
                tags: tags,
                agenda: agenda
            }
        );

        return NextResponse.json({ 
            message: 'Event created successfully', 
            event: createdEvent 
        }, 
        { status: 201 }
    );

    } catch (error) {
        
        return NextResponse.json({ 
            message: 'Event creation failed', 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 
        { status: 500 }
    );
    }

}   

export async function GET() {
    try {
        await connectToDatabase();

        const events = await Event.find().sort({ createdAt: -1 });

        return NextResponse.json({ 
            message: 'Events fetched successfully',
            events 
        }, 
        { status: 200 }
        );

    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json({ 
            message: 'Failed to fetch events', 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 
        { status: 500 }
    );
    }
}