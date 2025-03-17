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
        stepX: 125,      // Шаг по горизонтали
        stepY: 0,
        fontSize: 60    // конечный размер
    });


    const centerPosition = useRef({
        x: 864,
        y: 480,
        fontSize: 350
    });

    const statusRef = useRef(null);
    const animationTimeoutRef = useRef(null); // Реф для хранения таймера анимации
    const newNumbersRef = useRef(new Set()); // Для отслеживания новых чисел

    // Эффект для анимации появления новых чисел
    useEffect(() => {
        // const newEntries = objDrawnNumbers.filter(num =>
        //     !newNumbersRef.current.has(num.value) && num.opacity === 0
        // );
        //
        // if (newEntries.length > 0) {
        //     newEntries.forEach(num => newNumbersRef.current.add(num.value));
        //
        //     const timer = setTimeout(() => {
        //         setObjDrawnNumbers(prev =>
        //             prev.map(num => ({
        //                 ...num,
        //                 opacity: num.opacity === 0 ? 1 : num.opacity
        //             }))
        //         );
        //     }, 200);
        //
        //     return () => clearTimeout(timer);
        // }
    }, [objDrawnNumbers]);

    // useEffect(() => {
    //     if (currentState && currentState.status !== "НОВЫЙ ЭТАП") {
    //         setPrevDrawnNumbers(currentState.drawnNumbers || []);
    //     }
    // }, [currentState]);

    useEffect(() => {
        const handleResize = () => {
            centerPosition.current = {
                x: 864,
                y: 480,
                fontSize: 350
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
        const interval = setInterval(pollApi, 500);
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
                    target: calculateTargetPosition(newObjDrawnNumbers.length),
                    opacity: 0 // Начальная прозрачность
                };

                setObjDrawnNumbers([...newObjDrawnNumbers, newNumber]);
            }
        }

        const setVisible = () => {
            const timer = setTimeout(() => {
                setObjDrawnNumbers(prev =>
                    prev.map(num => ({
                        ...num,
                        opacity: 1
                    }))
                );
            }, 200);

            return () => clearTimeout(timer);
        }



        const handleReadyStatus = () => {
            const currentNumbers = [...objDrawnNumbers];
            const zeroIndex = currentNumbers.findIndex(n => n.value === 0);
            if (zeroIndex === -1) return;

            const remaining = [...currentState.remainingNumbers];
            const finalValue = currentState.currentValue;

            if (!remaining || remaining.length === 0) return;

            // Очистка предыдущей анимации
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }

            const startTime = Date.now();
            const duration = 6000;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                if (elapsed >= duration) {
                    setObjDrawnNumbers(prev => {
                        const newNumbers = [...prev];
                        if (newNumbers[zeroIndex]) {
                            newNumbers[zeroIndex].value = finalValue;
                        }
                        return newNumbers;
                    });
                    return;
                }

                const randomIndex = Math.floor(Math.random() * remaining.length);
                const randomValue = remaining[randomIndex];

                setObjDrawnNumbers(prev => {
                    const newNumbers = [...prev];
                    if (newNumbers[zeroIndex]) {
                        newNumbers[zeroIndex].value = randomValue;
                    }
                    return newNumbers;
                });

                const progress = elapsed / duration;
                const delay = 50 + progress * 250; // Настраиваем замедление

                animationTimeoutRef.current = setTimeout(animate, delay);
            };

            animate();
        };


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


                setObjDrawnNumbers(prev =>
                    prev.map(num => ({
                        ...num,
                        opacity: 0
                    })));
                setTimeout(() => {
                    setCurrentStage(currentStage+1)
                    const newNumber = {
                        value: currentState.currentValue,
                        position: {...centerPosition.current, size: centerPosition.current.fontSize},
                        target: calculateTargetPosition(0),
                        opacity: 0
                    };
                    setObjDrawnNumbers([newNumber]);
                    setVisible()
                }, 500);
            }


        const handleStatusChange = () => {
            switch(currentState.status) {
                case "НОМЕР СГЕНЕРИРОВАН":
                    handleReadyStatus();
                    break;

                case "ГОТОВ":

                    if (objDrawnNumbers.length === 10) {
                        deletePreviousStage();
                    } else {
                        initNewNuber();
                        setVisible()
                    }


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
                            fontFamily: 'TinkoffSans',
                            opacity: num.opacity,
                            transition: `
                                all 0.8s cubic-bezier(0.4, 0, 0.2, 1),
                                opacity 0.6s ease-out
                            `,
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
            <video
                className="background-video"
                autoPlay
                loop
                muted
                playsInline
                width={1728}
                height={960}
            >
                <source src="https://my-ration.ru/uyqwefgqiuye12iu3gh12h3/static/media/back.mp4" type="video/mp4" />
            </video>
            {renderDrawnNumbers()}
        </div>
    );
};

export default VisualizationPage;