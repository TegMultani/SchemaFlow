import React, { useState } from 'react';
import { Layers, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { useActions } from '../../store/useStore.jsx';
import { loadProjectData } from '../../store/persistence.js';
import './ProjectModal.css';

export default function ProjectModal() {
    const { setProjectCode } = useActions();
    const [mode, setMode] = useState('select'); // 'select' | 'load'
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const generateRandomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleCreateProject = () => {
        const newCode = generateRandomCode();
        setProjectCode(newCode);
    };

    const handleLoadProject = async (e) => {
        e.preventDefault();
        const cleanCode = code.trim().toUpperCase();
        if (cleanCode.length !== 6) {
            setError('Code must be exactly 6 characters.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const data = await loadProjectData(cleanCode);
            if (data) {
                // Success! Set global code, useStore effect will import data automatically
                setProjectCode(cleanCode);
            } else {
                setError('Project code not found.');
            }
        } catch (err) {
            setError('Failed to load project. Check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="project-modal-overlay">
            <div className="project-modal">
                <div className="project-modal__header">
                    <div className="project-modal__logo">
                        <Layers size={24} />
                    </div>
                    <h1 className="project-modal__title">SchemaFlow</h1>
                    <p className="project-modal__subtitle">Collaborative Database Modeling</p>
                </div>

                {mode === 'select' ? (
                    <div className="project-modal__actions">
                        <button
                            className="btn btn-primary"
                            style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-base)' }}
                            onClick={handleCreateProject}
                        >
                            <Plus size={18} />
                            Create New Project
                        </button>

                        <div className="project-modal__divider">or</div>

                        <button
                            className="btn btn-outline"
                            style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-base)' }}
                            onClick={() => setMode('load')}
                        >
                            <ArrowRight size={18} />
                            Load Existing Project
                        </button>
                    </div>
                ) : (
                    <form className="project-modal__code-form" onSubmit={handleLoadProject}>
                        <input
                            type="text"
                            className="input project-modal__input"
                            placeholder="Enter 6-digit code"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase());
                                setError('');
                            }}
                            maxLength={6}
                            autoFocus
                        />

                        {error && <div className="project-modal__error">{error}</div>}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-base)' }}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Join Project'}
                        </button>

                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setMode('select')}
                            disabled={isLoading}
                        >
                            Back
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
