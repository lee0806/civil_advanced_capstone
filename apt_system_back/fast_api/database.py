from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Float, create_engine
from sqlalchemy.orm import sessionmaker

# MySQL 연결 설정 (주소 설정)
DATABASE_URL = "mysql+pymysql://fastapi_user:0709@127.0.0.1/sensor_db"

# 데이터베이스 엔진 생성
engine = create_engine(DATABASE_URL)

# 세션 생성
SessionLocal = sessionmaker(autocommit = False, autoflush= False, bind=engine)

# Base 클래스 선언
Base = declarative_base()

class SensorData(Base) :
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True) # 기본키
    name = Column(String(255)) # 센서 이름
    time = Column(String(255)) # 타임 스탬프
    x = Column(Float) # X축 값
    y = Column(Float) # Y축 값
    z = Column(Float) # Z축 값

# 테이블 생성
Base.metadata.create_all(bind=engine)