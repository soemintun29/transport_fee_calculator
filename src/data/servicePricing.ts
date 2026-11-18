/* Auto-generated from 20260728_Service Charges.xlsx — do not edit by hand.
 * Standard matrix: sheet 20261001 (current prices).
 * CAC matrix: sheet CAC (commercial layout).
 */
export interface StandardFeeRow {
  pd: string;
  category: string;
  serviceCategory: string;
  serviceFee: number | null;
  diagnosisFee: number | null;
}

export interface CacFeeRow {
  pd: string;
  repairGroup: string;
  jobDetail: string | null;
  series: string | null;
  capacity: string | null;
  customerFee: number | null;
  laborFee: number | null;
}

export const workbookFile = '20260728_Service Charges.xlsx';
export const workbookUpdated = '2026-10-01';

export const standardFees = [
  {
    "pd": "LAD",
    "category": "Dryer",
    "serviceCategory": "Repairing/Alignment/Adjustment/Servicing",
    "serviceFee": 30000,
    "diagnosisFee": 15000
  },
  {
    "pd": "LAD",
    "category": "Dryer",
    "serviceCategory": "Repair with parts changed",
    "serviceFee": 35000,
    "diagnosisFee": null
  },
  {
    "pd": "LAD",
    "category": "Dryer",
    "serviceCategory": "Repair with parts changed (Busket/ Clauth)",
    "serviceFee": 50000,
    "diagnosisFee": null
  },
  {
    "pd": "LAD",
    "category": "Dryer",
    "serviceCategory": "General Cleaning Service",
    "serviceFee": 40000,
    "diagnosisFee": null
  },
  {
    "pd": "LAD",
    "category": "Commercial Dryer",
    "serviceCategory": "General Cleaning Service",
    "serviceFee": 50000,
    "diagnosisFee": null
  },
  {
    "pd": "LAD",
    "category": "Front Load",
    "serviceCategory": "Repairing/Alignment/Adjustment/Servicing",
    "serviceFee": 30000,
    "diagnosisFee": 10000
  },
  {
    "pd": "LAD",
    "category": "Front Load",
    "serviceCategory": "Repair with parts changed",
    "serviceFee": 35000,
    "diagnosisFee": null
  },
  {
    "pd": "LAD",
    "category": "Front Load",
    "serviceCategory": "Repair with parts changed (Busket/ Clauth)",
    "serviceFee": 80000,
    "diagnosisFee": null
  },
  {
    "pd": "LAD",
    "category": "Front Load",
    "serviceCategory": "General Cleaning Service",
    "serviceFee": 70000,
    "diagnosisFee": null
  },
  {
    "pd": "LAD",
    "category": "Top Load/Twin Tub",
    "serviceCategory": "Repairing/Alignment/Adjustment/Servicing",
    "serviceFee": 25000,
    "diagnosisFee": 13000
  },
  {
    "pd": "LAD",
    "category": "Top Load/Twin Tub",
    "serviceCategory": "Repair with parts changed (Others)",
    "serviceFee": 30000,
    "diagnosisFee": null
  },
  {
    "pd": "LAD",
    "category": "Top Load/Twin Tub",
    "serviceCategory": "Repair with parts changed (Busket/ Clauth)",
    "serviceFee": 70000,
    "diagnosisFee": null
  },
  {
    "pd": "LAD",
    "category": "Top Load/Twin Tub",
    "serviceCategory": "General Cleaning Service",
    "serviceFee": 50000,
    "diagnosisFee": null
  },
  {
    "pd": "REF",
    "category": "0 L to 95 L",
    "serviceCategory": "Repairing/Alignment/Adjustment/Servicing",
    "serviceFee": 30000,
    "diagnosisFee": 15000
  },
  {
    "pd": "REF",
    "category": "0 L to 95 L",
    "serviceCategory": "Repair with parts changed",
    "serviceFee": 40000,
    "diagnosisFee": null
  },
  {
    "pd": "REF",
    "category": "0 L to 95 L",
    "serviceCategory": "Replace/repairing sealed refrigeration system",
    "serviceFee": 150000,
    "diagnosisFee": null
  },
  {
    "pd": "REF",
    "category": "96 L to 150 L",
    "serviceCategory": "Repairing/Alignment/Adjustment/Servicing",
    "serviceFee": 40000,
    "diagnosisFee": 20000
  },
  {
    "pd": "REF",
    "category": "96 L to 150 L",
    "serviceCategory": "Repair with parts changed",
    "serviceFee": 50000,
    "diagnosisFee": null
  },
  {
    "pd": "REF",
    "category": "96 L to 150 L",
    "serviceCategory": "Replace/repairing sealed refrigeration system",
    "serviceFee": 200000,
    "diagnosisFee": null
  },
  {
    "pd": "REF",
    "category": "151 L to 249 L",
    "serviceCategory": "Repairing/Alignment/Adjustment/Servicing",
    "serviceFee": 50000,
    "diagnosisFee": 25000
  },
  {
    "pd": "REF",
    "category": "151 L to 249 L",
    "serviceCategory": "Repair with parts changed",
    "serviceFee": 60000,
    "diagnosisFee": null
  },
  {
    "pd": "REF",
    "category": "151 L to 249 L",
    "serviceCategory": "Replace/repairing sealed refrigeration system",
    "serviceFee": 250000,
    "diagnosisFee": null
  },
  {
    "pd": "REF",
    "category": "250 L  & Over",
    "serviceCategory": "Repairing/Alignment/Adjustment/Servicing",
    "serviceFee": 60000,
    "diagnosisFee": 30000
  },
  {
    "pd": "REF",
    "category": "250 L  & Over",
    "serviceCategory": "Repair with parts changed",
    "serviceFee": 65000,
    "diagnosisFee": null
  },
  {
    "pd": "REF",
    "category": "250 L  & Over",
    "serviceCategory": "Replace/repairing sealed refrigeration system",
    "serviceFee": 350000,
    "diagnosisFee": null
  },
  {
    "pd": "KWH",
    "category": "Dispenser",
    "serviceCategory": "Repairing/Alignment/Adjustment/Servicing",
    "serviceFee": 25000,
    "diagnosisFee": 13000
  },
  {
    "pd": "KWH",
    "category": "Dispenser",
    "serviceCategory": "Repair with parts changed",
    "serviceFee": 30000,
    "diagnosisFee": null
  },
  {
    "pd": "KWH",
    "category": "Dispenser",
    "serviceCategory": "Replace/repairing sealed refrigeration system",
    "serviceFee": 120000,
    "diagnosisFee": null
  },
  {
    "pd": "KWH",
    "category": "Water Heater",
    "serviceCategory": "Repairing/Alignment/Adjustment/Servicing",
    "serviceFee": 25000,
    "diagnosisFee": 13000
  },
  {
    "pd": "KWH",
    "category": "Water Heater",
    "serviceCategory": "Repair with parts changed",
    "serviceFee": 30000,
    "diagnosisFee": null
  },
  {
    "pd": "KWH",
    "category": "Water Heater",
    "serviceCategory": "Replace/repairing water piping",
    "serviceFee": 45000,
    "diagnosisFee": null
  },
  {
    "pd": "KWH",
    "category": "Other",
    "serviceCategory": "Repairing/Alignment/Adjustment/Servicing",
    "serviceFee": 25000,
    "diagnosisFee": 13000
  },
  {
    "pd": "KWH",
    "category": "Other",
    "serviceCategory": "Repair with parts changed",
    "serviceFee": 30000,
    "diagnosisFee": null
  },
  {
    "pd": "MCA/ CAD/SDA",
    "category": "All",
    "serviceCategory": "Repairing/Alignment/Adjustment/Servicing",
    "serviceFee": 25000,
    "diagnosisFee": 13000
  },
  {
    "pd": "MCA/ CAD/SDA",
    "category": "All",
    "serviceCategory": "Repair with parts changed",
    "serviceFee": 30000,
    "diagnosisFee": null
  },
  {
    "pd": "MCA/ CAD/SDA",
    "category": "Aircooler/Tower Fan",
    "serviceCategory": "General Cleaning Service",
    "serviceFee": 25000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "< 12000 Btu",
    "serviceCategory": "Repairing/Alignment/Adjustment/Servicing",
    "serviceFee": 30000,
    "diagnosisFee": 15000
  },
  {
    "pd": "RAC",
    "category": "< 12000 Btu",
    "serviceCategory": "Repair with parts changed",
    "serviceFee": 35000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "< 12000 Btu",
    "serviceCategory": "Replace/repairing sealed refrigeration system",
    "serviceFee": 60000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "< 12000 Btu",
    "serviceCategory": "Refrigeration Line Cleaning Service",
    "serviceFee": 40000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "< 12000 Btu",
    "serviceCategory": "Re-gassing",
    "serviceFee": 250000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "< 12000 Btu",
    "serviceCategory": "General Cleaning Service",
    "serviceFee": 80000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "> = 12000 Btu",
    "serviceCategory": "Repairing/Alignment/Adjustment/Servicing",
    "serviceFee": 35000,
    "diagnosisFee": 18000
  },
  {
    "pd": "RAC",
    "category": "> = 12000 Btu",
    "serviceCategory": "Repair with parts changed",
    "serviceFee": 40000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "> = 12000 Btu",
    "serviceCategory": "Replace/repairing sealed refrigeration system",
    "serviceFee": 80000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "> = 12000 Btu",
    "serviceCategory": "Refrigeration Line Cleaning Service",
    "serviceFee": 45000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "> = 12000 Btu",
    "serviceCategory": "Re-gassing",
    "serviceFee": 300000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "> = 12000 Btu",
    "serviceCategory": "General Cleaning Service",
    "serviceFee": 100000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "> = 18000 Btu",
    "serviceCategory": "Repairing/Alignment/Adjustment/Servicing",
    "serviceFee": 40000,
    "diagnosisFee": 20000
  },
  {
    "pd": "RAC",
    "category": "> = 18000 Btu",
    "serviceCategory": "Repair with parts changed",
    "serviceFee": 45000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "> = 18000 Btu",
    "serviceCategory": "Replace/repairing sealed refrigeration system",
    "serviceFee": 85000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "> = 18000 Btu",
    "serviceCategory": "Refrigeration Line Cleaning Service",
    "serviceFee": 50000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "> = 18000 Btu",
    "serviceCategory": "Re-gassing",
    "serviceFee": 350000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "> = 18000 Btu",
    "serviceCategory": "General Cleaning Service",
    "serviceFee": 120000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "Dehumidifier",
    "serviceCategory": "General Cleaning Service",
    "serviceFee": 40000,
    "diagnosisFee": null
  },
  {
    "pd": "RAC",
    "category": "Portable",
    "serviceCategory": "General Cleaning Service",
    "serviceFee": 40000,
    "diagnosisFee": null
  },
  {
    "pd": "ENG",
    "category": "Ecoflow ( <1000W )",
    "serviceCategory": "Repairing/Alignment/Adjustment/Firmware Update",
    "serviceFee": 35000,
    "diagnosisFee": 10000
  },
  {
    "pd": "ENG",
    "category": "Ecoflow ( <1000W )",
    "serviceCategory": "Repair with parts changed",
    "serviceFee": 40000,
    "diagnosisFee": null
  },
  {
    "pd": "ENG",
    "category": "Ecoflow ( >1000W )",
    "serviceCategory": "Repairing/Alignment/Adjustment/Firmware Update",
    "serviceFee": 40000,
    "diagnosisFee": 15000
  },
  {
    "pd": "ENG",
    "category": "Ecoflow ( >1000W )",
    "serviceCategory": "Repair with parts changed",
    "serviceFee": 50000,
    "diagnosisFee": null
  },
  {
    "pd": "All",
    "category": "All",
    "serviceCategory": "PCB Repair/Conponent Change Charges (Level-1)",
    "serviceFee": 40000,
    "diagnosisFee": null
  },
  {
    "pd": "All",
    "category": "All",
    "serviceCategory": "PCB Repair/Conponent Change Charges (Level-2)",
    "serviceFee": 60000,
    "diagnosisFee": null
  },
  {
    "pd": "All",
    "category": "All",
    "serviceCategory": "PCB Repair/Conponent Change Charges (Level-3)",
    "serviceFee": 100000,
    "diagnosisFee": null
  }
] as const;

