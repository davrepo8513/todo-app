import { v4 as uuidv4 } from 'uuid';

const DB_KEY = 'advanced_todo_app';

// Initialize database
const initDB = () => {
  const defaultData = {
    todos: [],
    categories: [
      { id: 'personal', name: 'Personal', color: '#667eea' },
      { id: 'work', name: 'Work', color: '#f093fb' },
      { id: 'shopping', name: 'Shopping', color: '#4facfe' },
      { id: 'health', name: 'Health', color: '#43e97b' }
    ],
    settings: {
      theme: 'light',
      sortBy: 'createdAt',
      showCompleted: true
    }
  };
  
  if (!localStorage.getItem(DB_KEY)) {
    localStorage.setItem(DB_KEY, JSON.stringify(defaultData));
  }
  return JSON.parse(localStorage.getItem(DB_KEY));
};

// Get all data
export const getDB = () => {
  return JSON.parse(localStorage.getItem(DB_KEY)) || initDB();
};

// Save data
const saveDB = (data) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

// Todo operations
export const getTodos = () => {
  const db = getDB();
  return db.todos;
};

export const addTodo = (todoData) => {
  const db = getDB();
  const newTodo = {
    id: uuidv4(),
    title: todoData.title,
    description: todoData.description || '',
    category: todoData.category || 'personal',
    priority: todoData.priority || 'medium',
    dueDate: todoData.dueDate || null,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: todoData.tags || [],
    subtasks: todoData.subtasks || [],
    order: db.todos.length
  };
  
  db.todos.push(newTodo);
  saveDB(db);
  return newTodo;
};

export const updateTodo = (id, updates) => {
  const db = getDB();
  const todoIndex = db.todos.findIndex(todo => todo.id === id);
  
  if (todoIndex !== -1) {
    db.todos[todoIndex] = {
      ...db.todos[todoIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveDB(db);
    return db.todos[todoIndex];
  }
  return null;
};

export const deleteTodo = (id) => {
  const db = getDB();
  db.todos = db.todos.filter(todo => todo.id !== id);
  saveDB(db);
};

export const reorderTodos = (todos) => {
  const db = getDB();
  db.todos = todos.map((todo, index) => ({
    ...todo,
    order: index
  }));
  saveDB(db);
};

// Category operations
export const getCategories = () => {
  const db = getDB();
  return db.categories;
};

export const addCategory = (categoryData) => {
  const db = getDB();
  const newCategory = {
    id: uuidv4(),
    name: categoryData.name,
    color: categoryData.color
  };
  
  db.categories.push(newCategory);
  saveDB(db);
  return newCategory;
};

// Settings operations
export const getSettings = () => {
  const db = getDB();
  return db.settings;
};

export const updateSettings = (settings) => {
  const db = getDB();
  db.settings = { ...db.settings, ...settings };
  saveDB(db);
};

// Initialize on import
initDB();