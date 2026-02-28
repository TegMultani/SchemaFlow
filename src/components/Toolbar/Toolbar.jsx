import React, { useRef, useState } from 'react';
import {
    Download, Upload, Trash2, Plus, Table2, FolderPlus,
    ZoomIn, ZoomOut, Maximize2, Info
} from 'lucide-react';
import { useActions } from '../../store/useStore.jsx';
import { exportToFile, importFromFile } from '../../store/persistence.js';
import './Toolbar.css';

export default function Toolbar({ state, onAddTable, onAddGroup, onToast }) {
    const { importState, clearAll } = useActions();
    const fileInputRef = useRef(null);
    const [showConfirmClear, setShowConfirmClear] = useState(false);

    const handleExport = () => {
        exportToFile(state);
        onToast?.('Schema exported successfully', 'success');
    };

    const handleImport = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const data = await importFromFile(file);
            importState(data);
            onToast?.('Schema imported successfully', 'success');
        } catch (err) {
            onToast?.(err.message, 'error');
        }
        e.target.value = '';
    };

    const handleClearAll = () => {
        clearAll();
        setShowConfirmClear(false);
        onToast?.('All data cleared', 'info');
    };

    const tableCount = Object.keys(state.tables).length;
    const relCount = Object.keys(state.relationships).length;

    return (
        <>
            <div className="toolbar glass animate-fade-in-up">
                <div className="toolbar__section">
                    <button className="toolbar__btn" onClick={onAddTable} data-tooltip="Add Table">
                        <Table2 size={16} />
                    </button>
                    <button className="toolbar__btn" onClick={onAddGroup} data-tooltip="Add Group">
                        <FolderPlus size={16} />
                    </button>
                </div>

                <div className="toolbar__divider" />

                <div className="toolbar__section">
                    <button className="toolbar__btn" onClick={handleExport} data-tooltip="Export JSON">
                        <Download size={16} />
                    </button>
                    <button className="toolbar__btn" onClick={handleImport} data-tooltip="Import JSON">
                        <Upload size={16} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>

                <div className="toolbar__divider" />

                <div className="toolbar__section">
                    <button
                        className="toolbar__btn toolbar__btn--danger"
                        onClick={() => setShowConfirmClear(true)}
                        data-tooltip="Clear All"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

                <div className="toolbar__divider" />

                <div className="toolbar__stats">
                    <span className="toolbar__stat">
                        <Table2 size={11} /> {tableCount}
                    </span>
                    <span className="toolbar__stat">
                        <Info size={11} /> {relCount} rel{relCount !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Confirm Clear Modal */}
            {showConfirmClear && (
                <div className="modal-overlay" onClick={() => setShowConfirmClear(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Clear Everything?</h3>
                        <p>This will permanently delete all tables, columns, relationships, and groups. This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowConfirmClear(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={handleClearAll}>
                                <Trash2 size={14} /> Clear All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
