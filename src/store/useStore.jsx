import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadProjectData, saveProjectState, defaultState } from './persistence.js';

const StoreContext = createContext(null);

// Column data types
export const DATA_TYPES = [
    'INT', 'BIGINT', 'SMALLINT', 'TINYINT',
    'DECIMAL', 'FLOAT', 'DOUBLE',
    'VARCHAR', 'CHAR', 'TEXT', 'LONGTEXT',
    'BOOLEAN',
    'DATE', 'DATETIME', 'TIMESTAMP', 'TIME',
    'JSON', 'BLOB',
    'UUID', 'ENUM', 'SERIAL',
];

// Table accent colors
export const TABLE_COLORS = [
    { name: 'Indigo', value: '#818cf8' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Purple', value: '#a78bfa' },
    { name: 'Pink', value: '#f472b6' },
    { name: 'Emerald', value: '#34d399' },
    { name: 'Amber', value: '#fbbf24' },
    { name: 'Rose', value: '#fb7185' },
    { name: 'Sky', value: '#38bdf8' },
];

// Group colors
export const GROUP_COLORS = [
    { name: 'Indigo', value: 'rgba(129, 140, 248, 0.08)', border: 'rgba(129, 140, 248, 0.25)', text: '#818cf8' },
    { name: 'Cyan', value: 'rgba(6, 182, 212, 0.08)', border: 'rgba(6, 182, 212, 0.25)', text: '#06b6d4' },
    { name: 'Purple', value: 'rgba(167, 139, 250, 0.08)', border: 'rgba(167, 139, 250, 0.25)', text: '#a78bfa' },
    { name: 'Pink', value: 'rgba(244, 114, 182, 0.08)', border: 'rgba(244, 114, 182, 0.25)', text: '#f472b6' },
    { name: 'Emerald', value: 'rgba(52, 211, 153, 0.08)', border: 'rgba(52, 211, 153, 0.25)', text: '#34d399' },
    { name: 'Amber', value: 'rgba(251, 191, 36, 0.08)', border: 'rgba(251, 191, 36, 0.25)', text: '#fbbf24' },
    { name: 'Rose', value: 'rgba(251, 113, 133, 0.08)', border: 'rgba(251, 113, 133, 0.25)', text: '#fb7185' },
    { name: 'Sky', value: 'rgba(56, 189, 248, 0.08)', border: 'rgba(56, 189, 248, 0.25)', text: '#38bdf8' },
];

// Relationship types
export const RELATIONSHIP_TYPES = [
    { value: '1:1', label: 'One to One' },
    { value: '1:N', label: 'One to Many' },
    { value: 'N:1', label: 'Many to One' },
    { value: 'N:M', label: 'Many to Many' },
];

function createColumn(overrides = {}) {
    return {
        id: uuidv4(),
        name: overrides.name || 'column',
        type: overrides.type || 'VARCHAR',
        isPrimaryKey: overrides.isPrimaryKey || false,
        isForeignKey: false,
        isNullable: overrides.isNullable !== undefined ? overrides.isNullable : true,
        isUnique: overrides.isUnique || false,
        isIndexed: overrides.isIndexed || false,
        isAutoIncrement: overrides.isAutoIncrement || false,
        defaultValue: overrides.defaultValue || '',
    };
}

function createTable(overrides = {}, viewportCenter = null) {
    const id = uuidv4();
    return {
        id,
        name: overrides.name || 'new_table',
        color: overrides.color || TABLE_COLORS[Math.floor(Math.random() * TABLE_COLORS.length)].value,
        columns: overrides.columns || [
            createColumn({ name: 'id', type: 'SERIAL', isPrimaryKey: true, isNullable: false, isAutoIncrement: true }),
        ],
        position: overrides.position || (viewportCenter ? { x: viewportCenter.x - 140, y: viewportCenter.y - 100 } : { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 }),
        groupId: overrides.groupId || null,
    };
}

// Actions
const ACTIONS = {
    ADD_TABLE: 'ADD_TABLE',
    UPDATE_TABLE: 'UPDATE_TABLE',
    DELETE_TABLE: 'DELETE_TABLE',
    UPDATE_TABLE_POSITION: 'UPDATE_TABLE_POSITION',
    UPDATE_VIEWPORT_CENTER: 'UPDATE_VIEWPORT_CENTER',
    ADD_COLUMN: 'ADD_COLUMN',
    UPDATE_COLUMN: 'UPDATE_COLUMN',
    DELETE_COLUMN: 'DELETE_COLUMN',
    REORDER_COLUMNS: 'REORDER_COLUMNS',
    ADD_RELATIONSHIP: 'ADD_RELATIONSHIP',
    UPDATE_RELATIONSHIP: 'UPDATE_RELATIONSHIP',
    DELETE_RELATIONSHIP: 'DELETE_RELATIONSHIP',
    ADD_GROUP: 'ADD_GROUP',
    UPDATE_GROUP: 'UPDATE_GROUP',
    DELETE_GROUP: 'DELETE_GROUP',
    SET_TABLE_GROUP: 'SET_TABLE_GROUP',
    IMPORT_STATE: 'IMPORT_STATE',
    CLEAR_ALL: 'CLEAR_ALL',
    SET_PROJECT_CODE: 'SET_PROJECT_CODE',
};

function reducer(state, action) {
    switch (action.type) {
        case ACTIONS.ADD_TABLE: {
            const table = createTable(action.payload, state.viewportCenter);
            return { ...state, tables: { ...state.tables, [table.id]: table } };
        }

        case ACTIONS.UPDATE_TABLE: {
            const { id, ...updates } = action.payload;
            const table = state.tables[id];
            if (!table) return state;
            return {
                ...state,
                tables: { ...state.tables, [id]: { ...table, ...updates } },
            };
        }

        case ACTIONS.DELETE_TABLE: {
            const { [action.payload]: _, ...remainingTables } = state.tables;
            // Also remove relationships connected to this table
            const remainingRelationships = {};
            Object.values(state.relationships).forEach((rel) => {
                if (rel.sourceTableId !== action.payload && rel.targetTableId !== action.payload) {
                    remainingRelationships[rel.id] = rel;
                }
            });
            // Remove from groups
            const updatedGroups = { ...state.groups };
            Object.values(updatedGroups).forEach((group) => {
                if (group.tableIds.includes(action.payload)) {
                    updatedGroups[group.id] = {
                        ...group,
                        tableIds: group.tableIds.filter((tid) => tid !== action.payload),
                    };
                }
            });
            return { ...state, tables: remainingTables, relationships: remainingRelationships, groups: updatedGroups };
        }

        case ACTIONS.UPDATE_TABLE_POSITION: {
            const { id, position } = action.payload;
            const table = state.tables[id];
            if (!table) return state;
            return {
                ...state,
                tables: { ...state.tables, [id]: { ...table, position } },
            };
        }

        case ACTIONS.UPDATE_VIEWPORT_CENTER: {
            return { ...state, viewportCenter: action.payload };
        }

        case ACTIONS.ADD_COLUMN: {
            const { tableId, column: colOverrides } = action.payload;
            const table = state.tables[tableId];
            if (!table) return state;
            const column = createColumn(colOverrides);
            return {
                ...state,
                tables: {
                    ...state.tables,
                    [tableId]: { ...table, columns: [...table.columns, column] },
                },
            };
        }

        case ACTIONS.UPDATE_COLUMN: {
            const { tableId, columnId, ...updates } = action.payload;
            const table = state.tables[tableId];
            if (!table) return state;
            const columns = table.columns.map((col) =>
                col.id === columnId ? { ...col, ...updates } : col
            );
            return {
                ...state,
                tables: { ...state.tables, [tableId]: { ...table, columns } },
            };
        }

        case ACTIONS.DELETE_COLUMN: {
            const { tableId, columnId } = action.payload;
            const table = state.tables[tableId];
            if (!table) return state;
            const columns = table.columns.filter((col) => col.id !== columnId);
            // Remove relationships using this column
            const remainingRelationships = {};
            Object.values(state.relationships).forEach((rel) => {
                if (rel.sourceColumnId !== columnId && rel.targetColumnId !== columnId) {
                    remainingRelationships[rel.id] = rel;
                }
            });
            return {
                ...state,
                tables: { ...state.tables, [tableId]: { ...table, columns } },
                relationships: remainingRelationships,
            };
        }

        case ACTIONS.REORDER_COLUMNS: {
            const { tableId, columns } = action.payload;
            const table = state.tables[tableId];
            if (!table) return state;
            return {
                ...state,
                tables: { ...state.tables, [tableId]: { ...table, columns } },
            };
        }

        case ACTIONS.ADD_RELATIONSHIP: {
            const id = uuidv4();
            const rel = { id, ...action.payload };
            // Mark target column as FK
            const targetTable = state.tables[rel.targetTableId];
            let updatedTables = state.tables;
            if (targetTable) {
                const updatedColumns = targetTable.columns.map((col) =>
                    col.id === rel.targetColumnId ? { ...col, isForeignKey: true } : col
                );
                updatedTables = {
                    ...state.tables,
                    [targetTable.id]: { ...targetTable, columns: updatedColumns },
                };
            }
            return {
                ...state,
                tables: updatedTables,
                relationships: { ...state.relationships, [id]: rel },
            };
        }

        case ACTIONS.UPDATE_RELATIONSHIP: {
            const { id, ...updates } = action.payload;
            const rel = state.relationships[id];
            if (!rel) return state;
            return {
                ...state,
                relationships: { ...state.relationships, [id]: { ...rel, ...updates } },
            };
        }

        case ACTIONS.DELETE_RELATIONSHIP: {
            const rel = state.relationships[action.payload];
            if (!rel) return state;
            const { [action.payload]: _, ...remainingRelationships } = state.relationships;
            // Unmark FK on target column if no other relationship points to it
            const targetTable = state.tables[rel.targetTableId];
            let updatedTables = state.tables;
            if (targetTable) {
                const otherFKs = Object.values(remainingRelationships).some(
                    (r) => r.targetTableId === rel.targetTableId && r.targetColumnId === rel.targetColumnId
                );
                if (!otherFKs) {
                    const updatedColumns = targetTable.columns.map((col) =>
                        col.id === rel.targetColumnId ? { ...col, isForeignKey: false } : col
                    );
                    updatedTables = {
                        ...state.tables,
                        [targetTable.id]: { ...targetTable, columns: updatedColumns },
                    };
                }
            }
            return { ...state, tables: updatedTables, relationships: remainingRelationships };
        }

        case ACTIONS.ADD_GROUP: {
            const id = uuidv4();
            const colorIdx = Object.keys(state.groups).length % GROUP_COLORS.length;
            const group = {
                id,
                name: action.payload?.name || 'New Group',
                color: action.payload?.color || GROUP_COLORS[colorIdx],
                tableIds: action.payload?.tableIds || [],
                position: action.payload?.position || (state.viewportCenter ? { x: state.viewportCenter.x - 200, y: state.viewportCenter.y - 150 } : { x: 50 + Math.random() * 200, y: 50 + Math.random() * 200 }),
                width: action.payload?.width || 400,
                height: action.payload?.height || 300,
            };
            return { ...state, groups: { ...state.groups, [id]: group } };
        }

        case ACTIONS.UPDATE_GROUP: {
            const { id, ...updates } = action.payload;
            const group = state.groups[id];
            if (!group) return state;
            return {
                ...state,
                groups: { ...state.groups, [id]: { ...group, ...updates } },
            };
        }

        case ACTIONS.DELETE_GROUP: {
            const group = state.groups[action.payload];
            if (!group) return state;
            const { [action.payload]: _, ...remainingGroups } = state.groups;
            // Remove groupId from tables in this group
            const updatedTables = { ...state.tables };
            group.tableIds.forEach((tid) => {
                if (updatedTables[tid]) {
                    updatedTables[tid] = { ...updatedTables[tid], groupId: null };
                }
            });
            return { ...state, tables: updatedTables, groups: remainingGroups };
        }

        case ACTIONS.SET_TABLE_GROUP: {
            const { tableId, groupId } = action.payload;
            const table = state.tables[tableId];
            if (!table) return state;

            const updatedGroups = { ...state.groups };

            // Remove from old group
            if (table.groupId && updatedGroups[table.groupId]) {
                updatedGroups[table.groupId] = {
                    ...updatedGroups[table.groupId],
                    tableIds: updatedGroups[table.groupId].tableIds.filter((tid) => tid !== tableId),
                };
            }

            // Add to new group
            if (groupId && updatedGroups[groupId]) {
                updatedGroups[groupId] = {
                    ...updatedGroups[groupId],
                    tableIds: [...new Set([...updatedGroups[groupId].tableIds, tableId])],
                };
            }

            return {
                ...state,
                tables: { ...state.tables, [tableId]: { ...table, groupId } },
                groups: updatedGroups,
            };
        }

        case ACTIONS.IMPORT_STATE: {
            return {
                ...state,
                tables: action.payload.tables || {},
                relationships: action.payload.relationships || {},
                groups: action.payload.groups || {},
                viewportCenter: action.payload.viewportCenter || null,
            };
        }

        case ACTIONS.CLEAR_ALL: {
            return { ...state, tables: {}, relationships: {}, groups: {} };
        }

        case ACTIONS.SET_PROJECT_CODE: {
            return { ...state, projectCode: action.payload };
        }

        default:
            return state;
    }
}

export function StoreProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, { ...defaultState, projectCode: null });
    const saveTimeoutRef = useRef(null);
    const hasLoadedRef = useRef(false);

    // Load project data once when projectCode is set
    useEffect(() => {
        if (!state.projectCode) {
            hasLoadedRef.current = false;
            return;
        }

        loadProjectData(state.projectCode).then((data) => {
            if (data) {
                dispatch({ type: ACTIONS.IMPORT_STATE, payload: data });
            }
            // Mark as loaded — future state changes will auto-save
            hasLoadedRef.current = true;
        }).catch((err) => {
            console.error('Failed to load project:', err);
            hasLoadedRef.current = true;
        });
    }, [state.projectCode]);

    // Debounced auto-save to Firebase after initial load
    useEffect(() => {
        if (!state.projectCode || !hasLoadedRef.current) return;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            saveProjectState(state.projectCode, state);
        }, 800);

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [state.tables, state.relationships, state.groups]);

    return (
        <StoreContext.Provider value={{ state, dispatch, ACTIONS }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useStore must be used within StoreProvider');
    return context;
}

export function useActions() {
    const { dispatch, ACTIONS: A } = useStore();

    return {
        addTable: useCallback((payload) => dispatch({ type: A.ADD_TABLE, payload }), [dispatch, A]),
        updateTable: useCallback((payload) => dispatch({ type: A.UPDATE_TABLE, payload }), [dispatch, A]),
        deleteTable: useCallback((id) => dispatch({ type: A.DELETE_TABLE, payload: id }), [dispatch, A]),
        updateTablePosition: useCallback((id, position) => dispatch({ type: A.UPDATE_TABLE_POSITION, payload: { id, position } }), [dispatch, A]),
        updateViewportCenter: useCallback((payload) => dispatch({ type: A.UPDATE_VIEWPORT_CENTER, payload }), [dispatch, A]),
        addColumn: useCallback((tableId, column) => dispatch({ type: A.ADD_COLUMN, payload: { tableId, column } }), [dispatch, A]),
        updateColumn: useCallback((payload) => dispatch({ type: A.UPDATE_COLUMN, payload }), [dispatch, A]),
        deleteColumn: useCallback((tableId, columnId) => dispatch({ type: A.DELETE_COLUMN, payload: { tableId, columnId } }), [dispatch, A]),
        reorderColumns: useCallback((tableId, columns) => dispatch({ type: A.REORDER_COLUMNS, payload: { tableId, columns } }), [dispatch, A]),
        addRelationship: useCallback((payload) => dispatch({ type: A.ADD_RELATIONSHIP, payload }), [dispatch, A]),
        updateRelationship: useCallback((payload) => dispatch({ type: A.UPDATE_RELATIONSHIP, payload }), [dispatch, A]),
        deleteRelationship: useCallback((id) => dispatch({ type: A.DELETE_RELATIONSHIP, payload: id }), [dispatch, A]),
        addGroup: useCallback((payload) => dispatch({ type: A.ADD_GROUP, payload }), [dispatch, A]),
        updateGroup: useCallback((payload) => dispatch({ type: A.UPDATE_GROUP, payload }), [dispatch, A]),
        deleteGroup: useCallback((id) => dispatch({ type: A.DELETE_GROUP, payload: id }), [dispatch, A]),
        setTableGroup: useCallback((tableId, groupId) => dispatch({ type: A.SET_TABLE_GROUP, payload: { tableId, groupId } }), [dispatch, A]),
        importState: useCallback((payload) => dispatch({ type: A.IMPORT_STATE, payload }), [dispatch, A]),
        clearAll: useCallback(() => dispatch({ type: A.CLEAR_ALL }), [dispatch, A]),
        setProjectCode: useCallback((code) => dispatch({ type: A.SET_PROJECT_CODE, payload: code }), [dispatch, A]),
    };
}
