// Event Calendar System Component
// Calendar view, event creation, RSVP, notifications, recurring events

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMobileHUD } from '@/lib/mobile-hud-context';

interface Event {
  id: string;
  title: string;
  description: string;
  category: 'social' | 'raid' | 'pvp' | 'contest' | 'concert' | 'market' | 'other';
  startTime: Date;
  endTime: Date;
  location: string;
  organizer: string;
  organizerId: string;
  attendees: number;
  maxAttendees?: number;
  isRSVP: boolean;
  rsvpStatus?: 'going' | 'maybe' | 'not-going';
  isRecurring: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly';
  reminderSet: boolean;
}

export function EventCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | Event['category']>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [selectedDate, viewMode]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/events?date=${selectedDate.toISOString()}&view=${viewMode}`
      );
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories: { key: Event['category']; label: string; icon: string; color: string }[] = [
    { key: 'social', label: 'Social', icon: '👥', color: 'bg-blue-500' },
    { key: 'raid', label: 'Raid', icon: '⚔️', color: 'bg-red-500' },
    { key: 'pvp', label: 'PvP', icon: '🗡️', color: 'bg-orange-500' },
    { key: 'contest', label: 'Contest', icon: '🏆', color: 'bg-yellow-500' },
    { key: 'concert', label: 'Concert', icon: '🎵', color: 'bg-purple-500' },
    { key: 'market', label: 'Market', icon: '🛒', color: 'bg-green-500' },
    { key: 'other', label: 'Other', icon: '📅', color: 'bg-gray-500' },
  ];

  const filteredEvents = filterCategory === 'all'
    ? events
    : events.filter(e => e.category === filterCategory);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['month', 'week', 'day', 'list'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-medium transition-all text-sm capitalize",
                viewMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCreateEvent(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90"
        >
          + Create Event
        </button>
      </div>

      {/* Category Filter */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setFilterCategory('all')}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-all text-sm",
              filterCategory === 'all'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            All Events
          </button>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-medium transition-all text-sm whitespace-nowrap",
                filterCategory === cat.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Navigator */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <button
          onClick={() => {
            const newDate = new Date(selectedDate);
            if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
            if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
            if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
            setSelectedDate(newDate);
          }}
          className="p-2 hover:bg-background rounded-lg"
        >
          ◀
        </button>

        <div className="text-center">
          <p className="font-bold">
            {selectedDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              ...(viewMode !== 'month' && { day: 'numeric' }),
            })}
          </p>
          {viewMode === 'week' && (
            <p className="text-xs text-muted-foreground">
              Week {getWeekNumber(selectedDate)}
            </p>
          )}
        </div>

        <button
          onClick={() => {
            const newDate = new Date(selectedDate);
            if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
            if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
            if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
            setSelectedDate(newDate);
          }}
          className="p-2 hover:bg-background rounded-lg"
        >
          ▶
        </button>
      </div>

      {/* Calendar Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === 'list' ? (
        <EventListView events={filteredEvents} categories={categories} onEventSelect={setSelectedEvent} />
      ) : (
        <EventListView events={filteredEvents} categories={categories} onEventSelect={setSelectedEvent} />
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <CreateEventModal
          onClose={() => setShowCreateEvent(false)}
          onCreated={() => {
            setShowCreateEvent(false);
            fetchEvents();
          }}
        />
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          categories={categories}
          onClose={() => setSelectedEvent(null)}
          onUpdate={fetchEvents}
        />
      )}
    </div>
  );
}

function EventListView({
  events,
  categories,
  onEventSelect,
}: {
  events: Event[];
  categories: { key: Event['category']; label: string; icon: string; color: string }[];
  onEventSelect: (event: Event) => void;
}) {
  const groupedEvents = events.reduce((acc, event) => {
    const dateKey = new Date(event.startTime).toLocaleDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-4xl mb-2">📅</p>
        <p>No events scheduled</p>
        <p className="text-sm mt-1">Create an event to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date}>
          <h4 className="font-bold text-sm mb-2">{date}</h4>
          <div className="space-y-2">
            {dateEvents.map((event) => {
              const category = categories.find(c => c.key === event.category);
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  category={category}
                  onClick={() => onEventSelect(event)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventCard({
  event,
  category,
  onClick,
}: {
  event: Event;
  category?: { key: Event['category']; label: string; icon: string; color: string };
  onClick: () => void;
}) {
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const isUpcoming = startTime.getTime() > new Date().getTime();
  const isHappening = startTime.getTime() <= new Date().getTime() && endTime.getTime() >= new Date().getTime();

  return (
    <button
      onClick={onClick}
      className="w-full p-3 bg-muted rounded-lg border border-border hover:border-primary transition-all text-left"
    >
      <div className="flex items-start gap-3">
        {/* Time */}
        <div className="text-center min-w-[50px]">
          <p className="text-lg font-bold">{startTime.getHours().toString().padStart(2, '0')}</p>
          <p className="text-xs text-muted-foreground">
            {startTime.getMinutes().toString().padStart(2, '0')}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {category && (
              <span className={cn("w-2 h-2 rounded-full", category.color)} />
            )}
            <h4 className="font-bold text-sm truncate">{event.title}</h4>
            {isHappening && (
              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-500 rounded text-xs font-medium">
                LIVE
              </span>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mb-1 truncate">
            {event.description}
          </p>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>📍 {event.location}</span>
            <span>👥 {event.attendees}{event.maxAttendees ? `/${event.maxAttendees}` : ''}</span>
            {event.isRecurring && <span>🔄 {event.recurrence}</span>}
          </div>
        </div>

        {/* RSVP Status */}
        {event.isRSVP && event.rsvpStatus && (
          <div className="flex items-center">
            {event.rsvpStatus === 'going' && <span className="text-green-500">✓</span>}
            {event.rsvpStatus === 'maybe' && <span className="text-yellow-500">?</span>}
            {event.rsvpStatus === 'not-going' && <span className="text-red-500">✕</span>}
          </div>
        )}
      </div>
    </button>
  );
}

function EventDetailModal({
  event,
  categories,
  onClose,
  onUpdate,
}: {
  event: Event;
  categories: { key: Event['category']; label: string; icon: string; color: string }[];
  onClose: () => void;
  onUpdate: () => void;
}) {
  const { pushNotification, preferences } = useMobileHUD();
  const category = categories.find(c => c.key === event.category);

  const handleRSVP = async (status: 'going' | 'maybe' | 'not-going') => {
    try {
      const response = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, status }),
      });

      if (response.ok) {
        pushNotification({
          type: 'success',
          title: 'RSVP Updated',
          message: `You're ${status === 'going' ? 'attending' : status === 'maybe' ? 'maybe attending' : 'not attending'}`,
          duration: 3000,
        });

        if (preferences.hapticEnabled && navigator.vibrate) {
          navigator.vibrate(50);
        }

        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Failed to RSVP:', error);
    }
  };

  const handleSetReminder = async () => {
    try {
      await fetch('/api/events/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id }),
      });

      pushNotification({
        type: 'success',
        title: 'Reminder Set',
        message: "We'll notify you before the event starts",
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to set reminder:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {category && <span className="text-2xl">{category.icon}</span>}
            <h3 className="text-lg font-bold">{event.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm">{event.description}</p>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Start:</span>
              <span className="font-medium">
                {new Date(event.startTime).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">End:</span>
              <span className="font-medium">
                {new Date(event.endTime).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Location:</span>
              <span className="font-medium">{event.location}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Organizer:</span>
              <span className="font-medium">{event.organizer}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Attendees:</span>
              <span className="font-medium">
                {event.attendees}{event.maxAttendees ? `/${event.maxAttendees}` : ''}
              </span>
            </div>
            {event.isRecurring && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Recurrence:</span>
                <span className="font-medium capitalize">{event.recurrence}</span>
              </div>
            )}
          </div>

          {/* RSVP Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleRSVP('going')}
              className={cn(
                "py-2 rounded-lg font-medium transition-all",
                event.rsvpStatus === 'going'
                  ? "bg-green-500 text-white"
                  : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
              )}
            >
              ✓ Going
            </button>
            <button
              onClick={() => handleRSVP('maybe')}
              className={cn(
                "py-2 rounded-lg font-medium transition-all",
                event.rsvpStatus === 'maybe'
                  ? "bg-yellow-500 text-white"
                  : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
              )}
            >
              ? Maybe
            </button>
            <button
              onClick={() => handleRSVP('not-going')}
              className={cn(
                "py-2 rounded-lg font-medium transition-all",
                event.rsvpStatus === 'not-going'
                  ? "bg-red-500 text-white"
                  : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
              )}
            >
              ✕ Can't Go
            </button>
          </div>

          {/* Reminder */}
          <button
            onClick={handleSetReminder}
            disabled={event.reminderSet}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {event.reminderSet ? '🔔 Reminder Set' : 'Set Reminder'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateEventModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Event['category']>('social');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxAttendees, setMaxAttendees] = useState<number | undefined>();
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          location,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          maxAttendees,
          isRecurring,
          recurrence: isRecurring ? recurrence : undefined,
        }),
      });

      if (response.ok) {
        onCreated();
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold">Create Event</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event name..."
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this event about?"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
            >
              <option value="social">Social</option>
              <option value="raid">Raid</option>
              <option value="pvp">PvP</option>
              <option value="contest">Contest</option>
              <option value="concert">Concert</option>
              <option value="market">Market</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where will it happen?"
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Start Time</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Time</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Max Attendees (Optional)</label>
            <input
              type="number"
              min={1}
              value={maxAttendees || ''}
              onChange={(e) => setMaxAttendees(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="No limit"
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Recurring Event</span>
            </label>

            {isRecurring && (
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!title || !startTime || !endTime}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              Create Event
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-muted rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
