import random, json
from datetime import datetime
from fastapi import FastAPI, Request, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, SensorData # DB 모듈 가져오기
# from fastapi.middleware.cors import CORESMiddleware


app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# DB 세션 가져오기
def get_db() :
    db = SessionLocal()
    try :
        yield db
    finally :
        db.close()


def convert_time(nanoseconds: int) -> str:
    """
    나노초 단위의 Unix 타임스탬프를 YYYY-MM-DD HH:MM:SS 형식으로 변환
    """
    seconds = nanoseconds /1e9
    dt = datetime.utcfromtimestamp(seconds)
    return dt.strftime("%Y-%m-%d %H:%M:%S")



@app.post("/data")
async def receive_sensor_data(request : Request, db : Session = Depends(get_db)):
    """
    Sensor Logger에서 전송된 JSON 데이터를 수신하는 엔드포인트.
    - POST 요청을 처리하고 데이터를 콘솔에 출력한 후 JSON 응답을 반환함.
    """
    data = await request.json()

    # "payload" 리스트에서 하나만 랜덤하게 선택
    if "payload" in data and isinstance(data["payload"], list) and len(data["payload"]) > 0:
        selected_data = random.choice(data["payload"])  # 리스트에서 랜덤하게 하나 선택
        
        if "time" in selected_data:
            formatted_time = convert_time(selected_data["time"])
            del selected_data["time"]
            selected_data = {
                "name" : selected_data["name"],
                "time" : formatted_time,
                "values" : selected_data["values"]
            }

        print(f"📡 Selected Data Saved: {selected_data}")  # 선택된 데이터만 출력

        db_entry = SensorData(
            name = selected_data["name"],
            time = formatted_time,
            x = selected_data["values"]["x"],
            y = selected_data["values"]["y"],
            z = selected_data["values"]["z"]
        )
        db.add(db_entry)
        db.commit()

        return {"message": "Single data entry processed", "data": selected_data}

    
    

# 기본 확인용 페이지
@app.get("/data")
def get_sensor_data(db: Session = Depends(get_db)):
    """
    MySQL에서 센서 데이터를 가져와 JSON 형식으로 변환하는 엔드 포인트
    """
    data = db.query(SensorData).all()

    result = [
        {
            "id" : item.id,
            "name" : item.name,
            "time" : item.time,
            "x" : item.x,
            "y" : item.y,
            "z" : item.z
        }
        for item in data
    ]

    return {"sensor_data": result}