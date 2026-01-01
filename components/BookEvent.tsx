"use client"
import React from 'react'
import { createBooking } from '@/lib/actions/booking.actions';
import PostHog from 'posthog-js';

const BookEvent = ({slug, eventId}:{slug: string, eventId: string}) => {

    const [email, setEmail] = React.useState('');
    const [submitted, setSubmitted] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
    
        e.preventDefault();

        const { success } = await createBooking({ eventId, slug, email });

        if (success) {
            setSubmitted(true);
            PostHog.capture('event_booked', { slug, eventId, email });
        } else {
            console.error('Booking creation failed')
            PostHog.captureException('Booking creation failed');
        }
        // setTimeout(() => {
        //     setSubmitted(true);
        // }, 1000);
    }

    return (
        <div id="book-event" className='z-[5]'>
            {submitted ? (
                <p className='text-sm'>Thank you for signing up!</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            id="email"
                            placeholder="Enter your email address"
                            required
                        />
                    </div>

                    <button type="submit" className='button-submit'>Book Now</button>
                </form>
            )
            }
        </div>
    )
}

export default BookEvent