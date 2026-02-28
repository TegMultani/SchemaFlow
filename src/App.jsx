import React, { useState, useCallback, useEffect } from 'react';
import DiagramCanvas from './components/Canvas/DiagramCanvas.jsx';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import TableEditor from './components/TableEditor/TableEditor.jsx';
import GroupEditor from './components/GroupEditor/GroupEditor.jsx';
import Toolbar from './components/Toolbar/Toolbar.jsx';
import ProjectModal from './components/ProjectModal/ProjectModal.jsx';
import { useStore, useActions } from './store/useStore.jsx';
import './App.css';

function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast-${type}`}>
            {message}
        </div>
    );
}

export default function App() {
    const { state } = useStore();
    const { addTable, addGroup, deleteTable, deleteGroup, setProjectCode } = useActions();

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [editingTableId, setEditingTableId] = useState(null);
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const handleEditTable = useCallback((tableId) => {
        setEditingTableId(tableId);
    }, []);

    const handleDeleteTable = useCallback((tableId) => {
        deleteTable(tableId);
        if (editingTableId === tableId) setEditingTableId(null);
        addToast('Table deleted', 'info');
    }, [deleteTable, editingTableId, addToast]);

    const handleEditGroup = useCallback((groupId) => {
        setEditingGroupId(groupId);
    }, []);

    const handleDeleteGroup = useCallback((groupId) => {
        deleteGroup(groupId);
        if (editingGroupId === groupId) setEditingGroupId(null);
        addToast('Group deleted', 'info');
    }, [deleteGroup, editingGroupId, addToast]);

    const handleAddTable = useCallback(() => {
        addTable();
        addToast('Table created', 'success');
    }, [addTable, addToast]);

    const handleAddGroup = useCallback(() => {
        addGroup({ name: `Group ${Object.keys(state.groups).length + 1}` });
        addToast('Group created', 'success');
    }, [addGroup, state.groups, addToast]);

    const handleFocusTable = useCallback((tableId) => {
        // Could use reactflow.fitView to zoom to node — for now just open editor
        setEditingTableId(tableId);
    }, []);

    // Handle connection from canvas
    const { addRelationship } = useActions();
    const handleEdgeConnect = useCallback((connection) => {
        addRelationship(connection);
        addToast('Relationship created', 'success');
    }, [addRelationship, addToast]);

    // Handle URL ?code= param
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const urlCode = queryParams.get('code');
        if (urlCode && urlCode.length === 6 && !state.projectCode) {
            setProjectCode(urlCode.toUpperCase());
        }
    }, [setProjectCode, state.projectCode]);

    // Reflect active project code in URL
    useEffect(() => {
        if (state.projectCode) {
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('code', state.projectCode);
            window.history.replaceState({}, '', newUrl);
        }
    }, [state.projectCode]);

    return (
        <div className="app">
            {!state.projectCode && <ProjectModal />}

            {/* Sidebar */}
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                onEditTable={handleEditTable}
                onFocusTable={handleFocusTable}
                onEditGroup={handleEditGroup}
            />

            {/* Canvas */}
            <div className="app__canvas">
                <DiagramCanvas
                    onEditTable={handleEditTable}
                    onDeleteTable={handleDeleteTable}
                    onEditGroup={handleEditGroup}
                    onDeleteGroup={handleDeleteGroup}
                    onConnect={handleEdgeConnect}
                />

                {/* Table Editor slide-in */}
                {editingTableId && state.tables[editingTableId] && (
                    <TableEditor
                        tableId={editingTableId}
                        onClose={() => setEditingTableId(null)}
                    />
                )}
            </div>

            {/* Group Editor modal */}
            {editingGroupId && state.groups[editingGroupId] && (
                <GroupEditor
                    groupId={editingGroupId}
                    onClose={() => setEditingGroupId(null)}
                />
            )}

            {/* Toolbar */}
            <Toolbar
                state={state}
                onAddTable={handleAddTable}
                onAddGroup={handleAddGroup}
                onToast={addToast}
            />

            {/* Toast Notifications */}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            {/* Active Project Code Overlay */}
            {state.projectCode && (
                <div className="app__project-code">
                    Project Code: <strong>{state.projectCode}</strong>
                </div>
            )}
        </div>
    );
}
