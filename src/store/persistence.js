const DB_URL = import.meta.env.VITE_FIREBASE_DB_URL;

export const defaultState = {
    tables: {},
    relationships: {},
    groups: {},
    viewportCenter: null,
};

// Load project data from Firebase REST API
export async function loadProjectData(projectCode) {
    try {
        const res = await fetch(`${DB_URL}/projects/${projectCode}.json`);
        const data = await res.json();
        if (data) {
            return {
                tables: data.tables || {},
                relationships: data.relationships || {},
                groups: data.groups || {},
            };
        }
        return null;
    } catch (e) {
        console.error('Failed to load project:', e);
        return null;
    }
}

// Save project state to Firebase REST API
export async function saveProjectState(projectCode, state) {
    if (!projectCode) return;
    try {
        const data = {
            tables: state.tables || {},
            relationships: state.relationships || {},
            groups: state.groups || {},
        };
        await fetch(`${DB_URL}/projects/${projectCode}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    } catch (e) {
        console.error('Failed to save project state:', e);
    }
}

export function exportToFile(state) {
    const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        tables: state.tables,
        relationships: state.relationships,
        groups: state.groups,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schemaflow-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function importFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.tables || typeof data.tables !== 'object') {
                    throw new Error('Invalid schema file: missing tables');
                }
                resolve({
                    tables: data.tables || {},
                    relationships: data.relationships || {},
                    groups: data.groups || {},
                });
            } catch (err) {
                reject(new Error('Invalid JSON file: ' + err.message));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}
