import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_FILE = PROJECT_ROOT / "real_aqi_dataset.csv"

# Targets: Delhi, Mumbai, Bengaluru, Kolkata
CITIES = {
    "Delhi": {"lat": 28.6139, "lon": 77.2090, "base_pm25": 120, "stations": ["Anand Vihar", "Wazirpur"]},
    "Mumbai": {"lat": 19.0760, "lon": 72.8777, "base_pm25": 60, "stations": ["Bandra", "Colaba"]},
    "Bengaluru": {"lat": 12.9716, "lon": 77.5946, "base_pm25": 35, "stations": ["Peenya", "Silk Board"]},
    "Kolkata": {"lat": 22.5726, "lon": 88.3639, "base_pm25": 70, "stations": ["Victoria Memorial", "Ballygunge"]}
}

PARAMETERS = ["pm25", "pm10", "no2", "wind_speed", "temperature", "relativehumidity", "so2", "co"]

def main():
    print("Generating realistic mock AQI data...")
    start_date = datetime(2025, 1, 1, 0, 0, 0)
    # Generate 60 days of hourly data to make training fast but statistically valid
    end_date = datetime(2025, 3, 1, 23, 0, 0)
    
    delta = end_date - start_date
    hours = int(delta.total_seconds() / 3600) + 1
    
    all_rows = []
    
    np.random.seed(42)
    
    for city, info in CITIES.items():
        for st_idx, station in enumerate(info["stations"]):
            loc_id = f"loc_{city.lower()}_{st_idx + 1}"
            lat = info["lat"] + np.random.uniform(-0.02, 0.02)
            lon = info["lon"] + np.random.uniform(-0.02, 0.02)
            
            print(f"Generating for {city} - {station} ({hours} hours)...")
            
            # Pre-generate base series for time-series correlation
            time_series = np.arange(hours)
            # Diurnal cycle
            diurnal = np.sin(time_series * 2 * np.pi / 24)
            # Weekly cycle
            weekly = np.sin(time_series * 2 * np.pi / (24 * 7))
            # Random walk / weather drift
            drift = np.zeros(hours)
            val = 0
            for t in range(hours):
                val += np.random.normal(0, 0.1)
                val = np.clip(val, -2, 2)
                drift[t] = val
                
            for t in range(hours):
                current_time = start_date + timedelta(hours=t)
                datetime_str = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")
                
                # PM2.5 baseline + cycles + drift
                pm25 = info["base_pm25"] + (diurnal[t] * 15) + (weekly[t] * 10) + (drift[t] * 20) + np.random.normal(0, 5)
                pm25 = max(5, round(pm25, 1))
                
                # PM10 is pm25 * factor
                pm10 = pm25 * np.random.uniform(1.4, 2.2) + np.random.normal(0, 5)
                pm10 = max(10, round(pm10, 1))
                
                # NO2 correlates with traffic hours
                hour = current_time.hour
                is_traffic = 1.8 if (7 <= hour <= 10 or 17 <= hour <= 21) else 1.0
                no2 = (pm25 * 0.4) * is_traffic + np.random.normal(0, 3)
                no2 = max(2, round(no2, 1))
                
                # Wind speed
                wind_speed = 3.0 + np.sin(time_series[t] * 2 * np.pi / 168) * 1.5 + np.random.uniform(-1, 1)
                wind_speed = max(0.1, round(wind_speed, 1))
                
                # Temperature
                temp = 20.0 + np.sin((time_series[t] - 6) * 2 * np.pi / 24) * 8.0 + np.random.uniform(-1, 1)
                temp = max(5.0, round(temp, 1))
                
                # Relative humidity
                rh = 60.0 - np.sin((time_series[t] - 6) * 2 * np.pi / 24) * 25.0 + np.random.uniform(-5, 5)
                rh = np.clip(rh, 10.0, 99.0)
                rh = round(rh, 1)
                
                # SO2
                so2 = 10.0 + drift[t] * 2 + np.random.uniform(-2, 2)
                so2 = max(1.0, round(so2, 1))
                
                # CO
                co = 1.0 + (pm25 / 100.0) * 0.5 + np.random.uniform(-0.1, 0.1)
                co = max(0.1, round(co, 1))
                
                values = {
                    "pm25": pm25,
                    "pm10": pm10,
                    "no2": no2,
                    "wind_speed": wind_speed,
                    "temperature": temp,
                    "relativehumidity": rh,
                    "so2": so2,
                    "co": co
                }
                
                for param, val in values.items():
                    all_rows.append({
                        "city": city,
                        "location_id": loc_id,
                        "location_name": f"{city} {station} AQMS",
                        "latitude": lat,
                        "longitude": lon,
                        "parameter": param,
                        "value": val,
                        "unit": "µg/m³" if param != "co" else "ppm",
                        "datetime_utc": datetime_str
                    })
                    
    df = pd.DataFrame(all_rows)
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"Successfully generated {len(df)} rows and saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
