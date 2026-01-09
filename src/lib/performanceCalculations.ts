import { getAtmosphere, getSeaLevelAtmosphere, PHYSICS } from './atmosphereCalculations';

export interface AircraftParams {
  W: number;      // Weight (lb)
  S: number;      // Wing area (ft²)
  Cd0: number;    // Zero-lift drag coefficient
  K: number;      // Induced drag factor
  CLmax: number;  // Maximum lift coefficient
  h: number;      // Altitude (ft)
}

export interface TurbofanParams extends AircraftParams {
  Tv0: number;    // Static thrust per engine (lb)
  n: number;      // Velocity power index
  A: number;      // Atmospheric coefficient
  m: number;      // Altitude power exponent
  // Range & Endurance
  W0?: number;    // Initial weight (lb)
  Wf?: number;    // Fuel weight (lb)
  Ct?: number;    // Thrust specific fuel consumption (lb/lb.hr)
}

export interface TurbopropParams extends AircraftParams {
  Psh: number;    // Shaft power per engine (hp)
  eta: number;    // Propeller efficiency
  Ne: number;     // Number of engines
  m: number;      // Altitude power exponent
  jetRatio: number; // Jet Power Ratio
  // Range & Endurance
  W0?: number;    // Initial weight (lb)
  Wf?: number;    // Fuel weight (lb)
  c?: number;     // Power specific fuel consumption (lb/hp.hr)
}

export interface PistonParams extends AircraftParams {
  P0: number;     // Max shaft power at sea level (hp)
  eta: number;    // Propeller efficiency
  // Range & Endurance
  W0?: number;    // Initial weight (lb)
  Wf?: number;    // Fuel weight (lb)
  c?: number;     // Power specific fuel consumption (lb/hp.hr)
}

export interface PerformanceResults {
  // Atmospheric
  rho: number;
  T: number;
  sigma: number;
  h_m: number;

  // Velocities
  Vmax: number;
  V2nd: number;
  Vstall: number;
  Vmin: number;
  VPRmin: number;
  VTRmin: number;

  // Thrust/Power
  TRmin: number;
  PRmin: number;  // lb.ft/s
  C: number;

  // Climb Performance
  RCmax: number;
  V_RCmax: number;
  Theta_RCmax: number;
  MEP: number;  // lb.ft/s
  
  // Max Climb Angle
  ThetaMax: number;
  V_ThetaMax: number;
  RC_ThetaMax: number;
  MET: number;

  // Aerodynamic Relations
  CLCD_max: number;
  V_CLCD_max: number;
  CL_1p5_CD_max: number;
  V_CL_1p5_CD_max: number;
  CL_0p5_CD_max: number;
  V_CL_0p5_CD_max: number;

  // Gliding Performance
  Theta_min_glide: number;
  V_Theta_min_glide: number;
  RD_Theta_min: number;
  RD_min: number;
  V_RD_min: number;
  Theta_RD_min: number;
  T_max_glide: number;
  R_max_glide: number;

  // Ceiling
  RC_max_sl: number;
  a_ceiling: number;
  b_ceiling: number;
  serviceCeiling: number;
  absoluteCeiling: number;

  // Range & Endurance
  R_max: number;        // Maximum Range (ft)
  V_Rmax: number;       // Velocity for max range (ft/s)
  E_max: number;        // Maximum Endurance (seconds)
  V_Emax: number;       // Velocity for max endurance (ft/s)

  // Chart Data
  chartData: ChartDataPoint[];
  glideData: GlideDataPoint[];
  
  // Sea Level Chart Data (for comparison)
  chartDataSL: ChartDataPoint[];
  glideDataSL: GlideDataPoint[];

  // Ceiling curve data
  ceilingData: CeilingDataPoint[];

  // Stall warnings
  stallInRCmax: boolean;
  stallInThetaMax: boolean;
  
  // Engine type
  engineType: 'turbofan' | 'turboprop' | 'piston';
}

export interface ChartDataPoint {
  V: number;
  TA: number;
  TR: number;
  PA: number;
  PR: number;
  ET: number;
  EP: number;
  RC: number;
  Theta: number;
  V_h: number;
  CL_CD?: number;
  CL_1p5_CD?: number;
  CL_0p5_CD?: number;
}

export interface GlideDataPoint {
  V: number;
  V_h: number;
  V_v: number;
  Theta: number;
  RD: number;
  ET_glide: number;  // ET_glide = -TR
}

export interface CeilingDataPoint {
  altitude: number;
  RC: number;
}

