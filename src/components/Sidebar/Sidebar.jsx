import React, { useState, useMemo } from 'react';
import {
    Search, Plus, ChevronLeft, ChevronRight, Table2, FolderOpen,
    Trash2, Eye, Pencil, ChevronDown, ChevronUp, Layers, Key, Link
} from 'lucide-react';
import { useStore, useActions, GROUP_COLORS } from '../../store/useStore.jsx';
import './Sidebar.css';

export default function Sidebar({ collapsed, onToggle, onEditTable, onFocusTable, onEditGroup }) {
    const { state } = useStore();
    const { addTable, deleteTable, addGroup, deleteGroup, setTableGroup } = useActions();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('tables');
    const [expandedGroups, setExpandedGroups] = useState({});
    const [expandedTables, setExpandedTables] = useState({});

    const tables = useMemo(() => {
        const list = Object.values(state.tables);
        if (!search) return list;
        return list.filter((t) =>
            t.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [state.tables, search]);

    const groups = useMemo(() => Object.values(state.groups), [state.groups]);

    const ungroupedTables = useMemo(() => {
        return tables.filter((t) => !t.groupId);
    }, [tables]);

    const toggleGroupExpand = (gid) => {
        setExpandedGroups((prev) => ({ ...prev, [gid]: !prev[gid] }));
    };

    const toggleTableExpand = (tid) => {
        setExpandedTables((prev) => ({ ...prev, [tid]: !prev[tid] }));
    };

    const handleAddTable = () => {
        addTable();
    };

    const handleAddGroup = () => {
        addGroup({ name: `Group ${groups.length + 1}` });
    };

    if (collapsed) {
        return (
            <div className="sidebar sidebar--collapsed">
                <button className="sidebar__expand-btn" onClick={onToggle} data-tooltip="Expand sidebar">
                    <ChevronRight size={16} />
                </button>
                <div className="sidebar__collapsed-icons">
                    <button className="sidebar__icon-btn" onClick={handleAddTable} data-tooltip="Add table">
                        <Plus size={16} />
                    </button>
                    <button className="sidebar__icon-btn" onClick={handleAddGroup} data-tooltip="Add group">
                        <FolderOpen size={16} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="sidebar animate-slide-in-left">
            {/* Header */}
            <div className="sidebar__header">
                <div className="sidebar__logo">
                    <div className="sidebar__logo-icon">
                        <Layers size={18} />
                    </div>
                    <div>
                        <h1 className="sidebar__title">SchemaFlow</h1>
                        <p className="sidebar__subtitle">{Object.keys(state.tables).length} tables</p>
                    </div>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={onToggle}>
                    <ChevronLeft size={16} />
                </button>
            </div>

            {/* Search */}
            <div className="sidebar__search">
                <Search size={14} className="sidebar__search-icon" />
                <input
                    type="text"
                    className="input sidebar__search-input"
                    placeholder="Search tables..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Tabs */}
            <div className="sidebar__tabs">
                <button
                    className={`sidebar__tab ${activeTab === 'tables' ? 'sidebar__tab--active' : ''}`}
                    onClick={() => setActiveTab('tables')}
                >
                    <Table2 size={13} /> Tables
                </button>
                <button
                    className={`sidebar__tab ${activeTab === 'groups' ? 'sidebar__tab--active' : ''}`}
                    onClick={() => setActiveTab('groups')}
                >
                    <FolderOpen size={13} /> Groups
                </button>
            </div>

            {/* Content */}
            <div className="sidebar__content">
                {activeTab === 'tables' && (
                    <div className="sidebar__list stagger">
                        {tables.map((table) => {
                            const isExpanded = !!expandedTables[table.id];
                            return (
                                <div key={table.id} className="sidebar__table-wrapper animate-fade-in-up">
                                    <div className="sidebar__item">
                                        <div
                                            className="sidebar__item-main"
                                            onClick={() => toggleTableExpand(table.id)}
                                        >
                                            <div className="sidebar__item-chevron">
                                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </div>
                                            <div className="sidebar__item-color" style={{ background: table.color }} />
                                            <div className="sidebar__item-info" onClick={(e) => { e.stopPropagation(); onFocusTable?.(table.id); }}>
                                                <span className="sidebar__item-name">{table.name}</span>
                                                <span className="sidebar__item-meta">
                                                    {table.columns.length} col{table.columns.length !== 1 ? 's' : ''}
                                                    {table.groupId && state.groups[table.groupId] && (
                                                        <> · <span style={{ color: state.groups[table.groupId].color?.text }}>{state.groups[table.groupId].name}</span></>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="sidebar__item-actions">
                                            <button className="sidebar__action-btn" onClick={() => onEditTable?.(table.id)}>
                                                <Pencil size={12} />
                                            </button>
                                            <button className="sidebar__action-btn sidebar__action-btn--danger" onClick={() => deleteTable(table.id)}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="sidebar__table-columns">
                                            {table.columns.map((col) => (
                                                <div key={col.id} className="sidebar__col-item">
                                                    <span className="sidebar__col-icon">
                                                        {col.isPrimaryKey ? <Key size={10} /> : col.isForeignKey ? <Link size={10} /> : <div className="sidebar__col-bullet" />}
                                                    </span>
                                                    <span className="sidebar__col-name">{col.name}</span>
                                                    <span className="sidebar__col-type">{col.type}</span>
                                                </div>
                                            ))}
                                            {table.columns.length === 0 && (
                                                <div className="sidebar__empty sidebar__empty--small">No columns yet</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                        {tables.length === 0 && (
                            <div className="sidebar__empty">
                                {search ? 'No matches found' : 'No tables yet. Add one to get started!'}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'groups' && (
                    <div className="sidebar__list stagger">
                        {groups.map((group) => {
                            const groupTables = group.tableIds
                                .map((tid) => state.tables[tid])
                                .filter(Boolean);
                            const isExpanded = expandedGroups[group.id] !== false;

                            return (
                                <div key={group.id} className="sidebar__group animate-fade-in-up">
                                    <div className="sidebar__group-header" onClick={() => toggleGroupExpand(group.id)}>
                                        <div className="sidebar__group-info">
                                            <div className="sidebar__item-color" style={{ background: group.color?.text || '#818cf8' }} />
                                            <span className="sidebar__group-name">{group.name}</span>
                                            <span className="sidebar__item-meta">{groupTables.length}</span>
                                        </div>
                                        <div className="sidebar__group-actions">
                                            <button className="sidebar__action-btn" onClick={(e) => { e.stopPropagation(); onEditGroup?.(group.id); }}>
                                                <Pencil size={12} />
                                            </button>
                                            <button className="sidebar__action-btn sidebar__action-btn--danger" onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}>
                                                <Trash2 size={12} />
                                            </button>
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="sidebar__group-tables">
                                            {groupTables.map((t) => (
                                                <div key={t.id} className="sidebar__group-table" onClick={() => onFocusTable?.(t.id)}>
                                                    <div className="sidebar__item-color sidebar__item-color--small" style={{ background: t.color }} />
                                                    <span>{t.name}</span>
                                                </div>
                                            ))}
                                            {groupTables.length === 0 && (
                                                <div className="sidebar__empty sidebar__empty--small">No tables in group</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {groups.length === 0 && (
                            <div className="sidebar__empty">
                                No groups yet. Create one to organize your tables!
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Button */}
            <div className="sidebar__footer">
                <button className="btn btn-primary sidebar__add-btn" onClick={activeTab === 'tables' ? handleAddTable : handleAddGroup}>
                    <Plus size={14} />
                    Add {activeTab === 'tables' ? 'Table' : 'Group'}
                </button>
            </div>
        </div>
    );
}
