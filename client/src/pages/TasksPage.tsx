import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  Calendar,
  CheckCircle2,
  RotateCcw,
  Trash2,
  User as UserIcon,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Task, User } from '../types';
import { formatDate, formatDateTime } from '../utils/formatters';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { Modal } from '../components/ui/Modal';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';

export const TasksPage: React.FC = () => {
  const { user, isAdmin, isManager } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [counts, setCounts] = useState<{ today: number; overdue: number; upcoming: number }>({
    today: 0,
    overdue: 0,
    upcoming: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [view, setView] = useState<'my' | 'team'>('my');
  const [timeFilter, setTimeFilter] = useState<'today' | 'overdue' | 'upcoming' | 'done' | 'all'>('all');
  const [priority, setPriority] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    dueDate: '',
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks', {
        view,
        filter: timeFilter !== 'all' ? timeFilter : undefined,
        priority: priority || undefined,
      });
      if (res.success) {
        setTasks(res.data);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.success) setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [view, timeFilter, priority]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'Done' ? 'To Do' : 'Done';
    try {
      await api.put(`/tasks/${task._id}/status`, { status: newStatus });
      fetchTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const res = await api.post('/tasks', {
        ...formData,
        assignedTo: formData.assignedTo || (isAdmin || isManager ? undefined : user?._id),
      });

      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          title: '',
          description: '',
          assignedTo: '',
          priority: 'Medium',
          dueDate: '',
        });
        fetchTasks();
      }
    } catch (err: any) {
      alert(err.message || 'Error creating task');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tasks & Follow-Ups</h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Stay on top of qualification calls, demo deliverables, and customer actions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Scope Switcher (My vs Team) & Status Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        {/* Scope switcher */}
        {(isAdmin || isManager) ? (
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setView('my')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                view === 'my'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setView('team')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                view === 'team'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Team Tasks ({isAdmin ? 'All Office' : 'My Team'})
            </button>
          </div>
        ) : (
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
            My Assigned Tasks
          </span>
        )}

        {/* Time Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
              timeFilter === 'all'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Active
          </button>
          <button
            onClick={() => setTimeFilter('today')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
              timeFilter === 'today'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Due Today ({counts.today})
          </button>
          <button
            onClick={() => setTimeFilter('overdue')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
              timeFilter === 'overdue'
                ? 'bg-rose-50 text-rose-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Overdue ({counts.overdue})
          </button>
          <button
            onClick={() => setTimeFilter('upcoming')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
              timeFilter === 'upcoming'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Upcoming ({counts.upcoming})
          </button>
          <button
            onClick={() => setTimeFilter('done')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
              timeFilter === 'done'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={5} />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks found"
            description="You have no tasks matching this filter view."
            actionLabel="Create Task"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const isOverdue =
                task.status !== 'Done' && new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

              return (
                <div
                  key={task._id}
                  className={`p-4 sm:p-5 flex items-start justify-between hover:bg-slate-50/70 transition ${
                    task.status === 'Done' ? 'opacity-60 bg-slate-50/30' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    {/* Completion Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(task)}
                      className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border transition ${
                        task.status === 'Done'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-indigo-600 bg-white'
                      }`}
                    >
                      {task.status === 'Done' && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-sm font-semibold ${
                            task.status === 'Done'
                              ? 'line-through text-slate-400'
                              : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </span>
                        <PriorityBadge priority={task.priority} />
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded uppercase">
                            Overdue
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          Due: {formatDate(task.dueDate)}
                        </span>
                        <span className="flex items-center">
                          <UserIcon className="w-3.5 h-3.5 mr-1" />
                          {task.assignedTo?.name || 'Unassigned'}
                        </span>
                        {task.completedAt && (
                          <span className="text-emerald-600 font-medium">
                            Completed on {formatDate(task.completedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hidden sm:block"
                    >
                      {task.status === 'Done' ? 'Reopen' : 'Mark Done'}
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Task Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Schedule commercial contract walk-through call"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            {(isAdmin || isManager) && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assignee
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="">Assign to Myself ({user?.name})</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description & Action Items
            </label>
            <textarea
              rows={3}
              placeholder="Detailed instructions or context for this task..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {formLoading ? 'Saving...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
