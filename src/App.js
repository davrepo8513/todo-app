import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  FaPlus, FaSearch, FaCog, FaCalendarAlt, 
  FaFlag, FaTag, FaEdit, FaTrash, FaTimes,
  FaDownload, FaBars, FaUser, FaUserCheck,
  FaClock, FaCheckCircle, FaHourglassHalf
} from 'react-icons/fa';
import './App.css';
import { 
  getTodos, addTodo, updateTodo, deleteTodo, reorderTodos,
  getCategories, getSettings, updateSettings 
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
    priority: 'all'
  });
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    category: 'personal',
    priority: 'medium',
    dueDate: '',
    tags: [],
    assignedBy: '',
    assignedTo: '',
    status: 'pending'
  });
  const [newTag, setNewTag] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Task board columns
  const columns = {
    pending: { title: 'Pending', icon: FaClock, color: '#ffc107' },
    inprogress: { title: 'In Progress', icon: FaHourglassHalf, color: '#17a2b8' },
    completed: { title: 'Completed', icon: FaCheckCircle, color: '#28a745' }
  };

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
      tags: [],
      assignedBy: '',
      assignedTo: '',
      status: 'pending'
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

    const { source, destination } = result;
    
    // If dropped in the same position, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const todoId = result.draggableId;
    const newStatus = destination.droppableId;
    
    // Update todo status based on column
    const updates = { status: newStatus };
    if (newStatus === 'completed') {
      updates.completed = true;
    } else {
      updates.completed = false;
    }

    handleUpdateTodo(todoId, updates);
  };

  const handleEditTodo = () => {
    if (!editingTodo.title.trim()) {
      alert('Please enter a todo title!');
      return;
    }

    handleUpdateTodo(editingTodo.id, editingTodo);
    setEditingTodo(null);
    alert('Todo updated successfully!');
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

  const filteredTodos = filterTodos(todos, filters);
  const stats = getCompletionStats(todos);

  // Group todos by status
  const todosByStatus = {
    pending: filteredTodos.filter(todo => todo.status === 'pending' || (!todo.status && !todo.completed)),
    inprogress: filteredTodos.filter(todo => todo.status === 'inprogress'),
    completed: filteredTodos.filter(todo => todo.status === 'completed' || todo.completed)
  };

  return (
    <div className={`app ${settings.theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>📋 Task Manager</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(false)}
          >
            <FaTimes />
          </button>
        </div>

        <div className="sidebar-stats">
          <div className="stat-item">
            <span className="stat-number">{todosByStatus.pending.length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{todosByStatus.inprogress.length}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{todosByStatus.completed.length}</span>
            <span className="stat-label">Completed</span>
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
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              <FaBars />
            </button>
            <h1>Task Board</h1>
          </div>

          <div className="header-actions">
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search tasks..."
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

        {/* Task Board */}
        <div className="task-board">
          <DragDropContext onDragEnd={handleDragEnd}>
            {Object.entries(columns).map(([columnId, column]) => (
              <div key={columnId} className="task-column">
                <div className="column-header">
                  <div className="column-title">
                    <column.icon style={{ color: column.color }} />
                    <h3>{column.title}</h3>
                    <span className="task-count">{todosByStatus[columnId].length}</span>
                  </div>
                </div>

                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`task-list ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                    >
                      {todosByStatus[columnId].length === 0 ? (
                        <div className="empty-column">
                          <p>No {column.title.toLowerCase()} tasks</p>
                        </div>
                      ) : (
                        todosByStatus[columnId].map((todo, index) => (
                          <Draggable key={todo.id} draggableId={todo.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`task-card ${snapshot.isDragging ? 'dragging' : ''} ${
                                  isOverdue(todo.dueDate) && !todo.completed ? 'overdue' : ''
                                }`}
                              >
                                <div className="task-header">
                                  <h4 className="task-title">{todo.title}</h4>
                                  <div className="task-actions">
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

                                {todo.description && (
                                  <p className="task-description">{todo.description}</p>
                                )}

                                <div className="task-meta">
                                  <div className="task-badges">
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

                                  {todo.dueDate && (
                                    <div className={`due-date ${isOverdue(todo.dueDate) ? 'overdue' : ''}`}>
                                      <FaCalendarAlt /> {formatDate(todo.dueDate)}
                                    </div>
                                  )}

                                  {(todo.assignedBy || todo.assignedTo) && (
                                    <div className="assignment-info">
                                      {todo.assignedBy && (
                                        <div className="assigned-by">
                                          <FaUser /> By: {todo.assignedBy}
                                        </div>
                                      )}
                                      {todo.assignedTo && (
                                        <div className="assigned-to">
                                          <FaUserCheck /> To: {todo.assignedTo}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {todo.tags && todo.tags.length > 0 && (
                                    <div className="task-tags">
                                      {todo.tags.map(tag => (
                                        <span key={tag} className="tag">
                                          <FaTag /> {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </DragDropContext>
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

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={newTodo.status}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="inprogress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={newTodo.dueDate}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Assigned By</label>
                  <input
                    type="text"
                    value={newTodo.assignedBy}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, assignedBy: e.target.value }))}
                    placeholder="Who assigned this task?"
                  />
                </div>

                <div className="form-group">
                  <label>Assigned To</label>
                  <input
                    type="text"
                    value={newTodo.assignedTo}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, assignedTo: e.target.value }))}
                    placeholder="Who is responsible for this task?"
                  />
                </div>
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

      {/* Edit Todo Modal */}
      {editingTodo && (
        <div className="modal-overlay" onClick={() => setEditingTodo(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Task</h2>
              <button onClick={() => setEditingTodo(null)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={editingTodo.title}
                  onChange={(e) => setEditingTodo(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title..."
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingTodo.description}
                  onChange={(e) => setEditingTodo(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description..."
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={editingTodo.category}
                    onChange={(e) => setEditingTodo(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={editingTodo.priority}
                    onChange={(e) => setEditingTodo(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editingTodo.status || 'pending'}
                    onChange={(e) => setEditingTodo(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="inprogress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={editingTodo.dueDate}
                    onChange={(e) => setEditingTodo(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Assigned By</label>
                  <input
                    type="text"
                    value={editingTodo.assignedBy || ''}
                    onChange={(e) => setEditingTodo(prev => ({ ...prev, assignedBy: e.target.value }))}
                    placeholder="Who assigned this task?"
                  />
                </div>

                <div className="form-group">
                  <label>Assigned To</label>
                  <input
                    type="text"
                    value={editingTodo.assignedTo || ''}
                    onChange={(e) => setEditingTodo(prev => ({ ...prev, assignedTo: e.target.value }))}
                    placeholder="Who is responsible for this task?"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tags</label>
                <div className="tags-list">
                  {(editingTodo.tags || []).map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                      <button onClick={() => setEditingTodo(prev => ({
                        ...prev,
                        tags: prev.tags.filter(t => t !== tag)
                      }))}>
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
                onClick={() => setEditingTodo(null)}
              >
                Cancel
              </button>
              <button 
                className="btn primary"
                onClick={handleEditTodo}
              >
                Update Task
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

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
