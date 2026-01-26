from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import engine, Base
from routers import auth, prospects, messages, icp, integrations, workflow, sequences, gmail


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    Base.metadata.create_all(bind=engine)
    print("Database initialized")
    yield
    # Shutdown
    print("Shutting down")


app = FastAPI(
    title="Outbound Sales Agent API",
    description="AI-powered cold outbound sales agent with ICP scoring and personalized messaging",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(prospects.router)
app.include_router(messages.router)
app.include_router(icp.router)
app.include_router(integrations.router)
app.include_router(workflow.router)
app.include_router(sequences.router)
app.include_router(gmail.router)


@app.get("/")
async def root():
    return {
        "name": "Outbound Sales Agent API",
        "version": "2.0.0",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
