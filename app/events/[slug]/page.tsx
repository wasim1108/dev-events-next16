import { notFound } from 'next/navigation';
import Image from 'next/image';
import React from 'react'
import BookEvent from '@/components/BookEvent';
import { getSimilarEventsBySlug } from '@/lib/actions/event.actions';
import { IEvent } from '@/database/event.model';
import EventCard from '@/components/EventCard';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const EventDetailItem = ({icon, alt, label}: {icon: string, alt: string, label: string}) => (
    <div className="flex-row-gap-2 items-center">
        <Image src={icon} alt={alt} width={17} height={17} />
        <p>{label}</p>
    </div>
);

const EventAgenda = ({agendaItems}: {agendaItems: string[]}) => (
    <div className="agenda">
        <h2>Agenda</h2>
        <ul>
            {agendaItems.map((item) => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    </div>
);

const EventTags = ({tags}: {tags: string[]}) => (
    <div className="tags flex-row-gap-1.5 flex-wrap">
        {tags.map((tag) => (
            <span key={tag} className="pill">{tag}</span>
        ))}
    </div>
);


const EventDetailsPage = async ({ params }: { params: Promise<{ slug: string }> }) => {

    const { slug } = await params;
    // console.log('Slug param:', slug);
    let description, image, overview, date, time, location, mode, agenda, audience, tags, organizer;
    let bookings: number = 0;
    const similarEvents: IEvent[] = await getSimilarEventsBySlug(slug) 
    console.log('Similar events fetched:', similarEvents.length);
    try {
    const request = await fetch(`${BASE_URL}/api/events/${slug}`, {
        next: { revalidate: 60 }
    });

    if (!request.ok) {
        // console.error('Failed to fetch event data:', request.statusText);
        return notFound();
    }

    const data = await request.json();
    // console.log('Fetched event data:', request);
    ({description, image, overview, date, time, location, mode, agenda, audience, tags, organizer} = data.event);
    
    
    if(!description) return notFound();

    bookings = 10; // Placeholder for bookings count


    } catch (error) {
        console.error('Error fetching event data:', error);
        throw error;
    }

    return (
        <section id="event">
            <div className="header">
                <h1>Event Description</h1>
                <p className="mt-2">{description}</p>
            </div>

            <div className="details">
                {/* Left side - Event content */}
                <div className="content">
                    <Image src={image} alt="Event Banner" width={800} height={800} className="banner" />

                    <section className="flex-col-gap-2">
                        <h2>Overview</h2>
                        <p>{overview}</p>
                    </section>

                    <section className="flex-col-gap-2">
                        <h2>Event Details</h2>
                        <EventDetailItem 
                            icon="/icons/calendar.svg" 
                            alt="calendar"
                            label={date}
                        />
                        <EventDetailItem 
                            icon="/icons/clock.svg" 
                            alt="clock"
                            label={time}
                        />
                        <EventDetailItem 
                            icon="/icons/pin.svg" 
                            alt="pin"
                            label={location}
                        />
                        <EventDetailItem 
                            icon="/icons/mode.svg" 
                            alt="mode"
                            label={mode}
                        />
                        <EventDetailItem 
                            icon="/icons/audience.svg" 
                            alt="audience"
                            label={audience}
                        />
                    </section>

                    <EventAgenda agendaItems={agenda} />
                    {/* {agenda && agenda.length > 0 && (() => {
                        try {
                            const agendaItems = JSON.parse(agenda[0]);
                            return Array.isArray(agendaItems) ? <EventAgenda agendaItems={agendaItems} /> : null;
                        } catch {
                            console.error('Invalid agenda JSON format');
                            return null;
                        }
                    })()} */}

                    <section className="flex-col-gap-2">
                        <h2>About the Organizer</h2>
                        <p>{organizer}</p>
                    </section>

                    <EventTags tags={tags} />
                    {/* {tags && tags.length > 0 && (() => {
                        try {
                            const tagList = JSON.parse(tags[0]);
                            return Array.isArray(tagList) ? <EventTags tags={tagList} /> : null;
                        } catch {
                            console.error('Invalid tags JSON format');
                            return null;
                        }
                    })()} */}
                </div>

                {/* Right side - Booking Form */}
                <aside className="booking">
                    <div className="signup-card">
                        <h2>Book Your Spot</h2>
                        {bookings > 0 ? (
                            <p className='text-sm'>
                                Join {bookings} people who have already booked their spot!
                            </p>
                        ) : (
                            <p className='text-sm'>
                                Be the first to book your spot!
                            </p>
                        )
                        }

                        <BookEvent />
                    </div>
                </aside>
            </div>

            <div className="flex w-full flex-col gap-4 pt-20">
                <h2>Similar Events You May Like</h2>
                <div className="events">
                    {similarEvents.length > 0 && similarEvents.map((similarEvent: IEvent) => (
                        <EventCard key={similarEvent.title} {...similarEvent} />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default EventDetailsPage