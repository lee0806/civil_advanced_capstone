
import React from "react";

import SensorData from "./SensorData/SensorData";


function App() {


  return (
    <>
      <h1>📡 센서 데이터 대시보드</h1>
      {/* 📌 SensorData 컴포넌트를 렌더링하여 데이터를 화면에 표시 */}
      <SensorData />
    </>
  );
}

export default App;