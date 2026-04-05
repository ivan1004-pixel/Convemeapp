import { create } from 'zustand';
import type { CuentaBancaria } from '../types';

interface CuentaBancariaState {
  cuentasBancarias: CuentaBancaria[];
  selectedCuentaBancaria: CuentaBancaria | null;
  isLoading: boolean;
  error: string | null;
  setCuentasBancarias: (cuentasBancarias: CuentaBancaria[]) => void;
  setSelectedCuentaBancaria: (cuenta: CuentaBancaria | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addCuentaBancaria: (cuenta: CuentaBancaria) => void;
  updateCuentaBancaria: (updated: CuentaBancaria) => void;
  removeCuentaBancaria: (id: number) => void;
}

export const useCuentaBancariaStore = create<CuentaBancariaState>((set) => ({
  cuentasBancarias: [],
  selectedCuentaBancaria: null,
  isLoading: false,
  error: null,
  setCuentasBancarias: (cuentasBancarias) => set({ cuentasBancarias }),
  setSelectedCuentaBancaria: (cuenta) => set({ selectedCuentaBancaria: cuenta }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addCuentaBancaria: (cuenta) =>
    set((state) => ({ cuentasBancarias: [...state.cuentasBancarias, cuenta] })),
  updateCuentaBancaria: (updated) =>
    set((state) => ({
      cuentasBancarias: state.cuentasBancarias.map((c) =>
        c.id_cuenta === updated.id_cuenta ? updated : c
      ),
    })),
  removeCuentaBancaria: (id) =>
    set((state) => ({
      cuentasBancarias: state.cuentasBancarias.filter((c) => c.id_cuenta !== id),
    })),
}));
