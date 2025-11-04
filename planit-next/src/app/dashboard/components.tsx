import { Task } from '@/types';

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
);

type StatCardProps = Readonly<{
  icon: string;
  label: string;
  value: number;
  color: string;
}>;

export function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
      <div className={`text-2xl p-3 rounded-lg ${colorMap[color as keyof typeof colorMap]}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

type TaskCardProps = Readonly<{
  task: Task;
}>;

export function TaskCard({ task }: TaskCardProps) {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium mb-1">{task.title}</h3>
          <p className="text-sm text-gray-500">
            Due: {new Date(task.dueDate || '').toLocaleDateString()}
          </p>
        </div>
        <div className="space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityStyles(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusStyles(task.status)}`}>
            {task.status}
          </span>
        </div>
      </div>
    </div>
  );
}

type PriorityItemProps = Readonly<{
  label: string;
  count: number;
  color: string;
}>;

export function PriorityItem({ label, count, color }: PriorityItemProps) {
  const colorMap = {
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600',
  };

  return (
    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
      <span className="text-gray-600">{label}</span>
      <span className={`text-lg font-semibold ${colorMap[color as keyof typeof colorMap]}`}>
        {count}
      </span>
    </div>
  );
}