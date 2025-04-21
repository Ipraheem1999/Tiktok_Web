from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr, validator, constr
from typing import List, Optional
from datetime import datetime, timedelta
import os
import json
import shutil
from jose import JWTError, jwt
import sys
from passlib.context import CryptContext
import secrets
import re
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

# إضافة مسار نظام أتمتة تيك توك للوصول إلى الوحدات الموجودة
sys.path.append('/home/ubuntu/tiktok_automation')

# استيراد وحدات نظام أتمتة تيك توك
try:
    from src.proxy.proxy_manager import ProxyManager
    from src.account.account_manager import AccountManager
    from src.scheduler.schedule_manager import ScheduleManager
    from src.mobile.mobile_simulator import MobileSimulator
    from src.engagement.tiktok_engagement import TikTokEngagement
    TIKTOK_AUTOMATION_AVAILABLE = True
except ImportError:
    print("تحذير: لم يتم العثور على وحدات نظام أتمتة تيك توك")
    TIKTOK_AUTOMATION_AVAILABLE = False

# إعداد قاعدة البيانات
SQLALCHEMY_DATABASE_URL = "sqlite:///./tiktok_web.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# إعداد مصادقة JWT
# تحسين الأمان: استخدام مفتاح سري معقد وعشوائي من متغيرات البيئة أو توليده عشوائياً
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", secrets.token_hex(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # تقليل مدة صلاحية التوكن لتحسين الأمان

# إعداد تشفير كلمات المرور
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# نماذج قاعدة البيانات
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    
    accounts = relationship("TikTokAccount", back_populates="owner", cascade="all, delete-orphan")
    schedules = relationship("Schedule", back_populates="owner", cascade="all, delete-orphan")

class TikTokAccount(Base):
    __tablename__ = "tiktok_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    password = Column(String)
    country = Column(String)
    proxy = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="accounts")
    schedules = relationship("Schedule", back_populates="account", cascade="all, delete-orphan")

class Schedule(Base):
    __tablename__ = "schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    video_path = Column(String)
    caption = Column(String)
    schedule_time = Column(DateTime)
    tags = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, completed, failed
    owner_id = Column(Integer, ForeignKey("users.id"))
    account_id = Column(Integer, ForeignKey("tiktok_accounts.id"))
    
    owner = relationship("User", back_populates="schedules")
    account = relationship("TikTokAccount", back_populates="schedules")

class Proxy(Base):
    __tablename__ = "proxies"
    
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, index=True)
    country = Column(String, index=True)
    is_active = Column(Boolean, default=True)

class Engagement(Base):
    __tablename__ = "engagements"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("tiktok_accounts.id"))
    engagement_type = Column(String)  # like, comment, share, save, follow
    target_url = Column(String)
    target_username = Column(String, nullable=True)
    comment_text = Column(String, nullable=True)
    share_type = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    account = relationship("TikTokAccount")

# إنشاء جداول قاعدة البيانات
Base.metadata.create_all(bind=engine)

