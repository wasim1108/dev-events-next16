'use server'
import connectToDatabase from '@/lib/mongodb';
import Event from '@/database/event.model';

export const getSimilarEventsBySlug = async (slug: string) => {
    // Placeholder function to simulate fetching similar events
    // In a real implementation, this would query the database

    try {
        await connectToDatabase();

        const event = await Event.findOne({ slug });
        return await Event.find({ _id: { $ne: event._id }, tags: { $in: event.tags } }).lean();
    } catch (error) {
        return []
    }
}