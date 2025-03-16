import React, { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import './VisualizationPage.css';
import './fonts/TinkoffSans_Bold.otf';
import './fonts/TinkoffSans_Medium.otf';


const VisualizationPage = () => {
    const host = "http://localhost:8080";
    const [currentState, setCurrentState] = useState(null);
    const [displayNumber, setDisplayNumber] = useState(null);
    const [flyAnimation, setFlyAnimation] = useState(false);
    const [flyingNumber, setFlyingNumber] = useState(null);
    const [prevDrawnNumbers, setPrevDrawnNumbers] = useState([]);

    // const [animationLeftSpace, setAnimationLeftSpace] = useState(400);

    const statusRef = useRef(null);
    const animationTimeout = useRef(null);
    const startTimeRef = useRef(null);
    const numbersRef = useRef([]);
    const drawnNumbersRef = useRef(null);

    useEffect(() => {
        if (currentState && currentState.status !== "НОВЫЙ ЭТАП") {
            setPrevDrawnNumbers(currentState.drawnNumbers || []);
        }
    }, [currentState]);

    useEffect(() => {
        const pollApi = async () => {
            try {
                const response = await fetchWithAuth(host + '/api/state');
                const data = await response.json();

                if(data.status !== statusRef.current) {
                    setCurrentState(data);
                    statusRef.current = data.status;
                }
            } catch (error) {
                console.error('Ошибка получения статуса:', error);
            }
        };

        pollApi();
        const interval = setInterval(pollApi, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!currentState) return;

        const handleStatusChange = () => {
            switch(currentState.status) {
                case "НОМЕР СГЕНЕРИРОВАН":
                    startNumberCycle();
                    break;

                case "ГОТОВ":
                    handleReadyStatus();
                    break;

                case "ЭТАП ЗАВЕРШЕН": // Добавляем обработку завершения этапа
                    handleStageCompleted();
                    break;

                case "НОВЫЙ ЭТАП":
                    setDisplayNumber(null);
                    break;
            }
        };

        const startNumberCycle = () => {
            clearAnimation();
            numbersRef.current = [...(currentState.remainingNumbers || [])];
            setDisplayNumber(null);
            startTimeRef.current = Date.now();

            const updateNumber = () => {
                const elapsed = Date.now() - startTimeRef.current;
                const progress = Math.min(elapsed / 6000, 1);
                const delay = 50 + 250 * progress;

                if(elapsed < 6000) {
                    const rndIndex = Math.floor(Math.random() * numbersRef.current.length);
                    setDisplayNumber(numbersRef.current[rndIndex]);
                    animationTimeout.current = setTimeout(updateNumber, delay);
                } else {
                    setDisplayNumber(currentState.currentValue);
                }
            };

            updateNumber();
        };

        const calculateLeftSpace = () => {
            var currentLeft = 225;
            prevDrawnNumbers.forEach(num => {
                const numStr = Math.abs(num).toString();
                const length = numStr.length;
                if (length === 1) {
                    currentLeft += 50
                } else if (length === 2) {
                    currentLeft += 80
                } else if (length === 3) {
                    currentLeft += 100
                }
            });
            console.log("------------------------------------")
            console.log("prevDrawnNumbers", prevDrawnNumbers)
            console.log("currentLeft", currentLeft)
            document.documentElement.style.setProperty('--animation-left', currentLeft + 'px');
        };

        const handleReadyStatus = () => {
            if(statusRef.previous === "НОМЕР СГЕНЕРИРОВАН") {
                calculateLeftSpace();
                triggerFlyAnimation(displayNumber, 0);
            } else {
                setDisplayNumber(0);
            }
        };

        const handleStageCompleted = () => {
            // Запускаем анимацию для последнего числа
            if(displayNumber !== null && displayNumber !== 0) {
                calculateLeftSpace();
                triggerFlyAnimation(displayNumber, null);
            }
            // Очищаем через 1 секунду (длительность анимации)
            setTimeout(() => setDisplayNumber(null), 1000);
        };

        const triggerFlyAnimation = (startValue, endValue) => {
            setFlyingNumber(startValue);
            setFlyAnimation(true);

            setTimeout(() => {
                setFlyAnimation(false);
                if(endValue !== null) {
                    setDisplayNumber(endValue);
                }
                setFlyingNumber(null);
            }, 1000);
        };

        const clearAnimation = () => {
            if(animationTimeout.current) {
                clearTimeout(animationTimeout.current);
                animationTimeout.current = null;
            }
        };

        handleStatusChange();
        statusRef.previous = currentState.status;

        return () => clearAnimation();
    }, [currentState]);

    const renderNewStageNumbers = () => {
        if (!prevDrawnNumbers.length) return null;

        const half = Math.ceil(prevDrawnNumbers.length / 2);
        return (
            <div className="new-stage-numbers">
                <div className="column">
                    {prevDrawnNumbers.slice(0, half).map((num, i) => (
                        <div key={i} className="large-number">{num}</div>
                    ))}
                </div>
                <div className="column">
                    {prevDrawnNumbers.slice(half).map((num, i) => (
                        <div key={i} className="large-number">{num}</div>
                    ))}
                </div>
            </div>
        );
    };

    const renderCenterDisplay = () => {
        if (!currentState) return null;

        if(currentState.status === "НОВЫЙ ЭТАП") {
            return renderNewStageNumbers();
        }

        return (
            <div className={`center-number ${flyAnimation ? 'fly-animation' : ''}`}>
                {flyAnimation ? flyingNumber : displayNumber}
            </div>
        );
    };

    const renderDrawnNumbers = () => {
        if (!currentState?.drawnNumbers?.length) return null;

        return (
            <div className="drawn-numbers" ref={drawnNumbersRef}>
                {currentState.drawnNumbers.map((num, i) => (
                    <span key={i} className="drawn-number">{num}</span>
                ))}
            </div>
        );
    };

    return (
        <div className="visualization-page">
            <div className="background"></div>
            {renderDrawnNumbers()}
            {renderCenterDisplay()}
        </div>
    );
};

export default VisualizationPage;