# نماذج Pydantic مع التحقق من صحة البيانات
class UserBase(BaseModel):
    username: constr(min_length=3, max_length=50)
    email: EmailStr

    @validator('username')
    def username_alphanumeric(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('اسم المستخدم يجب أن يحتوي على أحرف وأرقام وشرطات سفلية فقط')
        return v

class UserCreate(UserBase):
    password: constr(min_length=8)

    @validator('password')
    def password_strength(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
        if not re.search(r'[a-z]', v):
            raise ValueError('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
        if not re.search(r'[0-9]', v):
            raise ValueError('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل')
        return v

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_at: int

class TokenData(BaseModel):
    username: Optional[str] = None
    exp: Optional[int] = None

class TikTokAccountBase(BaseModel):
    username: constr(min_length=3, max_length=50)
    country: str
    proxy: Optional[str] = None

    @validator('country')
    def validate_country(cls, v):
        valid_countries = ['السعودية', 'الإمارات', 'الكويت', 'مصر']
        if v not in valid_countries:
            raise ValueError(f'الدولة يجب أن تكون واحدة من: {", ".join(valid_countries)}')
        return v

class TikTokAccountCreate(TikTokAccountBase):
    password: constr(min_length=8)

class TikTokAccountResponse(TikTokAccountBase):
    id: int
    
    class Config:
        orm_mode = True

class ScheduleBase(BaseModel):
    caption: str
    schedule_time: datetime
    tags: Optional[str] = None

    @validator('schedule_time')
    def validate_schedule_time(cls, v):
        if v < datetime.now():
            raise ValueError('وقت الجدولة يجب أن يكون في المستقبل')
        return v

class ScheduleCreate(ScheduleBase):
    account_id: int

class ScheduleResponse(ScheduleBase):
    id: int
    video_path: str
    status: str
    
    class Config:
        orm_mode = True

class ProxyBase(BaseModel):
    address: str
    country: str

    @validator('address')
    def validate_proxy_address(cls, v):
        if not re.match(r'^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5})$', v):
            raise ValueError('عنوان البروكسي يجب أن يكون بتنسيق IP:PORT')
        return v

    @validator('country')
    def validate_country(cls, v):
        valid_countries = ['السعودية', 'الإمارات', 'الكويت', 'مصر']
        if v not in valid_countries:
            raise ValueError(f'الدولة يجب أن تكون واحدة من: {", ".join(valid_countries)}')
        return v

class ProxyCreate(ProxyBase):
    pass

class ProxyResponse(ProxyBase):
    id: int
    is_active: bool
    
    class Config:
        orm_mode = True

class EngagementBase(BaseModel):
    account_id: int
    target_url: str

    @validator('target_url')
    def validate_url(cls, v):
        if not v.startswith('https://www.tiktok.com/'):
            raise ValueError('الرابط يجب أن يكون رابط تيك توك صالح')
        return v

class LikeCreate(EngagementBase):
    pass

class CommentCreate(EngagementBase):
    comment_text: constr(min_length=1, max_length=150)

class ShareCreate(EngagementBase):
    share_type: str

    @validator('share_type')
    def validate_share_type(cls, v):
        valid_types = ['copy', 'facebook', 'twitter', 'whatsapp', 'telegram']
        if v not in valid_types:
            raise ValueError(f'نوع المشاركة يجب أن يكون واحداً من: {", ".join(valid_types)}')
        return v

class SaveCreate(EngagementBase):
    pass

class FollowCreate(BaseModel):
    account_id: int
    username: constr(min_length=3, max_length=50)

class EngagementResponse(BaseModel):
    id: int
    account_id: int
    engagement_type: str
    target_url: Optional[str] = None
    target_username: Optional[str] = None
    comment_text: Optional[str] = None
    share_type: Optional[str] = None
    status: str
    created_at: datetime
    
    class Config:
        orm_mode = True

# وظائف المساعدة
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# وظائف المصادقة
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    
    # التحقق من عدد محاولات تسجيل الدخول الفاشلة
    if user.failed_login_attempts >= 5:
        # إعادة تعيين عداد المحاولات بعد 30 دقيقة
        if user.last_login and (datetime.utcnow() - user.last_login) > timedelta(minutes=30):
            user.failed_login_attempts = 0
        else:
            return False
    
    if not verify_password(password, user.hashed_password):
        # زيادة عداد محاولات تسجيل الدخول الفاشلة
        user.failed_login_attempts += 1
        user.last_login = datetime.utcnow()
        db.commit()
        return False
    
    # إعادة تعيين عداد المحاولات عند نجاح تسجيل الدخول
    user.failed_login_attempts = 0
    user.last_login = datetime.utcnow()
    db.commit()
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, int(expire.timestamp())

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="بيانات الاعتماد غير صالحة",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        exp: int = payload.get("exp")
        if username is None or exp is None:
            raise credentials_exception
        
        # التحقق من انتهاء صلاحية التوكن
        if datetime.fromtimestamp(exp) < datetime.utcnow():
            raise credentials_exception
            
        token_data = TokenData(username=username, exp=exp)
    except JWTError:
        raise credentials_exception
    user = get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="المستخدم غير نشط")
    return current_user

# إنشاء تطبيق FastAPI
app = FastAPI(title="نظام أتمتة تيك توك", description="واجهة برمجة تطبيقات لنظام أتمتة تيك توك")

# إضافة وسيط للتحقق من المضيفين الموثوقين
app.add_middleware(
    TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "tiktok-automation.example.com"]
)

# إعداد CORS - تحسين الأمان
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://tiktok-automation.example.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,  # تحديد مدة صلاحية طلبات preflight
)

