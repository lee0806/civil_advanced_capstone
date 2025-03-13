import React from "react";
import SensorData from "./SensorData/SensorData";
import Banner from "./Component/Banner/Banner";
import "./App.css"

function App() {


  return (
    <>
      <div className="app-container">
        <Banner />
        <h1>📡 센서 데이터 대시보드</h1>
      </div>
      
      {/* 📌 SensorData 컴포넌트를 렌더링하여 데이터를 화면에 표시 */}
      <SensorData />
    </>
  );
}

export default App;