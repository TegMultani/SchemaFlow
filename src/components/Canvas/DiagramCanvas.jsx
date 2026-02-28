import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    MiniMap,
    Controls,
    MarkerType,
    useReactFlow,
    ReactFlowProvider,
    applyNodeChanges,
    applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TableNode from '../TableNode/TableNode.jsx';
import GroupNode from '../GroupNode/GroupNode.jsx';
import RelationshipEdge from '../RelationshipEdge/RelationshipEdge.jsx';
import { useStore, useActions } from '../../store/useStore.jsx';
import './DiagramCanvas.css';

const nodeTypes = {
    tableNode: TableNode,
    groupNode: GroupNode,
};

const edgeTypes = {
    relationship: RelationshipEdge,
};

const defaultEdgeOptions = {
    type: 'relationship',
    markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: '#818cf8',
    },
};

function buildNodes(state, onEditTable, onDeleteTable, onEditGroup, onDeleteGroup, onGroupResizeEnd, onColumnContextMenu, onColumnClick, connectingFrom) {
    const groupNodes = Object.values(state.groups).map((group) => ({
        id: `group-${group.id}`,
        type: 'groupNode',
        position: group.position || { x: 0, y: 0 },
        style: { width: group.width || 400, height: group.height || 300 },
        data: {
            group,
            onEdit: onEditGroup,
            onDelete: onDeleteGroup,
            onResizeEnd: onGroupResizeEnd,
        },
        dragHandle: '.group-node__header',
    }));

    const tableNodes = Object.values(state.tables).map((table) => {
        const node = {
            id: table.id,
            type: 'tableNode',
            position: table.position || { x: 0, y: 0 },
            data: {
                table,
                onEdit: onEditTable,
                onDelete: onDeleteTable,
                onColumnContextMenu,
                onColumnClick,
                connectingFrom,
            },
            dragHandle: '.table-node__header',
        };

        if (table.groupId && state.groups[table.groupId]) {
            node.parentId = `group-${table.groupId}`;
            node.extent = 'parent';
        }

        return node;
    });

    return [...groupNodes, ...tableNodes];
}

function buildEdges(relationships, tables, deleteRelationship) {
    return Object.values(relationships).map((rel) => {
        const sourceTable = tables[rel.sourceTableId];
        const targetTable = tables[rel.targetTableId];
        if (!sourceTable || !targetTable) return null;

        return {
            id: rel.id,
            source: rel.sourceTableId,
            target: rel.targetTableId,
            sourceHandle: `${rel.sourceColumnId}-right`,
            targetHandle: `${rel.targetColumnId}-left`,
            type: 'relationship',
            data: {
                type: rel.type || '1:N',
                onDelete: deleteRelationship,
            },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 14,
                height: 14,
                color: '#818cf8',
            },
        };
    }).filter(Boolean);
}

