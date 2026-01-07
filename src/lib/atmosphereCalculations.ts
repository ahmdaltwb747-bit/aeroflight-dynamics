// Physics Constants
export const PHYSICS = {
  g0: 32.174, // ft/s^2
  R_gas: 1716, // ft*lbf/(slug*R)
  gamma: 1.4,
  rho_sl: 0.002377, // slug/ft^3 (sea level standard density)
  T_sl: 518.67, // Rankine (sea level standard temperature)
} as const;

// Atmosphere model based on MATLAB code
export interface AtmosphereResult {
  rho: number;
  T: number;
  sigma: number;
  h_m: number;
}

export function getAtmosphere(h_ft: number): AtmosphereResult {
  const h_m = h_ft * 0.3048; // Convert to meters for condition check
  let rho: number;
  let T: number;

  if (h_m < 11000) {
    // Troposphere - Standard lapse rate
    T = PHYSICS.T_sl - 0.003566 * h_ft;
    rho = PHYSICS.rho_sl * Math.pow(T / PHYSICS.T_sl, 4.2561);
  } else {
    // Stratosphere - Isothermal
    T = 389.97; // Constant temperature
    const h_delta = h_ft - 36089;
    const rho_11km = 0.0007061;
    rho = rho_11km * Math.exp(-h_delta / 20806);
  }

  const sigma = rho / PHYSICS.rho_sl;

  return { rho, T, sigma, h_m };
}

// Get atmosphere at sea level
export function getSeaLevelAtmosphere(): AtmosphereResult {
  return {
    rho: PHYSICS.rho_sl,
    T: PHYSICS.T_sl,
    sigma: 1.0,
    h_m: 0,
  };
}
