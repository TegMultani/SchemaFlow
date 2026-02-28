import React, { memo, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GripVertical, Pencil, Trash2, Key, Link } from 'lucide-react';
import './TableNode.css';

function TableNode({ data, selected }) {
    const { table, onEdit, onDelete, onColumnContextMenu, onColumnClick, connectingFrom } = data;

    const columnRows = useMemo(() => {
        return table.columns.map((col, idx) => {
            const badges = [];
            if (col.isPrimaryKey) badges.push(<span key="pk" className="badge badge-pk">PK</span>);
            if (col.isForeignKey) badges.push(<span key="fk" className="badge badge-fk">FK</span>);
            if (!col.isNullable) badges.push(<span key="nn" className="badge badge-nn">NN</span>);
            if (col.isUnique) badges.push(<span key="uq" className="badge badge-uq">UQ</span>);
            if (col.isIndexed) badges.push(<span key="idx" className="badge badge-idx">IDX</span>);
            if (col.defaultValue) badges.push(<span key="def" className="badge badge-default">DEF</span>);

            const isConnectingSource = connectingFrom?.tableId === table.id && connectingFrom?.columnId === col.id;
            const isConnectingMode = !!connectingFrom;

            return (
                <div
                    key={col.id}
                    className={`table-node__column ${isConnectingSource ? 'table-node__column--connecting-source' : ''} ${isConnectingMode && !isConnectingSource ? 'table-node__column--connectable' : ''}`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onColumnContextMenu?.(e, table.id, col.id);
                    }}
                    onPointerUp={(e) => {
                        if (isConnectingMode) {
                            e.preventDefault();
                            e.stopPropagation();
                            onColumnClick?.(table.id, col.id);
                        }
                    }}
                >
                    <Handle
                        type="target"
                        position={Position.Left}
                        id={`${col.id}-left`}
                        className="table-node__handle table-node__handle--left"
                    />
                    <div className="table-node__col-info">
                        <span className="table-node__col-icon">
                            {col.isPrimaryKey ? <Key size={10} /> : col.isForeignKey ? <Link size={10} /> : null}
                        </span>
                        <span className="table-node__col-name">{col.name}</span>
                        <span className="table-node__col-type">{col.type}</span>
                    </div>
                    <div className="table-node__col-badges">
                        {badges}
                    </div>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id={`${col.id}-right`}
                        className="table-node__handle table-node__handle--right"
                    />
                </div>
            );
        });
    }, [table.columns]);

    return (
        <div className={`table-node ${selected ? 'table-node--selected' : ''}`}>
            <div className="table-node__accent" style={{ background: table.color }} />
            <div className="table-node__header">
                <div className="table-node__title">
                    <GripVertical size={12} className="table-node__grip" />
                    <span className="table-node__name">{table.name}</span>
                    <span className="table-node__count">{table.columns.length}</span>
                </div>
                <div className="table-node__actions">
                    <button
                        className="table-node__action-btn"
                        onClick={(e) => { e.stopPropagation(); onEdit?.(table.id); }}
                        data-tooltip="Edit table"
                    >
                        <Pencil size={12} />
                    </button>
                    <button
                        className="table-node__action-btn table-node__action-btn--danger"
                        onClick={(e) => { e.stopPropagation(); onDelete?.(table.id); }}
                        data-tooltip="Delete table"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
            <div className="table-node__columns stagger">
                {columnRows}
            </div>
            {table.columns.length === 0 && (
                <div className="table-node__empty">
                    No columns yet
                </div>
            )}
        </div>
    );
}

export default memo(TableNode);
