import { format, isToday, isTomorrow, isYesterday, isPast, differenceInDays } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  if (isToday(dateObj)) return 'Today';
  if (isTomorrow(dateObj)) return 'Tomorrow';
  if (isYesterday(dateObj)) return 'Yesterday';
  
  return format(dateObj, 'MMM dd, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  return isPast(new Date(dueDate)) && !isToday(new Date(dueDate));
};

export const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return null;
  return differenceInDays(new Date(dueDate), new Date());
};

export const getPriorityColor = (priority) => {
  const colors = {
    low: '#28a745',
    medium: '#ffc107',
    high: '#fd7e14',
    urgent: '#dc3545'
  };
  return colors[priority] || colors.medium;
};

export const getCategoryColor = (categories, categoryId) => {
  const category = categories.find(cat => cat.id === categoryId);
  return category ? category.color : '#667eea';
};

export const filterTodos = (todos, filters) => {
  return todos.filter(todo => {
    // Category filter
    if (filters.category && filters.category !== 'all' && todo.category !== filters.category) {
      return false;
    }
    
    // Priority filter
    if (filters.priority && filters.priority !== 'all' && todo.priority !== filters.priority) {
      return false;
    }
    
    // Status filter
    if (filters.status === 'completed' && !todo.completed) return false;
    if (filters.status === 'pending' && todo.completed) return false;
    if (filters.status === 'overdue' && (!todo.dueDate || !isOverdue(todo.dueDate))) return false;
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        todo.title.toLowerCase().includes(searchTerm) ||
        todo.description.toLowerCase().includes(searchTerm) ||
        todo.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    return true;
  });
};

export const sortTodos = (todos, sortBy) => {
  const sortedTodos = [...todos];
  
  switch (sortBy) {
    case 'title':
      return sortedTodos.sort((a, b) => a.title.localeCompare(b.title));
    case 'dueDate':
      return sortedTodos.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    case 'priority':
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return sortedTodos.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    case 'createdAt':
      return sortedTodos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'order':
    default:
      return sortedTodos.sort((a, b) => a.order - b.order);
  }
};

export const getCompletionStats = (todos) => {
  const total = todos.length;
  const completed = todos.filter(todo => todo.completed).length;
  const overdue = todos.filter(todo => isOverdue(todo.dueDate) && !todo.completed).length;
  const dueToday = todos.filter(todo => 
    todo.dueDate && isToday(new Date(todo.dueDate)) && !todo.completed
  ).length;
  
  return {
    total,
    completed,
    pending: total - completed,
    overdue,
    dueToday,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  };
};

export const exportTodos = (todos) => {
  const dataStr = JSON.stringify(todos, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `todos_${format(new Date(), 'yyyy-MM-dd')}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};