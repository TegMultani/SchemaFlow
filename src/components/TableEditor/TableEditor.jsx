import React, { useState, useEffect, useCallback } from 'react';
import {
    X, Plus, Trash2, GripVertical, ChevronDown, Key, Hash,
    Link, Palette, ArrowRight
} from 'lucide-react';
import { useStore, useActions, DATA_TYPES, TABLE_COLORS, GROUP_COLORS, RELATIONSHIP_TYPES } from '../../store/useStore.jsx';
import './TableEditor.css';

export default function TableEditor({ tableId, onClose }) {
    const { state } = useStore();
    const {
        updateTable, addColumn, updateColumn, deleteColumn,
        addRelationship, setTableGroup,
    } = useActions();
    const table = state.tables[tableId];
    const [activeSection, setActiveSection] = useState('columns');

    // Relationship form state
    const [relForm, setRelForm] = useState({
        sourceColumnId: '',
        targetTableId: '',
        targetColumnId: '',
        type: '1:N',
    });

    if (!table) return null;

    const handleNameChange = (name) => {
        updateTable({ id: tableId, name });
    };

    const handleColorChange = (color) => {
        updateTable({ id: tableId, color });
    };

    const handleGroupChange = (groupId) => {
        setTableGroup(tableId, groupId || null);
    };

    const handleAddColumn = () => {
        addColumn(tableId, {
            name: `col_${table.columns.length + 1}`,
            type: 'VARCHAR',
        });
    };

    const handleUpdateColumn = (columnId, field, value) => {
        updateColumn({ tableId, columnId, [field]: value });
    };

    const handleDeleteColumn = (columnId) => {
        deleteColumn(tableId, columnId);
    };

    const handleAddRelationship = () => {
        if (!relForm.sourceColumnId || !relForm.targetTableId || !relForm.targetColumnId) return;
        addRelationship({
            sourceTableId: tableId,
            sourceColumnId: relForm.sourceColumnId,
            targetTableId: relForm.targetTableId,
            targetColumnId: relForm.targetColumnId,
            type: relForm.type,
        });
        setRelForm({ sourceColumnId: '', targetTableId: '', targetColumnId: '', type: '1:N' });
    };

    const otherTables = Object.values(state.tables).filter((t) => t.id !== tableId);
    const targetTable = relForm.targetTableId ? state.tables[relForm.targetTableId] : null;
    const groups = Object.values(state.groups);

    // Get existing relationships for this table
    const tableRelationships = Object.values(state.relationships).filter(
        (r) => r.sourceTableId === tableId || r.targetTableId === tableId
    );

    return (
        <div className="table-editor glass-heavy animate-slide-in-right">
            {/* Header */}
            <div className="table-editor__header">
                <div className="table-editor__header-info">
                    <div className="table-editor__color-dot" style={{ background: table.color }} />
                    <input
                        className="table-editor__name-input"
                        value={table.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        spellCheck={false}
                    />
                </div>
                <button className="btn btn-ghost btn-icon" onClick={onClose}>
                    <X size={16} />
                </button>
            </div>

            {/* Color & Group */}
            <div className="table-editor__meta">
                <div className="table-editor__field">
                    <label className="table-editor__label">Color</label>
                    <div className="table-editor__colors">
                        {TABLE_COLORS.map((c) => (
                            <button
                                key={c.value}
                                className={`table-editor__color-btn ${table.color === c.value ? 'table-editor__color-btn--active' : ''}`}
                                style={{ background: c.value }}
                                onClick={() => handleColorChange(c.value)}
                                data-tooltip={c.name}
                            />
                        ))}
                    </div>
                </div>
                <div className="table-editor__field">
                    <label className="table-editor__label">Group</label>
                    <select
                        className="input"
                        value={table.groupId || ''}
                        onChange={(e) => handleGroupChange(e.target.value)}
                    >
                        <option value="">No group</option>
                        {groups.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="table-editor__tabs">
                <button
                    className={`table-editor__tab ${activeSection === 'columns' ? 'table-editor__tab--active' : ''}`}
                    onClick={() => setActiveSection('columns')}
                >
                    Columns ({table.columns.length})
                </button>
                <button
                    className={`table-editor__tab ${activeSection === 'relationships' ? 'table-editor__tab--active' : ''}`}
                    onClick={() => setActiveSection('relationships')}
                >
                    Relations ({tableRelationships.length})
                </button>
            </div>

            {/* Columns Section */}
            {activeSection === 'columns' && (
                <div className="table-editor__section">
                    <div className="table-editor__columns stagger">
                        {table.columns.map((col, idx) => (
                            <div key={col.id} className="table-editor__column animate-fade-in-up">
                                <div className="table-editor__col-header">
                                    <GripVertical size={12} className="table-editor__col-grip" />
                                    <input
                                        className="input input-mono table-editor__col-name"
                                        value={col.name}
                                        onChange={(e) => handleUpdateColumn(col.id, 'name', e.target.value)}
                                        spellCheck={false}
                                        placeholder="column_name"
                                    />
                                    <input
                                        className="input input-mono table-editor__col-type"
                                        value={col.type}
                                        onChange={(e) => handleUpdateColumn(col.id, 'type', e.target.value)}
                                        list="col-types-list"
                                        placeholder="Type"
                                        spellCheck={false}
                                    />
                                    <button
                                        className="table-editor__col-delete"
                                        onClick={() => handleDeleteColumn(col.id)}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <div className="table-editor__col-constraints">
                                    <label className="checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            checked={col.isPrimaryKey}
                                            onChange={(e) => handleUpdateColumn(col.id, 'isPrimaryKey', e.target.checked)}
                                        />
                                        PK
                                    </label>
                                    <label className="checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            checked={col.isForeignKey}
                                            onChange={(e) => handleUpdateColumn(col.id, 'isForeignKey', e.target.checked)}
                                        />
                                        FK
                                    </label>
                                    <label className="checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            checked={!col.isNullable}
                                            onChange={(e) => handleUpdateColumn(col.id, 'isNullable', !e.target.checked)}
                                        />
                                        NOT NULL
                                    </label>
                                    <label className="checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            checked={col.isUnique}
                                            onChange={(e) => handleUpdateColumn(col.id, 'isUnique', e.target.checked)}
                                        />
                                        UNIQUE
                                    </label>
                                    <label className="checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            checked={col.isIndexed}
                                            onChange={(e) => handleUpdateColumn(col.id, 'isIndexed', e.target.checked)}
                                        />
                                        INDEX
                                    </label>
                                </div>
                                {/* Default value */}
                                <div className="table-editor__col-default">
                                    <input
                                        className="input input-mono table-editor__col-default-input"
                                        value={col.defaultValue || ''}
                                        onChange={(e) => handleUpdateColumn(col.id, 'defaultValue', e.target.value)}
                                        placeholder="Default value..."
                                        spellCheck={false}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="btn btn-surface table-editor__add-col" onClick={handleAddColumn}>
                        <Plus size={14} /> Add Column
                    </button>
                </div>
            )}

            {/* Relationships Section */}
            {activeSection === 'relationships' && (
                <div className="table-editor__section">
                    {/* Existing relationships */}
                    <div className="table-editor__existing-rels">
                        {tableRelationships.map((rel) => {
                            const srcTable = state.tables[rel.sourceTableId];
                            const tgtTable = state.tables[rel.targetTableId];
                            const srcCol = srcTable?.columns.find((c) => c.id === rel.sourceColumnId);
                            const tgtCol = tgtTable?.columns.find((c) => c.id === rel.targetColumnId);
                            return (
                                <div key={rel.id} className="table-editor__rel-item">
                                    <span className="table-editor__rel-label">
                                        {srcTable?.name}.{srcCol?.name}
                                    </span>
                                    <span className="table-editor__rel-type badge badge-fk">{rel.type}</span>
                                    <ArrowRight size={12} className="table-editor__rel-arrow" />
                                    <span className="table-editor__rel-label">
                                        {tgtTable?.name}.{tgtCol?.name}
                                    </span>
                                </div>
                            );
                        })}
                        {tableRelationships.length === 0 && (
                            <div className="sidebar__empty sidebar__empty--small">No relationships yet</div>
                        )}
                    </div>

                    {/* Add relationship form */}
                    <div className="table-editor__rel-form">
                        <div className="table-editor__label">New Relationship</div>

                        <div className="table-editor__field">
                            <label className="table-editor__label table-editor__label--small">From column</label>
                            <select
                                className="input"
                                value={relForm.sourceColumnId}
                                onChange={(e) => setRelForm({ ...relForm, sourceColumnId: e.target.value })}
                            >
                                <option value="">Select column...</option>
                                {table.columns.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="table-editor__field">
                            <label className="table-editor__label table-editor__label--small">Type</label>
                            <select
                                className="input"
                                value={relForm.type}
                                onChange={(e) => setRelForm({ ...relForm, type: e.target.value })}
                            >
                                {RELATIONSHIP_TYPES.map((rt) => (
                                    <option key={rt.value} value={rt.value}>{rt.label} ({rt.value})</option>
                                ))}
                            </select>
                        </div>

                        <div className="table-editor__field">
                            <label className="table-editor__label table-editor__label--small">To table</label>
                            <select
                                className="input"
                                value={relForm.targetTableId}
                                onChange={(e) => setRelForm({ ...relForm, targetTableId: e.target.value, targetColumnId: '' })}
                            >
                                <option value="">Select table...</option>
                                {otherTables.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {targetTable && (
                            <div className="table-editor__field">
                                <label className="table-editor__label table-editor__label--small">To column</label>
                                <select
                                    className="input"
                                    value={relForm.targetColumnId}
                                    onChange={(e) => setRelForm({ ...relForm, targetColumnId: e.target.value })}
                                >
                                    <option value="">Select column...</option>
                                    {targetTable.columns.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button
                            className="btn btn-primary table-editor__add-rel"
                            onClick={handleAddRelationship}
                            disabled={!relForm.sourceColumnId || !relForm.targetTableId || !relForm.targetColumnId}
                        >
                            <Link size={14} /> Add Relationship
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