# وسيط لتسجيل الطلبات وإضافة رؤوس أمان
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # إضافة رؤوس أمان
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'"
    
    return response

# معالج الأخطاء العام
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "حدث خطأ داخلي في الخادم"},
    )

# مسارات المصادقة
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="اسم المستخدم أو كلمة المرور غير صحيحة",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token, expires_at = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "expires_at": expires_at}

@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="اسم المستخدم مسجل بالفعل")
    
    # التحقق من البريد الإلكتروني
    email_exists = db.query(User).filter(User.email == user.email).first()
    if email_exists:
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مسجل بالفعل")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/me/", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# مسارات حسابات تيك توك
@app.post("/tiktok-accounts/", response_model=TikTokAccountResponse)
def create_tiktok_account(
    account: TikTokAccountCreate, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # تشفير كلمة المرور قبل التخزين
    encrypted_password = get_password_hash(account.password)
    
    db_account = TikTokAccount(
        username=account.username,
        password=encrypted_password,  # تخزين كلمة المرور المشفرة
        country=account.country,
        proxy=account.proxy,
        owner_id=current_user.id
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    
    # إذا كان نظام أتمتة تيك توك متاحًا، قم بإضافة الحساب إليه أيضًا
    if TIKTOK_AUTOMATION_AVAILABLE:
        account_manager = AccountManager()
        account_manager.add_account(
            account.username,
            account.password,  # استخدام كلمة المرور الأصلية للنظام الخارجي
            account.country,
            account.proxy
        )
    
    return db_account

@app.get("/tiktok-accounts/", response_model=List[TikTokAccountResponse])
def read_tiktok_accounts(
    skip: int = 0, 
    limit: int = 100, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    accounts = db.query(TikTokAccount).filter(TikTokAccount.owner_id == current_user.id).offset(skip).limit(limit).all()
    return accounts

@app.get("/tiktok-accounts/{account_id}", response_model=TikTokAccountResponse)
def read_tiktok_account(
    account_id: int, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    account = db.query(TikTokAccount).filter(TikTokAccount.id == account_id, TikTokAccount.owner_id == current_user.id).first()
    if account is None:
        raise HTTPException(status_code=404, detail="الحساب غير موجود")
    return account

@app.delete("/tiktok-accounts/{account_id}")
def delete_tiktok_account(
    account_id: int, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    account = db.query(TikTokAccount).filter(TikTokAccount.id == account_id, TikTokAccount.owner_id == current_user.id).first()
    if account is None:
        raise HTTPException(status_code=404, detail="الحساب غير موجود")
    
    # إذا كان نظام أتمتة تيك توك متاحًا، قم بإزالة الحساب منه أيضًا
    if TIKTOK_AUTOMATION_AVAILABLE:
        account_manager = AccountManager()
        account_manager.remove_account(account.username)
    
    db.delete(account)
    db.commit()
    return {"detail": "تم حذف الحساب بنجاح"}

# مسارات جدولة المنشورات
@app.post("/schedules/", response_model=ScheduleResponse)
async def create_schedule(
    caption: str = Form(...),
    schedule_time: str = Form(...),
    tags: Optional[str] = Form(None),
    account_id: int = Form(...),
    video: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # التحقق من وجود الحساب
    account = db.query(TikTokAccount).filter(TikTokAccount.id == account_id, TikTokAccount.owner_id == current_user.id).first()
    if account is None:
        raise HTTPException(status_code=404, detail="الحساب غير موجود")
    
    # التحقق من نوع الملف
    if not video.filename.lower().endswith(('.mp4', '.mov', '.avi')):
        raise HTTPException(status_code=400, detail="نوع الملف غير مدعوم. يجب أن يكون الملف بتنسيق mp4 أو mov أو avi")
    
    # حفظ الفيديو
    upload_dir = os.path.join("uploads", str(current_user.id))
    os.makedirs(upload_dir, exist_ok=True)
    
    # استخدام اسم ملف آمن
    safe_filename = f"{secrets.token_hex(8)}_{os.path.basename(video.filename)}"
    file_path = os.path.join(upload_dir, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)
    
    # تحويل وقت الجدولة إلى كائن datetime
    try:
        schedule_time_obj = datetime.fromisoformat(schedule_time)
        
        # التحقق من أن وقت الجدولة في المستقبل
        if schedule_time_obj <= datetime.now():
            raise HTTPException(status_code=400, detail="وقت الجدولة يجب أن يكون في المستقبل")
    except ValueError:
        raise HTTPException(status_code=400, detail="تنسيق وقت الجدولة غير صالح")
    
    # إنشاء الجدولة في قاعدة البيانات
    db_schedule = Schedule(
        video_path=file_path,
        caption=caption,
        schedule_time=schedule_time_obj,
        tags=tags,
        owner_id=current_user.id,
        account_id=account_id
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    # إذا كان نظام أتمتة تيك توك متاحًا، قم بإضافة الجدولة إليه أيضًا
    if TIKTOK_AUTOMATION_AVAILABLE:
        schedule_manager = ScheduleManager()
        schedule_manager.add_post(
            account.username,
            file_path,
            caption,
            schedule_time,
            tags
        )
    
    return db_schedule

@app.get("/schedules/", response_model=List[ScheduleResponse])
def read_schedules(
    skip: int = 0, 
    limit: int = 100, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    schedules = db.query(Schedule).filter(Schedule.owner_id == current_user.id).offset(skip).limit(limit).all()
    return schedules

@app.get("/schedules/{schedule_id}", response_model=ScheduleResponse)
def read_schedule(
    schedule_id: int, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id, Schedule.owner_id == current_user.id).first()
    if schedule is None:
        raise HTTPException(status_code=404, detail="الجدولة غير موجودة")
    return schedule

@app.delete("/schedules/{schedule_id}")
def delete_schedule(
    schedule_id: int, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id, Schedule.owner_id == current_user.id).first()
    if schedule is None:
        raise HTTPException(status_code=404, detail="الجدولة غير موجودة")
    
    # إذا كان نظام أتمتة تيك توك متاحًا، قم بإزالة الجدولة منه أيضًا
    if TIKTOK_AUTOMATION_AVAILABLE:
        schedule_manager = ScheduleManager()
        schedule_manager.remove_post(str(schedule_id))
    
    db.delete(schedule)
    db.commit()
    return {"detail": "تم حذف الجدولة بنجاح"}

# مسارات البروكسي
@app.post("/proxies/", response_model=ProxyResponse)
def create_proxy(
    proxy: ProxyCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # التحقق من صلاحيات المستخدم
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية لإضافة بروكسي")
    
    db_proxy = Proxy(
        address=proxy.address,
        country=proxy.country,
        is_active=True
    )
    db.add(db_proxy)
    db.commit()
    db.refresh(db_proxy)
    
    # إذا كان نظام أتمتة تيك توك متاحًا، قم بإضافة البروكسي إليه أيضًا
    if TIKTOK_AUTOMATION_AVAILABLE:
        proxy_manager = ProxyManager()
        proxy_manager.add_proxy(proxy.address, proxy.country)
    
    return db_proxy

@app.get("/proxies/", response_model=List[ProxyResponse])
def read_proxies(
    skip: int = 0, 
    limit: int = 100, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    proxies = db.query(Proxy).offset(skip).limit(limit).all()
    return proxies

@app.delete("/proxies/{proxy_id}")
def delete_proxy(
    proxy_id: int, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # التحقق من صلاحيات المستخدم
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية لحذف بروكسي")
    
    proxy = db.query(Proxy).filter(Proxy.id == proxy_id).first()
    if proxy is None:
        raise HTTPException(status_code=404, detail="البروكسي غير موجود")
    
    # إذا كان نظام أتمتة تيك توك متاحًا، قم بإزالة البروكسي منه أيضًا
    if TIKTOK_AUTOMATION_AVAILABLE:
        proxy_manager = ProxyManager()
        proxy_manager.remove_proxy(proxy.address)
    
    db.delete(proxy)
    db.commit()
    return {"detail": "تم حذف البروكسي بنجاح"}

# مسارات التفاعل
@app.post("/engagements/like/", response_model=EngagementResponse)
def like_video(
    like_data: LikeCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # التحقق من وجود الحساب
    account = db.query(TikTokAccount).filter(TikTokAccount.id == like_data.account_id, TikTokAccount.owner_id == current_user.id).first()
    if account is None:
        raise HTTPException(status_code=404, detail="الحساب غير موجود")
    
    # إنشاء سجل التفاعل
    db_engagement = Engagement(
        account_id=like_data.account_id,
        engagement_type="like",
        target_url=like_data.target_url,
        status="pending"
    )
    db.add(db_engagement)
    db.commit()
    db.refresh(db_engagement)
    
    # إذا كان نظام أتمتة تيك توك متاحًا، قم بتنفيذ الإعجاب
    if TIKTOK_AUTOMATION_AVAILABLE:
        try:
            engagement = TikTokEngagement()
            success = engagement.like_video(account.username, like_data.target_url)
            
            # تحديث حالة التفاعل
            db_engagement.status = "completed" if success else "failed"
            db.commit()
        except Exception as e:
            db_engagement.status = "failed"
            db.commit()
            raise HTTPException(status_code=500, detail=f"فشل في تنفيذ الإعجاب: {str(e)}")
    
    return db_engagement

@app.post("/engagements/comment/", response_model=EngagementResponse)
def comment_video(
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # التحقق من وجود الحساب
    account = db.query(TikTokAccount).filter(TikTokAccount.id == comment_data.account_id, TikTokAccount.owner_id == current_user.id).first()
    if account is None:
        raise HTTPException(status_code=404, detail="الحساب غير موجود")
    
    # إنشاء سجل التفاعل
    db_engagement = Engagement(
        account_id=comment_data.account_id,
        engagement_type="comment",
        target_url=comment_data.target_url,
        comment_text=comment_data.comment_text,
        status="pending"
    )
    db.add(db_engagement)
    db.commit()
    db.refresh(db_engagement)
    
    # إذا كان نظام أتمتة تيك توك متاحًا، قم بتنفيذ التعليق
    if TIKTOK_AUTOMATION_AVAILABLE:
        try:
            engagement = TikTokEngagement()
            success = engagement.comment_video(account.username, comment_data.target_url, comment_data.comment_text)
            
            # تحديث حالة التفاعل
            db_engagement.status = "completed" if success else "failed"
            db.commit()
        except Exception as e:
            db_engagement.status = "failed"
            db.commit()
            raise HTTPException(status_code=500, detail=f"فشل في تنفيذ التعليق: {str(e)}")
    
    return db_engagement

@app.post("/engagements/share/", response_model=EngagementResponse)
def share_video(
    share_data: ShareCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # التحقق من وجود الحساب
    account = db.query(TikTokAccount).filter(TikTokAccount.id == share_data.account_id, TikTokAccount.owner_id == current_user.id).first()
    if account is None:
        raise HTTPException(status_code=404, detail="الحساب غير موجود")
    
    # إنشاء سجل التفاعل
    db_engagement = Engagement(
        account_id=share_data.account_id,
        engagement_type="share",
        target_url=share_data.target_url,
        share_type=share_data.share_type,
        status="pending"
    )
    db.add(db_engagement)
    db.commit()
    db.refresh(db_engagement)
    
    # إذا كان نظام أتمتة تيك توك متاحًا، قم بتنفيذ المشاركة
    if TIKTOK_AUTOMATION_AVAILABLE:
        try:
            engagement = TikTokEngagement()
            success = engagement.share_video(account.username, share_data.target_url, share_data.share_type)
            
            # تحديث حالة التفاعل
            db_engagement.status = "completed" if success else "failed"
            db.commit()
        except Exception as e:
            db_engagement.status = "failed"
            db.commit()
            raise HTTPException(status_code=500, detail=f"فشل في تنفيذ المشاركة: {str(e)}")
    
    return db_engagement

@app.post("/engagements/save/", response_model=EngagementResponse)
def save_video(
    save_data: SaveCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # التحقق من وجود الحساب
    account = db.query(TikTokAccount).filter(TikTokAccount.id == save_data.account_id, TikTokAccount.owner_id == current_user.id).first()
    if account is None:
        raise HTTPException(status_code=404, detail="الحساب غير موجود")
    
    # إنشاء سجل التفاعل
    db_engagement = Engagement(
        account_id=save_data.account_id,
        engagement_type="save",
        target_url=save_data.target_url,
        status="pending"
    )
    db.add(db_engagement)
    db.commit()
    db.refresh(db_engagement)
    
    # إذا كان نظام أتمتة تيك توك متاحًا، قم بتنفيذ الحفظ
    if TIKTOK_AUTOMATION_AVAILABLE:
        try:
            engagement = TikTokEngagement()
            success = engagement.save_video(account.username, save_data.target_url)
            
            # تحديث حالة التفاعل
            db_engagement.status = "completed" if success else "failed"
            db.commit()
        except Exception as e:
            db_engagement.status = "failed"
            db.commit()
            raise HTTPException(status_code=500, detail=f"فشل في تنفيذ الحفظ: {str(e)}")
    
    return db_engagement

@app.post("/engagements/follow/", response_model=EngagementResponse)
def follow_user(
    follow_data: FollowCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # التحقق من وجود الحساب
    account = db.query(TikTokAccount).filter(TikTokAccount.id == follow_data.account_id, TikTokAccount.owner_id == current_user.id).first()
    if account is None:
        raise HTTPException(status_code=404, detail="الحساب غير موجود")
    
    # إنشاء سجل التفاعل
    db_engagement = Engagement(
        account_id=follow_data.account_id,
        engagement_type="follow",
        target_username=follow_data.username,
        status="pending"
    )
    db.add(db_engagement)
    db.commit()
    db.refresh(db_engagement)
    
    # إذا كان نظام أتمتة تيك توك متاحًا، قم بتنفيذ المتابعة
    if TIKTOK_AUTOMATION_AVAILABLE:
        try:
            engagement = TikTokEngagement()
            success = engagement.follow_user(account.username, follow_data.username)
            
            # تحديث حالة التفاعل
            db_engagement.status = "completed" if success else "failed"
            db.commit()
        except Exception as e:
            db_engagement.status = "failed"
            db.commit()
            raise HTTPException(status_code=500, detail=f"فشل في تنفيذ المتابعة: {str(e)}")
    
    return db_engagement

@app.get("/engagements/", response_model=List[EngagementResponse])
def read_engagements(
    skip: int = 0, 
    limit: int = 100, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # الحصول على قائمة حسابات المستخدم
    account_ids = [account.id for account in db.query(TikTokAccount).filter(TikTokAccount.owner_id == current_user.id).all()]
    
    # الحصول على التفاعلات المرتبطة بحسابات المستخدم
    engagements = db.query(Engagement).filter(Engagement.account_id.in_(account_ids)).offset(skip).limit(limit).all()
    return engagements

# تشغيل التطبيق
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
