import React, { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import './VisualizationPage.css';
import './fonts/TinkoffSans_Bold.otf';
import './fonts/TinkoffSans_Medium.otf';


const VisualizationPage = () => {
    const host = "http://localhost:8080";
    const [currentState, setCurrentState] = useState(null);
    const [currentStage, setCurrentStage] = useState(1);
    const [objDrawnNumbers, setObjDrawnNumbers] = useState([]);



    const configRef  = useRef({
        startX: 300,    // Начальная позиция X первого элемента
        startY: 285,    // Начальная позиция Y
        stepX: 127,      // Шаг по горизонтали
        stepY: 0,
        fontSize: 60    // конечный размер
    });


    const centerPosition = useRef({
        x: typeof window !== 'undefined' ? window.innerWidth/2 : 0,
        y: typeof window !== 'undefined' ? window.innerHeight/2 : 0,
        fontSize: 350
    });

    const statusRef = useRef(null);

    // useEffect(() => {
    //     if (currentState && currentState.status !== "НОВЫЙ ЭТАП") {
    //         setPrevDrawnNumbers(currentState.drawnNumbers || []);
    //     }
    // }, [currentState]);

    useEffect(() => {
        const handleResize = () => {
            centerPosition.current = {
                x: window.innerWidth/2,
                y: window.innerHeight/2
            };
        };

        window.addEventListener('resize', handleResize);


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
        return () => {clearInterval(interval);
            window.removeEventListener('resize', handleResize)};
    }, []);




    useEffect(() => {
        if (!currentState) return;

        const lastStageAction = () =>{
            setObjDrawnNumbers(objDrawnNumbers.map(e=> {return {...e, position: e.target}}));
        }

        const initNewNuber = () => {
            console.log("initNewNuber", objDrawnNumbers)
            var newObjDrawnNumbers = objDrawnNumbers.map(e=> {return {...e, position: e.target}});
            if (newObjDrawnNumbers.find(n => n.value === currentState.currentValue) === undefined) {
                console.log("newObjDrawnNumbers", newObjDrawnNumbers)
                const newNumber = {
                    value: currentState.currentValue,
                    position: {...centerPosition.current, size: centerPosition.current.fontSize},
                    target: calculateTargetPosition(newObjDrawnNumbers.length)
                };

                setObjDrawnNumbers([...newObjDrawnNumbers, newNumber]);
            }
        }

        const handleReadyStatus = () => {
            setObjDrawnNumbers(objDrawnNumbers.map(e=> {
                if(e.value === 0) return {...e, value: currentState.currentValue};
                else return e;
            }));
        }


        const countXforResult = (startX, index, step) => {
            return startX + (index * step)

        }

        const handleStageCompleted = () => {
            const positions = {
                                  0: {x: countXforResult(355, 0, 203), y: 370}
                                , 1: {x: countXforResult(500, 0, 230), y: 540}
                                , 2: {x: countXforResult(355, 1, 203), y: 370}
                                , 3: {x: countXforResult(500, 1, 230), y: 540}
                                , 4: {x: countXforResult(355, 2, 203), y: 370}
                                , 5: {x: countXforResult(355, 3, 203), y: 370}
                                , 6: {x: countXforResult(500, 2, 230), y: 540}
                                , 7: {x: countXforResult(355, 4, 203), y: 370}
                                , 8: {x: countXforResult(500, 3, 230), y: 540}
                                , 9: {x: countXforResult(355, 5, 203), y: 370}
            }
            setObjDrawnNumbers(objDrawnNumbers.map((e, i)=> {
                return {...e, position: {...positions[i], size: 100}}
            }))
        }

        const calculateTargetPosition = (index) => ({
            x: configRef.current.startX + index * configRef.current.stepX,
            y: configRef.current.startY + index * configRef.current.stepY,
            size: configRef.current.fontSize
        });

        const deletePreviousStage = () => {
            if (objDrawnNumbers.length === 10) {
                setCurrentStage(currentStage+1)
                const newNumber = {
                    value: currentState.currentValue,
                    position: {...centerPosition.current, size: centerPosition.current.fontSize},
                    target: calculateTargetPosition(0)
                };
                setObjDrawnNumbers([newNumber]);
            }
        }

        const handleStatusChange = () => {
            switch(currentState.status) {
                case "НОМЕР СГЕНЕРИРОВАН":
                    handleReadyStatus();
                    break;

                case "ГОТОВ":
                    initNewNuber();
                    deletePreviousStage();
                    break;

                case "ЭТАП ЗАВЕРШЕН": // Добавляем обработку завершения этапа
                    lastStageAction();
                    break;

                case "НОВЫЙ ЭТАП":
                    handleStageCompleted();
                    //
                    break;
            }
        };

        console.log("handleStatusChange")
        handleStatusChange();
        statusRef.previous = currentState.status;

    }, [currentState]);





    // const renderNewStageNumbers = () => {
    //     if (!prevDrawnNumbers.length) return null;
    //
    //     const half = Math.ceil(prevDrawnNumbers.length / 2);
    //     return (
    //         <div className="new-stage-numbers">
    //             <div className="column">
    //                 {prevDrawnNumbers.slice(0, half).map((num, i) => (
    //                     <div key={i} className="large-number">{num}</div>
    //                 ))}
    //             </div>
    //             <div className="column">
    //                 {prevDrawnNumbers.slice(half).map((num, i) => (
    //                     <div key={i} className="large-number">{num}</div>
    //                 ))}
    //             </div>
    //         </div>
    //     );
    // };


    const renderDrawnNumbers = () => {
        return (
            <>
            {objDrawnNumbers.map((num, index) => (
                    <div
                        key={index+"_"+currentStage}
                        className="number"
                        style={{
                            color: '#333333',
                            position: 'fixed',
                            left: num.position.x,
                            top: num.position.y,
                            fontSize: `${num.position.size}px`,
                            transform: 'translate(-50%, -50%)',
                            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontFamily: 'TinkoffSans',
                        }}
                    >
                        {num.value}
                    </div>
                ))}
            </>
        );
    };

    return (
        <div className="visualization-page">
            <div className="background"></div>
            {renderDrawnNumbers()}
        </div>
    );
};

export default VisualizationPage;