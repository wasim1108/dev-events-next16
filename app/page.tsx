import ExploreBtn from '@/components/ExploreBtn'
import EventCard from '@/components/EventCard'

import { IEvent } from '@/database';
import { cacheLife } from 'next/cache';
import events from '@/lib/constants';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

if (!baseUrl) {
  throw new Error('NEXT_PUBLIC_BASE_URL environment variable is not configured');
}

const page = async () => {

'use cache'
cacheLife('hours')

// let events = [];

// try {
//   const response = await fetch(`${baseUrl}/api/events`, {
//     cache: 'no-store', // or use next: { revalidate: 60 } for ISR
//   });
  
//   if (!response.ok) {
//     throw new Error(`Failed to fetch events: ${response.status}`);
//   }
  
//   const data = await response.json()
//   events = data.events;
  
//   if (!Array.isArray(events)) {
//     throw new Error('Invalid events data structure');
//   }
// } catch (error) {
//   console.error('Error fetching events:', error);
//   // Consider returning an error UI or empty state
//   return (
//     <section>
//       <h1 className='text-center'>Unable to load events</h1>
//       <p className='text-center mt-5'>Please try again later</p>
//     </section>
//   );
// }

  return (
    <section>
      <h1 className='text-center'>The Hub for Every Dev <br /> Event You Can't Miss</h1>
      <p className='text-center mt-5'>Hackathons, Meetups and Conferences, All in One Place</p>

      <ExploreBtn />

      <div className='mt-20 space-y-7'>
        <h3>Featured Events</h3>

        <ul className="events">
          {/* Events will be listed here */}
          {events && events.length > 0 && events.map((event)  => (
            <li key={event.title}>
              <EventCard {...event} />
            </li>
          ))}
        </ul>
      </div>
    </section>


  )
}

export default page