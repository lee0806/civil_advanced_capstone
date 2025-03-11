// Zustand 라이브러리에서 create 함수 가져옴 (상태 관리용)
import { create } from "zustand";

// Zustand 스토어 (변수 데이터를 전역 변수로 만들어 관리함)
const useSensorStore = create((set) => ({

    // 변수이며 센서 데이터를 저장함
    sensorData: [],

    // FastAPI에서 데이터를 가져오는 비동기 함수
    fetchData: async () => {
        try {
            // FastAPI의 'GET /data' API 호출 (센서 데이터 가져오는 과정)
            const response = await fetch("http://localhost:8000/data");
            
            // 응답을 JSON 형식으로 변환
            const result = await response.json();
            
            // 가져온 데이터를 sensorData 변수에 저장
            set({ sensorData: result.sensorData });

        } catch (error) {
            console.log("❌ 데이터 가져오기 실패:", error);
        }
    },


}));

export default useSensorStore;
