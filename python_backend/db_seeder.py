"""
db_seeder.py
Stochastic Data Generator for Heart Check PHC
Generates realistic multi-server queue timestamps and exports to CSV.
"""

import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_fake_patients(num_days=30, patients_per_day=50, start_date="2026-04-01", output_filename="simulated_patients.csv"):
    avg_inter_arrival = 5  #need to consult when presentation done
    avg_reg_time = 3       #need to consult when presentation done 
    
    # Define distinct services, their dedicated resources, and specific average times
    SERVICES = {
        'Consultation': {'resource': 'Doctor', 'avg_time': 15},
        'OPD Card': {'resource': 'Admin', 'avg_time': 5},
        'Warfarin': {'resource': 'Nurse', 'avg_time': 10},
        'Benzathine': {'resource': 'Nurse', 'avg_time': 12},
        'ECG': {'resource': 'Technician', 'avg_time': 20},
        'OPD Screening': {'resource': 'Triage', 'avg_time': 8}
    }
    
    data = []
    base_date = datetime.strptime(start_date, "%Y-%m-%d")

    print(f" Generating patients over {num_days} days.")

    for day in range(num_days):
        current_date = base_date + timedelta(days=day)
        if current_date.weekday() == 6: # Skip Sundays
            continue
            
        current_time = current_date.replace(hour=8, minute=0, second=0)
        reg_free_time = current_time
        
        # Track free times for each department/resource independently
        resource_free_times = {res['resource']: current_time for res in SERVICES.values()}

        # Create a realistic daily volume with slight random fluctuations
        daily_volume = int(np.random.normal(patients_per_day, scale=8))
        if daily_volume < 10: daily_volume = 10 

        for i in range(1, daily_volume + 1):
            # 1. Arrival
            inter_arrival = np.random.exponential(avg_inter_arrival)
            current_time += timedelta(minutes=inter_arrival)
            kiosk_time = current_time

            # 2. Registration
            reg_start = max(kiosk_time, reg_free_time)
            reg_duration = np.random.exponential(avg_reg_time)
            reg_end = reg_start + timedelta(minutes=reg_duration)
            reg_free_time = reg_end 

            # 3. Determine Purpose & Resource Needed
            purpose = random.choice(list(SERVICES.keys()))
            req_resource = SERVICES[purpose]['resource']
            avg_service_time = SERVICES[purpose]['avg_time']

            # 4. Service Execution (Routes to the correct department)
            service_start = max(reg_end, resource_free_times[req_resource])
            service_duration = np.random.exponential(avg_service_time)
            service_end = service_start + timedelta(minutes=service_duration)
            
            # Update the specific resource's free time
            resource_free_times[req_resource] = service_end

            data.append({
                'patient_id': f"{current_date.strftime('%Y%m%d')}-{i}",
                'queue_number': f"{purpose[0:3].upper()}-{i:03d}",
                'visit_date': current_date.strftime("%Y-%m-%d"),
                'kiosk_time': kiosk_time.replace(microsecond=0).strftime("%Y-%m-%d %H:%M:%S"),
                'reg_start': reg_start.replace(microsecond=0).strftime("%Y-%m-%d %H:%M:%S"),
                'reg_end': reg_end.replace(microsecond=0).strftime("%Y-%m-%d %H:%M:%S"),
                'service_start': service_start.replace(microsecond=0).strftime("%Y-%m-%d %H:%M:%S"),
                'service_end': service_end.replace(microsecond=0).strftime("%Y-%m-%d %H:%M:%S"),
                'purpose': purpose,
                'resource_used': req_resource,
                'status': 'Finished' # Marks the patient's lifecycle as complete
            })

    df = pd.DataFrame(data)
    df.to_csv(output_filename, index=False)
    print(f"Successfully generated {len(df)} fake patient records!")
    print(f"Saved to: {output_filename}")

# THE FIX: This is set to generate ~10,000 total patients
if __name__ == "__main__":
    generate_fake_patients(num_days=30, patients_per_day=50)