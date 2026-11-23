import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import withLoading from '../../hoc/withLoading';

const weekStartsOn = 1;

function ScheduleCalendar({ items = [] }) {
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const days = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn }),
  }), [month]);
  const selectedPosts = items
    .filter((item) => isSameDay(parseISO(item.datetime), selectedDate))
    .sort((a, b) => parseISO(a.datetime) - parseISO(b.datetime));
  const changeMonth = (nextMonth) => {
    setMonth(startOfMonth(nextMonth));
    setSelectedDate(startOfMonth(nextMonth));
  };

  return (
    <section className="panel calendar-panel" id="schedule">
      <div className="panel-heading calendar-heading">
        <h2>Schedule</h2>
        <div className="calendar-month-nav">
          <button type="button" onClick={() => changeMonth(subMonths(month, 1))} aria-label="Previous month">‹</button>
          <strong>{format(month, 'MMMM yyyy')}</strong>
          <button type="button" onClick={() => changeMonth(addMonths(month, 1))} aria-label="Next month">›</button>
        </div>
      </div>
      <div className="calendar-layout">
        <div className="month-grid">
          <div className="weekday-row">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-days">
            {days.map((day) => {
              const datePosts = items.filter((item) => isSameDay(parseISO(item.datetime), day));
              const currentMonth = isSameMonth(day, month);
              const isSelected = isSameDay(day, selectedDate);
              return (
                <button
                  type="button"
                  className={`calendar-day${currentMonth ? '' : ' is-outside'}${isSelected ? ' is-selected' : ''}${datePosts.length ? ' has-posts' : ''}`}
                  key={format(day, 'yyyy-MM-dd')}
                  onClick={() => {
                    if (!currentMonth) setMonth(startOfMonth(day));
                    setSelectedDate(day);
                  }}
                  aria-pressed={isSelected}
                  aria-label={`${format(day, 'EEEE, MMMM d')}, ${datePosts.length ? `${datePosts.length} scheduled ${datePosts.length === 1 ? 'post' : 'posts'}` : 'open slot'}`}
                >
                  <span className="calendar-day__number">{format(day, 'd')}</span>
                  {datePosts.length > 0 && <span className="calendar-day__count">{datePosts.length}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <aside className="selected-day">
          <div className="selected-day__date">
            <span>{format(selectedDate, 'EEEE')}</span>
            <strong>{format(selectedDate, 'd')}</strong>
            <small>{format(selectedDate, 'MMMM yyyy')}</small>
          </div>
          <div className="selected-day__list">
            <div className="selected-day__heading">
              <strong>Posts</strong>
              <span>{selectedPosts.length ? String(selectedPosts.length).padStart(2, '0') : '—'}</span>
            </div>
            {selectedPosts.length ? selectedPosts.map((post) => (
              <article className="scheduled-post" key={post.id}>
                <div>
                  <strong>{post.title}</strong>
                  <span>{format(parseISO(post.datetime), 'h:mm a')} <i>·</i> {post.platform}</span>
                </div>
              </article>
            )) : (
              <div className="open-slot">
                <p>No posts scheduled</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default withLoading(ScheduleCalendar);