function calculateThrustRequired(V: number, rho: number, S: number, W: number, Cd0: number, K: number): number {
  const q = 0.5 * rho * V * V;
  const CL = W / (q * S);
  const CD = Cd0 + K * CL * CL;
  return q * S * CD;
}

function bisectionSolver(
  rho: number, S: number, W: number, Cd0: number, K: number,
  C: number, n: number, startV: number, findMax: boolean, isPiston: boolean = false, powerConst?: number
): number {
  let lower = startV;
  let upper = findMax ? 2000 : startV + 500;
  
  for (let i = 0; i < 50; i++) {
    const mid = (lower + upper) / 2;
    const TR = calculateThrustRequired(mid, rho, S, W, Cd0, K);
    let TA: number;
    if (isPiston && powerConst) {
      // For piston: TA = eta * P * 550 / V
      TA = powerConst / mid;
    } else {
      TA = C * Math.pow(mid, -n);
    }
    
    if (findMax) {
      if (TA - TR > 0) lower = mid;
      else upper = mid;
    } else {
      if (TA - TR < 0) lower = mid;
      else upper = mid;
    }
  }
  return (lower + upper) / 2;
}

export function calculateTurbofanPerformance(params: TurbofanParams): PerformanceResults {
  const { W, S, Cd0, K, CLmax, h, Tv0, n, A, m, W0, Wf, Ct } = params;
  
  // Atmosphere
  const atm = getAtmosphere(h);
  const atmSL = getSeaLevelAtmosphere();
  const { rho, T, sigma, h_m } = atm;

  // Thrust constant (matches MATLAB)
  const T_sl_total = Tv0 * 2; // 2 engines
  const a_sound = Math.sqrt(PHYSICS.gamma * PHYSICS.R_gas * T);
  const C = T_sl_total * A * Math.pow(a_sound, n) * Math.pow(sigma, m);

  // Sea level C for ceiling calculation
  const a_sound_sl = Math.sqrt(PHYSICS.gamma * PHYSICS.R_gas * PHYSICS.T_sl);
  const C_sl = T_sl_total * A * Math.pow(a_sound_sl, n);

  return performCalculations(W, S, Cd0, K, CLmax, h, rho, T, sigma, h_m, C, n, C_sl, atmSL.rho, 'turbofan', W0, Wf, Ct, undefined);
}

export function calculateTurbopropPerformance(params: TurbopropParams): PerformanceResults {
  const { W, S, Cd0, K, CLmax, h, Psh, eta, Ne, m, jetRatio, W0, Wf, c } = params;
  
  // Atmosphere
  const atm = getAtmosphere(h);
  const atmSL = getSeaLevelAtmosphere();
  const { rho, T, sigma, h_m } = atm;

  // Power available (Turboprop - n=1 as per MATLAB: else C=365*550*npr; n=1;)
  const P_total = Psh * Ne;
  const altitudeFactor = Math.pow(sigma, m);
  const effective_eff = eta + jetRatio;
  const P_avail_alt = P_total * effective_eff * altitudeFactor;
  const C = P_avail_alt * 550;
  const n = 1.0; // MATLAB: n=1 for turboprop

  // Sea level C
  const P_avail_sl = P_total * effective_eff;
  const C_sl = P_avail_sl * 550;

  return performCalculations(W, S, Cd0, K, CLmax, h, rho, T, sigma, h_m, C, n, C_sl, atmSL.rho, 'turboprop', W0, Wf, undefined, c, eta);
}

export function calculatePistonPerformance(params: PistonParams): PerformanceResults {
  const { W, S, Cd0, K, CLmax, h, P0, eta, W0, Wf, c } = params;
  
  // Atmosphere
  const atm = getAtmosphere(h);
  const atmSL = getSeaLevelAtmosphere();
  const { rho, T, sigma, h_m } = atm;

  // Power available at altitude using piston engine formula from PDF:
  // P/P0 = 1.132 * (rho/rho0) - 0.132
  const P_ratio = 1.132 * sigma - 0.132;
  const P_alt = P0 * P_ratio;
  
  // Thrust Available for piston: TA = eta * P * 550 / V
  // So power constant = eta * P * 550
  const powerConst = eta * P_alt * 550;
  const powerConst_sl = eta * P0 * 550;
  
  // For compatibility with existing logic, use C and n format where n=1
  // TA = C * V^-1 = C / V, so C = eta * P * 550
  const C = powerConst;
  const n = 1.0;
  const C_sl = powerConst_sl;

  return performCalculations(W, S, Cd0, K, CLmax, h, rho, T, sigma, h_m, C, n, C_sl, atmSL.rho, 'piston', W0, Wf, undefined, c, eta, P0);
}

