import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  Video,
  User,
  Filter,
} from 'lucide-react';
import { api } from '../api/client';
import { formatDateTime, formatDate } from '../utils/formatters';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'agenda'>('agenda');
  const [filterType, setFilterType] = useState<string>('all');

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activities/calendar');
      if (res.success) {
        setEvents(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  const filteredEvents = events.filter((e) => {
    if (filterType === 'all') return true;
    return e.type.toLowerCase() === filterType.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Activity & Meeting Calendar
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Scheduled client demonstrations, follow-up calls, and appointments (Timezone: Asia/Kolkata).
          </p>
        </div>

        {/* View toggles & Filter */}
        <div className="flex items-center space-x-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 shadow-2xs focus:outline-none"
          >
            <option value="all">All Activities</option>
            <option value="meeting">Meetings Only</option>
            <option value="follow-up">Follow-ups Only</option>
            <option value="call">Calls Only</option>
          </select>

          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              onClick={() => setView('agenda')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                view === 'agenda'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agenda View
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                view === 'month'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month View
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar View Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={5} />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No scheduled meetings or follow-ups found.
          </div>
        ) : view === 'agenda' ? (
          <div className="divide-y divide-slate-100">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => {
                  if (event.relatedType === 'lead') {
                    navigate(`/leads/${event.relatedId}`);
                  }
                }}
                className="p-4 sm:p-5 flex items-start justify-between hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs ${
                      event.type === 'Meeting'
                        ? 'bg-purple-600'
                        : event.type === 'Follow-up'
                        ? 'bg-indigo-600'
                        : 'bg-blue-600'
                    }`}
                  >
                    {event.type === 'Meeting' ? (
                      <Video className="w-5 h-5" />
                    ) : event.type === 'Follow-up' ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <Phone className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-slate-900">{event.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {event.type}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                      <span className="flex items-center text-indigo-700 font-medium">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {formatDateTime(event.start)}
                      </span>
                      <span>• Author / Assigned: {event.author}</span>
                    </div>

                    {event.notes && (
                      <p className="text-xs text-slate-600 pt-1 max-w-2xl leading-relaxed">
                        {event.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Month Summary Grid */
          <div className="p-6 space-y-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Upcoming Month Agenda Items (Chronological)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 space-y-2 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-indigo-600">{event.type}</span>
                    <span className="text-slate-500">{formatDate(event.start)}</span>
                  </div>
                  <h2 className="text-sm font-semibold text-slate-800 line-clamp-1">{event.title}</h2>
                  <div className="text-xs text-slate-500">Scheduled: {formatDateTime(event.start)}</div>
                  {event.notes && <p className="text-xs text-slate-400 line-clamp-2">{event.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
