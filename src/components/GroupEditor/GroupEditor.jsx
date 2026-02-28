import React, { useState } from 'react';
import { X, FolderOpen } from 'lucide-react';
import { useStore, useActions, GROUP_COLORS } from '../../store/useStore.jsx';
import './GroupEditor.css';

export default function GroupEditor({ groupId, onClose }) {
    const { state } = useStore();
    const { updateGroup, setTableGroup } = useActions();
    const group = state.groups[groupId];
    const [addTableId, setAddTableId] = useState('');

    if (!group) return null;

    const handleNameChange = (name) => {
        updateGroup({ id: groupId, name });
    };

    const handleColorChange = (color) => {
        updateGroup({ id: groupId, color });
    };

    const handleAddTableToGroup = () => {
        if (!addTableId) return;
        setTableGroup(addTableId, groupId);
        setAddTableId('');
    };

    const handleRemoveFromGroup = (tableId) => {
        setTableGroup(tableId, null);
    };

    const groupTables = group.tableIds.map((tid) => state.tables[tid]).filter(Boolean);
    const availableTables = Object.values(state.tables).filter(
        (t) => !t.groupId || t.groupId !== groupId
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="group-editor modal" onClick={(e) => e.stopPropagation()}>
                <div className="group-editor__header">
                    <div className="group-editor__title-row">
                        <FolderOpen size={18} style={{ color: group.color?.text }} />
                        <input
                            className="table-editor__name-input"
                            value={group.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            spellCheck={false}
                            autoFocus
                        />
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                {/* Color picker */}
                <div className="group-editor__section">
                    <label className="table-editor__label">Color</label>
                    <div className="group-editor__colors">
                        {GROUP_COLORS.map((c, i) => (
                            <button
                                key={i}
                                className={`group-editor__color-btn ${group.color?.text === c.text ? 'group-editor__color-btn--active' : ''}`}
                                style={{ background: c.value, borderColor: c.border }}
                                onClick={() => handleColorChange(c)}
                            >
                                <span style={{ color: c.text, fontSize: '10px', fontWeight: 700 }}>
                                    {c.name[0]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tables in group */}
                <div className="group-editor__section">
                    <label className="table-editor__label">Tables in Group ({groupTables.length})</label>
                    <div className="group-editor__table-list">
                        {groupTables.map((t) => (
                            <div key={t.id} className="group-editor__table-item">
                                <div className="sidebar__item-color" style={{ background: t.color }} />
                                <span className="group-editor__table-name">{t.name}</span>
                                <button
                                    className="table-editor__col-delete"
                                    onClick={() => handleRemoveFromGroup(t.id)}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        {groupTables.length === 0 && (
                            <div className="sidebar__empty sidebar__empty--small">
                                No tables assigned yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Add table to group */}
                {availableTables.length > 0 && (
                    <div className="group-editor__section">
                        <label className="table-editor__label">Add Table</label>
                        <div className="group-editor__add-row">
                            <select
                                className="input"
                                value={addTableId}
                                onChange={(e) => setAddTableId(e.target.value)}
                            >
                                <option value="">Select table...</option>
                                {availableTables.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddTableToGroup}
                                disabled={!addTableId}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
