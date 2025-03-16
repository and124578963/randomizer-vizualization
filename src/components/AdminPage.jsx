import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/fetchWithAuth';

const AdminPage = () => {
    const [currentState, setCurrentState] = useState(null);
    const [showState, setShowState] = useState(false); // состояние для показа/скрытия
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false); // Новое состояние для блокировки
    const host = "http://localhost:8080";

    // Получение текущего состояния
    const fetchState = async () => {
        try {
            const response = await fetchWithAuth(host + '/api/state');
            const data = await response.json();
            setCurrentState(data);
        } catch (error) {
            console.error('Ошибка получения состояния:', error);
        }
    };

    useEffect(() => {
        fetchState();
    }, []);

    // Обнуление данных с подтверждением
    const handleReset = async () => {
        if (window.confirm("Вы уверены, что хотите обнулить рандомайзер?")) {
            try {
                await fetchWithAuth(host + '/api/reset', { method: 'POST' });
                await fetchState();
            } catch (error) {
                console.error('Ошибка обнуления:', error);
            }
        }
    };

    // Генерация нового числа
    const handleGenerate = async () => {
        try {
            await fetchWithAuth(host + '/api/generate', { method: 'POST' });
            await fetchState();
        } catch (error) {
            console.error('Ошибка генерации числа:', error);
        }
    };

    // Перевод состояния (смена статуса)
    const handleAdvance = async () => {
        try {
            await fetchWithAuth(host + '/api/advance', { method: 'POST' });
            await fetchState();
        } catch (error) {
            console.error('Ошибка перевода состояния:', error);
        }
    };

    // Действие третьей кнопки зависит от currentState.status
    const handleThirdButton = async () => {
        if (isProcessing || !currentState) return; // Блокируем повторные нажатия

        try {
            switch (currentState.status) {
                case 'ГОТОВ':
                    setIsProcessing(true); // Начинаем обработку
                    await handleGenerate();
                    break;
                case 'НОВЫЙ ЭТАП':
                    if(currentState.remainingStages === 0)
                        break;
                case 'НОМЕР СГЕНЕРИРОВАН':
                case 'ГОТОВ К СЛЕДУЮЩЕМУ ВЫБОРУ':
                case 'ЭТАП ЗАВЕРШЕН':

                    await handleAdvance();
                    break;
                case 'КОНЕЦ':
                    break;
                default:
                    setIsProcessing(true); // Начинаем обработку
                    await handleGenerate();

            }
        } catch (error) {
            console.error('Ошибка в handleThirdButton:', error);
        } finally {
            // Разблокируем через 3 секунды
            setTimeout(() => setIsProcessing(false), 8000);
        }
    };

    // Определение надписи для третьей кнопки в зависимости от состояния
    const getThirdButtonLabel = () => {
        if (!currentState) return '...';
        switch (currentState.status) {
            case 'ГОТОВ':
                return 'Запустить рандомайзер';
            case 'НОМЕР СГЕНЕРИРОВАН':
                if(currentState.remainingStages === 0)
                    break;
                return 'Перейти к следующей цифре';
            case 'НОВЫЙ ЭТАП':
                if(currentState.remainingStages === 0)
                    break;
                return 'Начать этап ' + currentState.currentStage;
            case 'ГОТОВ К СЛЕДУЮЩЕМУ ВЫБОРУ':
                return 'Перейти к следующей цифре';
            case 'ЭТАП ЗАВЕРШЕН':
                return 'Вывести результаты этапа';
            case 'КОНЕЦ':
                return ' ';
            default:
                return 'Запустить рандомайзер';
        }
    };

    // Отрисовка текущего состояния: каждое поле в одной строке, разделённое по ключу и значению
    const renderCurrentState = () => {
        if (!currentState) return null;
        return (
            <div>
                {Object.entries(currentState).map(([key, value]) => (
                    <div key={key} className="d-flex justify-content-between border-bottom py-2">
                        <strong>{key}:</strong>
                        <span>{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="container mt-5 text-center">
            <h2 className="mb-4">Страница управления</h2>
            <div className="mb-3">
                <button className="btn btn-primary me-2" onClick={() => navigate('/uyqwefgqiuye12iu3gh12h3/visualization')}>
                    Перейти на страницу визуализации
                </button>
            </div>
            <div className="mb-3">
                <button className="btn btn-warning me-2" onClick={handleReset}>
                    Обнулить рандомайзер
                </button>
            </div>
            <div className="mb-3">
                <button className="btn btn-success me-2" onClick={handleThirdButton}
                        disabled={isProcessing || currentState?.status === 'КОНЕЦ'}>
                    {getThirdButtonLabel()}
                </button>
            </div>
            <div className="mb-3">
                <button
                    className="btn btn-link"
                    onClick={() => setShowState(!showState)}
                >
                    {showState ? "Скрыть текущее состояние" : "Показать текущее состояние"}
                </button>
            </div>
            {showState && currentState && (
                <div className="card mx-auto" style={{ maxWidth: '500px' }}>
                    <div className="card-body">
                        {renderCurrentState()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;