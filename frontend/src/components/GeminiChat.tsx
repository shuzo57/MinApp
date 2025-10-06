import React, { useState } from 'react';
import { apiFetch } from '../auth/client';

export default function GeminiChat() {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setResponse('');

        try {
            const res = await apiFetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || `An error occurred: ${res.status}`);
            }

            const data = await res.json();
            setResponse(data.response);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
            <h3>🤖 Gemini Chat</h3>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="メッセージを入力..."
                    rows={3}
                    style={{ width: '80%', padding: '0.5rem' }}
                    required
                />
                <br />
                <button type="submit" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
                    {isLoading ? '生成中...' : '送信'}
                </button>
            </form>

            {error && <p style={{ color: 'red' }}>エラー: {error}</p>}

            {response && (
                <div style={{ marginTop: '1rem', textAlign: 'left', whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>
                    <h4>回答:</h4>
                    <p>{response}</p>
                </div>
            )}
        </div>
    );
}