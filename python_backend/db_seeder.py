"""
db_seeder.py
Stochastic Data Generator for Heart Check PHC
Generates realistic M/M/1 queue timestamps and exports to CSV.
"""

import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_fake_patients(num_days=30, patients_per_day=50, start_date="2026-03-01", output_filename="simulated_patients.csv"):
    avg_inter_arrival = 5   
    avg_reg_time = 3        
    avg_consult_time = 15   
    
    data = []
    base_date = datetime.strptime(start_date, "%Y-%m-%d")

    print(f"⚙️ Generating data for {num_days} days starting from {start_date}...")

    for day in range(num_days):
        current_date = base_date + timedelta(days=day)
        if current_date.weekday() == 6: # Skip Sundays
            continue
            
        current_time = current_date.replace(hour=8, minute=0, second=0)
        reg_free_time = current_time
        doctor_free_time = current_time

        daily_volume = int(np.random.normal(patients_per_day, scale=8))
        if daily_volume < 10: daily_volume = 10 

        for i in range(1, daily_volume + 1):
            # Arrival
            inter_arrival = np.random.exponential(avg_inter_arrival)
            current_time += timedelta(minutes=inter_arrival)
            kiosk_time = current_time

            # Registration
            reg_start = max(kiosk_time, reg_free_time)
            reg_duration = np.random.exponential(avg_reg_time)
            reg_end = reg_start + timedelta(minutes=reg_duration)
            reg_free_time = reg_end 

            # Consultation
            consult_start = max(reg_end, doctor_free_time)
            consult_duration = np.random.exponential(avg_consult_time)
            consult_end = consult_start + timedelta(minutes=consult_duration)
            doctor_free_time = consult_end

            purposes = ['General', 'General', 'Warfarin', 'Benzathine', 'ECG', 'OPD Screening']
            purpose = random.choice(purposes)

            data.append({
                'patient_id': f"{current_date.strftime('%Y%m%d')}-{i}",
                'queue_number': f"{purpose[0:3].upper()}-{i:03d}",
                'visit_date': current_date.strftime("%Y-%m-%d"),
                'kiosk_time': kiosk_time.round('S').strftime("%Y-%m-%d %H:%M:%S"),
                'reg_start': reg_start.round('S').strftime("%Y-%m-%d %H:%M:%S"),
                'reg_end': reg_end.round('S').strftime("%Y-%m-%d %H:%M:%S"),
                'consult_start': consult_start.round('S').strftime("%Y-%m-%d %H:%M:%S"),
                'consult_end': consult_end.round('S').strftime("%Y-%m-%d %H:%M:%S"),
                'purpose': purpose
            })

    df = pd.DataFrame(data)
    df.to_csv(output_filename, index=False)
    print(f"✅ Successfully generated {len(df)} fake patient records!")
    print(f"📁 Saved to: {output_filename}")

if __name__ == "__main__":
    generate_fake_patients(num_days=90, patients_per_day=60)