import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  FaPlus, FaSearch, FaFilter, FaCog, FaCalendarAlt, 
  FaFlag, FaTag, FaEdit, FaTrash, FaCheck, FaTimes,
  FaDownload, FaUpload, FaSun, FaMoon, FaBars,
  FaChevronDown, FaChevronUp, FaExclamationTriangle
} from 'react-icons/fa';
import './App.css';
import { 
  getTodos, addTodo, updateTodo, deleteTodo, reorderTodos,
  getCategories, addCategory, getSettings, updateSettings 
} from './utils/database';
import { 
  formatDate, isOverdue, getPriorityColor, getCategoryColor,
  filterTodos, sortTodos, getCompletionStats, exportTodos
} from './utils/helpers';

function App() {
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    priority: 'all',
    status: 'all'
  });
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    category: 'personal',
    priority: 'medium',
    dueDate: '',
    tags: []
  });
  const [newTag, setNewTag] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTodos(getTodos());
    setCategories(getCategories());
    setSettings(getSettings());
  };

  const handleAddTodo = () => {
    if (!newTodo.title.trim()) {
      alert('Please enter a todo title!');
      return;
    }

    const todo = addTodo(newTodo);
    setTodos(prev => [...prev, todo]);
    setNewTodo({
      title: '',
      description: '',
      category: 'personal',
      priority: 'medium',
      dueDate: '',
      tags: []
    });
    setShowAddForm(false);
    alert('Todo added successfully!');
  };

  const handleUpdateTodo = (id, updates) => {
    const updatedTodo = updateTodo(id, updates);
    if (updatedTodo) {
      setTodos(prev => prev.map(todo => todo.id === id ? updatedTodo : todo));
    }
  };

  const handleDeleteTodo = (id) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      deleteTodo(id);
      setTodos(prev => prev.filter(todo => todo.id !== id));
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(filteredAndSortedTodos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderTodos(items);
    setTodos(items);
  };

  const handleToggleComplete = (id) => {
    const todo = todos.find(t => t.id === id);
    handleUpdateTodo(id, { completed: !todo.completed });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !newTodo.tags.includes(newTag.trim())) {
      setNewTodo(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNewTodo(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const filteredAndSortedTodos = sortTodos(
    filterTodos(todos, filters),
    settings.sortBy || 'order'
  );

  const stats = getCompletionStats(todos);

  return (
    <div className={`app ${settings.theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>📋 Advanced Todo</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FaBars />
          </button>
        </div>

        <div className="sidebar-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.overdue}</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>

        <div className="sidebar-filters">
          <h3>Filters</h3>
          
          <div className="filter-group">
            <label>Category</label>
            <select 
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Priority</label>
            <select 
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="sidebar-actions">
          <button 
            className="action-btn"
            onClick={() => exportTodos(todos)}
          >
            <FaDownload /> Export
          </button>
          <button 
            className="action-btn"
            onClick={() => setShowSettings(true)}
          >
            <FaCog /> Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <button 
              className="sidebar-toggle mobile-only"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FaBars />
            </button>
            <h1>My Tasks</h1>
          </div>

          <div className="header-actions">
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search todos..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <button 
              className="add-btn"
              onClick={() => setShowAddForm(true)}
            >
              <FaPlus /> Add Task
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-info">
            <span>Progress: {stats.completionRate}%</span>
            <span>{stats.completed} of {stats.total} completed</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${stats.completionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Todos List */}
        <div className="todos-container">
          {filteredAndSortedTodos.length === 0 ? (
            <div className="empty-state">
              <h3>No todos found</h3>
              <p>Create your first todo or adjust your filters</p>
              <button 
                className="add-btn"
                onClick={() => setShowAddForm(true)}
              >
                <FaPlus /> Add Your First Task
              </button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="todos">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="todos-list"
                  >
                    {filteredAndSortedTodos.map((todo, index) => (
                      <Draggable key={todo.id} draggableId={todo.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`todo-item ${todo.completed ? 'completed' : ''} ${
                              snapshot.isDragging ? 'dragging' : ''
                            } ${isOverdue(todo.dueDate) && !todo.completed ? 'overdue' : ''}`}
                          >
                            <div className="todo-main">
                              <div className="todo-checkbox-container">
                                <input
                                  type="checkbox"
                                  checked={todo.completed}
                                  onChange={() => handleToggleComplete(todo.id)}
                                  className="todo-checkbox"
                                />
                                <span className="checkmark"></span>
                              </div>

                              <div className="todo-content">
                                <div className="todo-header">
                                  <h3 className="todo-title">{todo.title}</h3>
                                  <div className="todo-meta">
                                    <span 
                                      className="priority-badge"
                                      style={{ backgroundColor: getPriorityColor(todo.priority) }}
                                    >
                                      {todo.priority}
                                    </span>
                                    <span 
                                      className="category-badge"
                                      style={{ backgroundColor: getCategoryColor(categories, todo.category) }}
                                    >
                                      {categories.find(c => c.id === todo.category)?.name || 'Personal'}
                                    </span>
                                  </div>
                                </div>

                                {todo.description && (
                                  <p className="todo-description">{todo.description}</p>
                                )}

                                <div className="todo-footer">
                                  <div className="todo-info">
                                    {todo.dueDate && (
                                      <span className={`due-date ${isOverdue(todo.dueDate) ? 'overdue' : ''}`}>
                                        <FaCalendarAlt /> {formatDate(todo.dueDate)}
                                      </span>
                                    )}
                                    {todo.tags.length > 0 && (
                                      <div className="tags">
                                        {todo.tags.map(tag => (
                                          <span key={tag} className="tag">
                                            <FaTag /> {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="todo-actions">
                                    <button
                                      className="action-btn edit"
                                      onClick={() => setEditingTodo(todo)}
                                    >
                                      <FaEdit />
                                    </button>
                                    <button
                                      className="action-btn delete"
                                      onClick={() => handleDeleteTodo(todo.id)}
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* Add Todo Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Task</h2>
              <button onClick={() => setShowAddForm(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title..."
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTodo.description}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description..."
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newTodo.category}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newTodo.priority}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={newTodo.dueDate}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Tags</label>
                <div className="tags-input">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <button type="button" onClick={handleAddTag}>
                    <FaPlus />
                  </button>
                </div>
                <div className="tags-list">
                  {newTodo.tags.map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)}>
                        <FaTimes />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn secondary"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn primary"
                onClick={handleAddTodo}
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Settings</h2>
              <button onClick={() => setShowSettings(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Theme</label>
                <select
                  value={settings.theme || 'light'}
                  onChange={(e) => {
                    const newSettings = { ...settings, theme: e.target.value };
                    setSettings(newSettings);
                    updateSettings(newSettings);
                  }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className="form-group">
                <label>Sort By</label>
                <select
                  value={settings.sortBy || 'order'}
                  onChange={(e) => {
                    const newSettings = { ...settings, sortBy: e.target.value };
                    setSettings(newSettings);
                    updateSettings(newSettings);
                  }}
                >
                  <option value="order">Custom Order</option>
                  <option value="title">Title</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="createdAt">Created Date</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn primary"
                onClick={() => setShowSettings(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay mobile-only"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