function performCalculations(
  W: number, S: number, Cd0: number, K: number, CLmax: number, h: number,
  rho: number, T: number, sigma: number, h_m: number,
  C: number, n: number, C_sl: number, rho_sl: number, 
  engineType: 'turbofan' | 'turboprop' | 'piston' = 'turbofan',
  W0?: number, Wf?: number, Ct?: number, c?: number, eta?: number, P0?: number
): PerformanceResults {
  // Stall speed
  const Vstall = Math.sqrt((2 * W) / (rho * S * CLmax));
  const Vstall_sl = Math.sqrt((2 * W) / (rho_sl * S * CLmax));

  // Velocity for minimum thrust required (L/D max)
  const VTRmin = Math.pow((2 / rho) * (W / S) * Math.sqrt(K / Cd0), 0.5);
  const VTRmin_sl = Math.pow((2 / rho_sl) * (W / S) * Math.sqrt(K / Cd0), 0.5);
  const TRmin = calculateThrustRequired(VTRmin, rho, S, W, Cd0, K);

  // Velocity for minimum power required
  const VPRmin = Math.pow((2 / rho) * (W / S) * Math.sqrt(K / (3 * Cd0)), 0.5);
  const VPRmin_sl = Math.pow((2 / rho_sl) * (W / S) * Math.sqrt(K / (3 * Cd0)), 0.5);
  const PRmin = calculateThrustRequired(VPRmin, rho, S, W, Cd0, K) * VPRmin;  // lb.ft/s

  // Solve for Vmax and V2nd
  const Vmax = bisectionSolver(rho, S, W, Cd0, K, C, n, Vstall, true);
  let V2nd = bisectionSolver(rho, S, W, Cd0, K, C, n, 10, false);
  if (V2nd < Vstall) V2nd = Vstall;
  const Vmin = Math.max(Vstall, V2nd);

  // Chart data generation
  const chartData: ChartDataPoint[] = [];
  const glideData: GlideDataPoint[] = [];
  const chartDataSL: ChartDataPoint[] = [];
  const glideDataSL: GlideDataPoint[] = [];
  
  let RCmax = -Infinity;
  let V_RCmax = 0;
  let MEP = 0;
  let ThetaMax = -Infinity;
  let V_ThetaMax = 0;
  let MET = 0;

  for (let V = 50; V <= 1400; V += 10) {
    // At altitude
    const q = 0.5 * rho * V * V;
    const CL = W / (q * S);
    const CD = Cd0 + K * CL * CL;
    const TR = q * S * CD;
    const TA = C * Math.pow(V, -n);
    const PA = TA * V;  // lb.ft/s
    const PR = TR * V;  // lb.ft/s
    const ET = TA - TR;
    const EP = PA - PR;  // lb.ft/s
    const RC = EP / W;   // ft/s
    
    // Aerodynamic ratios
    const CL_CD = CL / CD;
    const CL_1p5_CD = Math.pow(CL, 1.5) / CD;
    const CL_0p5_CD = Math.pow(CL, 0.5) / CD;
    
    let Theta = 0;
    if (Math.abs(ET / W) <= 1) {
      Theta = Math.asin(ET / W) * (180 / Math.PI);
    }
    
    const V_h = V * Math.cos(Theta * Math.PI / 180);

    chartData.push({ V, TA, TR, PA, PR, ET, EP, RC, Theta, V_h, CL_CD, CL_1p5_CD, CL_0p5_CD });

    // Gliding (no thrust)
    const ET_glide = -TR;
    let Theta_glide = 0;
    if (Math.abs(ET_glide / W) <= 1) {
      Theta_glide = Math.asin(ET_glide / W) * (180 / Math.PI);
    }
    const V_v_glide = V * Math.sin(Theta_glide * Math.PI / 180);
    const V_h_glide = V * Math.cos(Theta_glide * Math.PI / 180);
    const RD = -V_v_glide;

    glideData.push({ V, V_h: V_h_glide, V_v: V_v_glide, Theta: Theta_glide, RD, ET_glide });

    // At sea level
    const q_sl = 0.5 * rho_sl * V * V;
    const CL_sl = W / (q_sl * S);
    const CD_sl = Cd0 + K * CL_sl * CL_sl;
    const TR_sl = q_sl * S * CD_sl;
    const TA_sl = C_sl * Math.pow(V, -n);
    const PA_sl = TA_sl * V;
    const PR_sl = TR_sl * V;
    const ET_sl = TA_sl - TR_sl;
    const EP_sl = PA_sl - PR_sl;
    const RC_sl = EP_sl / W;
    
    const CL_CD_sl = CL_sl / CD_sl;
    const CL_1p5_CD_sl = Math.pow(CL_sl, 1.5) / CD_sl;
    const CL_0p5_CD_sl = Math.pow(CL_sl, 0.5) / CD_sl;
    
    let Theta_sl = 0;
    if (Math.abs(ET_sl / W) <= 1) {
      Theta_sl = Math.asin(ET_sl / W) * (180 / Math.PI);
    }
    
    const V_h_sl = V * Math.cos(Theta_sl * Math.PI / 180);

    chartDataSL.push({ V, TA: TA_sl, TR: TR_sl, PA: PA_sl, PR: PR_sl, ET: ET_sl, EP: EP_sl, RC: RC_sl, Theta: Theta_sl, V_h: V_h_sl, CL_CD: CL_CD_sl, CL_1p5_CD: CL_1p5_CD_sl, CL_0p5_CD: CL_0p5_CD_sl });

    // Sea level gliding
    const ET_glide_sl = -TR_sl;
    let Theta_glide_sl = 0;
    if (Math.abs(ET_glide_sl / W) <= 1) {
      Theta_glide_sl = Math.asin(ET_glide_sl / W) * (180 / Math.PI);
    }
    const V_v_glide_sl = V * Math.sin(Theta_glide_sl * Math.PI / 180);
    const V_h_glide_sl = V * Math.cos(Theta_glide_sl * Math.PI / 180);
    const RD_sl = -V_v_glide_sl;

    glideDataSL.push({ V, V_h: V_h_glide_sl, V_v: V_v_glide_sl, Theta: Theta_glide_sl, RD: RD_sl, ET_glide: ET_glide_sl });

    // Track max RC and max Theta (above stall)
    if (V >= Vstall && V <= Vmax) {
      if (RC > RCmax) {
        RCmax = RC;
        V_RCmax = V;
        MEP = EP;
      }
      if (Theta > ThetaMax) {
        ThetaMax = Theta;
        V_ThetaMax = V;
        MET = ET;
      }
    }
  }

  // Check for stall conditions
  const stallInRCmax = Vstall > V_RCmax;
  const stallInThetaMax = Vstall > V_ThetaMax;

  // Correct if stall affects max values
  if (stallInRCmax) {
    const TR_stall = calculateThrustRequired(Vstall, rho, S, W, Cd0, K);
    const TA_stall = C * Math.pow(Vstall, -n);
    const PA_stall = TA_stall * Vstall;
    const PR_stall = TR_stall * Vstall;
    MEP = PA_stall - PR_stall;
    RCmax = MEP / W;
    V_RCmax = Vstall;
  }

  if (stallInThetaMax) {
    const TR_stall = calculateThrustRequired(Vstall, rho, S, W, Cd0, K);
    const TA_stall = C * Math.pow(Vstall, -n);
    MET = TA_stall - TR_stall;
    ThetaMax = Math.asin(MET / W) * (180 / Math.PI);
    V_ThetaMax = Vstall;
  }

  const Theta_RCmax = Math.asin(RCmax / V_RCmax) * (180 / Math.PI);
  const RC_ThetaMax = V_ThetaMax * Math.sin(ThetaMax * Math.PI / 180);

  // Aerodynamic relations (matching MATLAB formulas)
  const CLCD_max = 1 / Math.sqrt(4 * K * Cd0);
  const V_CLCD_max = VTRmin;
  
  const CL_1p5_CD_max = 0.25 * Math.pow(3 / K / Math.pow(Cd0, 1/3), 0.75);
  const V_CL_1p5_CD_max = VPRmin;
  
  const CL_0p5_CD_max = 0.75 * Math.pow(1 / (3 * K * Cd0 * Cd0 * Cd0), 0.25);
  const V_CL_0p5_CD_max = Math.pow((2 * W / rho / S) * Math.sqrt(3 * K / Cd0), 0.5);

  // Gliding performance
  const Theta_min_glide = -Math.atan(1 / CLCD_max) * (180 / Math.PI);
  const V_Theta_min_glide = VTRmin;
  const RD_Theta_min = VTRmin * Math.sin(Math.abs(Theta_min_glide) * Math.PI / 180);

  const V_RD_min = VPRmin;
  
  let RD_min = Infinity;
  for (const point of glideData) {
    if (point.V >= Vstall && point.RD < RD_min && point.RD > 0) {
      RD_min = point.RD;
    }
  }
  
  const Theta_RD_min = -Math.asin(RD_min / V_RD_min) * (180 / Math.PI);
  const T_max_glide = h / RD_min;
  const R_max_glide = h / Math.tan(Math.abs(Theta_min_glide) * Math.PI / 180);

  // Ceiling calculations with curve data
  const ceilingData: CeilingDataPoint[] = [];
  let RC_max_sl = 0;
  
  for (let V = 50; V <= 1400; V += 5) {
    const q = 0.5 * rho_sl * V * V;
    const CL = W / (q * S);
    const CD = Cd0 + K * CL * CL;
    const TR = q * S * CD;
    const TA = C_sl * Math.pow(V, -n);
    const PA = TA * V;
    const PR = TR * V;
    const EP = PA - PR;
    const RC = EP / W;
    if (RC > RC_max_sl) RC_max_sl = RC;
  }

  const a_ceiling = RC_max_sl;
  const b_ceiling = (RCmax - RC_max_sl) / h;
  
  // Generate ceiling curve data
  for (let alt = 0; alt <= 60000; alt += 1000) {
    const RC_at_alt = a_ceiling + b_ceiling * alt;
    if (RC_at_alt >= 0) {
      ceilingData.push({ altitude: alt, RC: RC_at_alt });
    }
  }
  
  // Service ceiling: RC = 100 ft/min = 5/3 ft/s
  const serviceCeiling = b_ceiling !== 0 ? (5/3 - a_ceiling) / b_ceiling : 0;
  // Absolute ceiling: RC = 0
  const absoluteCeiling = b_ceiling !== 0 ? -a_ceiling / b_ceiling : 0;

  // Range & Endurance calculations
  let R_max = 0;
  let V_Rmax = 0;
  let E_max = 0;
  let V_Emax = 0;

  if (W0 && Wf) {
    const W1 = W0 - Wf;
    const W_av = (W0 + W1) / 2;

    if ((engineType === 'turboprop' || engineType === 'piston') && c && eta) {
      // For Propellers:
      const c_per_sec = c / 3600;
      R_max = (eta / c_per_sec) * CLCD_max * Math.log(W0 / W1);
      V_Rmax = Math.pow((2 / rho) * Math.sqrt(K / Cd0) * (W_av / S), 0.5);
      
      E_max = (eta / c_per_sec) * Math.sqrt(2 * rho * S) * CL_1p5_CD_max * (Math.pow(W1, -0.5) - Math.pow(W0, -0.5));
      V_Emax = Math.pow((2 / rho) * Math.sqrt(K / (3 * Cd0)) * (W_av / S), 0.5);
    } else if (Ct) {
      // For Jets:
      const Ct_per_sec = Ct / 3600;
      R_max = (2 / Ct_per_sec) * Math.sqrt(2 / (rho * S)) * CL_0p5_CD_max * (Math.pow(W0, 0.5) - Math.pow(W1, 0.5));
      V_Rmax = Math.pow((2 / rho) * Math.sqrt(3 * K / Cd0) * (W_av / S), 0.5);
      
      E_max = (1 / Ct_per_sec) * CLCD_max * Math.log(W0 / W1);
      V_Emax = Math.pow((2 / rho) * Math.sqrt(K / Cd0) * (W_av / S), 0.5);
    }
  }

  return {
    rho, T, sigma, h_m,
    Vmax, V2nd, Vstall, Vmin, VPRmin, VTRmin,
    TRmin, PRmin, C,
    RCmax, V_RCmax, Theta_RCmax, MEP,
    ThetaMax, V_ThetaMax, RC_ThetaMax, MET,
    CLCD_max, V_CLCD_max, CL_1p5_CD_max, V_CL_1p5_CD_max, CL_0p5_CD_max, V_CL_0p5_CD_max,
    Theta_min_glide, V_Theta_min_glide, RD_Theta_min, RD_min, V_RD_min, Theta_RD_min, T_max_glide, R_max_glide,
    RC_max_sl, a_ceiling, b_ceiling, serviceCeiling, absoluteCeiling,
    R_max, V_Rmax, E_max, V_Emax,
    chartData, glideData, chartDataSL, glideDataSL, ceilingData,
    stallInRCmax, stallInThetaMax,
    engineType,
  };
}
