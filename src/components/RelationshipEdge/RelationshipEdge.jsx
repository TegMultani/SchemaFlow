import React, { memo } from 'react';
import { getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { X } from 'lucide-react';
import './RelationshipEdge.css';

function RelationshipEdge({
    id,
    sourceX, sourceY,
    targetX, targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
    markerEnd,
}) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX, sourceY, targetX, targetY,
        sourcePosition, targetPosition,
    });

    const relType = data?.type || '1:N';

    return (
        <>
            {/* Invisible wider path for easier hover/click */}
            <path
                className="relationship-edge__hitbox"
                d={edgePath}
                fill="none"
                strokeWidth={16}
                stroke="transparent"
            />
            {/* Glow effect */}
            {selected && (
                <path
                    className="relationship-edge__glow"
                    d={edgePath}
                    fill="none"
                    strokeWidth={6}
                    stroke="url(#edge-gradient)"
                />
            )}
            {/* Main line */}
            <path
                className={`relationship-edge__path ${selected ? 'relationship-edge__path--selected' : ''}`}
                d={edgePath}
                fill="none"
                strokeWidth={2}
                markerEnd={markerEnd}
            />
            {/* Animated dash */}
            <path
                className="relationship-edge__animated"
                d={edgePath}
                fill="none"
                strokeWidth={2}
            />
            {/* Label */}
            <EdgeLabelRenderer>
                <div
                    className={`relationship-edge__label ${selected ? 'relationship-edge__label--selected' : ''}`}
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                >
                    <span className="relationship-edge__type">{relType}</span>
                    {data?.onDelete && (
                        <button
                            className="relationship-edge__delete"
                            onClick={(e) => { e.stopPropagation(); data.onDelete(id); }}
                        >
                            <X size={10} />
                        </button>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

export default memo(RelationshipEdge);