function DiagramCanvasInner({ onEditTable, onDeleteTable, onEditGroup, onDeleteGroup, onConnect }) {
    const { state } = useStore();
    const { updateTablePosition, deleteRelationship, updateGroup, updateViewportCenter, addRelationship } = useActions();
    const { screenToFlowPosition, project } = useReactFlow();

    const [contextMenu, setContextMenu] = useState(null);
    const [connectingFrom, setConnectingFrom] = useState(null);

    const handleColumnContextMenu = useCallback((event, tableId, columnId) => {
        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            tableId,
            columnId
        });
    }, []);

    const handleColumnClick = useCallback((tableId, columnId) => {
        if (!connectingFrom) return;
        // Don't connect to itself
        if (connectingFrom.tableId === tableId && connectingFrom.columnId === columnId) {
            setConnectingFrom(null);
            return;
        }

        addRelationship({
            sourceTableId: connectingFrom.tableId,
            sourceColumnId: connectingFrom.columnId,
            targetTableId: tableId,
            targetColumnId: columnId,
            type: '1:N'
        });
        setConnectingFrom(null);
    }, [connectingFrom, addRelationship]);

    // Close menu on raw canvas click and add ESC
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setConnectingFrom(null);
                setContextMenu(null);
            }
        };
        window.addEventListener('click', handleClick);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const onMoveEnd = useCallback((event, viewport) => {
        const center = screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        });
        updateViewportCenter(center);
    }, [screenToFlowPosition, updateViewportCenter]);

    const onNodeClick = useCallback((event, node) => {
        if (node.type === 'tableNode' && onEditTable) {
            onEditTable(node.id);
        } else if (node.type === 'groupNode' && onEditGroup) {
            onEditGroup(node.id.replace('group-', ''));
        }
    }, [onEditTable, onEditGroup]);

    const handleGroupResizeEnd = useCallback((groupId, width, height) => {
        updateGroup({ id: groupId, width, height });
    }, [updateGroup]);

    // Local nodes state that ReactFlow controls for smooth dragging
    const [nodes, setNodes] = useState(() =>
        buildNodes(state, onEditTable, onDeleteTable, onEditGroup, onDeleteGroup, handleGroupResizeEnd, handleColumnContextMenu, handleColumnClick, connectingFrom)
    );

    // Sync nodes when store state changes (e.g. table added/deleted, name changed, etc.)
    useEffect(() => {
        setNodes(buildNodes(state, onEditTable, onDeleteTable, onEditGroup, onDeleteGroup, handleGroupResizeEnd, handleColumnContextMenu, handleColumnClick, connectingFrom));
    }, [state, onEditTable, onDeleteTable, onEditGroup, onDeleteGroup, handleGroupResizeEnd, handleColumnContextMenu, handleColumnClick, connectingFrom]);

    // Apply ALL node changes in real-time (position, selection, dimensions)
    const onNodesChange = useCallback((changes) => {
        setNodes((nds) => applyNodeChanges(changes, nds));

        changes.forEach((change) => {
            if (change.type === 'remove') {
                if (change.id.startsWith('group-')) {
                    onDeleteGroup?.(change.id.replace('group-', ''));
                } else {
                    onDeleteTable?.(change.id);
                }
            }
            // Persist position to store only when drag ends
            if (change.type === 'position' && !change.dragging && change.position) {
                const nodeId = change.id;
                if (nodeId.startsWith('group-')) {
                    const groupId = nodeId.replace('group-', '');
                    updateGroup({ id: groupId, position: change.position });
                } else {
                    updateTablePosition(nodeId, change.position);
                }
            }
        });
    }, [updateTablePosition, updateGroup, onDeleteTable, onDeleteGroup]);

    const [edges, setEdges] = useState(() => buildEdges(state.relationships, state.tables, deleteRelationship));

    useEffect(() => {
        setEdges(buildEdges(state.relationships, state.tables, deleteRelationship));
    }, [state.relationships, state.tables, deleteRelationship]);

    const onEdgesChange = useCallback((changes) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));

        changes.forEach((change) => {
            if (change.type === 'remove') {
                deleteRelationship(change.id);
            }
        });
    }, [deleteRelationship]);

    const onEdgeConnect = useCallback((connection) => {
        if (onConnect) {
            const sourceColumnId = connection.sourceHandle?.replace('-right', '');
            const targetColumnId = connection.targetHandle?.replace('-left', '');
            onConnect({
                sourceTableId: connection.source,
                sourceColumnId,
                targetTableId: connection.target,
                targetColumnId,
                type: '1:N',
            });
        }
    }, [onConnect]);

    return (
        <div className="diagram-canvas">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onEdgeConnect}
                onMoveEnd={onMoveEnd}
                onNodeClick={onNodeClick}
                defaultEdgeOptions={defaultEdgeOptions}
                fitView
                fitViewOptions={{ padding: 0.5, maxZoom: 0.6 }}
                proOptions={{ hideAttribution: true }}
                snapToGrid
                snapGrid={[16, 16]}
                connectionLineStyle={{ stroke: '#818cf8', strokeWidth: 2, strokeDasharray: '6 3' }}
                connectionLineType="smoothstep"
                minZoom={0.1}
                maxZoom={4}
                panOnDrag={[1, 2]}
                panActivationKeyCode={['Control', 'ControlLeft', 'ControlRight', 'Space']}
                selectionOnDrag={true}
                selectionKeyCode={null}
                selectionMode="partial"
                panOnScroll={false}
                zoomOnScroll={true}
            >
                <Background color="rgba(129, 140, 248, 0.06)" gap={24} size={1.5} />
                <MiniMap
                    className="diagram-canvas__minimap"
                    nodeColor={(n) => {
                        if (n.type === 'groupNode') return 'rgba(129, 140, 248, 0.2)';
                        return n.data?.table?.color || '#818cf8';
                    }}
                    maskColor="rgba(10, 14, 26, 0.7)"
                    nodeStrokeWidth={3}
                    pannable
                    zoomable
                    style={{ background: 'var(--bg-secondary)' }}
                />
                <Controls
                    className="diagram-canvas__controls"
                    showInteractive={false}
                />
            </ReactFlow>

            {contextMenu && (
                <div
                    className="canvas-context-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <button
                        className="canvas-context-menu__btn"
                        onClick={() => {
                            setConnectingFrom({ tableId: contextMenu.tableId, columnId: contextMenu.columnId });
                        }}
                    >
                        Create Relationship To...
                    </button>
                </div>
            )}

            {connectingFrom && (
                <div className="canvas-connecting-toast">
                    Select a target column to connect... (Press Esc to cancel)
                </div>
            )}
        </div>
    );
}

export default function DiagramCanvas(props) {
    return (
        <ReactFlowProvider>
            <DiagramCanvasInner {...props} />
        </ReactFlowProvider>
    );
}
