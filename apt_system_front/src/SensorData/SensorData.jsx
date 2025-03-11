// React에서 컴포넌트가 실행될 때 특정 작업을 수행하도록 하는 useEffect를 가져옴
import React, { useEffect } from "react";

// Zustand에서 만든 변수관리 스토어를 가져옴
import useSensorStore from "../store/store";

const SensorData = () => {

    // store에서 센서 데이터 변수(sensorData)와 데이터를 가져오는 함수(fetchData)를 가져옴
    const { sensorData, fetchData } = useSensorStore();

    useEffect(() => {
        fetchData();
    }, []);

    return(
        <>
        <h2>📡 센서 데이터</h2>

        {/* 센서 데이터를 표 형식으로 표시 */}
        <table border="1">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>이름</th>
                    <th>시간</th>
                    <th>X</th>
                    <th>Y</th>
                    <th>Z</th>
                </tr>
            </thead>
            <tbody>
                {/* sensorData 배열을 반복하여 데이터를 표에 출력 */}
                {sensorData.map((data) => (
                    <tr key={data.id}>
                        <td>{data.id}</td>
                        <td>{data.name}</td>
                        <td>{data.time}</td>
                        <td>{data.x.toFixed(3)}</td> {/* 소수점 3자리까지 표시 */}
                        <td>{data.y.toFixed(3)}</td>
                        <td>{data.z.toFixed(3)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        </>
    );
};

export default SensorData;

