import React, { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import { GripVertical, Pencil, Trash2, FolderOpen } from 'lucide-react';
import './GroupNode.css';

function GroupNode({ data, selected }) {
    const { group, onEdit, onDelete } = data;
    const color = group.color || {
        value: 'rgba(129, 140, 248, 0.08)',
        border: 'rgba(129, 140, 248, 0.25)',
        text: '#818cf8',
    };

    return (
        <>
            <NodeResizer
                color={color.text}
                isVisible={selected}
                minWidth={200}
                minHeight={150}
                onResizeEnd={(evt, params) => {
                    if (data.onResizeEnd) {
                        data.onResizeEnd(group.id, params.width, params.height);
                    }
                }}
                handleStyle={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: color.text,
                    border: '2px solid white',
                }}
                lineStyle={{
                    border: 'none',
                    borderWidth: 0,
                }}
            />
            <div
                className={`group-node ${selected ? 'group-node--selected' : ''}`}
                style={{
                    borderColor: selected ? color.text : color.border,
                    '--group-color': color.text,
                    '--group-bg': color.value,
                }}
            >
                {/* Solid header bar — same pattern as table node */}
                <div className="group-node__header" style={{ borderBottomColor: color.border }}>
                    <div className="group-node__title">
                        <GripVertical size={12} className="group-node__grip" />
                        <FolderOpen size={13} style={{ color: color.text }} />
                        <span className="group-node__name" style={{ color: color.text }}>{group.name}</span>
                    </div>
                    <div className="group-node__actions">
                        <button
                            className="group-node__action-btn"
                            onClick={(e) => { e.stopPropagation(); onEdit?.(group.id); }}
                            style={{ color: color.text }}
                        >
                            <Pencil size={12} />
                        </button>
                        <button
                            className="group-node__action-btn group-node__action-btn--danger"
                            onClick={(e) => { e.stopPropagation(); onDelete?.(group.id); }}
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
                {/* Body area where tables go */}
                <div className="group-node__body" style={{ background: color.value }} />
            </div>
        </>
    );
}

export default memo(GroupNode);
