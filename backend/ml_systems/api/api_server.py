"""
FastAPI backend serving live predictions and ML results.
Re-reads clean_aqi_dataset.csv on every request, so new data appears on the
next poll without a server restart.

Run: uvicorn api.api_server:app --reload --port 5000
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from xgboost import XGBRegressor

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = PROJECT_ROOT / "clean_aqi_dataset.csv"
MODEL_DIR = PROJECT_ROOT / "outputs" / "models"
RESULTS_DIR = PROJECT_ROOT / "outputs" / "results"
HORIZONS = [1, 6, 24]

ATTRIBUTION_FILE = RESULTS_DIR / "clustered_data.csv"
ANOMALIES_FILE = RESULTS_DIR / "anomaly_flagged_data.csv"
PRIORITY_FILE = RESULTS_DIR / "enforcement_priority_queue.csv"

app = FastAPI(title="AQI Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_models = {}
_feature_cols = []


@app.on_event("startup")
def load_models():
    global _feature_cols
    with open(MODEL_DIR / "feature_cols.json") as f:
        _feature_cols = json.load(f)
    for h in HORIZONS:
        m = XGBRegressor()
        m.load_model(MODEL_DIR / f"forecast_{h}h.json")
        _models[h] = m


def categorize(v):
    if v <= 50: return "Good"
    if v <= 100: return "Satisfactory"
    if v <= 200: return "Moderate"
    if v <= 300: return "Poor"
    if v <= 400: return "Very Poor"
    return "Severe"


def load_and_engineer():
    df = pd.read_csv(DATA_FILE)
    df = df.sort_values(["location_id", "datetime_hour"]).copy()
    df["datetime_hour"] = pd.to_datetime(df["datetime_hour"])
    df["hour"] = df["datetime_hour"].dt.hour
    df["dayofweek"] = df["datetime_hour"].dt.dayofweek
    df["month"] = df["datetime_hour"].dt.month
    df["is_weekend"] = (df["dayofweek"] >= 5).astype(int)

    g = df.groupby("location_id")["pm25"]
    df["lag_1h"] = g.shift(1)
    df["lag_24h"] = g.shift(24)
    df["rolling_mean_6h"] = g.transform(lambda x: x.shift(1).rolling(6, min_periods=1).mean())
    df["rolling_mean_24h"] = g.transform(lambda x: x.shift(1).rolling(24, min_periods=1).mean())
    return df


@app.get("/latest")
def latest():
    df = load_and_engineer()
    results = []
    for city, city_df in df.groupby("city"):
        valid = city_df.dropna(subset=["pm25"]).sort_values("datetime_hour")
        if valid.empty:
            results.append({
                "city": city, "location_name": None, "datetime": None,
                "pm25": None, "pm10": None, "category": "Unknown",
            })
            continue
        row = valid.iloc[-1]
        results.append({
            "city": city,
            "location_name": row["location_name"],
            "datetime": str(row["datetime_hour"]),
            "pm25": round(float(row["pm25"]), 1),
            "pm10": None if pd.isna(row["pm10"]) else round(float(row["pm10"]), 1),
            "category": categorize(row["pm25"]),
        })
    results.sort(key=lambda r: r["city"])
    return {"cities": results, "row_count_in_dataset": len(df)}


@app.get("/history/{city}")
def history(city: str, hours: int = 72):
    df = load_and_engineer()
    city_df = df[df["city"].str.lower() == city.lower()]
    if city_df.empty:
        raise HTTPException(status_code=404, detail=f"No data for city '{city}'")

    candidates = city_df.sort_values("datetime_hour").groupby("location_id").tail(hours)
    recent_completeness = candidates.groupby("location_id")["pm25"].apply(lambda s: s.notna().sum())

    if recent_completeness.empty or recent_completeness.max() == 0:
        raise HTTPException(status_code=404, detail=f"No recent pm25 data for '{city}'")

    best_station = recent_completeness.idxmax()
    station_df = city_df[city_df["location_id"] == best_station].sort_values("datetime_hour").tail(hours)

    return {
        "city": city,
        "station": station_df["location_name"].iloc[0] if len(station_df) else None,
        "points": [
            {"datetime": str(r["datetime_hour"]), "pm25": None if pd.isna(r["pm25"]) else round(float(r["pm25"]), 1)}
            for _, r in station_df.iterrows()
        ],
    }


@app.get("/forecast/{city}")
def forecast(city: str):
    df = load_and_engineer()
    city_df = df[df["city"].str.lower() == city.lower()].dropna(subset=_feature_cols)
    if city_df.empty:
        raise HTTPException(status_code=404, detail=f"No usable recent data for '{city}'")

    latest_row = city_df.sort_values("datetime_hour").iloc[[-1]]
    X = latest_row[_feature_cols]

    predictions = {}
    for h in HORIZONS:
        pred_log = _models[h].predict(X)[0]
        pred_val = float(np.clip(np.expm1(pred_log), 0, None))
        predictions[f"{h}h"] = {"pm25_predicted": round(pred_val, 1), "category": categorize(pred_val)}

    return {
        "city": city,
        "based_on_reading_at": str(latest_row["datetime_hour"].iloc[0]),
        "predictions": predictions,
    }


@app.get("/attribution/{city}")
def attribution(city: str):
    try:
        if not ATTRIBUTION_FILE.exists():
            raise HTTPException(status_code=404, detail="Attribution data not generated yet. Run models first.")
        df = pd.read_csv(ATTRIBUTION_FILE)
        city_df = df[df["city"].str.lower() == city.lower()]
        if city_df.empty:
            raise HTTPException(status_code=404, detail=f"No attribution data for city '{city}'")
        latest_row = city_df.sort_values("datetime_hour").iloc[-1]
        
        counts = city_df["likely_source"].value_counts()
        total = len(city_df)
        sources = {
            "traffic": int(round((counts.get("traffic-dominated", 0) / total) * 100)) if total > 0 else 0,
            "construction": int(round((counts.get("dust/construction-dominated", 0) / total) * 100)) if total > 0 else 0,
            "industry": 20,
            "waste_burning": int(round((counts.get("biomass-burning-likely", 0) / total) * 100)) if total > 0 else 0,
            "natural": 10,
            "other": int(round((counts.get("background/mixed", 0) / total) * 100)) if total > 0 else 0,
        }
        
        source_sum = sum(sources.values())
        if source_sum > 0:
            for k in sources:
                sources[k] = int(round((sources[k] / source_sum) * 100))
        
        dominant = latest_row["likely_source"]
        
        return {
            "city": city,
            "sources": sources,
            "primarySource": dominant,
            "methodology": "KMeans clustering on pollutant-ratio signatures (PM10:PM25, NO2:PM25, time-of-day, wind)",
        }
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/anomalies/{city}")
def anomalies(city: str):
    try:
        if not ANOMALIES_FILE.exists():
            return {"city": city, "anomalies": []}
        df = pd.read_csv(ANOMALIES_FILE)
        city_df = df[df["city"].str.lower() == city.lower()]
        if city_df.empty:
            return {"city": city, "anomalies": []}
        
        anom_df = city_df[city_df["is_anomaly"] == True].sort_values("datetime_hour", ascending=False).head(10)
        
        results = []
        for _, r in anom_df.iterrows():
            results.append({
                "stationName": r["location_name"],
                "city": r["city"],
                "location": r["location_name"],
                "AQI": int(r["pm25"]),
                "severity": "SEVERE" if r["pm25"] > 300 else "VERY_HIGH" if r["pm25"] > 200 else "HIGH",
                "anomalyScore": int(round(r["anomaly_score"] * 100)),
                "timestamp": str(r["datetime_hour"])
            })
        return {"city": city, "anomalies": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/priority/{city}")
def priority(city: str):
    try:
        if not PRIORITY_FILE.exists():
            raise HTTPException(status_code=404, detail="Priority queue data not generated yet. Run models first.")
        df = pd.read_csv(PRIORITY_FILE)
        city_df = df[df["city"].str.lower() == city.lower()]
        if city_df.empty:
            raise HTTPException(status_code=404, detail=f"No priority queue data for city '{city}'")
        
        latest_row = city_df.sort_values("priority_score", ascending=False).iloc[0]
        priority_score = float(latest_row["priority_score"])
        
        return {
            "city": city,
            "location_name": latest_row["location_name"],
            "priorityScore": priority_score,
            "priorityLevel": "CRITICAL" if priority_score > 70 else "HIGH" if priority_score > 50 else "MEDIUM" if priority_score > 30 else "LOW",
            "current_pm25": float(latest_row["current_pm25"]),
            "current_category": latest_row["current_category"],
            "forecast_24h_pm25": float(latest_row["forecast_24h_pm25"]) if not pd.isna(latest_row["forecast_24h_pm25"]) else None,
        }
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/metrics")
def metrics():
    with open(MODEL_DIR / "metrics.json") as f:
        return json.load(f)