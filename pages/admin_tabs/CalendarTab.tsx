
import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../../components/GlassUI';
import { api } from '../../services/api';
import { CalendarEvent, EventType } from '../../types';
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, Moon, Sparkles, AlertTriangle, X } from 'lucide-react';

const CalendarTab: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [hijriAdjustment, setHijriAdjustment] = useState(0);
    const [loading, setLoading] = useState(false);
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState<{title: string, date: string, type: EventType, description: string}>({
        title: '', date: '', type: 'ACADEMIC', description: ''
    });
    
    // Predictor State
    const [prediction, setPrediction] = useState<{title: string, oldDate: string, newDate: string} | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [evts, config] = await Promise.all([
            api.getCalendarEvents(),
            api.getSchoolConfig()
        ]);
        setEvents(evts);
        if (config?.hijriAdjustment) setHijriAdjustment(config.hijriAdjustment);
        setLoading(false);
    };

    const handleHijriAdjust = async (val: number) => {
        const newAdj = hijriAdjustment + val;
        setHijriAdjustment(newAdj);
        await api.updateSchoolSettings({ hijriAdjustment: newAdj });
    };

    const getHijriDate = (date: Date) => {
        const adjusted = new Date(date);
        adjusted.setDate(adjusted.getDate() + hijriAdjustment);
        return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {day: 'numeric', month: 'short'}).format(adjusted);
    };

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        
        const blanks = Array(firstDay).fill(null);
        const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
        
        const allCells = [...blanks, ...days];

        return (
            <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-xs font-bold text-slate-500 uppercase py-2">{d}</div>
                ))}
                
                {allCells.map((day, idx) => {
                    if (!day) return <div key={idx} className="h-24 bg-transparent"></div>;
                    
                    const cellDateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    const dayEvents = events.filter(e => e.date === cellDateStr);
                    const isToday = new Date().toISOString().split('T')[0] === cellDateStr;
                    const isFriday = idx % 7 === 5; // Check column index for Friday

                    return (
                        <div 
                            key={idx}
                            onClick={() => { setNewEvent({...newEvent, date: cellDateStr}); setShowModal(true); }}
                            className={`h-28 border border-slate-200 dark:border-slate-700 rounded-lg p-2 relative hover:border-blue-400 cursor-pointer transition-colors bg-white dark:bg-slate-800 ${isToday ? 'ring-2 ring-blue-500' : ''} ${isFriday ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}>{day}</span>
                                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">{getHijriDate(new Date(year, month, day))}</span>
                            </div>
                            
                            <div className="mt-2 space-y-1 overflow-y-auto max-h-16 custom-scrollbar">
                                {dayEvents.map(ev => (
                                    <div key={ev.id} className={`text-[9px] px-1.5 py-0.5 rounded truncate font-medium ${
                                        ev.type === 'HOLIDAY' ? 'bg-red-100 text-red-700' :
                                        ev.type === 'EXAM' ? 'bg-orange-100 text-orange-700' :
                                        ev.type === 'RELIGIOUS' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {ev.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const handleSaveEvent = async () => {
        if (!newEvent.title || !newEvent.date) return alert("Title and Date required");
        
        // CONFLICT GUARD
        const dateObj = new Date(newEvent.date);
        const dayOfWeek = dateObj.getDay(); // 0=Sun, 5=Fri
        
        // Example Rule: Warn if Exam on Friday
        if (newEvent.type === 'EXAM' && dayOfWeek === 5) {
            if (!confirm("⚠️ Warning: Scheduling an Exam on Friday. This might conflict with Jumu'ah. Continue?")) return;
        }

        const res = await api.createCalendarEvent(newEvent);
        if (res.success) {
            setShowModal(false);
            setNewEvent({title: '', date: '', type: 'ACADEMIC', description: ''});
            loadData();
        } else {
            alert("Failed");
        }
    };

    const handleDelete = async (id: string) => {
        if(!confirm("Delete event?")) return;
        await api.deleteCalendarEvent(id);
        loadData();
    };

    const handlePredict = () => {
        // Find last year's event around this time
        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        const cutoff = lastYear.toISOString().split('T')[0];
        
        // Simple logic: Find first event from exactly 1 year ago +/- 30 days
        // Ideally this would be smarter, but for now we simulate finding one
        const similar = events.find(e => e.date < cutoff); 
        
        if (similar) {
            const nextDate = api.predictNextYearEvent(similar);
            setPrediction({
                title: similar.title,
                oldDate: similar.date,
                newDate: nextDate
            });
        } else {
            alert("No historical data found to predict from.");
        }
    };

    const confirmPrediction = () => {
        if (!prediction) return;
        setNewEvent({
            title: prediction.title,
            date: prediction.newDate,
            type: 'ACADEMIC', // Default
            description: 'Auto-predicted based on last year'
        });
        setPrediction(null);
        setShowModal(true);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()-1)))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><ChevronLeft className="w-5 h-5"/></button>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase w-40 text-center">
                        {currentDate.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}
                    </h2>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()+1)))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><ChevronRight className="w-5 h-5"/></button>
                </div>

                <div className="flex gap-3 items-center">
                    {/* Hijri Controls */}
                    <div className="flex items-center bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
                        <Moon className="w-4 h-4 text-emerald-600 mr-2"/>
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mr-2">Hijri: {hijriAdjustment > 0 ? `+${hijriAdjustment}` : hijriAdjustment}</span>
                        <div className="flex gap-1">
                            <button onClick={() => handleHijriAdjust(-1)} className="w-5 h-5 bg-white dark:bg-slate-800 rounded text-xs font-bold hover:bg-emerald-100">-</button>
                            <button onClick={() => handleHijriAdjust(1)} className="w-5 h-5 bg-white dark:bg-slate-800 rounded text-xs font-bold hover:bg-emerald-100">+</button>
                        </div>
                    </div>

                    <GlassButton onClick={handlePredict} variant="secondary" className="text-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-500"/> Smart Predict
                    </GlassButton>
                    
                    <GlassButton onClick={() => setShowModal(true)} className="flex items-center gap-1 text-xs">
                        <Plus className="w-3 h-3"/> Add Event
                    </GlassButton>
                </div>
            </div>

            {/* PREDICTION ALERT */}
            {prediction && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 rounded-xl flex justify-between items-center animate-fade-in-up">
                    <div>
                        <h4 className="font-bold text-purple-800 dark:text-purple-300 text-sm flex items-center gap-2">
                            <Sparkles className="w-4 h-4"/> Prediction Found
                        </h4>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                            Based on pattern, <b>{prediction.title}</b> might be on <b>{prediction.newDate}</b>.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setPrediction(null)} className="px-3 py-1.5 text-xs text-slate-500 font-bold">Dismiss</button>
                        <button onClick={confirmPrediction} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-purple-700">Use Date</button>
                    </div>
                </div>
            )}

            {/* CALENDAR GRID */}
            <GlassCard className="p-4">
                {renderCalendar()}
            </GlassCard>

            {/* EVENT LIST (Below) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <h3 className="font-bold text-sm text-slate-500 uppercase mb-3">Upcoming Events</h3>
                <div className="space-y-2">
                    {events.filter(e => new Date(e.date) >= new Date()).slice(0, 5).map(e => (
                        <div key={e.id} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group transition-all">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-8 rounded-full ${e.type === 'HOLIDAY' ? 'bg-red-500' : e.type === 'EXAM' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">{e.title}</h4>
                                    <p className="text-xs text-slate-500">{new Date(e.date).toDateString()} • {e.type}</p>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(e.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}
                    {events.length === 0 && <p className="text-center text-xs text-slate-400 py-4">No events scheduled.</p>}
                </div>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in-up">
                    <GlassCard className="w-full max-w-sm relative border-t-4 border-t-blue-500">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Add Event</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Event Title</label>
                                <GlassInput placeholder="e.g. Annual Day" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} autoFocus />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Date</label>
                                <GlassInput type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Type</label>
                                <GlassSelect value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}>
                                    <option value="ACADEMIC">Academic</option>
                                    <option value="EXAM">Exam</option>
                                    <option value="HOLIDAY">Holiday</option>
                                    <option value="RELIGIOUS">Religious</option>
                                    <option value="ACTIVITY">Activity</option>
                                </GlassSelect>
                            </div>
                            <GlassButton onClick={handleSaveEvent} className="w-full bg-blue-600 hover:bg-blue-700">Save Event</GlassButton>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default CalendarTab;
