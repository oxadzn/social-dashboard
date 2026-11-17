import { format, parseISO } from 'date-fns';
import withLoading from '../../hoc/withLoading';

// Base version: scheduled posts grouped by day in a simple list.
// TODO: replace with a real month/week grid built with date-fns
//       (startOfMonth, eachDayOfInterval, isSameDay)
// TODO: click a day to add a new scheduled post
function ScheduleCalendar({ items }) {
  const byDay = items.reduce((acc, item) => {
    const day = format(parseISO(item.datetime), 'EEE, d MMM');
    (acc[day] = acc[day] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="card">
      <h3 className="card__title">Scheduled posts</h3>
      {items.length === 0 && <p className="state">No scheduled posts.</p>}
      {Object.entries(byDay).map(([day, posts]) => (
        <div key={day} className="schedule__day">
          <strong>{day}</strong>
          <ul>
            {posts.map((p) => (
              <li key={p.id}>
                {format(parseISO(p.datetime), 'h:mm a')} · {p.title} ({p.platform})
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default withLoading(ScheduleCalendar);