export const cacFees = [
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Compressor, Condenser Coil, Reversing Valve",
    "series": "Big-RAC & PAC",
    "capacity": "1.5HP ~ 2.8HP (4.0 ~ 7.1KW)",
    "customerFee": 88000,
    "laborFee": 80000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Compressor, Condenser Coil, Reversing Valve",
    "series": "Big-RAC & PAC",
    "capacity": "3.0HP ~ 6.0HP (8.0 ~ 16.0KW)",
    "customerFee": 110000,
    "laborFee": 100000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Compressor, Condenser Coil, Reversing Valve",
    "series": "Big-RAC & PAC",
    "capacity": "7.5HP ~ (20.0KW ~)",
    "customerFee": 165000,
    "laborFee": 150000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Compressor, Condenser Coil, Reversing Valve",
    "series": "VRF",
    "capacity": "1st Compressor",
    "customerFee": 275000,
    "laborFee": 250000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Compressor, Condenser Coil, Reversing Valve",
    "series": "VRF",
    "capacity": "2nd Compressor",
    "customerFee": 275000,
    "laborFee": 200000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Compressor, Condenser Coil, Reversing Valve",
    "series": "VRF",
    "capacity": "3rd Compressor",
    "customerFee": 275000,
    "laborFee": 150000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Compressor, Condenser Coil, Reversing Valve",
    "series": "VRF",
    "capacity": "4th Compressor",
    "customerFee": 275000,
    "laborFee": 100000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Brazing component or Repaired by Brazing",
    "series": "Big-RAC & PAC",
    "capacity": "1.5HP ~ 2.8HP (4.0 ~ 7.1KW)",
    "customerFee": 55000,
    "laborFee": 50000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Brazing component or Repaired by Brazing",
    "series": "Big-RAC & PAC",
    "capacity": "3.0HP ~ 6.0HP (8.0 ~ 16.0KW)",
    "customerFee": 66000,
    "laborFee": 60000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Brazing component or Repaired by Brazing",
    "series": "Big-RAC & PAC",
    "capacity": "7.5HP ~ (20.0KW ~)",
    "customerFee": 88000,
    "laborFee": 80000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Brazing component or Repaired by Brazing",
    "series": "VRF",
    "capacity": "4 ~ 6HP (11.2 ~ 16.0KW)",
    "customerFee": 220000,
    "laborFee": 100000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Brazing component or Repaired by Brazing",
    "series": "VRF",
    "capacity": "8 ~ 10HP (22.4 ~ 28.0KW)",
    "customerFee": 220000,
    "laborFee": 150000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Brazing component or Repaired by Brazing",
    "series": "VRF",
    "capacity": "12 ~ 16HP (33.5 ~ 45.0KW)",
    "customerFee": 220000,
    "laborFee": 200000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Brazing component or Repaired by Brazing",
    "series": "VRF",
    "capacity": "18 ~ 20HP (56.0KW)",
    "customerFee": 220000,
    "laborFee": 200000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Evaporator",
    "series": "Ducted  (F2, M1, Z1, E1, E2, H1 Type)",
    "capacity": null,
    "customerFee": 66000,
    "laborFee": 60000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Evaporator",
    "series": "Ceiling Exposed (T2 Type), Cassette",
    "capacity": null,
    "customerFee": 55000,
    "laborFee": 50000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Evaporator",
    "series": "Wall Mounting (K1, K2 Type)",
    "capacity": null,
    "customerFee": 33000,
    "laborFee": 30000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of Evaporator",
    "series": "Floor Standing (P1, R1 Type)",
    "capacity": null,
    "customerFee": 33000,
    "laborFee": 30000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Sealed System",
    "jobDetail": "Replacement of others",
    "series": "All Models",
    "capacity": null,
    "customerFee": 33000,
    "laborFee": 30000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Indoor",
    "jobDetail": "Replacement of Fan Motor, Blower Wheel, Shaft, Bearing",
    "series": "Ceiling Cassette (4-way)",
    "capacity": null,
    "customerFee": 39000,
    "laborFee": 25000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Indoor",
    "jobDetail": "Replacement of Fan Motor, Blower Wheel, Shaft, Bearing",
    "series": "Ceiling Cassette (1-way, 2-way type)",
    "capacity": null,
    "customerFee": 39000,
    "laborFee": 20000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Indoor",
    "jobDetail": "Replacement of Fan Motor, Blower Wheel, Shaft, Bearing",
    "series": "Ceiling Exposed (T2 type) , Wall Mounting",
    "capacity": null,
    "customerFee": 33000,
    "laborFee": 30000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Indoor",
    "jobDetail": "Replacement of Fan Motor, Blower Wheel, Shaft, Bearing",
    "series": "Floor Standing (P1, R1 Type)",
    "capacity": null,
    "customerFee": 33000,
    "laborFee": 25000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Indoor",
    "jobDetail": "Replacement of Fan Motor, Blower Wheel, Shaft, Bearing",
    "series": "Ducted  (F2, M1, Z1, E1, E2, H1 Type)",
    "capacity": null,
    "customerFee": 55000,
    "laborFee": 40000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Indoor",
    "jobDetail": "Replacement of Sensor, Drain Pump, Drain Pan, Float Switch, Drain Tube",
    "series": "Ceiling Cassette (4-way)",
    "capacity": null,
    "customerFee": 33000,
    "laborFee": 25000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Indoor",
    "jobDetail": "Replacement of Sensor, Drain Pump, Drain Pan, Float Switch, Drain Tube",
    "series": "Ceiling Cassette (1-way, 2-way type)",
    "capacity": null,
    "customerFee": 33000,
    "laborFee": 20000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Indoor",
    "jobDetail": "Replacement of Sensor, Drain Pump, Drain Pan, Float Switch, Drain Tube",
    "series": "Ceiling Exposed (T2 type) , Wall Mounting",
    "capacity": null,
    "customerFee": 33000,
    "laborFee": 20000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Indoor",
    "jobDetail": "Replacement of Sensor, Drain Pump, Drain Pan, Float Switch, Drain Tube",
    "series": "Floor Standing (P1, R1 Type)",
    "capacity": null,
    "customerFee": 33000,
    "laborFee": 30000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Indoor",
    "jobDetail": "Replacement of Sensor, Drain Pump, Drain Pan, Float Switch, Drain Tube",
    "series": "Ducted  (F2, M1, Z1, E1, E2, H1 Type)",
    "capacity": null,
    "customerFee": 44000,
    "laborFee": 40000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Indoor",
    "jobDetail": "Replacement of Sensor, Drain Pump, Drain Pan, Float Switch, Drain Tube",
    "series": "Other Models",
    "capacity": null,
    "customerFee": 33000,
    "laborFee": 30000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Outdoor",
    "jobDetail": "Replacement of Fan Motor",
    "series": "Big-RAC & PAC",
    "capacity": null,
    "customerFee": 33000,
    "laborFee": 30000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Outdoor",
    "jobDetail": "Replacement of Fan Motor",
    "series": "VRF",
    "capacity": null,
    "customerFee": 66000,
    "laborFee": 60000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Outdoor",
    "jobDetail": "Replacement of Pressure Switch, Magnetic Relay & Relay Coil, Over-load Protector, Thermistor",
    "series": "All Models",
    "capacity": null,
    "customerFee": 28000,
    "laborFee": 25000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Electronic Controller (PCB)",
    "jobDetail": "Electronic Controller (PCB)",
    "series": "Big-RAC & PAC",
    "capacity": null,
    "customerFee": 39000,
    "laborFee": 35000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Electronic Controller (PCB)",
    "jobDetail": "Electronic Controller (PCB)",
    "series": "VRF",
    "capacity": null,
    "customerFee": 55000,
    "laborFee": 50000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Replacing Plastic parts, Latches, Air Filter, Air Direction Louvers, Fuse, Plug",
    "jobDetail": "Replacing Plastic parts, Latches, Air Filter, Air Direction Louvers, Fuse, Plug",
    "series": "Replacing Plastic parts, Latches, Air Filter, Air Direction Louvers, Fuse, Plug",
    "capacity": null,
    "customerFee": 33000,
    "laborFee": 25000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Decoration Parts, Easy and light load job such as Tightening the screws and etc",
    "jobDetail": "Decoration Parts, Easy and light load job such as Tightening the screws and etc",
    "series": "Decoration Parts, Easy and light load job such as Tightening the screws and etc",
    "capacity": null,
    "customerFee": 33000,
    "laborFee": 20000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Adjustment, replacing the parts excepted Parts mention above",
    "jobDetail": "Adjustment, replacing the parts excepted Parts mention above",
    "series": "Adjustment, replacing the parts excepted Parts mention above",
    "capacity": null,
    "customerFee": 33000,
    "laborFee": 30000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Attend Charge",
    "jobDetail": "Attend Charge",
    "series": "Big-RAC & PAC",
    "capacity": null,
    "customerFee": 44000,
    "laborFee": 25000
  },
  {
    "pd": "Big-RAC, CAC & VRF",
    "repairGroup": "Attend Charge",
    "jobDetail": "Attend Charge",
    "series": "VRF",
    "capacity": null,
    "customerFee": 44000,
    "laborFee": 40000
  },
  {
    "pd": "Others Miscellaneous Expenses",
    "repairGroup": "Others Miscellaneous Expenses",
    "jobDetail": "Others Miscellaneous Expenses",
    "series": "Top-up Refregirant per Kg",
    "capacity": "R22",
    "customerFee": 39000,
    "laborFee": 90000
  },
  {
    "pd": "Others Miscellaneous Expenses",
    "repairGroup": "Others Miscellaneous Expenses",
    "jobDetail": "Others Miscellaneous Expenses",
    "series": "Top-up Refregirant per Kg",
    "capacity": "R410a",
    "customerFee": 50000,
    "laborFee": 100000
  },
  {
    "pd": "Others Miscellaneous Expenses",
    "repairGroup": "Others Miscellaneous Expenses",
    "jobDetail": "Others Miscellaneous Expenses",
    "series": "Top-up Refregirant per Kg",
    "capacity": "R32",
    "customerFee": 50000,
    "laborFee": 100000
  }
] as const;

export const standardFeeRows: StandardFeeRow[] = [...standardFees];
export const cacFeeRows: CacFeeRow[] = [...cacFees];
